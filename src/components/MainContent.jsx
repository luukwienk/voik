// MainContent.jsx
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
    if (currentTab === 0) { // 0 for 'tasks'
      console.log('MainContent: Switching to tasks, setting currentTaskList to "Today"');
      setCurrentTaskList('Today');
    } else if (currentTab === 1) { // 1 for 'notes'
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

  const currentItems = currentTab === 0 // 0 for 'tasks'
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
          lists={currentTab === 0 ? tasks : notes} // 0 for 'tasks'
          currentList={currentTab === 0 ? currentTaskList : currentNoteList} // 0 for 'tasks'
          setCurrentList={currentTab === 0 ? setCurrentTaskList : setCurrentNoteList} // 0 for 'tasks'
          addList={currentTab === 0 ? addTaskList : addNoteList} // 0 for 'tasks'
          deleteList={currentTab === 0 ? deleteTaskList : deleteNoteList} // 0 for 'tasks'
          currentTab={currentTab}
        />
      </div>
      {isLoading && <p className="loading">Processing...</p>}
      {error && <p className="error">{error}</p>}
      {currentTab === 0 ? ( // 0 for 'tasks'
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