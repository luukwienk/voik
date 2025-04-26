// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContentWithCalendar'; // Use this for testing
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

  const moveTask = async (task, sourceList, destinationList) => {
    console.log('Moving task:', { task, sourceList, destinationList });

    try {
      // Create a deep copy of the current tasks
      const updatedTasks = JSON.parse(JSON.stringify(tasks));

      // Ensure both source and destination lists exist
      if (!updatedTasks[sourceList]) updatedTasks[sourceList] = { items: [] };
      if (!updatedTasks[destinationList]) updatedTasks[destinationList] = { items: [] };

      // Remove from source list
      updatedTasks[sourceList].items = updatedTasks[sourceList].items.filter(
        t => t.id !== task.id
      );

      // Add to destination list
      updatedTasks[destinationList].items = [
        task,
        ...(updatedTasks[destinationList].items || [])
      ];

      // Update both lists
      if (sourceList !== destinationList) {
        await updateTaskList(sourceList, updatedTasks[sourceList]);
        await updateTaskList(destinationList, updatedTasks[destinationList]);
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
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
