import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRight, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// Dit component creëert een taakitem dat naar kalenders kan worden gesleept
const DraggableTaskItem = ({ task, handleToggleCompletion, handleDeleteTask, setMovingTaskId, handleTaskClick }) => {
  
  // Genereer een schone tekstversie van de taaktekst (zonder HTML)
  const getTaskTitle = (html) => {
    if (!html) return { title: '', hasMoreText: false };
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const lines = text.split(/\r?\n/);
    const title = lines[0];
    const hasMoreText = lines.length > 1 || text.length > 35;
    const maxLength = 35;
    let displayTitle = title;
    if (displayTitle.length > maxLength) {
      displayTitle = displayTitle.substring(0, maxLength) + '...';
    }
    return { title: displayTitle, hasMoreText };
  };

  // Stel de gegevensoverdracht in voor het slepen naar de kalender
  const handleDragStart = (e) => {
    // Deze gegevens worden door de kalender gebruikt om een gebeurtenis te maken
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = task.text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || 'Task';
    const shortTitle = cleanText.split('\n')[0].substring(0, 30);
    
    // Eenvoudiger format om problemen met datumverwerking te voorkomen
    const taskData = {
      id: task.id,
      title: shortTitle,
      isTask: true,
      completed: task.completed,
      // Vereenvoudigd kalendar-formaat
      kalendFormat: {
        id: task.id,
        startAt: new Date().toISOString(),
        endAt: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        summary: shortTitle,
        color: task.completed ? '#888888' : '#000000'
      }
    };
    
    // Stel de overdrachtgegevens in
    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Voeg een klasse toe aan het gesleepte element
    e.target.classList.add('task-dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('task-dragging');
  };

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
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        cursor: 'pointer',
        width: '100%',
        position: 'relative'
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
        {/* Kalender-hint icoon */}
        <div style={{
          fontSize: '12px',
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          marginRight: '8px'
        }}>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '2px' }} />
          <span>Sleep naar agenda</span>
        </div>
        
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
          title="Verwijder taak"
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
          title="Verplaats taak naar andere lijst"
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      
      {/* Voeg een draggable hint toe tijdens het slepen */}
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
          opacity: 0.6;
          background-color: #f0f9ff !important;
          border: 1px dashed #2196F3 !important;
        }
      `}</style>
    </div>
  );
};

export default DraggableTaskItem;