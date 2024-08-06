import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import NoteCard from './NoteCard';
import { TextField, Button, Box, Typography } from '@mui/material';

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
      <Box className="note-list">
        <form onSubmit={handleAddNote} className="add-note-form">
          <TextField
            fullWidth
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Add a new note"
            variant="outlined"
            size="small"
          />
          <Button type="submit" variant="contained" color="primary">+</Button>
        </form>
        <Box className="note-list-header" display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
          <Typography variant="h6">{currentList} Notes:</Typography>
          <Button onClick={copyNotesToClipboard} startIcon={<FontAwesomeIcon icon={faCopy} />} variant="outlined">
            Copy list
          </Button>
        </Box>
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
                      className={`note-item ${snapshot.isDragging ? 'dragging' : ''}`}
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
      </Box>
    </DragDropContext>
  );
};

export default NoteList;