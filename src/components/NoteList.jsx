import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPlus } from '@fortawesome/free-solid-svg-icons';
import NoteCard from './NoteCard';

const NoteList = ({ notes, updateList, currentList }) => {
  const [newNoteText, setNewNoteText] = useState('');

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
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="note-list">
        <form onSubmit={handleAddNote} className="add-note-form" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Add a new note.."
            style={{ flexGrow: 1, padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            style={{
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 10px',  // Adjusted padding for size
              cursor: 'pointer',
              fontSize: '16px',  // Adjusted font size
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',  // Align with input height
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </form>
        <div className="note-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h6 style={{ margin: 0 }}>{currentList} Notes:</h6>
          <button 
            onClick={copyNotesToClipboard} 
            style={{ backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
        <Droppable droppableId={`notes-${currentList}`}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="note-card-container"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {notes.map((note, index) => (
                <Draggable key={note.id} draggableId={note.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`note-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '10px',
                        boxShadow: snapshot.isDragging ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                        ...provided.draggableProps.style,
                      }}
                    >
                      <NoteCard
                        note={note}
                        onEdit={() => {}} // This is now handled within the NoteCard
                        onDelete={handleDeleteNote}
                        onSave={handleUpdateNote}
                        dragHandleProps={provided.dragHandleProps}
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
