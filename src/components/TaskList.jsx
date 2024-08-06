import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';

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
          <h3>{currentList} :</h3>
          <button onClick={copyTasksToClipboard} className="copy-list-btn" title="Copy list">
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
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
      </div>
    </DragDropContext>
  );
};

export default TaskList;
