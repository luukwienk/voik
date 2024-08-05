import React, { useState } from 'react';

const NoteCard = ({ note, onEdit, onDelete, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [text, setText] = useState(note.text);

  const handleSave = () => {
    onSave(note.id, text);
    setEditMode(false);
  };

  return (
    <div className="note-card">
      {editMode ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <>
          <p>{note.text}</p>
          <button onClick={() => setEditMode(true)}>Edit</button>
          <button onClick={() => onDelete(note.id)}>Delete</button>
        </>
      )}
    </div>
  );
};

export default NoteCard;
