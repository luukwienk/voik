// Updated App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ResponsiveMainContent from './components/ResponsiveMainContent';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useNotes } from './hooks/useNotes';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useHealthTracking } from './hooks/useHealthTracking';
import SignIn from './SignIn';
import { initClient } from './services/googleCalendar';
// PWA registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  const { user, signOut } = useAuth();
  const { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList } = useTasks(user);
  const { notes, currentNoteList, setCurrentNoteList, addNoteList, deleteNoteList, updateNoteList } = useNotes(user);
  const { recognizedText, aiResponse, isLoading, error, handleVoiceInput, setRecognizedText } = useVoiceInput(
    tasks, 
    notes, 
    currentTaskList, 
    currentNoteList, 
    updateTaskList, 
    updateNoteList,
    user?.uid
  );
  const [currentTab, setCurrentTab] = useState(0);
  
  // Initialize health tracking
  const { 
    healthData, 
    isLoading: healthLoading, 
    error: healthError, 
    addHealthEntry, 
    updateHealthEntry, 
    deleteHealthEntry,
    getHealthDataByDateRange,
    getLatestEntry,
    calculateWeeklyAverage,
    calculateTrend
  } = useHealthTracking(user);

  useEffect(() => {
    initClient().catch(error => console.error("Failed to initialize Google API client:", error));
  }, []);

  useEffect(() => {
    console.log('Tasks:', tasks);
    console.log('Current Task List:', currentTaskList);
    console.log('Notes:', notes);
    console.log('Current Note List:', currentNoteList);
    if (healthData) {
      console.log('Health Data:', healthData);
    }
  }, [tasks, currentTaskList, notes, currentNoteList, healthData]);

  // Dit effect zorgt ervoor dat de juiste initiële lijst wordt geselecteerd
  // maar behoudt de huidige lijsten bij tabwisseling
  const [initialTabsVisited, setInitialTabsVisited] = useState({ 0: false, 1: false });
  
  useEffect(() => {
    if (currentTab === 1 && !initialTabsVisited[1]) { // 1 for 'notes'
      console.log('App: Eerste bezoek aan notes tab, standaard notelist instellen op "My Notes"');
      setCurrentNoteList('My Notes');
      setInitialTabsVisited(prev => ({ ...prev, 1: true }));
    } else if (currentTab === 0 && !initialTabsVisited[0]) {
      console.log('App: Eerste bezoek aan tasks tab, standaard tasklist instellen op "Today"');
      setCurrentTaskList('Today');
      setInitialTabsVisited(prev => ({ ...prev, 0: true }));
    }
    // We behouden de huidige lijsten bij terugkeer naar tabs
  }, [currentTab, setCurrentNoteList, setCurrentTaskList, initialTabsVisited]);

  const handleTabChange = (tab) => {
    if (tab !== currentTab) {
      setCurrentTab(tab);
      
      // Bij eerste navigatie naar elke tab, stel standaardlijsten in
      if (tab === 1 && !initialTabsVisited[1]) { // 1 voor 'notes'
        setCurrentNoteList('My Notes');
        setInitialTabsVisited(prev => ({ ...prev, 1: true }));
      } else if (tab === 0 && !initialTabsVisited[0]) {
        setCurrentTaskList('Today');
        setInitialTabsVisited(prev => ({ ...prev, 0: true }));
      }
      
      // We behouden de geselecteerde lijsten bij tabwisseling
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
      />
      
      <ResponsiveMainContent
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
        moveTask={moveTask}
        signOut={signOut}
        user={user}
        // Pass health tracking props
        healthData={healthData}
        healthLoading={healthLoading}
        healthError={healthError}
        addHealthEntry={addHealthEntry}
        updateHealthEntry={updateHealthEntry}
        deleteHealthEntry={deleteHealthEntry}
        getHealthDataByDateRange={getHealthDataByDateRange}
        getLatestEntry={getLatestEntry}
        calculateWeeklyAverage={calculateWeeklyAverage}
        calculateTrend={calculateTrend}
      />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

// Register service worker for PWA functionality
serviceWorkerRegistration.register();

export default App;