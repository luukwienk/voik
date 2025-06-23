import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy, faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import MoveTaskModal from './MoveTaskModal';
import TaskEditorModal from './TaskEditorModal';
// import ListSelector from './ListSelector'; // Verwijder deze import
import DraggableTaskItem from './DraggableTaskItem';
import ListSelectorModal from './ListSelectorModal';

const TaskList = ({ 
  tasks = { items: [] }, 
  updateList, 
  currentList, 
  lists, 
  moveTask, 
  hideTitleHeader = false,
  setCurrentList,
  addList,
  deleteList
}) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [isTaskDragging, setIsTaskDragging] = useState(false);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const newTask = {
        id: `task-${Date.now()}`,
        title: newTaskText,
        text: newTaskText,
        completed: false
      };
  
      const currentItems = tasks?.items || [];
      const updatedItems = [newTask, ...currentItems];
  
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
      return `${task.completed ? '✓' : '☐'} ${task.title || textContent}`;
    }).join('\n');
    navigator.clipboard.writeText(taskText).then(() => {
      alert('Copied tasks!');
    }, (err) => {
      console.error('Could not copy tasks: ', err);
    });
  };

  // Extreem eenvoudige drop handler, alleen voor compatibiliteit
  const handleDrop = (e) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      
      const eventData = JSON.parse(data);
      
      // Check if it's a calendar event being dropped back to task list
      if (eventData && eventData.isCalendarEvent) {
        // Create a new task from the event
        const newTask = {
          id: `task-${Date.now()}`,
          title: eventData.title || 'Event from calendar',
          text: eventData.title || 'Event from calendar',
          completed: false,
        };
        
        // Add the new task to the list
        const currentItems = tasks?.items || [];
        const updatedItems = [newTask, ...currentItems];
        
        if (updateList.length === 1) {
          updateList({
            items: updatedItems
          });
        } else {
          updateList(currentList, {
            items: updatedItems
          });
        }
      }
    } catch (err) {
      console.error('Error handling drop in task list:', err);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
  
    if (!destination || !currentList || !tasks?.items) {
      return;
    }
  
    const currentItems = Array.from(tasks.items);
    const [removed] = currentItems.splice(source.index, 1);
    currentItems.splice(destination.index, 0, removed);
  
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
      moveTask(taskToMove, currentList, destinationList);
      setMovingTaskId(null);
    } else {
      console.error('Task not found:', taskId);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div 
        className="task-list"
        style={{ 
          padding: '20px', 
          backgroundColor: '#F0F8FF', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: '100%',
          height: '100%',
          minHeight: '400px', /* Minimale hoogte zodat lege lijst niet ineenklapt */
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto', /* Zorgt dat de TaskList groeit om de beschikbare ruimte te vullen */
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Lijst-selector boven de 'Add a new task' input - altijd weergeven als setCurrentList beschikbaar is */}
        {setCurrentList && lists && (
          <div style={{ marginBottom: '15px' }}>
            <ListSelectorModal 
              lists={lists}
              currentList={currentList}
              setCurrentList={setCurrentList}
              addList={addList}
              deleteList={deleteList}
            />
          </div>
        )}

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

        {/* Header alleen tonen als we geen gebruik maken van de ingebouwde lijst-selector */}
        {!setCurrentList && (
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
        )}

        <Droppable droppableId={`tasks-${currentList}`}>
          {(provided) => (
            <ul 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              style={{ 
                listStyleType: 'none', 
                padding: 0, 
                margin: 0, 
                width: '100%', 
                boxSizing: 'border-box', 
                overflowX: 'hidden',
                flex: '1 1 auto', // Laat de lijst groeien om beschikbare ruimte te vullen
                overflowY: 'auto', // Voeg scrollbars toe indien nodig
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {(tasks?.items || []).length > 0 ? (
                // Bestaande takenlijst weergave
                (tasks?.items || []).map((task, index) => (
                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          background: 'none',
                          border: 'none',
                        }}
                      >
                        <DraggableTaskItem
                          task={task}
                          handleToggleCompletion={handleToggleCompletion}
                          handleDeleteTask={handleDeleteTask}
                          setMovingTaskId={setMovingTaskId}
                          handleTaskClick={(t) => setSelectedTask(t)}
                          onDragStart={() => setIsTaskDragging(true)}
                          onDragEnd={() => setIsTaskDragging(false)}
                        />
                      </li>
                    )}
                  </Draggable>
                ))
              ) : (
                // Lege staat weergave wanneer er geen taken zijn
                <div style={{
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#888',
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>Geen taken in deze lijst</div>
                  <div style={{ fontSize: '14px' }}>Voeg een nieuwe taak toe met het invoerveld hierboven</div>
                </div>
              )}
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
            // Zoek de juiste lijst en update alleen de betreffende taak
            const currentItems = tasks?.items || [];
            const updatedItems = currentItems.map(t =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t
            );
            if (updateList.length === 1) {
              updateList({ items: updatedItems });
            } else {
              updateList(currentList, { items: updatedItems });
            }
            setSelectedTask(null);
          }}
        />
      )}
    </DragDropContext>
  );
};

export default TaskList;