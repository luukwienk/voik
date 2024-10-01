import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy, faPlus } from '@fortawesome/free-solid-svg-icons';

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
    setEditingTaskId(null);  // Exit edit mode after saving
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
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="task-list" style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <form onSubmit={handleAddTask} className="add-task-form" style={{ display: 'flex', marginBottom: '20px', alignItems: 'center' }}>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task.."
            style={{ flexGrow: 1, padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit"
            style={{
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 10px', // Reduced padding
              cursor: 'pointer',
              fontSize: '16px', // Adjust font size
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%', // Align with input height
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </form>
        <div className="task-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0 }}>{currentList} :</h4>
          <button 
            onClick={copyTasksToClipboard} 
            style={{ backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
        <Droppable droppableId={`tasks-${currentList}`}>
          {(provided) => (
            <ul 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              style={{ listStyleType: 'none', padding: 0 }}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '10px',
                        marginBottom: '10px',
                        boxShadow: snapshot.isDragging ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {editingTaskId === task.id ? (
                        <EditTask
                          task={task}
                          onSave={(newText) => handleUpdateTask(task.id, newText)}
                          onCancel={() => setEditingTaskId(null)}
                        />
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleCompletion(task.id)}
                            style={{ marginRight: '10px' }}
                          />
                          <span className={`task-text ${task.completed ? 'completed' : ''}`} style={{ flexGrow: 1 }}>
                            {task.text}
                          </span>
                          <button 
                            onClick={() => setEditingTaskId(task.id)} 
                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginRight: '10px' }}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)} 
                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
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
