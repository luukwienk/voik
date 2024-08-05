// NoteList.jsx
import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import NoteCard from './NoteCard';

const NoteList = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      onAddNote(newNoteText);
      setNewNoteText('');
    }
  };

  return (
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
        <h3>Dit zijn mijn notities:</h3>
        <button className="copy-list-btn" title="Copy list">
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </div>
      <Droppable droppableId="droppable-notes">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="note-card-container"
          >
            {notes.map((note, index) => (
              <NoteCard
                key={note.id.toString()}
                note={note}
                index={index}
                onEdit={(id) => setEditingNoteId(id)}
                onDelete={onDeleteNote}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {editingNoteId !== null && (
        <EditNote
          note={notes.find((note) => note.id === editingNoteId)}
          onSave={(updatedText) => {
            onUpdateNote(editingNoteId, updatedText);
            setEditingNoteId(null);
          }}
          onCancel={() => setEditingNoteId(null)}
        />
      )}
    </div>
  );
};

const EditNote = ({ note, onSave, onCancel }) => {
  const [updatedText, setUpdatedText] = useState(note.text);

  const handleSave = () => {
    onSave(updatedText);
  };

  return (
    <div className="edit-note">
      <input
        type="text"
        value={updatedText}
        onChange={(e) => setUpdatedText(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default NoteList;
