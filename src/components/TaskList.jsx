import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import VoiceInput from './VoiceInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';

const TaskList = ({ tasks, onToggleCompletion, onDeleteTask, onUpdateTask, onAddTask }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText);
      setNewTaskText('');
    }
  };

  const copyTasksToClipboard = () => {
    const taskText = tasks.map(task => `${task.completed ? '✓' : '☐'} ${task.text}`).join('\n');
    navigator.clipboard.writeText(taskText).then(() => {
      alert('Copied tasks!');
    }, (err) => {
      console.error('Could not copy tasks: ', err);
    });
  };

  if (tasks.length === 0) {
    return <p>No tasks yet. Add a task to get started!</p>;
  }

  return (
    <div className="task-list">
      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task"
        />
        <button type="submit">+</button>
      </form>
      <div className="task-list-header">
        <h3>Tasks List:</h3>
        <button onClick={copyTasksToClipboard} className="copy-list-btn" title="Copy list">
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </div>
      <Droppable droppableId="droppable-tasks">
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {tasks.map((task, index) => (
              <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
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
                          onUpdateTask(task.id, updatedText);
                          setEditingTaskId(null);
                        }}
                        onCancel={() => setEditingTaskId(null)}
                      />
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => onToggleCompletion(task.id)}
                        />
                        <span className="task-text">{task.text}</span>
                        <button onClick={() => setEditingTaskId(task.id)} className="edit-task-btn">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => onDeleteTask(task.id)} className="delete-task-btn">
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
    </div>
  );
};

export default TaskList;
