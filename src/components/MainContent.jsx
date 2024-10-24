import React, { useEffect } from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import VoiceInputSection from './VoiceInputSection';
import ListSelector from './ListSelector';
import Timer from './Timer';

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
  moveTask  // Add this new prop
}) {
  useEffect(() => {
    if (currentTab === 0) {
      console.log('MainContent: Switching to tasks, setting currentTaskList to "Today"');
      setCurrentTaskList('Today');
    } else if (currentTab === 1) {
      console.log('MainContent: Switching to notes, setting currentNoteList to "My Notes"');
      setCurrentNoteList('My Notes');
    }
  }, [currentTab, setCurrentTaskList, setCurrentNoteList]);

  useEffect(() => {
    console.log('Current tab:', currentTab);
    console.log('Current tasks:', tasks);
    console.log('Current task list:', currentTaskList);
    console.log('Current notes:', notes);
    console.log('Current note list:', currentNoteList);
  }, [currentTab, tasks, currentTaskList, notes, currentNoteList]);

  const currentItems = currentTab === 0
    ? tasks[currentTaskList]?.items || []
    : notes[currentNoteList]?.items || [];

  return (
    <main>
      <VoiceInputSection 
        handleVoiceInput={handleVoiceInput}
        setRecognizedText={setRecognizedText}
        recognizedText={recognizedText}
        aiResponse={aiResponse}
        currentItems={currentItems}
      />
      {currentTab === 2 ? (
        <Timer />
      ) : (
        <>
          <div className="list-controls">
            <ListSelector 
              lists={currentTab === 0 ? tasks : notes}
              currentList={currentTab === 0 ? currentTaskList : currentNoteList}
              setCurrentList={currentTab === 0 ? setCurrentTaskList : setCurrentNoteList}
              addList={currentTab === 0 ? addTaskList : addNoteList}
              deleteList={currentTab === 0 ? deleteTaskList : deleteNoteList}
              currentTab={currentTab}
            />
          </div>
          {isLoading && <p className="loading">Processing...</p>}
          {error && <p className="error">{error}</p>}
          {currentTab === 0 ? (
            <TaskList
              tasks={tasks[currentTaskList]}
              currentList={currentTaskList}
              lists={tasks}
              moveTask={moveTask}
              updateList={updateTaskList}
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
    </main>
  );
}

export default MainContent;