import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRight, faCalendarAlt, faGripLines } from '@fortawesome/free-solid-svg-icons';

// Enhanced draggable task item with improved calendar drag-and-drop
const DraggableTaskItem = ({ 
  task, 
  handleToggleCompletion, 
  handleDeleteTask, 
  setMovingTaskId, 
  handleTaskClick,
  onDragStart,
  onDragEnd
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
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

  // Enhanced drag start handler with better data formatting
  const handleDragStart = (e) => {
    console.log('Task drag start triggered for task:', task.id);
    
    // Set callback if provided
    if (onDragStart) onDragStart();
    
    setIsDragging(true);
    
    // Convert the HTML content to clean text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = task.text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || 'Task';
    
    // Get a short title for the calendar event
    const shortTitle = cleanText.split('\n')[0].substring(0, 30);
    
    // Create a data structure for the drag operation with all necessary details
    const taskData = {
      id: task.id,
      title: shortTitle,
      description: cleanText,
      completed: task.completed,
      isTask: true,
      // Include additional metadata for precise calendar placement
      dragSource: 'taskList',
      originalTaskId: task.id,
      timestamp: Date.now()
    };
    
    console.log('Dragging task with data:', taskData);
    
    // Set the data transfer with the task information - USING STANDARD FORMAT
    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
    
    // Also set a specific format that can be checked for
    e.dataTransfer.setData('application/x-task', JSON.stringify(taskData));
    
    // Set the operation type
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a drag image for better visual feedback
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.innerHTML = `<div style="
      padding: 10px 15px;
      background-color: #f0f9ff;
      border: 1px dashed #2196F3;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.9;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    ">${shortTitle}</div>`;
    
    // Add the drag image to the document temporarily
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove the temporary element after a small delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 100);
    
    // Add a class to style the dragged element
    e.target.classList.add('task-dragging');
  };

  const handleDragEnd = (e) => {
    console.log('Task drag end triggered');
    
    // Set callback if provided
    if (onDragEnd) onDragEnd();
    
    setIsDragging(false);
    e.target.classList.remove('task-dragging');
  };

  const { title, hasMoreText } = getTaskTitle(task.text);

  return (
    <div
      className={`task-item ${isDragging ? 'task-dragging' : ''}`}
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        cursor: 'pointer',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Drag handle */}
      <div 
        className="drag-handle"
        style={{ 
          marginRight: '10px', 
          cursor: 'grab',
          color: '#aaa',
          padding: '5px'
        }}
        title="Drag to calendar to schedule"
      >
        <FontAwesomeIcon icon={faGripLines} />
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
          {title}
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
        {/* Calendar icon for drag hint */}
        <button
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'grab',
            color: '#2196F3',
            padding: '3px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            fontSize: '12px'
          }}
          title="Drag to calendar to schedule"
          // Make non-clickable, just visual indicator
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
        </button>
        
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
            transition: 'all 0.2s',
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
      
      {/* Enhanced drag styles */}
      <style jsx>{`
        .task-item {
          transition: all 0.2s;
        }
        
        .task-item:hover {
          background-color: #f8f8f8;
          box-shadow: 0 3px 6px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        
        .task-dragging {
          opacity: 0.6 !important;
          background-color: #f0f9ff !important;
          border: 1px dashed #2196F3 !important;
          transform: scale(1.02) !important;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
        }
        
        .drag-handle {
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        
        .task-item:hover .drag-handle {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default DraggableTaskItem;