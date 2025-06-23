// hooks/useTranscriptions.js
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDocs, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { debugLog, debugError } from '../utils/debug';

export function useTranscriptions(user) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTranscriptions = useCallback(async () => {
    if (!user) {
      setTranscriptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'users', user.uid, 'transcriptions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const loadedTranscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      debugLog('Loaded transcriptions:', loadedTranscriptions.length);
      setTranscriptions(loadedTranscriptions);
    } catch (err) {
      debugError('Error loading transcriptions:', err);
      setError('Kon transcripties niet laden');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTranscriptions();
  }, [loadTranscriptions]);

  const saveTranscription = useCallback(async (transcriptionData) => {
    if (!user) {
      throw new Error('Gebruiker niet ingelogd');
    }

    try {
      const docData = {
        ...transcriptionData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'transcriptions'),
        docData
      );

      debugLog('Saved transcription:', docRef.id);

      const newTranscription = {
        id: docRef.id,
        ...transcriptionData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setTranscriptions(prev => [newTranscription, ...prev]);
      
      return docRef.id;
    } catch (err) {
      debugError('Error saving transcription:', err);
      throw new Error('Kon transcriptie niet opslaan');
    }
  }, [user]);

  const updateTranscription = useCallback(async (transcriptionId, updates) => {
    if (!user) {
      throw new Error('Gebruiker niet ingelogd');
    }

    try {
      const docRef = doc(db, 'users', user.uid, 'transcriptions', transcriptionId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      setTranscriptions(prev => 
        prev.map(t => 
          t.id === transcriptionId 
            ? { ...t, ...updates, updatedAt: new Date() }
            : t
        )
      );

      debugLog('Updated transcription:', transcriptionId);
    } catch (err) {
      debugError('Error updating transcription:', err);
      throw new Error('Kon transcriptie niet bijwerken');
    }
  }, [user]);

  const deleteTranscription = useCallback(async (transcriptionId) => {
    if (!user) {
      throw new Error('Gebruiker niet ingelogd');
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transcriptions', transcriptionId));
      
      setTranscriptions(prev => prev.filter(t => t.id !== transcriptionId));
      
      debugLog('Deleted transcription:', transcriptionId);
    } catch (err) {
      debugError('Error deleting transcription:', err);
      throw new Error('Kon transcriptie niet verwijderen');
    }
  }, [user]);

  const searchTranscriptions = useCallback(async (searchTerm) => {
    if (!user || !searchTerm) {
      return transcriptions;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    
    return transcriptions.filter(t => 
      t.text?.toLowerCase().includes(lowercaseSearch) ||
      t.title?.toLowerCase().includes(lowercaseSearch) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
    );
  }, [user, transcriptions]);

  const getTranscriptionsByDateRange = useCallback((startDate, endDate) => {
    return transcriptions.filter(t => {
      const transcriptionDate = new Date(t.createdAt);
      return transcriptionDate >= startDate && transcriptionDate <= endDate;
    });
  }, [transcriptions]);

  const exportTranscription = useCallback((transcription, format = 'txt') => {
    const date = new Date(transcription.createdAt).toLocaleDateString('nl-NL');
    const time = new Date(transcription.createdAt).toLocaleTimeString('nl-NL');
    
    let content = '';
    
    if (format === 'txt') {
      content = `Transcriptie: ${transcription.title || 'Geen titel'}\n`;
      content += `Datum: ${date} ${time}\n`;
      content += `Duur: ${transcription.formattedDuration || 'Onbekend'}\n`;
      content += `Taal: ${transcription.language || 'nl'}\n`;
      if (transcription.tags?.length) {
        content += `Tags: ${transcription.tags.join(', ')}\n`;
      }
      content += '\n---\n\n';
      content += transcription.text;
    } else if (format === 'json') {
      content = JSON.stringify(transcription, null, 2);
    }
    
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcriptie-${transcription.id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    transcriptions,
    isLoading,
    error,
    saveTranscription,
    updateTranscription,
    deleteTranscription,
    searchTranscriptions,
    getTranscriptionsByDateRange,
    exportTranscription,
    reload: loadTranscriptions
  };
}