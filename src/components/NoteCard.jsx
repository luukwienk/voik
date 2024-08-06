import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography, IconButton, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { Edit, Delete, Save, DragIndicator } from '@mui/icons-material';

const NoteCard = ({ note, onEdit, onDelete, onSave, dragHandleProps }) => {
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
      <Card 
        className="note-card" 
        sx={{ 
          mb: 2, 
          transition: 'all 0.3s ease', 
          '&:hover': { boxShadow: 3 },
          cursor: editMode ? 'text' : 'pointer',
          minHeight: '100px',
          position: 'relative'
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ height: '100%', p: '16px !important' }}>
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
                minHeight: '80px'
              }}
            />
          ) : (
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {note.text}
            </Typography>
          )}
        </CardContent>
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '4px',
            padding: '2px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton {...dragHandleProps} size="small">
            <DragIndicator fontSize="small" />
          </IconButton>
          {editMode ? (
            <IconButton onClick={handleSave} size="small">
              <Save fontSize="small" />
            </IconButton>
          ) : (
            <>
              <IconButton onClick={() => setEditMode(true)} size="small">
                <Edit fontSize="small" />
              </IconButton>
              <IconButton onClick={handleDeleteClick} size="small">
                <Delete fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Note"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteCard;