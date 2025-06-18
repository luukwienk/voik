import React, { useState, useEffect } from 'react';
// Verwijder de react-router-dom import die niet wordt gebruikt
// import { Route, Routes, useNavigate } from 'react-router-dom';
import TaskList from './TaskList';
import TaskOverviewPage from './TaskOverviewPage';
import MinimalistHealthTracker from './health/MinimalistHealthTracker';
import ChatButton from './ChatButton';
import ChatModal from './ChatModal';
import ErrorBoundary from './ErrorBoundary';
import BigCalendarView from './BigCalendarView';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/responsive.css';
import '../styles/centeredLayout.css';
import ListSelectorModal from './ListSelectorModal';
import ListSelector from './ListSelector';

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
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  getHealthDataByDateRange,
  getLatestEntry,
  calculateWeeklyAverage,
  calculateTrend
}) {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  // Detect if device is an iPad
  const isIPad = /iPad/.test(navigator.userAgent) || 
                (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  
  // Consider iPad as mobile for our layout
  const isDesktop = useMediaQuery('(min-width: 768px)') && !isIPad;

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
          <MinimalistHealthTracker 
            healthData={healthData} 
            healthLoading={false}
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
            <ChatButton onClick={() => setIsChatModalOpen(true)} />
          </div>
            
          {/* Chat modal */}
          <ChatModal 
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            tasks={tasks}
            currentTasks={tasks[currentTaskList] || { items: [] }}
            updateTaskList={updateTaskList}
            currentTaskList={currentTaskList}
            userId={user?.uid}
          />
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
          ) : (
            <>
              {/* Combined calendar and task list view */}
              {currentTab === 0 ? (
                <div className="desktop-flex-row">
                  {/* Calendar on the left, 63% width */}
                  <div className="calendar-container">
                    <ErrorBoundary>
                      <BigCalendarView 
                        tasks={tasks}
                        currentTaskList={currentTaskList}
                        moveTask={moveTask}
                      />
                    </ErrorBoundary>
                  </div>
                  {/* Task list on the right, 37% width */}
                  <div className="tasklist-container" style={{ marginTop: 24 }}>
                    <TaskList
                      tasks={tasks[currentTaskList]}
                      currentList={currentTaskList}
                      lists={tasks}
                      moveTask={moveTask}
                      hideTitleHeader={true}
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
                </div>
              ) : null}
              {/* Chat button */}
              <div className="chat-button-container">
                <ChatButton onClick={() => setIsChatModalOpen(true)} />
              </div>
              {/* Chat modal */}
              <ChatModal 
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                tasks={tasks}
                currentTasks={tasks[currentTaskList] || { items: [] }}
                updateTaskList={updateTaskList}
                currentTaskList={currentTaskList}
                userId={user?.uid}
              />
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
          <ChatButton onClick={() => setIsChatModalOpen(true)} />
        </div>
        {/* Chat modal */}
        <ChatModal 
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          tasks={tasks}
          currentTasks={tasks[currentTaskList] || { items: [] }}
          updateTaskList={updateTaskList}
          currentTaskList={currentTaskList}
          userId={user?.uid}
        />
      </main>
    );
  }
}

export default ResponsiveMainContent;