import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// Compleet gestripte task item zonder drag handles
const DraggableTaskItem = ({ 
  task, 
  handleToggleCompletion, 
  handleDeleteTask, 
  setMovingTaskId, 
  handleTaskClick,
  onDragStart,
  onDragEnd
}) => {
  // Extract clean text from HTML task content
  const getTaskTitle = (html) => {
    if (!html) return { title: '', hasMoreText: false };
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const lines = text.split(/\r?\n/);
    const title = lines[0];
    const hasMoreText = lines.length > 1 || text.length > 75;
    const maxLength = 75;
    let displayTitle = title;
    if (displayTitle.length > maxLength) {
      displayTitle = displayTitle.substring(0, maxLength) + '...';
    }
    return { title: displayTitle, hasMoreText };
  };

  // Extreem vereenvoudigde drag handlers
  const handleDragStart = (e) => {
    if (onDragStart) onDragStart();
    
    // Minimale data transfer om drag-drop te laten werken
    const taskData = {
      id: task.id,
      title: task.title || getTaskTitle(task.text).title,
      isTask: true
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) onDragEnd();
  };

  // Gebruik de titel eigenschap als het bestaat, anders haal het uit de tekst
  const taskTitle = task.title || getTaskTitle(task.text).title;
  const { hasMoreText } = getTaskTitle(task.text);

  return (
    <div
      className="task-item"
      draggable="true" 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        handleTaskClick(task);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        border: '1px solid #eee',
        borderRadius: '6px',
        padding: '15px',
        marginBottom: '10px',
        cursor: 'pointer',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => {
            e.stopPropagation();
            handleToggleCompletion(task.id);
          }}
          onClick={(e) => e.stopPropagation()}
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {taskTitle}
          {hasMoreText && (
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
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTask(task.id);
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'black',
            padding: '3px',
            borderRadius: '3px',
            fontSize: '12px'
          }}
          title="Delete task"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setMovingTaskId(task.id);
          }}
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
    </div>
  );
};

export default DraggableTaskItem;