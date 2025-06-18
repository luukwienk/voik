// Updated App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
// import Header from './components/Header';
import ResponsiveMainContent from './components/ResponsiveMainContent';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useHealthTracking } from './hooks/useHealthTracking';
import SignIn from './SignIn';
import { initClient } from './services/googleCalendar';
// PWA registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ChatModal from './components/ChatModal';
import TabsNavigation from './components/TabsNavigation';

function App() {
  const { user, signOut } = useAuth();
  const { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList } = useTasks(user);
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
    if (healthData) {
      console.log('Health Data:', healthData);
    }
  }, [tasks, currentTaskList, healthData]);

  // Dit effect zorgt ervoor dat de juiste initiële lijst wordt geselecteerd
  // maar behoudt de huidige lijsten bij tabwisseling
  const [initialTabsVisited, setInitialTabsVisited] = useState({ 0: false });
  
  useEffect(() => {
    if (currentTab === 0 && !initialTabsVisited[0]) {
      console.log('App: Eerste bezoek aan tasks tab, standaard tasklist instellen op "Today"');
      setCurrentTaskList('Today');
      setInitialTabsVisited(prev => ({ ...prev, 0: true }));
    }
    // We behouden de huidige lijsten bij terugkeer naar tabs
  }, [currentTab, setCurrentTaskList, initialTabsVisited]);

  const handleTabChange = (tab) => {
    if (tab !== currentTab) {
      setCurrentTab(tab);
      
      // Bij eerste navigatie naar elke tab, stel standaardlijsten in
      if (tab === 0 && !initialTabsVisited[0]) {
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

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  if (!user) return <SignIn user={user} />;

  return (
    <div className="App">
      {/* Geen header meer */}
      <div className="navbar-wrapper">
        <TabsNavigation currentTab={currentTab} onTabChange={handleTabChange} signOut={signOut} />
      </div>
      <ResponsiveMainContent
        currentTab={currentTab}
        tasks={tasks}
        currentTaskList={currentTaskList}
        setCurrentTaskList={setCurrentTaskList}
        updateTaskList={updateTaskList}
        addTaskList={addTaskList}
        deleteTaskList={deleteTaskList}
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

      {/* Chat modal */}
      <ChatModal 
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentTasks={tasks[currentTaskList] || { items: [] }}
        updateTaskList={updateTaskList}
        currentTaskList={currentTaskList}
        userId={user?.uid}
      />
    </div>
  );
}

// Register service worker for PWA functionality
serviceWorkerRegistration.register();

export default App;