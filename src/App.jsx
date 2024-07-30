import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import './App.css';
import VoiceInput from './components/VoiceInput';
import TaskList from './components/TaskList';
import { generateTasks } from './services/openai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import SignIn from './SignIn';
import { auth, db, signOutUser, onAuthStateChanged, collection, getDocs, setDoc, doc, deleteDoc } from './firebase';

function App() {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState({ 'Today': [] });
  const [currentList, setCurrentList] = useState('Today');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [tasksLoaded, setTasksLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User signed in:', user);
        setUser(user);
        loadTasks(user.uid);
      } else {
        console.log('User signed out');
        setUser(null);
        setLists({ 'Today': [] });
        setCurrentList('Today');
        setTasksLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadTasks = async (userId) => {
    try {
      console.log('Loading tasks for user:', userId);
      const listsCollection = collection(db, 'users', userId, 'lists');
      const listsSnapshot = await getDocs(listsCollection);
      const loadedLists = {};
      listsSnapshot.forEach((doc) => {
        loadedLists[doc.id] = doc.data().tasks || [];
      });
      if (Object.keys(loadedLists).length === 0) {
        // No lists exist, create the default list
        loadedLists['Today'] = [];
        await saveTasks(userId, loadedLists);
      }
      console.log('Loaded lists:', loadedLists);
      setLists(loadedLists);
      setCurrentList(Object.keys(loadedLists)[0]); // Set the current list to the first available list
      setTasksLoaded(true);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    }
  };

  const saveTasks = async (userId, lists) => {
    if (!tasksLoaded) return;  // Check if tasks have been loaded
    try {
      console.log('Saving tasks for user:', userId);
      const listsCollection = collection(db, 'users', userId, 'lists');
      for (const listName in lists) {
        await setDoc(doc(listsCollection, listName), { tasks: lists[listName] });
      }
      console.log('Tasks and lists saved');
    } catch (error) {
      console.error('Error saving tasks and lists:', error);
      setError('Failed to save tasks and lists. Please try again.');
    }
  };

  const deleteListFromDatabase = async (userId, listName) => {
    try {
      const listDoc = doc(db, 'users', userId, 'lists', listName);
      await deleteDoc(listDoc);
      console.log(`List "${listName}" deleted from database`);
    } catch (error) {
      console.error('Error deleting list:', error);
      setError('Failed to delete list. Please try again.');
    }
  };

  useEffect(() => {
    if (user && tasksLoaded) { // Only save tasks if they have been loaded
      saveTasks(user.uid, lists);
    }
  }, [lists, user, tasksLoaded]);

  const handleVoiceInput = async (text) => {
    console.log('Recognized text:', text);
    setIsLoading(true);
    setError(null);
    try {
      const generatedTasks = await generateTasks(text);
      console.log('Generated tasks:', generatedTasks);
      const newTasks = generatedTasks.map(task => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: task,
        completed: false
      }));
      setLists(prevLists => {
        const updatedLists = { ...prevLists };
        if (!updatedLists[currentList]) {
          updatedLists[currentList] = [];
        }
        return {
          ...updatedLists,
          [currentList]: [...newTasks, ...updatedLists[currentList]]
        };
      });
    } catch (error) {
      console.error('Error generating tasks:', error);
      setError('Failed to generate tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = (newTaskText) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newTaskText,
      completed: false
    };
    setLists(prevLists => {
      const updatedLists = { ...prevLists };
      if (!updatedLists[currentList]) {
        updatedLists[currentList] = [];
      }
      return {
        ...updatedLists,
        [currentList]: [newTask, ...updatedLists[currentList]]
      };
    });
  };

  const handleTextChange = (text) => {
    setRecognizedText(text);
  };

  const toggleTaskCompletion = (taskId) => {
    setLists(prevLists => ({
      ...prevLists,
      [currentList]: prevLists[currentList].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const deleteTask = (taskId) => {
    setLists(prevLists => ({
      ...prevLists,
      [currentList]: prevLists[currentList].filter(task => task.id !== taskId)
    }));
  };

  const handleListChange = (e) => {
    if (e.target.value === 'new') {
      addNewList();
    } else {
      setCurrentList(e.target.value);
    }
  };

  const addNewList = () => {
    const listName = prompt('Enter the name for your new list:');
    if (listName && !lists[listName]) {
      setLists(prevLists => ({
        ...prevLists,
        [listName]: []
      }));
      setCurrentList(listName);
    } else if (lists[listName]) {
      alert('A list with this name already exists.');
    }
  };

  const deleteList = (listName) => {
    if (listName === 'Today') {
      alert('The default list cannot be removed.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the "${listName}" list?`)) {
      setLists(prevLists => {
        const { [listName]: deletedList, ...restLists } = prevLists;
        if (user) {
          deleteListFromDatabase(user.uid, listName);
        }
        const newCurrentList = currentList === listName ? Object.keys(restLists)[0] || 'Today' : currentList;
        setCurrentList(newCurrentList);
        return restLists;
      });
    }
  };

  const updateTask = (taskId, newText) => {
    setLists(prevLists => ({
      ...prevLists,
      [currentList]: prevLists[currentList].map(task =>
        task.id === taskId ? { ...task, text: newText } : task
      )
    }));
  };

  const reorderTasks = (startIndex, endIndex) => {
    setLists(prevLists => {
      const currentTasks = [...prevLists[currentList]];
      const [reorderedItem] = currentTasks.splice(startIndex, 1);
      currentTasks.splice(endIndex, 0, reorderedItem);
      return {
        ...prevLists,
        [currentList]: currentTasks
      };
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    reorderTasks(result.source.index, result.destination.index);
  };

  const [agendaItems, setAgendaItems] = useState([]);

  const handleCreateAgendaItem = (task, agendaDetails) => {
    const newAgendaItem = {
      id: `agenda-${Date.now()}`,
      taskId: task.id,
      ...agendaDetails
    };
    setAgendaItems(prevItems => [...prevItems, newAgendaItem]);
  };

  if (!user) {
    return <SignIn />;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="App">
        <header className="app-header">
          <div className="list-selector">
            <select value={currentList} onChange={handleListChange}>
              {Object.keys(lists).map(listName => (
                <option key={listName} value={listName}>{listName}</option>
              ))}
              <option value="new">+ New List</option>
            </select>
            <button className="remove-list-btn" onClick={() => deleteList(currentList)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <button onClick={signOutUser}>Sign out</button>
          </div>
          <VoiceInput 
            onInputComplete={handleVoiceInput} 
            onTextChange={handleTextChange}
            language="en-US" 
          />
          <div className="user-info">
            {user && (
              <p className="user-email">{user.email}</p>
            )}
          </div>
        </header>

        <div className="prompt-display">
          {recognizedText && <p>{recognizedText}</p>}
        </div>

        {isLoading && <p className="loading">Generating tasks...</p>}
        {error && <p className="error">{error}</p>}

        <main>
          {lists[currentList] && (
            <TaskList 
              tasks={lists[currentList]} 
              onToggleCompletion={toggleTaskCompletion}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onCreateAgendaItem={handleCreateAgendaItem}
              onAddTask={handleAddTask}
            />
          )}
        </main>
      </div>
    </DragDropContext>
  );
}

export default App;
