import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, deleteDoc } from '../firebase';

export function useLists(user) {
  const [lists, setLists] = useState({ 'Today': { type: 'task', items: [] } });
  const [currentList, setCurrentList] = useState('Today');
  const [tasksLoaded, setTasksLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      loadLists(user.uid);
    } else {
      setLists({ 'Today': { type: 'task', items: [] } });
      setCurrentList('Today');
      setTasksLoaded(false);
    }
  }, [user]);

  // In hooks/useLists.js

  const loadLists = async (userId) => {
    try {
      console.log('Loading lists for user:', userId);
      const listsCollection = collection(db, 'users', userId, 'lists');
      const listsSnapshot = await getDocs(listsCollection);
      const loadedLists = {};
      listsSnapshot.forEach((doc) => {
        loadedLists[doc.id] = {
          type: doc.data().type || 'task',
          items: doc.data().items || []
        };
        console.log(`Loaded list "${doc.id}" with type: ${loadedLists[doc.id].type}`);
      });
      if (Object.keys(loadedLists).length === 0 || !Object.values(loadedLists).some(list => list.type === 'task') || !Object.values(loadedLists).some(list => list.type === 'note')) {
        if (!Object.values(loadedLists).some(list => list.type === 'task')) {
          loadedLists['Today'] = { type: 'task', items: [] };
          console.log('Created default "Today" task list');
        }
        if (!Object.values(loadedLists).some(list => list.type === 'note')) {
          loadedLists['My Notes'] = { type: 'note', items: [] };
          console.log('Created default "My Notes" note list');
        }
        await saveLists(userId, loadedLists);
      }
      console.log('All loaded lists:', loadedLists);
      setLists(loadedLists);
      setCurrentList(Object.keys(loadedLists)[0]);
      setTasksLoaded(true);
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const saveLists = async (userId, listsToSave) => {
    if (!tasksLoaded) return;
    try {
      console.log('Saving lists for user:', userId);
      const listsCollection = collection(db, 'users', userId, 'lists');
      for (const listName in listsToSave) {
        await setDoc(doc(listsCollection, listName), { 
          type: listsToSave[listName].type, 
          items: listsToSave[listName].items 
        });
      }
      console.log('Lists saved');
    } catch (error) {
      console.error('Error saving lists:', error);
    }
  };

  const addList = (listName, type) => {
    if (listName && !lists[listName]) {
      const newLists = {
        ...lists,
        [listName]: { type, items: [] }
      };
      setLists(newLists);
      setCurrentList(listName);
      if (user) {
        saveLists(user.uid, newLists);
      }
    }
  };

  const deleteList = async (listName) => {
    if (listName === 'Today') return;
    setLists(prevLists => {
      const { [listName]: deletedList, ...restLists } = prevLists;
      if (user) {
        deleteListFromDatabase(user.uid, listName);
      }
      const newCurrentList = currentList === listName ? Object.keys(restLists)[0] || 'Today' : currentList;
      setCurrentList(newCurrentList);
      return restLists;
    });
  };

  const deleteListFromDatabase = async (userId, listName) => {
    try {
      const listDoc = doc(db, 'users', userId, 'lists', listName);
      await deleteDoc(listDoc);
      console.log(`List "${listName}" deleted from database`);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const updateList = (listName, newListData) => {
    setLists(prevLists => ({
      ...prevLists,
      [listName]: newListData
    }));
    if (user) {
      saveLists(user.uid, {
        ...lists,
        [listName]: newListData
      });
    }
  };

  return { lists, currentList, setCurrentList, addList, deleteList, updateList };
}