// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useNotes } from './hooks/useNotes';
import { useVoiceInput } from './hooks/useVoiceInput';
import SignIn from './SignIn';
import { initClient } from './services/googleCalendar';

function App() {
  const { user, signOut } = useAuth();
  const { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList } = useTasks(user);
  const { notes, currentNoteList, setCurrentNoteList, addNoteList, deleteNoteList, updateNoteList } = useNotes(user);
  const { recognizedText, aiResponse, isLoading, error, handleVoiceInput, setRecognizedText } = useVoiceInput(tasks, notes, currentTaskList, currentNoteList, updateTaskList, updateNoteList);
  const [currentTab, setCurrentTab] = useState(0); // Changed to 0 for 'tasks'

  useEffect(() => {
    initClient().catch(error => console.error("Failed to initialize Google API client:", error));
  }, []);

  useEffect(() => {
    console.log('Tasks:', tasks);
    console.log('Current Task List:', currentTaskList);
    console.log('Notes:', notes);
    console.log('Current Note List:', currentNoteList);
  }, [tasks, currentTaskList, notes, currentNoteList]);

  useEffect(() => {
    if (currentTab === 0) { // 0 for 'tasks'
      console.log('App: Switching to tasks, setting currentTaskList to "Today"');
      setCurrentTaskList('Today');
    } else if (currentTab === 1) { // 1 for 'notes'
      console.log('App: Switching to notes, setting currentNoteList to "My Notes"');
      setCurrentNoteList('My Notes');
    }
  }, [currentTab, setCurrentTaskList, setCurrentNoteList]);

  const handleTabChange = (tab) => {
    if (tab !== currentTab) {
      setCurrentTab(tab);
      if (tab === 0) { // 0 for 'tasks'
        setCurrentTaskList('Today');
      } else if (tab === 1) { // 1 for 'notes'
        setCurrentNoteList('My Notes');
      }
    }
  };

  const moveTask = (task, sourceList, destinationList) => {
    // Create a copy of the tasks object
    const updatedTasks = { ...tasks };
    
    // Ensure the arrays exist
    updatedTasks[sourceList] = updatedTasks[sourceList] || { items: [] };
    updatedTasks[destinationList] = updatedTasks[destinationList] || { items: [] };
    
    // Remove task from source list's items array
    updatedTasks[sourceList].items = updatedTasks[sourceList].items.filter(t => t.id !== task.id);
    
    // Add task to destination list's items array
    updatedTasks[destinationList].items = [task, ...updatedTasks[destinationList].items];
    
    // Update all tasks
    updateTaskList(updatedTasks);
  };

  if (!user) return <SignIn user={user} />;

  return (
    <div className="App">
      <Header
        user={user}
        signOut={signOut}
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        tasks={tasks}
        notes={notes}
        currentTaskList={currentTaskList}
        currentNoteList={currentNoteList}
        setCurrentTaskList={setCurrentTaskList}
        setCurrentNoteList={setCurrentNoteList}
        addTaskList={addTaskList}
        addNoteList={addNoteList}
        deleteTaskList={deleteTaskList}
        deleteNoteList={deleteNoteList}
      />
      <MainContent
        currentTab={currentTab}
        tasks={tasks}
        notes={notes}
        currentTaskList={currentTaskList}
        currentNoteList={currentNoteList}
        setCurrentTaskList={setCurrentTaskList}
        setCurrentNoteList={setCurrentNoteList}
        updateTaskList={updateTaskList}
        updateNoteList={updateNoteList}
        recognizedText={recognizedText}
        aiResponse={aiResponse}
        isLoading={isLoading}
        error={error}
        handleVoiceInput={handleVoiceInput}
        setRecognizedText={setRecognizedText}
        addTaskList={addTaskList}
        addNoteList={addNoteList}
        deleteTaskList={deleteTaskList}
        deleteNoteList={deleteNoteList}
        moveTask={moveTask} // Add this new prop
      />
    </div>
  );
}

export default App;
