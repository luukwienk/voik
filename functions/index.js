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

async function transcribeChunk(filePath, apiKey, { language = 'nl' } = {}) {
  const form = new FormData();
  const fileBuffer = await fs.promises.readFile(filePath);
  const blob = new Blob([fileBuffer], { type: 'audio/wav' });
  form.append('file', blob, path.basename(filePath));
  form.append('model', MODEL);
  form.append('language', language);
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

      // Transcribe both channels
      const transcribeChannel = async (wavPath, label) => {
        const chunks = [];
        let start = 0;
        while (start < durationSec) {
          const effectiveStart = Math.max(0, start - (start > 0 ? CHUNK_OVERLAP_SECONDS : 0));
          const remaining = durationSec - effectiveStart;
          const dur = Math.min(CHUNK_SECONDS + (start > 0 ? CHUNK_OVERLAP_SECONDS : 0), remaining);
          const chunkPath = path.join(tmpDir, `${docId}-${label}-${chunks.length}.wav`);
          tempFiles.push(chunkPath);
          await createChunk(wavPath, effectiveStart, dur, chunkPath);
          chunks.push({ path: chunkPath, startSec: effectiveStart, durationSec: dur });
          start += CHUNK_SECONDS;
        }

        const parts = [];
        for (const chunk of chunks) {
          const result = await transcribeChunk(chunk.path, apiKey, { language: metadata?.language || 'nl' });
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
      // Standard mono processing
      console.log(`[Transcription] MONO MODE - standard processing`);
      const localWav = path.join(tmpDir, `${docId}.wav`);
      tempFiles.push(localWav);

      await transcodeToWavMono16k(localInput, localWav);
      durationSec = Math.ceil(await probeDuration(localWav));

      const chunks = [];
      let start = 0;
      while (start < durationSec) {
        const effectiveStart = Math.max(0, start - (start > 0 ? CHUNK_OVERLAP_SECONDS : 0));
        const remaining = durationSec - effectiveStart;
        const dur = Math.min(CHUNK_SECONDS + (start > 0 ? CHUNK_OVERLAP_SECONDS : 0), remaining);
        const chunkPath = path.join(tmpDir, `${docId}-${chunks.length}.wav`);
        tempFiles.push(chunkPath);
        await createChunk(localWav, effectiveStart, dur, chunkPath);
        chunks.push({ path: chunkPath, startSec: effectiveStart, durationSec: dur });
        start += CHUNK_SECONDS;
      }

      const parts = [];
      for (const chunk of chunks) {
        const result = await transcribeChunk(chunk.path, apiKey, { language: metadata?.language || 'nl' });
        parts.push({ startSec: chunk.startSec, result });
      }

      chunkCount = parts.length;
      text = parts.map(p => (p.result?.text || '').trim()).join('\n');
    }

    console.log(`[Transcription] Completed - duration: ${durationSec}s, chunks: ${chunkCount}`);
    console.log(`[Transcription] Result text (first 500 chars):`, text?.substring(0, 500));

    await docRef.set({
      text,
      language: metadata?.language || 'nl',
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
