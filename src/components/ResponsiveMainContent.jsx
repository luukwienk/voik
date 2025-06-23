import React, { useState } from 'react';
import TaskList from './TaskList';
import TaskOverviewPage from './TaskOverviewPage';
import HealthTabNavigator from './health/HealthTabNavigator';
import SuccessTracker from './success/succesTracker';
import TranscriptionTab from './TranscriptionTab';
import ChatButton from './ChatButton';
import ChatInterface from './ChatInterface';
import ErrorBoundary from './ErrorBoundary';
import BigCalendarView from './BigCalendarView';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/responsive.css';
import '../styles/centeredLayout.css';
import ListSelectorModal from './ListSelectorModal';
import ListSelector from './ListSelector';
import '../styles/chat.css';

function ResponsiveMainContent({
  currentTab, 
  tasks,
  currentTaskList,
  setCurrentTaskList,
  updateTaskList,
  addTaskList,
  deleteTaskList,
  moveTask,
  user,
  signOut,
  // Health tracking props
  healthData,
  healthLoading,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  getHealthDataByDateRange,
  getLatestEntry,
  calculateWeeklyAverage,
  calculateTrend,
  // Chat props - NEW!
  chatProps,
  isChatModalOpen,
  setIsChatModalOpen
}) {
  // Detect if device is an iPad
  const isIPad = /iPad/.test(navigator.userAgent) || 
                (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  
  // Consider iPad as mobile for our layout
  const isDesktop = useMediaQuery('(min-width: 768px)') && !isIPad;

  const handleTasksExtracted = (tasksToAdd) => {
    if (tasksToAdd && tasksToAdd.length > 0) {
      const currentItems = tasks[currentTaskList]?.items || [];
      const newTasks = tasksToAdd.map(text => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text,
        title: text.split('\n')[0].substring(0, 50),
        completed: false,
        createdAt: new Date().toISOString()
      }));
      const updatedItems = [...currentItems, ...newTasks];
      updateTaskList(currentTaskList, { items: updatedItems });
    }
  };

  // Render TaskOverviewPage for tab 2
  if (currentTab === 2) {
    return (
      <ErrorBoundary>
        <TaskOverviewPage 
          tasks={tasks} 
          currentTaskList={currentTaskList}
          updateTaskList={updateTaskList}
          moveTask={moveTask}
        />
      </ErrorBoundary>
    );
  }

  // Render Health Tracker for tab 3
  if (currentTab === 3) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={{ 
          width: '100%',
          maxWidth: '100%', 
          boxSizing: 'border-box',
          height: 'calc(100vh - 130px)',
          overflowY: 'auto'
        }}>
          <HealthTabNavigator 
            healthData={healthData} 
            healthLoading={healthLoading}
            addHealthEntry={addHealthEntry}
            updateHealthEntry={updateHealthEntry}
            deleteHealthEntry={deleteHealthEntry}
            getHealthDataByDateRange={getHealthDataByDateRange || (() => {})}
            getLatestEntry={getLatestEntry || (() => {})}
            calculateWeeklyAverage={calculateWeeklyAverage || (() => {})}
            calculateTrend={calculateTrend || (() => {})}
          />
            
          {/* Chat button */}
          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
            
          {/* Chat interface */}
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
        </main>
      </ErrorBoundary>
    );
  }

  // Render Transcription Tab for tab 4
  if (currentTab === 4) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={{ 
          width: '100%',
          maxWidth: '100%', 
          boxSizing: 'border-box',
          height: 'calc(100vh - 130px)',
          overflowY: 'auto'
        }}>
          <TranscriptionTab user={user} onTasksExtracted={handleTasksExtracted} />
            
          {/* Chat button */}
          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
            
          {/* Chat interface */}
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
        </main>
      </ErrorBoundary>
    );
  }

  // Render Success Tracker for tab 5
  if (currentTab === 5) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={{ 
          width: '100%',
          maxWidth: '100%', 
          boxSizing: 'border-box',
          height: 'calc(100vh - 130px)',
          overflowY: 'auto'
        }}>
          <SuccessTracker userId={user?.uid} />
            
          {/* Chat button */}
          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
            
          {/* Chat interface */}
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
        </main>
      </ErrorBoundary>
    );
  }

  // Render Desktop or Mobile layout based on screen size
  if (isDesktop) {
    // Desktop Layout (calendar + task list)
    return (
      <ErrorBoundary>
        <main className="responsive-container">
          {currentTab === 1 ? (
            // For calendar tab, use the BigCalendarView
            <BigCalendarView
              tasks={tasks}
              currentTaskList={currentTaskList}
              moveTask={moveTask}
            />
          ) : currentTab === 3 ? (
            // Health tracker for desktop
            <div style={{ marginTop: 24 }}>
              <HealthTabNavigator 
                healthData={healthData} 
                healthLoading={healthLoading}
                addHealthEntry={addHealthEntry}
                updateHealthEntry={updateHealthEntry}
                deleteHealthEntry={deleteHealthEntry}
                getHealthDataByDateRange={getHealthDataByDateRange || (() => {})}
                getLatestEntry={getLatestEntry || (() => {})}
                calculateWeeklyAverage={calculateWeeklyAverage || (() => {})}
                calculateTrend={calculateTrend || (() => {})}
              />
            </div>
          ) : currentTab === 4 ? (
            // Transcription tab for desktop
            <div style={{ marginTop: 24 }}>
              <TranscriptionTab user={user} onTasksExtracted={handleTasksExtracted} />
            </div>
          ) : currentTab === 5 ? (
            // Success tracker for desktop
            <div style={{ marginTop: 24 }}>
              <SuccessTracker userId={user?.uid} />
            </div>
          ) : (
            <>
              {/* Combined calendar and task list view */}
              {currentTab === 0 ? (
                <div className="desktop-flex-row">
                  {/* Task list only - calendar temporarily removed */}
                  <div className="tasklist-container" style={{ marginTop: 24, width: '100%' }}>
                    <TaskList
                      tasks={tasks[currentTaskList]}
                      currentList={currentTaskList}
                      lists={tasks}
                      moveTask={moveTask}
                      hideTitleHeader={true}
                      setCurrentList={setCurrentTaskList}
                      addList={addTaskList}
                      deleteList={deleteTaskList}
                      updateList={(updatedData) => updateTaskList(currentTaskList, updatedData)}
                      signOut={signOut}
                    />
                  </div>
                </div>
              ) : null}
              {/* Chat button */}
              <div className="chat-button-container">
                {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
              </div>
            </>
          )}
        </main>
      </ErrorBoundary>
    );
  } else {
    // Mobile Layout (task list only with chat button)
    return (
      <main className="responsive-container mobile-full-width">
        {currentTab === 1 ? (
          // For calendar tab, we'll show a simplified calendar view on mobile
          // You can implement a mobile-friendly calendar here later
          <div style={{padding: '20px', textAlign: 'center'}}>
            <p>Calendar view will be available here soon.</p>
            <p>Please use the desktop version for full calendar functionality.</p>
          </div>
        ) : currentTab === 3 ? (
          // Health tracker for mobile
          <div style={{ marginTop: 24 }}>
            <HealthTabNavigator 
              healthData={healthData} 
              healthLoading={healthLoading}
              addHealthEntry={addHealthEntry}
              updateHealthEntry={updateHealthEntry}
              deleteHealthEntry={deleteHealthEntry}
              getHealthDataByDateRange={getHealthDataByDateRange || (() => {})}
              getLatestEntry={getLatestEntry || (() => {})}
              calculateWeeklyAverage={calculateWeeklyAverage || (() => {})}
              calculateTrend={calculateTrend || (() => {})}
            />
          </div>
        ) : currentTab === 4 ? (
          // Transcription tab for mobile
          <div style={{ marginTop: 24 }}>
            <TranscriptionTab user={user} onTasksExtracted={handleTasksExtracted} />
          </div>
        ) : currentTab === 5 ? (
          // Success tracker for mobile
          <div style={{ marginTop: 24 }}>
            <SuccessTracker userId={user?.uid} />
          </div>
        ) : (
          <>
            {/* Task list based on current tab */}
            {currentTab === 0 ? (
              <div style={{ marginTop: 24 }}>
                <TaskList
                  tasks={tasks[currentTaskList]}
                  currentList={currentTaskList}
                  lists={tasks}
                  moveTask={moveTask}
                  setCurrentList={setCurrentTaskList}
                  addList={addTaskList}
                  deleteList={deleteTaskList}
                  updateList={(updatedData) => {
                    if (updatedData.id && updatedData.list) {
                      updateTaskList(updatedData);
                    } else {
                      updateTaskList(currentTaskList, updatedData);
                    }
                  }}
                  signOut={signOut}
                />
              </div>
            ) : null}
          </>
        )}
        {/* Chat button for all mobile views */}
        <div className="chat-button-container">
          {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
        </div>
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
      </main>
    );
  }
}

export default ResponsiveMainContent;