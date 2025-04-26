import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faRedo, faTrash } from '@fortawesome/free-solid-svg-icons';

const TaskTable = ({ tasks, availableLists, onSelectTask, onToggleCompletion, onDeleteTask, onMoveTasksToList }) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [targetList, setTargetList] = useState('');
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [selectedStatuses, setSelectedStatuses] = useState(['open']);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Functie om te sorteren op een veld
  const handleSort = (field) => {
    if (sortField === field) {
      // Als we al op dit veld sorteren, verander de richting
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Anders, sorteer oplopend op het nieuwe veld
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorteer de taken
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    if (sortField === 'status') {
      // Sorteren op status (completed boolean)
      aValue = a.completed ? 'voltooid' : 'open';
      bValue = b.completed ? 'voltooid' : 'open';
    } else if (sortField === 'title') {
      // Sorteren op titel (eerste regel van task text)
      aValue = getTaskTitle(a.text)?.toLowerCase() || '';
      bValue = getTaskTitle(b.text)?.toLowerCase() || '';
    } else {
      // Sorteren op andere velden
      aValue = a[sortField]?.toString().toLowerCase() || '';
      bValue = b[sortField]?.toString().toLowerCase() || '';
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Extraheer de eerste regel van een taak voor de tabelweergave
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

  // Render sorteerindicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: '5px' }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  // Selecteer/deselecteer een individuele taak
  const handleSelectTask = (taskId, e) => {
    e.stopPropagation(); // Voorkom dat de modal opent
    
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };
  
  // Selecteer/deselecteer alle taken
  const handleSelectAll = (e) => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };
  
  // Verplaats geselecteerde taken naar de gekozen lijst
  const handleMoveTasks = () => {
    if (selectedTasks.length === 0 || !targetList) return;
    
    // Verzamel alle geselecteerde taken
    const tasksToMove = tasks.filter(task => selectedTasks.includes(task.id));
    
    // Roep de callback functie één keer aan met alle geselecteerde taken
    if (window.confirm(`Wil je deze ${tasksToMove.length} ${tasksToMove.length === 1 ? 'taak' : 'taken'} verplaatsen naar "${targetList}"?`)) {
      onMoveTasksToList(tasksToMove, targetList);
      
      // Reset selectie na verplaatsing
      setSelectedTasks([]);
      setTargetList('');
    }
  };

  // Functie om te filteren op status
  const handleStatusFilter = (status) => {
    if (status === 'all') {
      setSelectedStatuses(['open', 'completed']);
      setFilteredTasks(tasks);
    } else {
      setSelectedStatuses(prev => {
        if (prev.includes(status)) {
          return prev.filter(s => s !== status);
        } else {
          return [...prev, status];
        }
      });
    }
  };

  // Filter de taken op basis van geselecteerde statussen
  const filteredAndSortedTasks = sortedTasks.filter(task => 
    selectedStatuses.includes(task.completed ? 'completed' : 'open')
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Bulk actie balk - alleen tonen als er taken geselecteerd zijn */}
      {selectedTasks.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
          marginBottom: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <span style={{ marginRight: '10px', fontWeight: 500 }}>
            {selectedTasks.length} {selectedTasks.length === 1 ? 'taak' : 'taken'} geselecteerd
          </span>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            <select
              value={targetList}
              onChange={(e) => setTargetList(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                marginRight: '10px'
              }}
            >
              <option value="">Selecteer een lijst...</option>
              {availableLists.filter(list => list !== 'All Lists').map(list => (
                <option key={list} value={list}>{list}</option>
              ))}
            </select>
            <button
              onClick={handleMoveTasks}
              disabled={!targetList}
              style={{
                padding: '6px 12px',
                backgroundColor: targetList ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: targetList ? 'pointer' : 'not-allowed'
              }}
            >
              Move
            </button>
            <button
              onClick={() => setSelectedTasks([])}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                marginLeft: '10px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕ Annuleer
            </button>
          </div>
        </div>
      )}
      
      <div className="tasks-table-container" style={{ 
        flexGrow: 1,
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          overflow: 'auto',
          flexGrow: 1,
          height: '100%'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '45%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th 
                  style={{ padding: '12px 10px', cursor: 'pointer' }}
                  onClick={() => handleSort('title')}
                >
                  Taak {renderSortIndicator('title')}
                </th>
                <th 
                  style={{ padding: '12px 10px', cursor: 'pointer' }}
                  onClick={() => handleSort('list')}
                >
                  Lijst {renderSortIndicator('list')}
                </th>
                <th 
                  style={{ padding: '12px 10px', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Status</span>
                    {showStatusDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px',
                        zIndex: 1000,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes('open')}
                              onChange={() => handleStatusFilter('open')}
                            />
                            Open
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes('completed')}
                              onChange={() => handleStatusFilter('completed')}
                            />
                            Voltooid
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th style={{ padding: '12px 10px' }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.length > 0 ? (
                filteredAndSortedTasks.map(task => (
                  <tr 
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: selectedTasks.includes(task.id) ? '#e3f2fd' : 'transparent',
                      borderBottom: '1px solid #eee',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!selectedTasks.includes(task.id)) {
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!selectedTasks.includes(task.id)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => handleSelectTask(task.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      opacity: task.completed ? 0.6 : 1,
                      textDecoration: task.completed ? 'line-through' : 'none'
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
                    </td>
                    <td style={{ padding: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.list}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {task.completed ? 
                        <span style={{ color: 'green' }}>Voltooid</span> : 
                        <span style={{ color: 'blue' }}>Open</span>
                      }
                    </td>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Voorkom dat de modal opent
                            onToggleCompletion(task);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: task.completed ? '#ff9800' : '#4CAF50',
                            padding: '5px',
                            borderRadius: '3px',
                            transition: 'all 0.2s',
                            fontSize: '14px'
                          }}
                          title={task.completed ? "Markeer als open" : "Markeer als voltooid"}
                        >
                          <FontAwesomeIcon icon={task.completed ? faRedo : faCheck} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Voorkom dat de modal opent
                            onDeleteTask(task);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '5px',
                            borderRadius: '3px',
                            transition: 'all 0.2s',
                            fontSize: '14px'
                          }}
                          title="Verwijder taak"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Geen taken gevonden die aan de zoekcriteria voldoen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskTable;