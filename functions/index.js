import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as functions from 'firebase-functions';
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
const MODEL = process.env.TRANSCRIBE_MODEL || 'whisper-1';
const CHUNK_SECONDS = parseInt(process.env.CHUNK_SECONDS || '120', 10);
const CHUNK_OVERLAP_SECONDS = parseInt(process.env.CHUNK_OVERLAP_SECONDS || '2', 10);

// VAD settings - silence detection thresholds
const SILENCE_THRESHOLD_DB = parseInt(process.env.SILENCE_THRESHOLD_DB || '-35', 10); // dB below which is silence
const SILENCE_MIN_DURATION = parseFloat(process.env.SILENCE_MIN_DURATION || '1.0'); // min silence duration to detect
const SPEECH_GAP_MERGE = parseFloat(process.env.SPEECH_GAP_MERGE || '3.0'); // merge speech segments closer than this

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
      .outputOptions([
        '-ac 1',
        '-ar 16000',
        '-f wav'
      ])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Extract left channel (index 0) to mono wav
function extractLeftChannel(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .outputOptions([
        '-af', 'pan=mono|c0=c0',
        '-ar 16000',
        '-f wav'
      ])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Extract right channel (index 1) to mono wav
function extractRightChannel(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .outputOptions([
        '-af', 'pan=mono|c0=c1',
        '-ar 16000',
        '-f wav'
      ])
      .output(destPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Probe number of audio channels
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

// Detect speech segments using ffmpeg silencedetect filter
// Returns array of { start, end } objects for speech (non-silent) sections
function detectSpeechSegments(filePath, totalDuration) {
  return new Promise((resolve, reject) => {
    const silentParts = [];
    let currentSilenceStart = null;

    ffmpeg(filePath)
      .audioFilters(`silencedetect=noise=${SILENCE_THRESHOLD_DB}dB:d=${SILENCE_MIN_DURATION}`)
      .outputOptions(['-f null'])
      .output('-')
      .on('stderr', (line) => {
        // Parse silence_start and silence_end from ffmpeg stderr
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
        // Handle case where audio ends during silence
        if (currentSilenceStart !== null) {
          silentParts.push({ start: currentSilenceStart, end: totalDuration });
        }

        // Invert silent parts to get speech segments
        const speechSegments = [];
        let lastEnd = 0;

        for (const silent of silentParts) {
          if (silent.start > lastEnd) {
            speechSegments.push({ start: lastEnd, end: silent.start });
          }
          lastEnd = silent.end;
        }
        // Add final segment if audio doesn't end in silence
        if (lastEnd < totalDuration) {
          speechSegments.push({ start: lastEnd, end: totalDuration });
        }

        // Merge nearby segments (within SPEECH_GAP_MERGE seconds)
        const merged = [];
        for (const seg of speechSegments) {
          if (merged.length === 0) {
            merged.push({ ...seg });
          } else {
            const last = merged[merged.length - 1];
            if (seg.start - last.end <= SPEECH_GAP_MERGE) {
              // Merge with previous segment
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
        // If silencedetect fails, return full audio as one segment
        console.warn('[VAD] Silence detection failed, using full audio:', err.message);
        resolve([{ start: 0, end: totalDuration }]);
      })
      .run();
  });
}

// Create chunks only from speech segments, respecting max chunk size
function createSpeechChunks(speechSegments, maxChunkSec, overlapSec) {
  const chunks = [];

  for (const seg of speechSegments) {
    const segDuration = seg.end - seg.start;

    if (segDuration <= maxChunkSec) {
      // Segment fits in one chunk
      chunks.push({ startSec: seg.start, durationSec: segDuration });
    } else {
      // Split segment into multiple chunks with overlap
      let pos = seg.start;
      while (pos < seg.end) {
        const remaining = seg.end - pos;
        const dur = Math.min(maxChunkSec, remaining);
        chunks.push({ startSec: pos, durationSec: dur });
        pos += maxChunkSec - overlapSec;
      }
    }
  }

  return chunks;
}

// Post-process transcription to remove common Whisper hallucinations
function filterHallucinations(text) {
  if (!text) return text;

  let filtered = text;

  // Common hallucination patterns
  const hallucinationPatterns = [
    // URLs and domains (Whisper often hallucinates these during silence)
    /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(com|org|net|io|co|info|biz|tv|me|us|uk|de|nl|be|fr|es|it|ru|cn|jp|in)[^\s]*/gi,
    // Repeated phrases (3+ times in a row)
    /(\b\w+(?:\s+\w+){0,3}\b)(?:\s*\1){2,}/gi,
    // Common hallucinated phrases
    /\b(?:thank you for watching|please subscribe|like and subscribe|see you next time|bye bye|goodbye)\b[.!]*/gi,
    // Music/sound effect descriptions that shouldn't appear
    /\[(?:music|applause|laughter|silence|background noise|inaudible)\]/gi,
    // Foreign script that appears randomly (common Whisper hallucination)
    /[\u0D80-\u0DFF]{5,}/g, // Sinhalese
    /[\u0900-\u097F]{10,}/g, // Devanagari (when not expected)
    /[\u4E00-\u9FFF]{10,}/g, // Chinese (when not expected)
    /[\u0600-\u06FF]{10,}/g, // Arabic (when not expected)
    /[\u3040-\u309F\u30A0-\u30FF]{10,}/g, // Japanese (when not expected)
    // Repeated punctuation or symbols
    /[.]{4,}/g,
    /[-]{4,}/g,
    // Empty speaker labels
    /\[\w+\]:\s*$/gm,
  ];

  for (const pattern of hallucinationPatterns) {
    filtered = filtered.replace(pattern, '');
  }

  // Clean up extra whitespace and newlines
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

async function transcribeChunk(filePath, apiKey, { language } = {}) {
  const form = new FormData();
  const fileBuffer = await fs.promises.readFile(filePath);
  const blob = new Blob([fileBuffer], { type: 'audio/wav' });
  form.append('file', blob, path.basename(filePath));
  form.append('model', MODEL);
  // Only set language if explicitly specified (not 'auto')
  // This allows Whisper to auto-detect the language
  if (language && language !== 'auto') {
    form.append('language', language);
  }
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI transcription error: ${res.status} ${err}`);
  }
  return res.json();
}

export const onAudioUploaded = functions
  .region(process.env.FUNCTION_REGION || 'us-central1')
  .runWith({ memory: '1GB', timeoutSeconds: 540, secrets: [OPENAI_API_KEY] })
  .storage.object().onFinalize(async (object) => {
  const { bucket, name, contentType, metadata = {} } = object;
  if (!name) return;

  // Process only our uploads dir
  if (!name.startsWith('transcriptions/')) return;

  // Derive doc id & uid from metadata or path
  const uid = metadata.uid || name.split('/')[1];
  const docId = metadata.transcriptionDocId || (name.split('/')[2]?.split('.')[0]);
  if (!uid || !docId) return;

  const docRef = db.doc(`users/${uid}/transcriptions/${docId}`);

  try {
    const apiKey = OPENAI_API_KEY.value();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set. Configure functions secret.');
    }

    console.log(`[Transcription] Starting processing for doc ${docId}, user ${uid}`);
    console.log(`[Transcription] File: ${name}, contentType: ${contentType}`);

    await docRef.set({ processingStatus: 'processing', storagePath: name, updatedAt: new Date() }, { merge: true });

    const tmpDir = os.tmpdir();
    const localInput = path.join(tmpDir, `${docId}.webm`);

    await downloadFile(bucket, name, localInput);
    console.log(`[Transcription] Downloaded file to ${localInput}`);

    // Check for stereo channels (Meet extension recordings)
    const docSnap = await docRef.get();
    const docData = docSnap.data() || {};
    const stereoChannels = docData.stereoChannels;
    const numChannels = await probeChannels(localInput);

    console.log(`[Transcription] Document data:`, JSON.stringify(docData, null, 2));
    console.log(`[Transcription] stereoChannels field:`, stereoChannels);
    console.log(`[Transcription] Audio channels detected: ${numChannels}`);

    const isStereoMeet = stereoChannels && numChannels >= 2;
    console.log(`[Transcription] Processing as stereo Meet: ${isStereoMeet}`);

    let text;
    let durationSec;
    let chunkCount = 0;
    const tempFiles = [localInput];

    if (isStereoMeet) {
      // Process stereo Meet recording with speaker labels
      const leftLabel = stereoChannels.left || 'Ik';
      const rightLabel = stereoChannels.right || 'Anderen';
      console.log(`[Transcription] STEREO MODE - Left: "${leftLabel}", Right: "${rightLabel}"`);

      const localLeft = path.join(tmpDir, `${docId}-left.wav`);
      const localRight = path.join(tmpDir, `${docId}-right.wav`);
      tempFiles.push(localLeft, localRight);

      // Extract channels
      await extractLeftChannel(localInput, localLeft);
      await extractRightChannel(localInput, localRight);

      durationSec = Math.ceil(await probeDuration(localLeft));

      // Transcribe both channels with VAD
      const transcribeChannel = async (wavPath, label) => {
        // Detect speech segments using VAD
        const speechSegments = await detectSpeechSegments(wavPath, durationSec);
        console.log(`[Transcription] ${label} channel: ${speechSegments.length} speech segments detected`);

        if (speechSegments.length === 0) {
          console.log(`[Transcription] ${label} channel: no speech detected, skipping`);
          return [];
        }

        // Create chunks only from speech segments
        const chunkDefs = createSpeechChunks(speechSegments, CHUNK_SECONDS, CHUNK_OVERLAP_SECONDS);
        console.log(`[Transcription] ${label} channel: ${chunkDefs.length} chunks to transcribe`);

        const chunks = [];
        for (let i = 0; i < chunkDefs.length; i++) {
          const { startSec, durationSec: dur } = chunkDefs[i];
          const chunkPath = path.join(tmpDir, `${docId}-${label}-${i}.wav`);
          tempFiles.push(chunkPath);
          await createChunk(wavPath, startSec, dur, chunkPath);
          chunks.push({ path: chunkPath, startSec, durationSec: dur });
        }

        const parts = [];
        for (const chunk of chunks) {
          const result = await transcribeChunk(chunk.path, apiKey, { language: metadata?.language });
          // Get segments with timestamps from verbose_json response
          const segments = result.segments || [];
          parts.push({
            startSec: chunk.startSec,
            text: (result.text || '').trim(),
            segments: segments.map(s => ({
              start: chunk.startSec + s.start,
              end: chunk.startSec + s.end,
              text: s.text
            }))
          });
        }
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

      // Merge transcripts with speaker labels based on segments
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

      // Sort by start time
      allSegments.sort((a, b) => a.start - b.start);

      // Build formatted text with speaker labels
      // Group consecutive segments by speaker
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
      // Standard mono processing with VAD
      console.log(`[Transcription] MONO MODE - standard processing with VAD`);
      const localWav = path.join(tmpDir, `${docId}.wav`);
      tempFiles.push(localWav);

      await transcodeToWavMono16k(localInput, localWav);
      durationSec = Math.ceil(await probeDuration(localWav));

      // Detect speech segments using VAD
      const speechSegments = await detectSpeechSegments(localWav, durationSec);
      console.log(`[Transcription] MONO: ${speechSegments.length} speech segments detected`);

      if (speechSegments.length === 0) {
        console.log(`[Transcription] No speech detected in audio`);
        text = '';
        chunkCount = 0;
      } else {
        // Create chunks only from speech segments
        const chunkDefs = createSpeechChunks(speechSegments, CHUNK_SECONDS, CHUNK_OVERLAP_SECONDS);
        console.log(`[Transcription] MONO: ${chunkDefs.length} chunks to transcribe`);

        const chunks = [];
        for (let i = 0; i < chunkDefs.length; i++) {
          const { startSec, durationSec: dur } = chunkDefs[i];
          const chunkPath = path.join(tmpDir, `${docId}-${i}.wav`);
          tempFiles.push(chunkPath);
          await createChunk(localWav, startSec, dur, chunkPath);
          chunks.push({ path: chunkPath, startSec, durationSec: dur });
        }

        const parts = [];
        for (const chunk of chunks) {
          const result = await transcribeChunk(chunk.path, apiKey, { language: metadata?.language });
          parts.push({ startSec: chunk.startSec, result });
        }

        chunkCount = parts.length;
        text = parts.map(p => (p.result?.text || '').trim()).join('\n');
      }
    }

    // Apply hallucination filter
    const filteredText = filterHallucinations(text);

    console.log(`[Transcription] Completed - duration: ${durationSec}s, chunks: ${chunkCount}`);
    console.log(`[Transcription] Result text (first 500 chars):`, filteredText?.substring(0, 500));

    await docRef.set({
      text: filteredText,
      language: metadata?.language || 'auto',
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

  } catch (err) {
    console.error('Background transcription failed:', err);
    await docRef.set({ processingStatus: 'error', errorMessage: String(err), updatedAt: new Date() }, { merge: true });
    throw err;
  }
});
