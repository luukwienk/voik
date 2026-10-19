import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

initializeApp();

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const db = getFirestore();
const storage = getStorage();

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

// Access is invite-only: config/access { emails: [...] } lists who may use Voik.
// Kept in Firestore (not in this public repo) and also read by firestore.rules.
async function isAllowedEmail(email) {
  if (!email) return false;
  const snap = await db.doc('config/access').get();
  const emails = (snap.exists && snap.data().emails) || [];
  return emails.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

async function assertAllowed(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!request.auth.token.email_verified || !(await isAllowedEmail(request.auth.token.email))) {
    throw new HttpsError('permission-denied', 'This account has no access to Voik');
  }
}
const FUNCTION_REGION = process.env.FUNCTION_REGION || 'europe-west4';
const MODEL = process.env.TRANSCRIBE_MODEL || 'whisper-1';
const CHUNK_SECONDS = parseInt(process.env.CHUNK_SECONDS || '120', 10);
const CHUNK_OVERLAP_SECONDS = parseInt(process.env.CHUNK_OVERLAP_SECONDS || '2', 10);

// VAD settings - silence detection thresholds
const SILENCE_THRESHOLD_DB = parseInt(process.env.SILENCE_THRESHOLD_DB || '-35', 10);
const SILENCE_MIN_DURATION = parseFloat(process.env.SILENCE_MIN_DURATION || '1.0');
const SPEECH_GAP_MERGE = parseFloat(process.env.SPEECH_GAP_MERGE || '3.0');

// Minimum chunk duration for Whisper API (must be > 0.1s, use 0.5s for safety margin)
const MIN_CHUNK_DURATION = 0.5;

// Number of concurrent Whisper API calls
const PARALLEL_TRANSCRIPTIONS = parseInt(process.env.PARALLEL_TRANSCRIPTIONS || '5', 10);

// Per-request timeout and attempts for a single Whisper call
const CHUNK_TIMEOUT_MS = parseInt(process.env.CHUNK_TIMEOUT_MS || '90000', 10);
const CHUNK_MAX_ATTEMPTS = parseInt(process.env.CHUNK_MAX_ATTEMPTS || '4', 10);

/**
 * Run an async function over an array with limited concurrency.
 * Items are processed in order of availability, results preserve input order.
 */
async function parallelMap(items, fn, concurrency = PARALLEL_TRANSCRIPTIONS) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function downloadFile(bucketName, filePath, destPath) {
  const bucket = storage.bucket(bucketName);
  await bucket.file(filePath).download({ destination: destPath });
}

function probeDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const duration = data?.format?.duration || 0;
      resolve(duration);
    });
  });
}

function transcodeToWavMono16k(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .outputOptions(['-ac 1', '-ar 16000', '-f wav'])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function extractLeftChannel(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .outputOptions(['-af', 'pan=mono|c0=c0', '-ar 16000', '-f wav'])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function extractRightChannel(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .outputOptions(['-af', 'pan=mono|c0=c1', '-ar 16000', '-f wav'])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function probeChannels(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const audioStream = data?.streams?.find(s => s.codec_type === 'audio');
      resolve(audioStream?.channels || 1);
    });
  });
}

