import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import RichTextViewer from './RichTextViewer';
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
    setEditingTaskId(null);
  };

  const copyTasksToClipboard = () => {
    // Strip HTML tags when copying to clipboard
    const taskText = tasks.map(task => {
      let textContent;
      try {
        const contentState = convertFromRaw(JSON.parse(task.text));
        textContent = contentState.getPlainText();
      } catch {
        textContent = task.text;
      }
      return `${task.completed ? '✓' : '☐'} ${textContent}`;
    }).join('\n');
    
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
      <div className="task-list" style={{ 
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleAddTask} className="add-task-form" style={{ 
          display: 'flex', 
          marginBottom: '20px', 
          gap: '10px'
        }}>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task.."
            style={{ 
              flexGrow: 1,
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit"
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </form>

        <div className="task-list-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          <h4 style={{ margin: 0, color: '#333' }}>{currentList}</h4>
          <button 
            onClick={copyTasksToClipboard} 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Copy tasks to clipboard"
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
                        alignItems: 'flex-start',
                        backgroundColor: '#fff',
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        padding: '15px',
                        marginBottom: '10px',
                        boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {editingTaskId === task.id ? (
                        <EditTask
                          task={task}
                          onSave={(updatedText) => handleUpdateTask(task.id, updatedText)}
                          onCancel={() => setEditingTaskId(null)}
                        />
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleCompletion(task.id)}
                              style={{ 
                                margin: 0,
                                marginRight: '10px',
                                cursor: 'pointer'
                              }}
                            />
                          </div>
                          <div style={{ 
                            flexGrow: 1,
                            opacity: task.completed ? 0.6 : 1,
                            textDecoration: task.completed ? 'line-through' : 'none'
                          }}>
                            <RichTextViewer content={task.text} />
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            marginLeft: '10px'
                          }}>
                            <button 
                              onClick={() => setEditingTaskId(task.id)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#666',
                                padding: '5px',
                                borderRadius: '3px',
                                transition: 'all 0.2s'
                              }}
                              title="Edit task"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#dc3545',
                                padding: '5px',
                                borderRadius: '3px',
                                transition: 'all 0.2s'
                              }}
                              title="Delete task"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
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