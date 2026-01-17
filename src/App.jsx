// Updated App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
// import Header from './components/Header';
import ResponsiveMainContent from './components/ResponsiveMainContent';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useHealthTracking } from './hooks/useHealthTracking';
import SignIn from './SignIn';
import { initClient, addEventToCalendar } from './services/googleCalendar';
// PWA registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import TabsNavigation from './components/TabsNavigation';
import ChatInterface from './components/ChatInterface';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { debugLog, debugError } from './utils/debug';
import MeetImport from './components/MeetImport';

function App() {
  // console.log('🔄 App component re-rendered at:', new Date().toISOString());
  
  const { user, signOut } = useAuth();
  const { tasks, currentTaskList, setCurrentTaskList, addTaskList, deleteTaskList, updateTaskList } = useTasks(user);
  const [currentTab, setCurrentTab] = useState(0);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [showMeetImport, setShowMeetImport] = useState(false);
  const [pendingTranscriptionId, setPendingTranscriptionId] = useState(null);
  
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

  // Task management callbacks for chat
  const handleTaskAdd = useCallback(async (taskTexts) => {
    if (!taskTexts || !Array.isArray(taskTexts)) return;
    
    const newTasks = taskTexts.map(text => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text,
      title: text.split('\n')[0].substring(0, 50),
      completed: false,
      createdAt: new Date().toISOString()
    }));
    
    const currentItems = tasks[currentTaskList]?.items || [];
    await updateTaskList(currentTaskList, {
      items: [...currentItems, ...newTasks]
    });
  }, [tasks, currentTaskList, updateTaskList]);

  const handleTaskComplete = useCallback(async (taskId) => {
    // Find task in all lists
    for (const [listName, list] of Object.entries(tasks)) {
      const taskIndex = list.items?.findIndex(t => t.id === taskId) ?? -1;
      if (taskIndex !== -1) {
        const updatedItems = [...list.items];
        updatedItems[taskIndex] = {
          ...updatedItems[taskIndex],
          completed: true,
          completedAt: new Date().toISOString()
        };
        await updateTaskList(listName, { items: updatedItems });
        break;
      }
    }
  }, [tasks, updateTaskList]);

  const handleTaskSearch = useCallback((query) => {
    const results = [];
    Object.entries(tasks).forEach(([listName, list]) => {
      list.items?.forEach(task => {
        if (task.text.toLowerCase().includes(query.toLowerCase()) ||
            task.title?.toLowerCase().includes(query.toLowerCase())) {
          results.push({ ...task, list: listName });
        }
      });
    });
    return results;
  }, [tasks]);

  const handleCalendarEventAdd = useCallback(async (eventData) => {
    const event = {
      summary: eventData.title,
      start: {
        dateTime: eventData.start_time,
        timeZone: 'Europe/Amsterdam'
      },
      end: {
        dateTime: eventData.end_time,
        timeZone: 'Europe/Amsterdam'
      },
      description: eventData.description || ''
    };
    return await addEventToCalendar(event);
  }, []);

  const handleGetTasksFromList = useCallback((listName) => {
    debugLog('🔍 DEBUG: All tasks state:', tasks);
    debugLog('🔍 DEBUG: Current list:', currentTaskList);
    debugLog('🔍 DEBUG: Requested list:', listName);
    debugLog('🔍 DEBUG: Timestamp:', new Date().toISOString());
    
    const list = tasks[listName] || tasks[currentTaskList];
    debugLog('🔍 DEBUG: Found list data:', list);
    
    return {
      list_name: listName || currentTaskList,
      tasks: list?.items || [],
      count: list?.items?.length || 0
    };
  }, [tasks, currentTaskList]);

  const getSystemContext = useCallback(() => {
    return {
      currentTaskList,
      taskListNames: Object.keys(tasks),
      taskCount: tasks[currentTaskList]?.items?.length || 0,
      timezone: 'Europe/Amsterdam'
    };
  }, [currentTaskList, tasks]);

  // Initialize Realtime Chat
  // console.log('🔄 About to call useRealtimeChat at:', new Date().toISOString());
  const chatProps = useRealtimeChat({
    onTaskAdd: handleTaskAdd,
    onTaskComplete: handleTaskComplete,
    onTaskSearch: handleTaskSearch,
    onCalendarEventAdd: handleCalendarEventAdd,
    onGetTasksFromList: handleGetTasksFromList,
    getSystemContext
  });

  useEffect(() => {
    initClient().catch(error => debugError("Failed to initialize Google API client:", error));
  }, []);

  // Detecteer Meet import URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === 'meet' && user) {
      setShowMeetImport(true);
      // Verwijder parameter uit URL zonder pagina reload
      const url = new URL(window.location.href);
      url.searchParams.delete('import');
      window.history.replaceState({}, '', url.pathname);
      // Ga naar transcriptie tab (now index 1)
      setCurrentTab(1);
    }
  }, [user]);

  // Deel Firebase config met Chrome extension voor directe uploads
  useEffect(() => {
    async function shareFirebaseConfig() {
      if (!user) return;

      try {
        // Haal fresh auth token op
        const token = await user.getIdToken(true);

        // Stuur naar extension via postMessage (bridge luistert)
        window.postMessage({
          type: 'VOIK_SET_FIREBASE_CONFIG',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          authToken: token,
          userId: user.uid
        }, '*');

        debugLog('[App] Firebase config gedeeld met extension');
      } catch (err) {
        debugError('[App] Kon Firebase config niet delen:', err);
      }
    }

    shareFirebaseConfig();

    // Refresh token elke 30 minuten (tokens verlopen na 1 uur)
    const tokenRefreshInterval = setInterval(shareFirebaseConfig, 30 * 60 * 1000);

    return () => clearInterval(tokenRefreshInterval);
  }, [user]);

  useEffect(() => {
    console.log('Tasks:', tasks);
    console.log('Current Task List:', currentTaskList);
    if (healthData) {
      console.log('Health Data:', healthData);
    }
  }, [tasks, currentTaskList, healthData]);

  // Monitor tasks state changes (only in development)
  useEffect(() => {
    debugLog('📊 TASKS STATE CHANGED:', {
      taskKeys: Object.keys(tasks),
      isEmpty: Object.keys(tasks).length === 0,
      timestamp: new Date().toISOString()
    });
  }, [tasks]);

  // Dit effect zorgt ervoor dat de juiste initiële lijst wordt geselecteerd
  // maar behoudt de huidige lijsten bij tabwisseling
  // New tab indices: 0=Board, 1=Transcriptions, 2=Tasks, 3=Calendar, 4=Search, 5=Health, 6=Success
  const [initialTabsVisited, setInitialTabsVisited] = useState({ 2: false });

  useEffect(() => {
    // Tab 2 is now Tasks - set default list on first visit
    if (currentTab === 2 && !initialTabsVisited[2]) {
      debugLog('App: Eerste bezoek aan tasks tab, standaard tasklist instellen op "Today"');
      setCurrentTaskList('Today');
      setInitialTabsVisited(prev => ({ ...prev, 2: true }));
    }
    // We behouden de huidige lijsten bij terugkeer naar tabs
  }, [currentTab, setCurrentTaskList, initialTabsVisited]);

  const handleTabChange = (tab) => {
    if (tab !== currentTab) {
      setCurrentTab(tab);

      // Bij eerste navigatie naar Tasks tab (now index 2), stel standaardlijsten in
      if (tab === 2 && !initialTabsVisited[2]) {
        setCurrentTaskList('Today');
        setInitialTabsVisited(prev => ({ ...prev, 2: true }));
      }

      // Clear pending transcription when leaving transcription tab
      if (tab !== 1 && pendingTranscriptionId) {
        setPendingTranscriptionId(null);
      }
    }
  };

  // Navigate to transcription tab and show processing transcription
  const handleNavigateToTranscription = useCallback((transcriptionId) => {
    setPendingTranscriptionId(transcriptionId);
    setCurrentTab(1); // Transcriptions tab
  }, []);

  const moveTask = async (task, sourceList, destinationList) => {
    debugLog('Moving task:', { task, sourceList, destinationList });

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
      debugError('Error moving task:', error);
    }
  };

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
  // Health tracking props
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
  // Chat props
  chatProps={chatProps}
  isChatModalOpen={isChatModalOpen}
  setIsChatModalOpen={setIsChatModalOpen}
  // Transcription navigation
  pendingTranscriptionId={pendingTranscriptionId}
  onNavigateToTranscription={handleNavigateToTranscription}
  onClearPendingTranscription={() => setPendingTranscriptionId(null)}
/>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Chat interface - alleen renderen als modal open is */}
      {isChatModalOpen && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <ChatInterface
              {...chatProps}
              onClose={() => setIsChatModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Meet Import Modal */}
      {showMeetImport && (
        <MeetImport
          user={user}
          onClose={() => setShowMeetImport(false)}
          onSuccess={() => {
            setShowMeetImport(false);
            // Optioneel: refresh transcripties lijst
          }}
        />
      )}
    </div>
  );
}

// Register service worker for PWA functionality
serviceWorkerRegistration.register();

export default App;