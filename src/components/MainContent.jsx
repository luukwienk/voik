import React from 'react';
import TaskList from './TaskList';
import NoteList from './NoteList';
import VoiceInputSection from './VoiceInputSection';
import ListSelector from './ListSelector';

function MainContent({ 
  currentTab, 
  lists, 
  currentList, 
  updateList, 
  recognizedText, 
  aiResponse, 
  isLoading, 
  error, 
  handleVoiceInput, 
  setRecognizedText, 
  setCurrentList, 
  addList,
  deleteList
}) {
  const currentTasks = lists[currentList]?.type === 'task' ? lists[currentList].items : [];

  return (
    <main>
      <VoiceInputSection 
        handleVoiceInput={handleVoiceInput}
        setRecognizedText={setRecognizedText}
        recognizedText={recognizedText}
        aiResponse={aiResponse}
        currentTasks={currentTasks}
      />
      <div className="task-controls">
        <ListSelector 
          lists={lists}
          currentList={currentList}
          setCurrentList={setCurrentList}  // Ensure setCurrentList is passed
          addList={addList}
          deleteList={deleteList}
          currentTab={currentTab}
        />
        </div>
      {isLoading && <p className="loading">Processing...</p>}
      {error && <p className="error">{error}</p>}
      {lists[currentList]?.type === 'task' && currentTab === 0 && (
        <TaskList
          tasks={lists[currentList].items}
          updateList={updateList}
          currentList={currentList}
        />
      )}
      {lists[currentList]?.type === 'note' && currentTab === 1 && (
        <NoteList
          notes={lists[currentList].items}
          onAddNote={(newNoteText) => {
            const newNote = {
              id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: newNoteText,
            };
            updateList(currentList, {
              ...lists[currentList],
              items: [newNote, ...lists[currentList].items]
            });
          }}
          onUpdateNote={(id, text) => {
            const updatedNotes = lists[currentList].items.map(note =>
              note.id === id ? { ...note, text } : note
            );
            updateList(currentList, { ...lists[currentList], items: updatedNotes });
          }}
          onDeleteNote={(id) => {
            const updatedNotes = lists[currentList].items.filter(note => note.id !== id);
            updateList(currentList, { ...lists[currentList], items: updatedNotes });
          }}
        />
      )}
    </main>
  );
}

export default MainContent;
