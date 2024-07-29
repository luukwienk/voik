import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import './App.css';
import VoiceInput from './components/VoiceInput';
import TaskList from './components/TaskList';
import { generateTasks } from './services/openai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';


function App() {
  const [lists, setLists] = useState(() => {
    const storedLists = localStorage.getItem('taskLists');
    return storedLists ? JSON.parse(storedLists) : { 'Today': [] };
  });


  const [currentList, setCurrentList] = useState(() => {
    const storedCurrentList = localStorage.getItem('currentList');
    return storedCurrentList || 'Today';
  });


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');


  useEffect(() => {
    localStorage.setItem('taskLists', JSON.stringify(lists));
  }, [lists]);


  useEffect(() => {
    localStorage.setItem('currentList', currentList);
  }, [currentList]);


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
      setLists(prevLists => ({
        ...prevLists,
        [currentList]: [...newTasks,...prevLists[currentList] ]
      }));
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
    setLists(prevLists => ({
      ...prevLists,
      [currentList]: [newTask, ...prevLists[currentList]]
    }));
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
        return restLists;
      });
      if (currentList === listName) {
        const newCurrentList = Object.keys(restLists)[0] || 'Today';
        setCurrentList(newCurrentList);
      }
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


  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="App">
        <header className="app-header">
          <div className="list-selector">
            <select 
  value={currentList} 
  onChange={handleListChange}
>
  {Object.keys(lists).map(listName => (
    <option key={listName} value={listName}>{listName}</option>
  ))}
  <option value="new">+ New List</option>
</select>
            <button className="remove-list-btn" onClick={() => deleteList(currentList)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          <VoiceInput 
            onInputComplete={handleVoiceInput} 
            onTextChange={handleTextChange}
            language="en-US" 
          />
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