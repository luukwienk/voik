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
  .runWith({ memory: '1GiB', timeoutSeconds: 540, secrets: [OPENAI_API_KEY] })
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
    await docRef.set({ processingStatus: 'processing', storagePath: name, updatedAt: new Date() }, { merge: true });

    const tmpDir = os.tmpdir();
    const localInput = path.join(tmpDir, `${docId}.webm`);
    const localWav = path.join(tmpDir, `${docId}.wav`);

    await downloadFile(bucket, name, localInput);

    // Transcode to mono 16k wav for stable chunking
    await transcodeToWavMono16k(localInput, localWav);

    // Determine duration
    const durationSec = Math.ceil(await probeDuration(localWav));

    // Create chunks
    const chunks = [];
    let start = 0;
    while (start < durationSec) {
      const effectiveStart = Math.max(0, start - (start > 0 ? CHUNK_OVERLAP_SECONDS : 0));
      const remaining = durationSec - effectiveStart;
      const dur = Math.min(CHUNK_SECONDS + (start > 0 ? CHUNK_OVERLAP_SECONDS : 0), remaining);
      const chunkPath = path.join(tmpDir, `${docId}-${chunks.length}.wav`);
      // eslint-disable-next-line no-await-in-loop
      await createChunk(localWav, effectiveStart, dur, chunkPath);
      chunks.push({ path: chunkPath, startSec: effectiveStart, durationSec: dur });
      start += CHUNK_SECONDS;
    }

    // Transcribe chunks sequentially (can be parallelized if needed)
    const parts = [];
    for (const chunk of chunks) {
      // eslint-disable-next-line no-await-in-loop
      const result = await transcribeChunk(chunk.path, apiKey, { language: metadata?.language || 'nl' });
      parts.push({ startSec: chunk.startSec, result });
    }

    // Naive stitch: concatenate texts with newline
    const text = parts.map(p => (p.result?.text || '').trim()).join('\n');

    await docRef.set({
      text,
      language: metadata?.language || 'nl',
      duration: durationSec,
      chunkCount: parts.length,
      model: MODEL,
      processingStatus: 'completed',
      updatedAt: new Date()
    }, { merge: true });

    // Cleanup tmp files
    try { fs.unlinkSync(localInput); } catch {}
    try { fs.unlinkSync(localWav); } catch {}
    for (const c of chunks) { try { fs.unlinkSync(c.path); } catch {} }

  } catch (err) {
    console.error('Background transcription failed:', err);
    await docRef.set({ processingStatus: 'error', errorMessage: String(err), updatedAt: new Date() }, { merge: true });
    throw err;
  }
});
