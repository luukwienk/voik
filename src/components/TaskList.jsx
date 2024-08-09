import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';
import { TextField, Button, Box, Typography } from '@mui/material';

const TaskList = ({ tasks, updateList, currentList }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const newTask = {
        id: `task-${Date.now()}`,
        text: newTaskText,
        completed: false
      };
      updateList([newTask, ...tasks]);
      setNewTaskText('');
    }
  };

  const handleToggleCompletion = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    updateList(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    updateList(updatedTasks);
  };

  const handleUpdateTask = (taskId, newText) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, text: newText } : task
    );
    updateList(updatedTasks);
  };

  const copyTasksToClipboard = () => {
    const taskText = tasks.map(task => `${task.completed ? '✓' : '☐'} ${task.text}`).join('\n');
    navigator.clipboard.writeText(taskText).then(() => {
      alert('Copied tasks!');
    }, (err) => {
      console.error('Could not copy tasks: ', err);
    });
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const reorderedTasks = Array.from(tasks);
    const [removed] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, removed);

    updateList(reorderedTasks);
    console.log('Reordered tasks:', reorderedTasks);
  };

  return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Box className="task-list">
          <form onSubmit={handleAddTask} className="add-task-form">
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                fullWidth
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task.."
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                sx={{ 
                  minWidth: '30px', 
                  height: '30px', 
                  p: 0
                }}
              >
                +
              </Button>
            </Box>
          </form>
          <Box className="task-list-header" display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h">{currentList} :</Typography>
            <Button onClick={copyTasksToClipboard} startIcon={<FontAwesomeIcon icon={faCopy} />} variant="outlined"></Button>
          </Box>
        <Droppable droppableId={`tasks-${currentList}`}>
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <span className="drag-handle">☰</span>
                      {editingTaskId === task.id ? (
                        <EditTask
                          task={task}
                          onSave={(updatedText) => {
                            handleUpdateTask(task.id, updatedText);
                            setEditingTaskId(null);
                          }}
                          onCancel={() => setEditingTaskId(null)}
                        />
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleCompletion(task.id)}
                          />
                          <span className={`task-text ${task.completed ? 'completed' : ''}`}>{task.text}</span>
                          <button onClick={() => setEditingTaskId(task.id)} className="edit-task-btn">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} className="delete-task-btn">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </Box>
    </DragDropContext>
  );
};

export default TaskList;