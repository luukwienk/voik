import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRight, faGripVertical } from '@fortawesome/free-solid-svg-icons';

// Compleet gestripte task item zonder drag handles
const DraggableTaskItem = ({ 
  task, 
  handleToggleCompletion, 
  handleDeleteTask, 
  setMovingTaskId, 
  handleTaskClick,
  onDragStart,
  onDragEnd,
  dragHandleProps
}) => {
  const [isReordering, setIsReordering] = useState(false);
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
    if (isReordering) {
      // Disable native drag when reordering within the list
      e.preventDefault();
      return;
    }
    if (onDragStart) onDragStart();
    
    // Minimale data transfer om drag-drop te laten werken
    const taskData = {
      id: task.id,
      title: task.title || getTaskTitle(task.text).title,
      isTask: true
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
    try { window.__voikDragTask = taskData; } catch {}
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) onDragEnd();
    try { delete window.__voikDragTask; } catch {}
  };

  // Gebruik de titel eigenschap als het bestaat, anders haal het uit de tekst
  const taskTitle = task.title || getTaskTitle(task.text).title;
  const { hasMoreText } = getTaskTitle(task.text);

  return (
    <div
      className="task-item"
      draggable={!isReordering}
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
      {/* Reorder handle for react-beautiful-dnd (prevents conflict with native HTML5 drag) */}
      <div
        className="drag-handle-wrap"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: '100%',
          marginRight: 10,
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            color: '#999',
            pointerEvents: 'none'
          }}
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </span>
        {/* Invisible enlarged hit area for reordering handle */}
        <span
          {...(dragHandleProps || {})}
          onMouseDown={() => setIsReordering(true)}
          onMouseUp={() => setIsReordering(false)}
          onMouseLeave={() => setIsReordering(false)}
          draggable={false}
          aria-label="Reorder"
          style={{
            position: 'absolute',
            top: -8,
            bottom: -8,
            left: -12,
            right: -12,
            cursor: 'grab',
            background: 'transparent'
          }}
        />
      </div>
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
