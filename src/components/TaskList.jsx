import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy, faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import MoveTaskModal from './MoveTaskModal';
import TaskEditorModal from './TaskEditorModal';
import ListSelector from './ListSelector';

const TaskList = ({ tasks = { items: [] }, updateList, currentList, lists, moveTask }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const newTask = {
        id: `task-${Date.now()}`,
        text: newTaskText,
        completed: false
      };
  
      const currentItems = tasks?.items || [];
      const updatedItems = [newTask, ...currentItems];
  
      // Log voor debugging
      console.log('Adding task:', {
        listName: currentList,
        newListData: {
          items: updatedItems
        }
      });
  
      // Compatibiliteit met beide update methodes
      if (updateList.length === 1) {
        // Voice input methode (1 parameter)
        updateList({
          items: updatedItems
        });
      } else {
        // Handmatige methode (2 parameters)
        updateList(currentList, {
          items: updatedItems
        });
      }
      
      setNewTaskText('');
    }
  };
       

  const handleToggleCompletion = (taskId) => {
    const currentItems = tasks?.items || [];
    const updatedItems = currentItems.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
  
    if (updateList.length === 1) {
      updateList({
        items: updatedItems
      });
    } else {
      updateList(currentList, {
        items: updatedItems
      });
    }
  };

  const handleDeleteTask = (taskId) => {
    const currentItems = tasks?.items || [];
    const updatedItems = currentItems.filter(task => task.id !== taskId);
  
    if (updateList.length === 1) {
      updateList({
        items: updatedItems
      });
    } else {
      updateList(currentList, {
        items: updatedItems
      });
    }
  };

     
  const handleUpdateTask = (taskId, newText) => {
    const currentItems = tasks?.items || [];
    const updatedItems = currentItems.map(task =>
      task.id === taskId 
        ? { ...task, text: newText }
        : task
    );
  
    if (updateList.length === 1) {
      updateList({
        items: updatedItems
      });
    } else {
      updateList(currentList, {
        items: updatedItems
      });
    }
    setEditingTaskId(null);
  };

  // Kopieer taken als platte tekst naar het klembord
  const copyTasksToClipboard = () => {
    const taskText = (tasks?.items || []).map(task => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = task.text;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
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
  
    if (!destination || !currentList || !tasks?.items) {
      return;
    }
  
    const currentItems = Array.from(tasks.items);
    const [removed] = currentItems.splice(source.index, 1);
    currentItems.splice(destination.index, 0, removed);
  
    console.log('Updating after drag with:', { items: currentItems });
  
    if (updateList.length === 1) {
      updateList({ items: currentItems });
    } else if (updateList.length === 2) {
      updateList(currentList, { items: currentItems });
    }
  };
  

  const handleMoveTask = (taskId, destinationList) => {
    if (!tasks?.items) {
      console.error('No tasks available to move');
      return;
    }
  
    const taskArray = tasks.items;
    const taskToMove = taskArray.find(task => task.id === taskId);
    
    if (taskToMove) {
      console.log('Moving task:', taskToMove, 'from', currentList, 'to', destinationList);
      moveTask(taskToMove, currentList, destinationList);
      setMovingTaskId(null);
    } else {
      console.error('Task not found:', taskId);
    }
  };

  // Haal de eerste zichtbare tekstregel uit HTML
  const getTaskTitle = (html) => {
    if (!html) return { title: '', hasMoreText: false };
    // Strip HTML tags en pak de eerste regel
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const lines = text.split(/\r?\n/);
    const title = lines[0];
    const hasMoreText = lines.length > 1 || text.length > 35;
    // Beperk de titel tot 35 tekens
    const maxLength = 35;
    let displayTitle = title;
    if (displayTitle.length > maxLength) {
      displayTitle = displayTitle.substring(0, maxLength) + '...';
    }
    return { title: displayTitle, hasMoreText };
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="task-list" style={{ 
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '32px auto'
      }}>
        <form onSubmit={handleAddTask} className="add-task-form" style={{ 
          display: 'flex', 
          gap: '8px',
          alignItems: 'center',
          marginBottom: '20px',
          width: '100%'
        }}>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task.."
            style={{ 
              flex: 1,
              width: '100%',
              minWidth: 0,
              margin: 0,
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <button 
            type="submit"
            style={{
              minWidth: 40,
              padding: '0 12px',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f7fa',
              color: '#2196F3',
              border: '1px solid #e0e7ef',
              borderRadius: '4px',
              boxShadow: 'none',
              fontSize: '15px',
              transition: 'background 0.2s, color 0.2s',
              opacity: 0.7
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: '14px', color: '#222', opacity: 1 }} />
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
          <h4 style={{ margin: 0, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentList}</h4>
          <button 
            onClick={copyTasksToClipboard} 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 40,
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Copy tasks to clipboard"
          >
            <FontAwesomeIcon icon={faCopy} style={{ color: '#222', fontSize: '18px', opacity: 1 }} />
          </button>
        </div>

        <Droppable droppableId={`tasks-${currentList}`}>
          {(provided) => (
            <ul 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              style={{ listStyleType: 'none', padding: 0 }}
            >
              {(tasks?.items || []).map((task, index) => (
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
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        padding: '15px',
                        marginBottom: '10px',
                        boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        ...provided.draggableProps.style,
                      }}
                    >
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
                        textDecoration: task.completed ? 'line-through' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {getTaskTitle(task.text).title}
                          {getTaskTitle(task.text).hasMoreText && (
                            <span style={{ 
                              color: '#2196F3',
                              fontSize: '12px',
                              opacity: 0.9
                            }}>⋯</span>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginLeft: '10px'
                      }}>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'black',
                            padding: '3px',
                            borderRadius: '3px',
                            transition: 'all 0.2s',
                            fontSize: '12px'
                          }}
                          title="Delete task"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button 
                          onClick={() => setMovingTaskId(task.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '3px',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                          title="Move task to another list"
                        >
                          <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </div>
      {movingTaskId && (
        <MoveTaskModal
          lists={lists}
          currentList={currentList}
          onMove={(destinationList) => handleMoveTask(movingTaskId, destinationList)}
          onClose={() => setMovingTaskId(null)}
        />
      )}
      {selectedTask && (
        <TaskEditorModal
          task={{ ...selectedTask, list: currentList }}
          onClose={() => setSelectedTask(null)}
          updateTaskList={(updatedTask) => {
            updateList(updatedTask);
            setSelectedTask(null);
          }}
        />
      )}
    </DragDropContext>
  );
};

export default TaskList;