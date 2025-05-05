import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import ListSelector from './ListSelector';
import TaskOverviewPage from './TaskOverviewPage';
import MinimalistHealthTracker from './health/MinimalistHealthTracker';
import ChatButton from './ChatButton';
import ChatModal from './ChatModal';
import ErrorBoundary from './ErrorBoundary';
import BigCalendarView from './BigCalendarView';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/responsive.css';
import '../styles/centeredLayout.css';

function ResponsiveMainContent({
  currentTab, 
  tasks,
  notes,
  currentTaskList,
  currentNoteList,
  setCurrentTaskList,
  setCurrentNoteList,
  updateTaskList,
  updateNoteList,
  recognizedText, 
  aiResponse, 
  isLoading = false, 
  error, 
  handleVoiceInput, 
  setRecognizedText, 
  addTaskList,
  addNoteList,
  deleteTaskList,
  deleteNoteList,
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

  // Render TaskOverviewPage for tab 3
  if (currentTab === 3) {
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

  // Render Health Tracker for tab 4
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
          <MinimalistHealthTracker 
            healthData={healthData} 
            healthLoading={isLoading}
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
            currentTasks={tasks[currentTaskList]}
            currentNotes={notes[currentNoteList]}
            updateTaskList={updateTaskList}
            updateNoteList={updateNoteList}
            currentTaskList={currentTaskList}
            currentNoteList={currentNoteList}
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
          {currentTab === 2 ? (
            // For calendar tab, use the BigCalendarView
            <BigCalendarView
              tasks={tasks}
              currentTaskList={currentTaskList}
              moveTask={moveTask}
            />
          ) : (
            <>
              {isLoading && <p className="loading">Processing...</p>}
              {error && <p className="error">{error}</p>}
              
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
                  <div className="tasklist-container">
                    {/* List selector */}
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'flex-start',
                      padding: '10px 0',
                      marginBottom: '0px',
                      marginTop: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ListSelector 
                          lists={tasks}
                          currentList={currentTaskList}
                          setCurrentList={setCurrentTaskList}
                          addList={addTaskList}
                          deleteList={deleteTaskList}
                          currentTab={currentTab}
                          selectStyle={{ width: '100%', maxWidth: '300px' }}
                        />
                      </div>
                    </div>
                    
                    {/* Task list - pas de container styling aan om de hele hoogte te benutten */}
                    <div style={{ 
                      flex: '1 1 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      height: 'calc(100% - 58px)',
                      marginTop: '8px'
                    }}>
                      <TaskList
                        tasks={tasks[currentTaskList]}
                        currentList={currentTaskList}
                        lists={tasks}
                        moveTask={moveTask}
                        hideTitleHeader={true}
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
                    
                    {/* Show recognized text feedback if available */}
                    {recognizedText && (
                      <div style={{ 
                        padding: '10px', 
                        marginTop: '10px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '8px'
                      }}>
                        <p style={{ margin: '0', fontSize: '14px' }}><b>You said:</b> {recognizedText}</p>
                        {aiResponse && <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}><b>Response:</b> {aiResponse}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ) : currentTab === 1 ? (
                // Notes view
                <NoteList
                  notes={notes[currentNoteList]?.items || []}
                  updateList={(newItems) => updateNoteList(currentNoteList, { items: newItems })}
                  currentList={currentNoteList}
                />
              ) : null}
              
              {/* Chat button */}
              <div className="chat-button-container">
                <ChatButton onClick={() => setIsChatModalOpen(true)} />
              </div>
              
              {/* Chat modal */}
              <ChatModal 
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                currentTasks={tasks[currentTaskList]}
                currentNotes={notes[currentNoteList]}
                updateTaskList={updateTaskList}
                updateNoteList={updateNoteList}
                currentTaskList={currentTaskList}
                currentNoteList={currentNoteList}
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
        {currentTab === 2 ? (
          // For calendar tab, we'll show a simplified calendar view on mobile
          // You can implement a mobile-friendly calendar here later
          <div style={{padding: '20px', textAlign: 'center'}}>
            <p>Calendar view will be available here soon.</p>
            <p>Please use the desktop version for full calendar functionality.</p>
          </div>
        ) : (
          <>
            {/* List selector */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'flex-start',
              padding: '10px 15px',
              marginBottom: '10px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ListSelector 
                  lists={currentTab === 0 ? tasks : notes}
                  currentList={currentTab === 0 ? currentTaskList : currentNoteList}
                  setCurrentList={currentTab === 0 ? setCurrentTaskList : setCurrentNoteList}
                  addList={currentTab === 0 ? addTaskList : addNoteList}
                  deleteList={currentTab === 0 ? deleteTaskList : deleteNoteList}
                  currentTab={currentTab}
                  selectStyle={{ width: '100%' }}
                />
              </div>
            </div>
            
            {/* Task or Note list based on current tab */}
            {currentTab === 0 ? (
              <TaskList
                tasks={tasks[currentTaskList]}
                currentList={currentTaskList}
                lists={tasks}
                moveTask={moveTask}
                updateList={(updatedData) => {
                  if (updatedData.id && updatedData.list) {
                    updateTaskList(updatedData);
                  } else {
                    updateTaskList(currentTaskList, updatedData);
                  }
                }}
                signOut={signOut}
              />
            ) : (
              <NoteList
                notes={notes[currentNoteList]?.items || []}
                updateList={(newItems) => updateNoteList(currentNoteList, { items: newItems })}
                currentList={currentNoteList}
              />
            )}
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
          currentTasks={tasks[currentTaskList]}
          currentNotes={notes[currentNoteList]}
          updateTaskList={updateTaskList}
          updateNoteList={updateNoteList}
          currentTaskList={currentTaskList}
          currentNoteList={currentNoteList}
          userId={user?.uid}
        />
      </main>
    );
  }
}

export default ResponsiveMainContent;