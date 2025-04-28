import React, { useState, useEffect } from 'react';
import MainContentWithCalendar from './MainContentWithCalendar';
import TaskList from './TaskList';
import NoteList from './NoteList';
import ListSelector from './ListSelector';
import TaskOverviewPage from './TaskOverviewPage';
import MinimalistHealthTracker from './health/MinimalistHealthTracker';
import ChatButton from './ChatButton';
import ChatModal from './ChatModal';
import ErrorBoundary from './ErrorBoundary';

// Custom hook for responsive design
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
};

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
  addTaskList,
  addNoteList,
  deleteTaskList,
  deleteNoteList,
  moveTask,
  user,
  signOut,
  healthData,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry
}) {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (currentTab === 0) {
      console.log('ResponsiveMainContent: Switching to tasks, setting currentTaskList to "Today"');
      setCurrentTaskList('Today');
    } else if (currentTab === 1) {
      console.log('ResponsiveMainContent: Switching to notes, setting currentNoteList to "My Notes"');
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

  // Render Desktop or Mobile layout based on screen size
  if (isDesktop) {
    // Desktop Layout (calendar + task list)
    return (
      <ErrorBoundary>
        <MainContentWithCalendar
          currentTab={currentTab}
          tasks={tasks}
          notes={notes}
          currentTaskList={currentTaskList}
          currentNoteList={currentNoteList}
          setCurrentTaskList={setCurrentTaskList}
          setCurrentNoteList={setCurrentNoteList}
          updateTaskList={updateTaskList}
          updateNoteList={updateNoteList}
          addTaskList={addTaskList}
          addNoteList={addNoteList}
          deleteTaskList={deleteTaskList}
          deleteNoteList={deleteNoteList}
          moveTask={moveTask}
          user={user}
          signOut={signOut}
          healthData={healthData}
          addHealthEntry={addHealthEntry}
          updateHealthEntry={updateHealthEntry}
          deleteHealthEntry={deleteHealthEntry}
        />
      </ErrorBoundary>
    );
  } else {
    // Mobile Layout (task list only with chat button)
    return (
      <main style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
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
        <ChatButton onClick={() => setIsChatModalOpen(true)} />
        
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