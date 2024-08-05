// NoteCard.jsx
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const NoteCard = ({ note, index, onEdit, onDelete }) => (
  <Draggable draggableId={note.id.toString()} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="note-card"
      >
        <div className="note-card-content">
          <p>{note.text}</p>
        </div>
        <div className="note-card-actions">
          <button onClick={() => onEdit(note.id)}>
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={() => onDelete(note.id)}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    )}
  </Draggable>
);

export default NoteCard;
