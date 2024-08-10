import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSave } from '@fortawesome/free-solid-svg-icons';

const NoteCard = ({ note, onDelete, onSave, dragHandleProps }) => {
  const [editMode, setEditMode] = useState(false);
  const [text, setText] = useState(note.text);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (editMode && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [editMode]);

  const handleSave = () => {
    onSave(note.id, text);
    setEditMode(false);
  };

  const handleCardClick = (e) => {
    if (!editMode && e.target === e.currentTarget) {
      setEditMode(true);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(note.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div 
        className="note-card" 
        style={{ 
          height: '100%',
          minHeight: '120px',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: editMode ? 'text' : 'grab',
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={handleCardClick}
        {...dragHandleProps}
      >
        <div style={{ flexGrow: 1, wordBreak: 'break-word', marginBottom: '24px' }}>
          {editMode ? (
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                font: 'inherit',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
              }}
            />
          ) : (
            <div>{note.text}</div>
          )}
        </div>
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '8px', 
            right: '8px', 
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '4px',
            padding: '2px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {editMode ? (
            <button onClick={handleSave} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px' }}>
              <FontAwesomeIcon icon={faSave} size="xs" />
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <FontAwesomeIcon icon={faEdit} size="xs" />
              </button>
              <button onClick={handleDeleteClick} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <FontAwesomeIcon icon={faTrash} size="xs" />
              </button>
            </>
          )}
        </div>
      </div>

      {deleteDialogOpen && (
        <div className="delete-dialog" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)', zIndex: 1000 }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Delete Note</h4>
          <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button onClick={() => setDeleteDialogOpen(false)} style={{ marginRight: '8px', padding: '8px 12px', border: 'none', backgroundColor: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 12px', border: 'none', backgroundColor: '#d9534f', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCard;