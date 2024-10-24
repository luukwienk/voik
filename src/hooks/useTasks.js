import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, deleteDoc } from '../firebase';

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

  const loadTasks = async (userId) => {
    try {
      console.log('Loading tasks for user:', userId);
      const tasksCollection = collection(db, 'users', userId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const loadedTasks = {};
      tasksSnapshot.forEach((doc) => {
        loadedTasks[doc.id] = {
          items: doc.data().items || []
        };
        console.log(`Loaded task list "${doc.id}":`, doc.data().items);
      });
      if (Object.keys(loadedTasks).length === 0) {
        loadedTasks['Today'] = { items: [] };
        console.log('Created default "Today" task list');
        await saveTasks(userId, loadedTasks);
      }
      console.log('All loaded tasks:', loadedTasks);
      setTasks(loadedTasks);
      setCurrentTaskList(Object.keys(loadedTasks)[0]);
      setTasksLoaded(true);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (userId, tasksToSave) => {
    if (!tasksLoaded) return;
    try {
      console.log('Saving tasks for user:', userId);
      const tasksCollection = collection(db, 'users', userId, 'tasks');
      for (const listName in tasksToSave) {
        await setDoc(doc(tasksCollection, listName), { 
          items: tasksToSave[listName].items 
        });
      }
      console.log('Tasks saved');
    } catch (error) {
      console.error('Error saving tasks:', error);
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
      console.log(`Task list "${listName}" deleted from database`);
    } catch (error) {
      console.error('Error deleting task list:', error);
    }
  };

  const updateTaskList = (listName, newListData) => {
    // Ensure we have the correct structure
    const updatedList = {
      items: Array.isArray(newListData) ? newListData : newListData.items || []
    };
  
    setTasks(prevTasks => ({
      ...prevTasks,
      [listName]: updatedList
    }));
  
    if (user) {
      const updatedTasks = {
        ...tasks,
        [listName]: updatedList
      };
      saveTasks(user.uid, updatedTasks);
    }
  };

  return { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList };
}
