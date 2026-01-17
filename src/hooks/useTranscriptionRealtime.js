// hooks/useTranscriptionRealtime.js
// Realtime listener for a single transcription document
import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../firebase';

export function useTranscriptionRealtime(user, transcriptionId) {
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !transcriptionId) {
      setTranscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const docRef = doc(db, 'users', user.uid, 'transcriptions', transcriptionId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTranscription({
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        } else {
          setTranscription(null);
          setError('Transcription not found');
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Realtime transcription error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, transcriptionId]);

  const isProcessing = transcription?.processingStatus === 'processing' ||
                       transcription?.processingStatus === 'queued';
  const isCompleted = transcription?.processingStatus === 'completed';
  const hasError = transcription?.processingStatus === 'error';

  return {
    transcription,
    isLoading,
    isProcessing,
    isCompleted,
    hasError,
    error
  };
}
