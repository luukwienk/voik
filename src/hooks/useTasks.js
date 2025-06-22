import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, deleteDoc } from '../firebase';
import { debugLog, debugError } from '../utils/debug';

export function useTasks(user) {
  const [tasks, setTasks] = useState({});
  const [currentTaskList, setCurrentTaskList] = useState('Today');
  const [tasksLoaded, setTasksLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks(user.uid);
    } else {
      setTasks({ 'Today': { items: [] } });
      setCurrentTaskList('Today');
      setTasksLoaded(false);
    }
  }, [user]);

  // Helper function om titel uit tekst te halen
  const extractTitleFromText = (text) => {
    if (!text) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    const lines = cleanText.split(/\r?\n/);
    return lines[0].trim();
  };

  const loadTasks = async (userId) => {
    try {
      debugLog('Loading tasks for user:', userId);
      const tasksCollection = collection(db, 'users', userId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const loadedTasks = {};
      tasksSnapshot.forEach((doc) => {
        // Controleer en voeg titles toe aan taken die nog geen titel hebben
        const items = doc.data().items || [];
        const updatedItems = items.map(item => {
          if (!item.title) {
            return {
              ...item,
              title: extractTitleFromText(item.text)
            };
          }
          return item;
        });

        loadedTasks[doc.id] = {
          items: updatedItems
        };
        debugLog(`Loaded task list "${doc.id}":`, updatedItems);
      });
      
      // Zorg ervoor dat er altijd een 'Today' lijst is
      if (!loadedTasks['Today']) {
        loadedTasks['Today'] = { items: [] };
        debugLog('Created missing "Today" task list');
        await saveTasks(userId, loadedTasks);
      }
      
      if (Object.keys(loadedTasks).length === 0) {
        loadedTasks['Today'] = { items: [] };
        debugLog('Created default "Today" task list');
        await saveTasks(userId, loadedTasks);
      }
      
      debugLog('All loaded tasks:', loadedTasks);
      setTasks(loadedTasks);
      
      // Altijd 'Today' selecteren als standaard, ongeacht welke lijsten er zijn
      setCurrentTaskList('Today');
      setTasksLoaded(true);
      debugLog('🔍 DEBUG: Tasks loading completed, tasksLoaded set to true');
    } catch (error) {
      debugError('Error loading tasks:', error);
    }
  };

  const saveTasks = async (userId, tasksToSave) => {
    if (!tasksLoaded) return;
    try {
      debugLog('Saving tasks for user:', userId);
      const tasksCollection = collection(db, 'users', userId, 'tasks');
      for (const listName in tasksToSave) {
        await setDoc(doc(tasksCollection, listName), { 
          items: tasksToSave[listName].items 
        });
      }
      debugLog('Tasks saved');
    } catch (error) {
      debugError('Error saving tasks:', error);
    }
  };

  const addTaskList = (listName) => {
    if (listName && !tasks[listName]) {
      const newTasks = {
        ...tasks,
        [listName]: { items: [] }
      };
      setTasks(newTasks);
      setCurrentTaskList(listName);
      if (user) {
        saveTasks(user.uid, newTasks);
      }
    }
  };

  const deleteTaskList = async (listName) => {
    if (listName === 'Today') return;
    setTasks(prevTasks => {
      const { [listName]: deletedList, ...restTasks } = prevTasks;
      if (user) {
        deleteTaskListFromDatabase(user.uid, listName);
      }
      const newCurrentList = currentTaskList === listName ? Object.keys(restTasks)[0] || 'Today' : currentTaskList;
      setCurrentTaskList(newCurrentList);
      return restTasks;
    });
  };

  const deleteTaskListFromDatabase = async (userId, listName) => {
    try {
      const taskDoc = doc(db, 'users', userId, 'tasks', listName);
      await deleteDoc(taskDoc);
      debugLog(`Task list "${listName}" deleted from database`);
    } catch (error) {
      debugError('Error deleting task list:', error);
    }
  };

  const updateTaskList = async (listName, newListData) => {
    try {
      // Detecteer of we een task object krijgen
      if (typeof listName === 'object' && listName !== null) {
        debugLog('Received task object instead of listName');
        const task = listName;
        const taskList = task.list;
        
        if (!taskList) {
          debugError('Missing list property in task:', task);
          return;
        }
        
        // Haal huidige items op
        const currentItems = tasks[taskList]?.items || [];
        
        // Update juiste task
        const updatedItems = currentItems.map(item => 
          item.id === task.id ? task : item
        );
        
        // Update direct in state en in firebase
        setTasks(prevTasks => ({
          ...prevTasks,
          [taskList]: { items: updatedItems }
        }));
        
        if (user) {
          const taskDoc = doc(db, 'users', user.uid, 'tasks', taskList);
          await setDoc(taskDoc, { items: updatedItems });
        }
        
        return;
      }

      // Originele code vanaf hier...
      debugLog('UpdateTaskList called with:', {
        listName,
        newListData
      });
  
      // Controleer de basis structuur
      if (!newListData || !listName) {
        debugError('Missing required data:', { listName, newListData });
        throw new Error('Missing required task list data');
      }
  
      // Zorg ervoor dat we een items array hebben
      if (!newListData.items) {
        debugLog('Items array missing, creating empty array for:', listName);
        newListData.items = [];
      } else if (!Array.isArray(newListData.items)) {
        debugError('Invalid items structure:', listName);
        newListData.items = [];
      }
  
      // Valideer elk item in de array en voeg title toe als het ontbreekt
      const validatedItems = newListData.items.map(item => {
        if (!item || typeof item !== 'object') {
          debugError('Invalid item:', item);
          return {
            id: `task-${Date.now()}-${Math.random()}`,
            title: 'Nieuwe taak',
            text: '',
            completed: false
          };
        }
  
        // Extract title from text if missing
        const title = item.title || extractTitleFromText(item.text) || 'Nieuwe taak';
        
        return {
          id: item.id || `task-${Date.now()}-${Math.random()}`,
          title: title,
          text: item.text || '',
          completed: Boolean(item.completed)
        };
      });
  
      const validatedData = {
        items: validatedItems
      };
  
      // Update local state
      setTasks(prevTasks => ({
        ...prevTasks,
        [listName]: validatedData
      }));
  
      // Update in Firebase
      if (user) {
        const taskDoc = doc(db, 'users', user.uid, 'tasks', listName);
        debugLog('Saving to Firebase:', {
          listName,
          validatedData
        });
        await setDoc(taskDoc, validatedData);
      }
  
    } catch (error) {
      debugError('Error in updateTaskList:', error);
      throw error;
    }
  };

  return { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList };
}