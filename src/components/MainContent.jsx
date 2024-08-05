import React, { useEffect } from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import VoiceInputSection from './VoiceInputSection';
import ListSelector from './ListSelector';

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
  deleteNoteList
}) {
  useEffect(() => {
    console.log('Current tab:', currentTab);
    console.log('Current tasks:', tasks);
    console.log('Current task list:', currentTaskList);
    console.log('Current notes:', notes);
    console.log('Current note list:', currentNoteList);
  }, [currentTab, tasks, currentTaskList, notes, currentNoteList]);

  const currentItems = currentTab === 'tasks' 
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
      <div className="list-controls">
        <ListSelector 
          lists={currentTab === 'tasks' ? tasks : notes}
          currentList={currentTab === 'tasks' ? currentTaskList : currentNoteList}
          setCurrentList={currentTab === 'tasks' ? setCurrentTaskList : setCurrentNoteList}
          addList={currentTab === 'tasks' ? addTaskList : addNoteList}
          deleteList={currentTab === 'tasks' ? deleteTaskList : deleteNoteList}
          currentTab={currentTab}
        />
      </div>
      {isLoading && <p className="loading">Processing...</p>}
      {error && <p className="error">{error}</p>}
      {currentTab === 'tasks' ? (
        <TaskList
          tasks={tasks[currentTaskList]?.items || []}
          updateList={(newItems) => updateTaskList(currentTaskList, { items: newItems })}
          currentList={currentTaskList}
        />
      ) : (
        <NoteList
          notes={notes[currentNoteList]?.items || []}
          updateList={(newItems) => updateNoteList(currentNoteList, { items: newItems })}
          currentList={currentNoteList}
        />
      )}
    </main>
  );
}

export default MainContent;
