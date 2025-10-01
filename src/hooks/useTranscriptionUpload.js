// hooks/useTranscriptionUpload.js
import { useCallback, useState } from 'react';
import { 
  db, 
  storage, 
  doc, 
  setDoc, 
  uploadBytesResumable, 
  storageRef 
} from '../firebase';

/**
 * Handles uploading a recorded audio Blob to Firebase Storage
 * and queuing a background transcription job via Cloud Function (Storage trigger).
 */
export function useTranscriptionUpload(user) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadAndQueueTranscription = useCallback(async ({
    audioBlob,
    title,
    tags = [],
    language = 'nl',
    durationSec = 0,
    formattedDuration = '',
    mimeType = 'audio/webm'
  }) => {
    if (!user) throw new Error('Gebruiker niet ingelogd');
    if (!audioBlob) throw new Error('Geen audio om te uploaden');

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1) Create Firestore doc upfront to track status
      const docId = crypto.randomUUID();
      const docRef = doc(db, 'users', user.uid, 'transcriptions', docId);
      const createdAt = new Date();

      await setDoc(docRef, {
        title: title?.trim() || `Transcriptie ${createdAt.toLocaleDateString('nl-NL')}`,
        tags,
        language,
        duration: durationSec,
        formattedDuration,
        processingStatus: 'queued',
        storagePath: '',
        audioSize: audioBlob.size,
        userId: user.uid,
        createdAt,
        updatedAt: createdAt
      }, { merge: true });

      // Determine extension from mime type
      const ext = (() => {
        if (!mimeType) return 'webm';
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mp4')) return 'mp4';
        if (mimeType.includes('mpeg')) return 'mp3';
        if (mimeType.includes('wav')) return 'wav';
        return 'webm';
      })();

      // 2) Upload to Storage with metadata that helps the Function locate context
      const path = `transcriptions/${user.uid}/${docId}.${ext}`;
      const fileRef = storageRef(storage, path);

      const uploadTask = uploadBytesResumable(fileRef, audioBlob, {
        contentType: mimeType,
        customMetadata: {
          uid: user.uid,
          transcriptionDocId: docId,
          language,
          durationSec: String(durationSec),
          app: 'voik'
        }
      });

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot) => {
          const pct = snapshot.totalBytes
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          setProgress(pct);
        }, (err) => {
          reject(err);
        }, () => {
          resolve();
        });
      });

      // 3) Mark as processing and persist storage path
      await setDoc(docRef, {
        storagePath: path,
        processingStatus: 'processing',
        updatedAt: new Date()
      }, { merge: true });

      return { id: docId };
    } catch (err) {
      console.error('Upload transcription error:', err);
      setError(err.message || 'Upload mislukt');
      throw err;
    } finally {
      setUploading(false);
    }
  }, [user]);

  return {
    uploading,
    progress,
    error,
    uploadAndQueueTranscription
  };
}
