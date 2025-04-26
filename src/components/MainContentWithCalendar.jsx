import React, { useEffect, useState } from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import ListSelector from './ListSelector';
import Timer from './Timer';
import TaskOverviewPage from './TaskOverviewPage';
import CalendarPOCContainer from './CalendarPOCContainer';
import ChatButton from './ChatButton'; // Import de nieuwe ChatButton
import ChatModal from './ChatModal'; // Import de nieuwe ChatModal
import ErrorBoundary from './ErrorBoundary';
// Add Dutch localization
const LOCALES = {
  nl: {
    buttons: {
      today: "Vandaag",
      agenda: "Agenda",
      day: "Dag",
      threeDays: "3 Dagen",
      week: "Week",
      month: "Maand",
      showMore: "Toon meer"
    },
    calendar: {
      weekDays: {
        Sun: "Zo",
        Mon: "Ma",
        Tue: "Di",
        Wed: "Wo",
        Thu: "Do",
        Fri: "Vr",
        Sat: "Za"
      },
      months: {
        Jan: "Januari",
        Feb: "Februari",
        Mar: "Maart",
        Apr: "April",
        May: "Mei",
        Jun: "Juni",
        Jul: "Juli",
        Aug: "Augustus",
        Sep: "September",
        Oct: "Oktober",
        Nov: "November",
        Dec: "December"
      },
      defaultDateFormat: "DD.MM.YYYY",
      defaultDateTimeFormat: "DD.MM.YYYY HH:mm"
    }
  }
};

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
  user
}) {
  // Nieuwe state voor het beheren van de ChatModal
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

  const currentItems = currentTab === 0
    ? tasks[currentTaskList]?.items || []
    : notes[currentNoteList]?.items || [];

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

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {currentTab === 2 ? (
        <Timer />
      ) : (
        <>
          {isLoading && <p className="loading">Processing...</p>}
          {error && <p className="error">{error}</p>}
          
          {/* User email in top right - moved to Header component */}
          
          {currentTab === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', // Rij-layout
              gap: '20px', 
              height: 'calc(100vh - 220px)',
              overflow: 'hidden',
              width: '100%',
              position: 'relative'
            }}>
              {/* Kalender links, 65% breedte */}
              <div style={{ flex: '0 0 65%', maxWidth: '65%', overflow: 'auto' }}>
                <ErrorBoundary>
                  <CalendarPOCContainer 
                    tasks={tasks}
                    currentTaskList={currentTaskList}
                    moveTask={moveTask}
                  />
                </ErrorBoundary>
              </div>
              {/* Takenlijst rechts, 35% breedte */}
              <div style={{ flex: '0 0 35%', maxWidth: '35%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Lijstselector rechtsboven */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  padding: '10px 0',
                  marginBottom: '10px'
                }}>
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
                />
                {/* Voice recognition feedback onderaan */}
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
          ) : (
            <NoteList
              notes={notes[currentNoteList]?.items || []}
              updateList={(newItems) => updateNoteList(currentNoteList, { items: newItems })}
              currentList={currentNoteList}
            />
          )}
          
          {/* Vervang de oude VoiceInput door de nieuwe ChatButton */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100
          }}>
            <ChatButton onClick={() => setIsChatModalOpen(true)} />
          </div>
          
          {/* Voeg de ChatModal component toe */}
          <ChatModal 
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            currentTasks={tasks[currentTaskList]}
            currentNotes={notes[currentNoteList]}
            updateTaskList={updateTaskList}
            updateNoteList={updateNoteList}
            currentTaskList={currentTaskList}
            currentNoteList={currentNoteList}
          />
        </>
      )}
    </main>
  );
}

export default MainContent;