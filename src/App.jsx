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
  const [currentTab, setCurrentTab] = useState('tasks');

  useEffect(() => {
    initClient().catch(error => console.error("Failed to initialize Google API client:", error));
  }, []);

  useEffect(() => {
    console.log('Tasks:', tasks);
    console.log('Current Task List:', currentTaskList);
    console.log('Notes:', notes);
    console.log('Current Note List:', currentNoteList);
  }, [tasks, currentTaskList, notes, currentNoteList]);

  if (!user) return <SignIn user={user} />;

  return (
    <div className="App">
      <Header
        user={user}
        signOut={signOut}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
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
      />
    </div>
  );
}

export default App;
