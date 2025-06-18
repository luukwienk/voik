import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faEdit, 
  faTrash, 
  faGripLines, 
  faCalendarAlt, 
  faTimes, 
  faSave 
} from '@fortawesome/free-solid-svg-icons';

const TaskItem = ({ 
  task, 
  index, 
  onUpdate, 
  onDelete, 
  isDraggable = true,
  moveTask 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(task.text || '');
  const [isDragging, setIsDragging] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const taskRef = useRef(null);
  const dragTimeoutRef = useRef(null);

  // Handle checkbox change for task completion
  const handleCheckboxChange = () => {
    onUpdate({
      ...task,
      completed: !task.completed
    });
  };

  // Handle drag start event
  const handleDragStart = (e) => {
    // Add styling to indicate dragging
    setIsDragging(true);
    
    // Set data for dropping (necessary for drag & drop API)
    // Include all task data as JSON
    const fullTask = {
      ...task,
      id: task.id,
      text: task.text,
      completed: task.completed,
      list: task.list // Include the list name for the task
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(fullTask));
    
    // Use an image element as drag preview
    if (taskRef.current) {
      const rect = taskRef.current.getBoundingClientRect();
      const dragImage = document.createElement('div');
      dragImage.style.position = 'fixed';
      dragImage.style.top = '-1000px';
      dragImage.style.backgroundColor = 'rgba(33, 150, 243, 0.8)';
      dragImage.style.padding = '10px 16px';
      dragImage.style.borderRadius = '4px';
      dragImage.style.color = 'white';
      dragImage.style.fontSize = '14px';
      dragImage.style.maxWidth = '200px';
      dragImage.style.overflow = 'hidden';
      dragImage.style.textOverflow = 'ellipsis';
      dragImage.style.whiteSpace = 'nowrap';
      dragImage.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      dragImage.textContent = task.title || extractTaskTitle(task.text) || 'Taak';
      document.body.appendChild(dragImage);
      
      e.dataTransfer.setDragImage(dragImage, 20, 20);
      
      // Clean up the temporary drag image element
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  // Handle drag end event
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Extract a title from the task text
  const extractTaskTitle = (text) => {
    if (!text) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    // Get the text content
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Split by lines and return the first line
    const lines = plainText.split(/\r?\n/);
    return lines[0].trim();
  };

  // Handle direct scheduling of task from the list
  const handleScheduleTask = () => {
    // Get current time
    const now = new Date();
    const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
    
    // Create start and end times (1 hour later)
    const startDateTime = new Date(now);
    startDateTime.setMinutes(roundedMinutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);
    
    // Format dates for the modal
    const startFormatted = startDateTime.toISOString().slice(0, 16);
    const endFormatted = endDateTime.toISOString().slice(0, 16);
    
    // Prompt user for date/time
    const confirmSchedule = window.confirm(
      `Wil je deze taak inplannen voor vandaag van ${startDateTime.getHours()}:${startDateTime.getMinutes() || '00'} tot ${endDateTime.getHours()}:${endDateTime.getMinutes() || '00'}?`
    );
    
    if (confirmSchedule) {
      // Here you would call your function to add the task to the calendar
      // This could be implemented in your app's context or as props
      alert('Functionaliteit voor direct inplannen wordt nog geïmplementeerd!');
      
      // You might want to mark the task as scheduled or completed
      onUpdate({
        ...task,
        scheduled: true // Add a flag to indicate this task is scheduled
      });
    }
  };
  
  // Handle mouse enter for draggable tasks
  const handleMouseEnter = () => {
    // Only show hint if task is draggable
    if (isDraggable) {
      // Set a timeout to avoid flickering for quick mouse movements
      dragTimeoutRef.current = setTimeout(() => {
        setShowDragHint(true);
      }, 500); // Show hint after 500ms hover
    }
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before hint is shown
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    setShowDragHint(false);
  };

  // Save edited task
  const handleSaveEdit = () => {
    onUpdate({
      ...task,
      text: editedText
    });
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedText(task.text || '');
    setIsEditing(false);
  };

  // Format the title display
  const taskTitle = task.title || extractTaskTitle(task.text) || 'Nieuwe taak';

  return (
    <li 
      ref={taskRef}
      className={`task-item ${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 10px',
        margin: '8px 0',
        backgroundColor: isDragging ? '#e3f2fd' : task.completed ? '#f5f5f5' : 'white',
        borderRadius: '8px',
        boxShadow: isDragging 
          ? '0 8px 16px rgba(0,0,0,0.15)' 
          : '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        border: showDragHint 
          ? '2px dashed #2196F3' 
          : isDragging 
            ? '2px solid #2196F3' 
            : '1px solid #e0e0e0',
        opacity: isDragging ? 0.7 : 1,
        cursor: isDraggable ? 'grab' : 'default',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Drag handle icon for visual cue */}
      {isDraggable && (
        <div 
          className="drag-handle" 
          style={{ 
            marginRight: '10px', 
            color: '#bbb',
            cursor: 'grab',
            touchAction: 'none', // Prevents scrolling on touch devices
          }}
        >
          <FontAwesomeIcon icon={faGripLines} />
        </div>
      )}
      
      {/* Checkbox for task completion */}
      <input 
        type="checkbox" 
        checked={task.completed} 
        onChange={handleCheckboxChange} 
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      
      {/* Task content */}
      {isEditing ? (
        <div className="edit-task-container" style={{ flex: 1 }}>
          <textarea
            className="edit-task-textarea"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
          <div className="edit-task-buttons" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button 
              className="save-task-btn" 
              onClick={handleSaveEdit}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <FontAwesomeIcon icon={faSave} />
              Opslaan
            </button>
            <button 
              className="cancel-task-btn" 
              onClick={handleCancelEdit}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <span 
          className="task-text" 
          style={{ 
            flex: 1, 
            margin: '0 10px',
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#888' : 'inherit',
            wordBreak: 'break-word',
            fontSize: '15px'
          }}
        >
          {/* We display the task title or the first line of the text */}
          {taskTitle}
          
          {/* If the task has more content, show an indicator */}
          {task.text && task.text.split(/\r?\n/).length > 1 && (
            <span style={{ 
              fontSize: '12px',
              color: '#757575',
              marginLeft: '8px',
              fontStyle: 'italic'
            }}>
              (+ meer)
            </span>
          )}
        </span>
      )}
      
      {/* Action buttons */}
      {!isEditing && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: '#757575',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
            }}
            title="Bewerken"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          
          <button 
            onClick={handleScheduleTask}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: '#2196F3',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
            }}
            title="Inplannen"
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
          </button>
          
          <button 
            onClick={() => onDelete(task.id)}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: '#f44336',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
            }}
            title="Verwijderen"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}
      
      {/* Drag hint tooltip */}
      {showDragHint && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          zIndex: 10,
          pointerEvents: 'none', // So it doesn't interfere with mouse events
          animation: 'fadeIn 0.3s ease',
        }}>
          Sleep naar de agenda om in te plannen
        </div>
      )}
    </li>
  );
};

export default TaskItem;