function createChunk(srcPath, startSec, durationSec, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .seekInput(startSec)
      .duration(durationSec)
      .outputOptions(['-ac 1', '-ar 16000', '-f wav'])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function detectSpeechSegments(filePath, totalDuration) {
  return new Promise((resolve, reject) => {
    const silentParts = [];
    let currentSilenceStart = null;

    ffmpeg(filePath)
      .audioFilters(`silencedetect=noise=${SILENCE_THRESHOLD_DB}dB:d=${SILENCE_MIN_DURATION}`)
      .output('/dev/null')
      .outputOptions(['-f', 'null'])
      .on('stderr', (line) => {
        const startMatch = line.match(/silence_start:\s*([\d.]+)/);
        const endMatch = line.match(/silence_end:\s*([\d.]+)/);

        if (startMatch) {
          currentSilenceStart = parseFloat(startMatch[1]);
        }
        if (endMatch && currentSilenceStart !== null) {
          silentParts.push({
            start: currentSilenceStart,
            end: parseFloat(endMatch[1])
          });
          currentSilenceStart = null;
        }
      })
      .on('end', () => {
        if (currentSilenceStart !== null) {
          silentParts.push({ start: currentSilenceStart, end: totalDuration });
        }

        const speechSegments = [];
        let lastEnd = 0;

        for (const silent of silentParts) {
          if (silent.start > lastEnd) {
            speechSegments.push({ start: lastEnd, end: silent.start });
          }
          lastEnd = silent.end;
        }
        if (lastEnd < totalDuration) {
          speechSegments.push({ start: lastEnd, end: totalDuration });
        }

        const merged = [];
        for (const seg of speechSegments) {
          if (merged.length === 0) {
            merged.push({ ...seg });
          } else {
            const last = merged[merged.length - 1];
            if (seg.start - last.end <= SPEECH_GAP_MERGE) {
              last.end = seg.end;
            } else {
              merged.push({ ...seg });
            }
          }
        }

        console.log(`[VAD] Found ${silentParts.length} silent sections, ${merged.length} speech segments`);
        resolve(merged);
      })
      .on('error', (err) => {
        console.warn('[VAD] Silence detection failed, using full audio:', err.message);
        resolve([{ start: 0, end: totalDuration }]);
      })
      .run();
  });
}

function createSpeechChunks(speechSegments, maxChunkSec, overlapSec) {
  const chunks = [];

  for (const seg of speechSegments) {
    const segDuration = seg.end - seg.start;

    if (segDuration < MIN_CHUNK_DURATION) {
      console.log(`[VAD] Skipping short segment: ${segDuration.toFixed(2)}s (min: ${MIN_CHUNK_DURATION}s)`);
      continue;
    }

    if (segDuration <= maxChunkSec) {
      chunks.push({ startSec: seg.start, durationSec: segDuration });
    } else {
      let pos = seg.start;
      while (pos < seg.end) {
        const remaining = seg.end - pos;
        const dur = Math.min(maxChunkSec, remaining);
        if (dur >= MIN_CHUNK_DURATION) {
          chunks.push({ startSec: pos, durationSec: dur });
        } else {
          console.log(`[VAD] Skipping short final chunk: ${dur.toFixed(2)}s`);
        }
        pos += maxChunkSec - overlapSec;
      }
    }
  }

  return chunks;
}

function filterHallucinations(text) {
  if (!text) return text;

  let filtered = text;

  const hallucinationPatterns = [
    /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(com|org|net|io|co|info|biz|tv|me|us|uk|de|nl|be|fr|es|it|ru|cn|jp|in)[^\s]*/gi,
    /(\b\w+(?:\s+\w+){0,3}\b)(?:\s*\1){2,}/gi,
    /\b(?:thank you for watching|please subscribe|like and subscribe|see you next time|bye bye|goodbye)\b[.!]*/gi,
    /\[(?:music|applause|laughter|silence|background noise|inaudible)\]/gi,
    /[\u0D80-\u0DFF]{5,}/g,
    /[\u0900-\u097F]{10,}/g,
    /[\u4E00-\u9FFF]{10,}/g,
    /[\u0600-\u06FF]{10,}/g,
    /[\u3040-\u309F\u30A0-\u30FF]{10,}/g,
    /[.]{4,}/g,
    /[-]{4,}/g,
    /\[\w+\]:\s*$/gm,
  ];

  for (const pattern of hallucinationPatterns) {
    filtered = filtered.replace(pattern, '');
  }

  filtered = filtered
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();

  const removed = text.length - filtered.length;
  if (removed > 50) {
    console.log(`[Hallucination filter] Removed ${removed} characters of suspected hallucinations`);
  }

  return filtered;
}

// Out of OpenAI credits is not transient: fail the whole transcription loudly
// instead of retrying and silently filling every chunk with a gap marker.
class OpenAIQuotaError extends Error {
  constructor() {
    super('OpenAI credits exhausted: top up the OpenAI balance, then retry this transcription.');
    this.name = 'OpenAIQuotaError';
  }
}

async function transcribeChunk(filePath, apiKey, { language } = {}) {
  // Verify chunk duration before sending to API
  const actualDuration = await probeDuration(filePath);
  if (actualDuration < MIN_CHUNK_DURATION) {
    console.log(`[Transcription] Skipping chunk ${filePath}: actual duration ${actualDuration.toFixed(2)}s < ${MIN_CHUNK_DURATION}s`);
    return { text: '', segments: [] };
  }

  const form = new FormData();
  const fileBuffer = await fs.promises.readFile(filePath);
  const blob = new Blob([fileBuffer], { type: 'audio/wav' });
  form.append('file', blob, path.basename(filePath));
  form.append('model', MODEL);
  if (language && language !== 'auto') {
    form.append('language', language);
  }
  form.append('response_format', 'verbose_json');

  // A single hung Whisper request used to fail the whole transcription (undici's
  // 5-minute headers timeout). Time out each call and retry transient failures;
  // if a chunk still fails, leave a gap marker instead of losing the rest.
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS)
      });
      if (res.status === 429) {
        const errBody = await res.text();
        if (errBody.includes('insufficient_quota')) throw new OpenAIQuotaError();
        throw new Error(`HTTP 429`);
      }
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      break;
    } catch (err) {
      if (err instanceof OpenAIQuotaError) throw err;
      if (attempt >= CHUNK_MAX_ATTEMPTS) {
        console.error(`[Transcription] Chunk ${filePath} failed after ${attempt} attempts, leaving a gap: ${err.message}`);
        return { text: '[…]', segments: [{ start: 0, end: actualDuration, text: '[…]' }] };
      }
      console.log(`[Transcription] Chunk ${filePath} attempt ${attempt} failed, retrying: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }

  if (!res.ok) {
    const errBody = await res.text();
    // If Whisper says audio is too short, skip this chunk instead of failing entirely
    if (res.status === 400 && errBody.includes('audio_too_short')) {
      console.log(`[Transcription] Whisper rejected chunk as too short, skipping: ${filePath}`);
      return { text: '', segments: [] };
    }
    throw new Error(`OpenAI transcription error: ${res.status} ${errBody}`);
  }
  return res.json();
}

// Core transcription processing logic - shared between upload trigger and retry
async function processTranscription(bucketName, storagePath, uid, docId, apiKey) {
  const docRef = db.doc(`users/${uid}/transcriptions/${docId}`);

  console.log(`[Transcription] Starting processing for doc ${docId}, user ${uid}`);
  console.log(`[Transcription] File: ${storagePath}`);

  await docRef.set({ processingStatus: 'processing', errorMessage: null, updatedAt: new Date() }, { merge: true });

  const tmpDir = os.tmpdir();
  const localInput = path.join(tmpDir, `${docId}.webm`);

  await downloadFile(bucketName, storagePath, localInput);
  console.log(`[Transcription] Downloaded file to ${localInput}`);

  const docSnap = await docRef.get();
  const docData = docSnap.data() || {};
  const stereoChannels = docData.stereoChannels;
  const language = docData.language;
  const numChannels = await probeChannels(localInput);

  console.log(`[Transcription] stereoChannels field:`, stereoChannels);
  console.log(`[Transcription] Audio channels detected: ${numChannels}`);

  const isStereoMeet = stereoChannels && numChannels >= 2;
  console.log(`[Transcription] Processing as stereo Meet: ${isStereoMeet}`);

  let text;
  let durationSec;
  let chunkCount = 0;
  const tempFiles = [localInput];

  if (isStereoMeet) {
    const leftLabel = stereoChannels.left || 'Ik';
    const rightLabel = stereoChannels.right || 'Anderen';
    console.log(`[Transcription] STEREO MODE - Left: "${leftLabel}", Right: "${rightLabel}"`);

    const localLeft = path.join(tmpDir, `${docId}-left.wav`);
    const localRight = path.join(tmpDir, `${docId}-right.wav`);
    tempFiles.push(localLeft, localRight);

    await extractLeftChannel(localInput, localLeft);
    await extractRightChannel(localInput, localRight);

    durationSec = Math.ceil(await probeDuration(localLeft));

    const transcribeChannel = async (wavPath, label) => {
      const speechSegments = await detectSpeechSegments(wavPath, durationSec);
      console.log(`[Transcription] ${label} channel: ${speechSegments.length} speech segments detected`);

      if (speechSegments.length === 0) {
        console.log(`[Transcription] ${label} channel: no speech detected, skipping`);
        return [];
      }

      const chunkDefs = createSpeechChunks(speechSegments, CHUNK_SECONDS, CHUNK_OVERLAP_SECONDS);
      console.log(`[Transcription] ${label} channel: ${chunkDefs.length} chunks to transcribe`);

      if (chunkDefs.length === 0) {
        console.log(`[Transcription] ${label} channel: all segments too short, skipping`);
        return [];
      }

      // Create all WAV chunks first (sequential - disk I/O)
      const chunks = [];
      for (let i = 0; i < chunkDefs.length; i++) {
        const { startSec, durationSec: dur } = chunkDefs[i];
        const chunkPath = path.join(tmpDir, `${docId}-${label}-${i}.wav`);
        tempFiles.push(chunkPath);
        await createChunk(wavPath, startSec, dur, chunkPath);
        chunks.push({ path: chunkPath, startSec, durationSec: dur });
      }

      // Transcribe in parallel
      console.log(`[Transcription] ${label} channel: transcribing ${chunks.length} chunks (${PARALLEL_TRANSCRIPTIONS} parallel)...`);
      const parts = await parallelMap(chunks, async (chunk, i) => {
        console.log(`[Transcription] ${label} chunk ${i + 1}/${chunks.length} starting...`);
        const result = await transcribeChunk(chunk.path, apiKey, { language });
        const segments = result.segments || [];
        console.log(`[Transcription] ${label} chunk ${i + 1}/${chunks.length} done`);
        return {
          startSec: chunk.startSec,
          text: (result.text || '').trim(),
          segments: segments.map(s => ({
            start: chunk.startSec + s.start,
            end: chunk.startSec + s.end,
            text: s.text
          }))
        };
      });
      return parts;
    };

    console.log(`[Transcription] Transcribing both channels in parallel...`);
    const [leftParts, rightParts] = await Promise.all([
      transcribeChannel(localLeft, 'left'),
      transcribeChannel(localRight, 'right')
    ]);

    console.log(`[Transcription] Left channel segments: ${leftParts.reduce((sum, p) => sum + p.segments.length, 0)}`);
    console.log(`[Transcription] Right channel segments: ${rightParts.reduce((sum, p) => sum + p.segments.length, 0)}`);

    chunkCount = leftParts.length + rightParts.length;

    const allSegments = [];
    for (const part of leftParts) {
      for (const seg of part.segments) {
        if (seg.text.trim()) {
          allSegments.push({ ...seg, speaker: leftLabel });
        }
      }
    }
    for (const part of rightParts) {
      for (const seg of part.segments) {
        if (seg.text.trim()) {
          allSegments.push({ ...seg, speaker: rightLabel });
        }
      }
    }

    allSegments.sort((a, b) => a.start - b.start);

    const lines = [];
    let currentSpeaker = null;
    let currentTexts = [];

    for (const seg of allSegments) {
      if (seg.speaker !== currentSpeaker) {
        if (currentTexts.length > 0) {
          lines.push(`[${currentSpeaker}]: ${currentTexts.join(' ')}`);
        }
        currentSpeaker = seg.speaker;
        currentTexts = [seg.text.trim()];
      } else {
        currentTexts.push(seg.text.trim());
      }
    }
    if (currentTexts.length > 0 && currentSpeaker) {
      lines.push(`[${currentSpeaker}]: ${currentTexts.join(' ')}`);
    }

    text = lines.join('\n\n');

  } else {
    console.log(`[Transcription] MONO MODE - standard processing with VAD`);
    const localWav = path.join(tmpDir, `${docId}.wav`);
    tempFiles.push(localWav);

    await transcodeToWavMono16k(localInput, localWav);
    durationSec = Math.ceil(await probeDuration(localWav));

    const speechSegments = await detectSpeechSegments(localWav, durationSec);
    console.log(`[Transcription] MONO: ${speechSegments.length} speech segments detected`);

    if (speechSegments.length === 0) {
      console.log(`[Transcription] No speech detected in audio`);
      text = '';
      chunkCount = 0;
    } else {
      const chunkDefs = createSpeechChunks(speechSegments, CHUNK_SECONDS, CHUNK_OVERLAP_SECONDS);
      console.log(`[Transcription] MONO: ${chunkDefs.length} chunks to transcribe`);

      if (chunkDefs.length === 0) {
        console.log(`[Transcription] All segments too short, no transcription possible`);
        text = '';
        chunkCount = 0;
      } else {
        // Create all WAV chunks first (sequential - disk I/O)
        const chunks = [];
        for (let i = 0; i < chunkDefs.length; i++) {
          const { startSec, durationSec: dur } = chunkDefs[i];
          const chunkPath = path.join(tmpDir, `${docId}-${i}.wav`);
          tempFiles.push(chunkPath);
          await createChunk(localWav, startSec, dur, chunkPath);
          chunks.push({ path: chunkPath, startSec, durationSec: dur });
        }

        // Transcribe in parallel
        console.log(`[Transcription] Transcribing ${chunks.length} chunks (${PARALLEL_TRANSCRIPTIONS} parallel)...`);
        const parts = await parallelMap(chunks, async (chunk, i) => {
          console.log(`[Transcription] Chunk ${i + 1}/${chunks.length} starting...`);
          const result = await transcribeChunk(chunk.path, apiKey, { language });
          console.log(`[Transcription] Chunk ${i + 1}/${chunks.length} done`);
          return { startSec: chunk.startSec, result };
        });

        chunkCount = parts.length;
        text = parts.map(p => (p.result?.text || '').trim()).join('\n');
      }
    }
  }

  const filteredText = filterHallucinations(text);

  console.log(`[Transcription] Completed - duration: ${durationSec}s, chunks: ${chunkCount}`);
  console.log(`[Transcription] Result text (first 500 chars):`, filteredText?.substring(0, 500));

  await docRef.set({
    text: filteredText,
    duration: durationSec,
    chunkCount,
    model: MODEL,
    processingStatus: 'completed',
    updatedAt: new Date()
  }, { merge: true });

  console.log(`[Transcription] Document updated successfully`);

  // Cleanup tmp files
  for (const f of tempFiles) {
    try { fs.unlinkSync(f); } catch {}
  }

  return { success: true, duration: durationSec, chunkCount };
}

// Storage trigger (v2) - fires when audio file is uploaded
// Timeout: 540s (max for event triggers); parallel Whisper keeps it well within limit
// For very long recordings that still timeout, use retryTranscription (callable, 3600s)
export const onAudioUploaded = onObjectFinalized({
  region: FUNCTION_REGION,
  memory: '2GiB',
  timeoutSeconds: 540,
  secrets: [OPENAI_API_KEY],
}, async (event) => {
  const { bucket, name } = event.data;
  const metadata = event.data.metadata || {};
  if (!name) return;

  if (!name.startsWith('transcriptions/')) return;

  const uid = metadata.uid || name.split('/')[1];
  const docId = metadata.transcriptionDocId || (name.split('/')[2]?.split('.')[0]);
  if (!uid || !docId) return;

  const docRef = db.doc(`users/${uid}/transcriptions/${docId}`);

  // Storage rules only check that users write to their own folder; spend
  // OpenAI credits only on invited accounts
  const uploader = await getAuth().getUser(uid).catch(() => null);
  if (!uploader?.emailVerified || !(await isAllowedEmail(uploader.email))) {
    console.warn(`[Transcription] Upload by non-allowed user ${uid}, deleting ${name}`);
    await storage.bucket(bucket).file(name).delete().catch(() => {});
    return;
  }

  try {
    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set. Configure functions secret.');
    }

    // Set storagePath on initial upload
    await docRef.set({ storagePath: name }, { merge: true });

    await processTranscription(bucket, name, uid, docId, apiKey);

  } catch (err) {
    console.error('Background transcription failed:', err);
    await docRef.set({ processingStatus: 'error', errorMessage: String(err), updatedAt: new Date() }, { merge: true });
    throw err;
  }
});

// Callable function (v2) for retrying failed transcriptions
// Timeout: 3600s (60 min) to handle long recordings
export const retryTranscription = onCall({
  region: FUNCTION_REGION,
  memory: '2GiB',
  timeoutSeconds: 3600,
  secrets: [OPENAI_API_KEY],
}, async (request) => {
  await assertAllowed(request);

  const { transcriptionId } = request.data;
  if (!transcriptionId) {
    throw new HttpsError('invalid-argument', 'transcriptionId is required');
  }

  const uid = request.auth.uid;
  const docRef = db.doc(`users/${uid}/transcriptions/${transcriptionId}`);

  try {
    // Get the transcription document
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new HttpsError('not-found', 'Transcription not found');
    }

    const docData = docSnap.data();
    const storagePath = docData.storagePath;

    if (!storagePath) {
      throw new HttpsError('failed-precondition', 'No audio file available for this transcription');
    }

    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'OPENAI_API_KEY not configured');
    }

    // Get bucket name from storage path or use default
    const bucket = storage.bucket();
    const bucketName = bucket.name;

    console.log(`[Retry] Starting retry for transcription ${transcriptionId}, user ${uid}`);

    const result = await processTranscription(bucketName, storagePath, uid, transcriptionId, apiKey);

    return { success: true, ...result };

  } catch (err) {
    console.error('Retry transcription failed:', err);

    // If it's already an HttpsError, rethrow it
    if (err instanceof HttpsError) {
      throw err;
    }

    await docRef.set({ processingStatus: 'error', errorMessage: String(err), updatedAt: new Date() }, { merge: true });
    throw new HttpsError('internal', `Transcription failed: ${err.message}`);
  }
});

// The OpenAI key must never reach the browser (it was baked into the Vite bundle
// and abused). Browser features call these functions instead.

const AI_ACTION_MODEL = process.env.AI_ACTION_MODEL || 'gpt-4.1-mini';
const AI_ACTION_MAX_PROMPT_CHARS = 400000;

// Runs one AI action (summary, tasks, email, ...) on a transcription.
export const runTranscriptionAIAction = onCall({
  region: FUNCTION_REGION,
  secrets: [OPENAI_API_KEY],
}, async (request) => {
  await assertAllowed(request);

  const { prompt } = request.data || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new HttpsError('invalid-argument', 'prompt is required');
  }
  if (prompt.length > AI_ACTION_MAX_PROMPT_CHARS) {
    throw new HttpsError('invalid-argument', 'prompt is too long');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_ACTION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Je bent een behulpzame AI-assistent. Reageer altijd in het Nederlands, tenzij anders gevraagd. Wees beknopt en to-the-point.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[AI action] failed: ${res.status} ${errBody}`);
    if (errBody.includes('insufficient_quota')) {
      throw new HttpsError('resource-exhausted', 'OpenAI credits exhausted');
    }
    throw new HttpsError('internal', 'AI processing failed');
  }

  const data = await res.json();
  return { content: data.choices[0].message.content };
});
