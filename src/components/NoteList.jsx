import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import NoteCard from './NoteCard';

const NoteList = ({ notes, updateList, currentList }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      const newNote = {
        id: `note-${Date.now()}`,
        text: newNoteText,
      };
      updateList([newNote, ...notes]);
      setNewNoteText('');
    }
  };

  const handleUpdateNote = (id, updatedText) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, text: updatedText } : note
    );
    updateList(updatedNotes);
  };

  const handleDeleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    updateList(updatedNotes);
  };

  const copyNotesToClipboard = () => {
    const noteText = notes.map(note => note.text).join('\n\n');
    navigator.clipboard.writeText(noteText).then(() => {
      alert('Copied notes!');
    }, (err) => {
      console.error('Could not copy notes: ', err);
    });
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const reorderedNotes = Array.from(notes);
    const [removed] = reorderedNotes.splice(source.index, 1);
    reorderedNotes.splice(destination.index, 0, removed);

    updateList(reorderedNotes);
    console.log('Reordered notes:', reorderedNotes);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="note-list">
        <form onSubmit={handleAddNote} className="add-note-form">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Add a new note"
          />
          <button type="submit">+</button>
        </form>
        <div className="note-list-header">
          <h3>{currentList} Notes:</h3>
          <button onClick={copyNotesToClipboard} className="copy-list-btn" title="Copy list">
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
        <Droppable droppableId={`notes-${currentList}`}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="note-card-container"
            >
              {notes.map((note, index) => (
                <Draggable key={note.id} draggableId={note.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`note-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <NoteCard
                        note={note}
                        index={index}
                        onEdit={(id) => setEditingNoteId(id)}
                        onDelete={handleDeleteNote}
                        onSave={handleUpdateNote}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default NoteList;
