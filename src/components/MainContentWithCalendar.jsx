import React, { useEffect, useState } from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import ListSelector from './ListSelector';
import TaskOverviewPage from './TaskOverviewPage';
import BigCalendarView from './BigCalendarView';
import MinimalistHealthTracker from './health/MinimalistHealthTracker'; // Import the health tracker
import ChatButton from './ChatButton';
import ChatModal from './ChatModal';
import ErrorBoundary from './ErrorBoundary';
import VoiceInput from './VoiceInput';

function MainContent({ 
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
  isLoading, 
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
  // Health tracking props would go here when fully integrated
  healthData,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry
}) {
  // State for the chat modal
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  useEffect(() => {
    if (currentTab === 0) {
      console.log('MainContent: Switching to tasks, setting currentTaskList to "Today"');
      setCurrentTaskList('Today');
    } else if (currentTab === 1) {
      console.log('MainContent: Switching to notes, setting currentNoteList to "My Notes"');
      setCurrentNoteList('My Notes');
    }
  }, [currentTab, setCurrentTaskList, setCurrentNoteList]);

  // Render TaskOverviewPage for tab 3
  if (currentTab === 3) {
    return (
      <TaskOverviewPage 
        tasks={tasks} 
        currentTaskList={currentTaskList}
        updateTaskList={updateTaskList}
        moveTask={moveTask}
      />
    );
  }

  // Render Health Tracker for tab 4
  if (currentTab === 4) {
    return (
      <ErrorBoundary>
        <MinimalistHealthTracker 
          healthData={healthData} 
          addHealthEntry={addHealthEntry}
          updateHealthEntry={updateHealthEntry}
          deleteHealthEntry={deleteHealthEntry}
        />
      </ErrorBoundary>
    );
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {currentTab === 2 ? (
        // For calendar tab, use the BigCalendarView
        <ErrorBoundary>
          <BigCalendarView
            tasks={tasks}
            currentTaskList={currentTaskList}
            moveTask={moveTask}
          />
        </ErrorBoundary>
      ) : (
        <>
          {isLoading && <p className="loading">Processing...</p>}
          {error && <p className="error">{error}</p>}
          
          {/* Combined calendar and task list view */}
          {currentTab === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row',
              gap: '20px', 
              height: 'calc(100vh - 220px)',
              overflow: 'hidden',
              width: '100%',
              position: 'relative'
            }}>
              {/* Calendar on the left, 63% width */}
              <div style={{ flex: '0 0 63%', maxWidth: '63%', overflow: 'auto' }}>
                <ErrorBoundary>
                  <BigCalendarView 
                    tasks={tasks}
                    currentTaskList={currentTaskList}
                    moveTask={moveTask}
                  />
                </ErrorBoundary>
              </div>
              
              {/* Task list on the right, 37% width */}
              <div style={{ flex: '0 0 37%', maxWidth: '37%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* List selector */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'flex-start',
                  padding: '10px 0',
                  marginBottom: '10px',
                  marginTop: '8px',
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
                      selectStyle={{ width: '100%', maxWidth: '300px' }}
                    />
                  </div>
                </div>
                
                {/* Task list */}
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
                
                {/* Voice recognition feedback */}
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
                
                {/* Voice input */}
                <VoiceInput
                  onInputComplete={handleVoiceInput}
                  setRecognizedText={setRecognizedText}
                  currentTasks={tasks[currentTaskList]?.items || []}
                  userId={user?.uid}
                />
              </div>
            </div>
          ) : (
            // Notes view
            <NoteList
              notes={notes[currentNoteList]?.items || []}
              updateList={(newItems) => updateNoteList(currentNoteList, { items: newItems })}
              currentList={currentNoteList}
            />
          )}
          
          {/* Chat button */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100
          }}>
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
  );
}

export default MainContent;