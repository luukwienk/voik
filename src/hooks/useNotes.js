import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, deleteDoc } from '../firebase';

export function useNotes(user) {
  const [notes, setNotes] = useState({});
  const [currentNoteList, setCurrentNoteList] = useState('My Notes');
  const [notesLoaded, setNotesLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotes(user.uid);
    } else {
      setNotes({ 'My Notes': { items: [] } });
      setCurrentNoteList('My Notes');
      setNotesLoaded(false);
    }
  }, [user]);

  const loadNotes = async (userId) => {
    try {
      console.log('Loading notes for user:', userId);
      const notesCollection = collection(db, 'users', userId, 'notes');
      const notesSnapshot = await getDocs(notesCollection);
      const loadedNotes = {};
      notesSnapshot.forEach((doc) => {
        loadedNotes[doc.id] = {
          items: doc.data().items || []
        };
        console.log(`Loaded note list "${doc.id}"`);
      });
      if (Object.keys(loadedNotes).length === 0) {
        loadedNotes['My Notes'] = { items: [] };
        console.log('Created default "My Notes" note list');
        await saveNotes(userId, loadedNotes);
      }
      console.log('All loaded notes:', loadedNotes);
      setNotes(loadedNotes);
      setCurrentNoteList(Object.keys(loadedNotes)[0]);
      setNotesLoaded(true);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async (userId, notesToSave) => {
    if (!notesLoaded) return;
    try {
      console.log('Saving notes for user:', userId);
      const notesCollection = collection(db, 'users', userId, 'notes');
      for (const listName in notesToSave) {
        await setDoc(doc(notesCollection, listName), { 
          items: notesToSave[listName].items 
        });
      }
      console.log('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const addNoteList = (listName) => {
    if (listName && !notes[listName]) {
      const newNotes = {
        ...notes,
        [listName]: { items: [] }
      };
      setNotes(newNotes);
      setCurrentNoteList(listName);
      if (user) {
        saveNotes(user.uid, newNotes);
      }
    }
  };

  const deleteNoteList = async (listName) => {
    if (listName === 'My Notes') return;
    setNotes(prevNotes => {
      const { [listName]: deletedList, ...restNotes } = prevNotes;
      if (user) {
        deleteNoteListFromDatabase(user.uid, listName);
      }
      const newCurrentList = currentNoteList === listName ? Object.keys(restNotes)[0] || 'My Notes' : currentNoteList;
      setCurrentNoteList(newCurrentList);
      return restNotes;
    });
  };

  const deleteNoteListFromDatabase = async (userId, listName) => {
    try {
      const noteDoc = doc(db, 'users', userId, 'notes', listName);
      await deleteDoc(noteDoc);
      console.log(`Note list "${listName}" deleted from database`);
    } catch (error) {
      console.error('Error deleting note list:', error);
    }
  };

  const updateNoteList = (listName, newListData) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [listName]: newListData
    }));
    if (user) {
      saveNotes(user.uid, {
        ...notes,
        [listName]: newListData
      });
    }
  };

  return { notes, currentNoteList, setCurrentNoteList, addNoteList, deleteNoteList, updateNoteList };
}