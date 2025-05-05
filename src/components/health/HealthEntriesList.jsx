import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faSort, 
  faSortUp, 
  faSortDown, 
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

const HealthEntriesList = ({ 
  healthData = [],
  updateHealthEntry,
  deleteHealthEntry,
  activeMetric
}) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValues, setEditValues] = useState({
    date: '',
    weight: '',
    calories: '',
    waist: '',
    workout: ''
  });
  
  const [filteredData, setFilteredData] = useState([]);
  
  // Filter and sort the data when changes occur
  useEffect(() => {
    if (!healthData || !healthData.length) return;
    
    // Make a copy to avoid mutating the original
    let processed = [...healthData];
    
    // Sort the data
    processed.sort((a, b) => {
      // Handle date sorting
      if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Handle numeric fields
      const valueA = a[sortField] || 0;
      const valueB = b[sortField] || 0;
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    setFilteredData(processed);
  }, [healthData, sortField, sortDirection]);
  
  // Set up editing mode for an entry
  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditValues({
      date: entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : new Date(entry.date).toISOString().split('T')[0],
      weight: entry.weight || '',
      calories: entry.calories || '',
      waist: entry.waist || '',
      workout: entry.workout || ''
    });
  };
  
  // Handle input changes while editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditValues({
      ...editValues,
      [name]: value
    });
  };
  
  // Save the edited entry
  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      // Format the updated data
      const updatedEntry = {
        date: new Date(editValues.date),
        weight: editValues.weight ? parseFloat(editValues.weight) : null,
        calories: editValues.calories ? parseInt(editValues.calories) : null,
        waist: editValues.waist ? parseFloat(editValues.waist) : null,
        workout: editValues.workout ? parseInt(editValues.workout) : null
      };
      
      // Update the entry
      await updateHealthEntry(editingEntry.id, updatedEntry);
      
      // Exit edit mode
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating health entry:', error);
      alert('Kon de gezondheidsgegevens niet bijwerken. Probeer het opnieuw.');
    }
  };
  
  // Delete an entry
  const handleDeleteEntry = async (entryId) => {
    // Confirm deletion
    if (window.confirm('Weet je zeker dat je deze invoer wilt verwijderen?')) {
      try {
        await deleteHealthEntry(entryId);
      } catch (error) {
        console.error('Error deleting health entry:', error);
        alert('Kon de gezondheidsgegevens niet verwijderen. Probeer het opnieuw.');
      }
    }
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for a new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (field !== sortField) return <FontAwesomeIcon icon={faSort} />;
    return sortDirection === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />;
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Style for highlighted metric
  const getHighlightStyle = (metric) => {
    return metric === activeMetric ? { color: '#2196F3', fontWeight: '600' } : {};
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Gezondheidsgegevens
        </h3>
      </div>
      
      {healthData && healthData.length > 0 ? (
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => handleSort('date')}
                >
                  <span>Datum</span> {getSortIcon('date')}
                </th>
                <th 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: 'right', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    ...getHighlightStyle('weight')
                  }}
                  onClick={() => handleSort('weight')}
                >
                  <span>Gewicht (kg)</span> {getSortIcon('weight')}
                </th>
                <th 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: 'right', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    ...getHighlightStyle('calories')
                  }}
                  onClick={() => handleSort('calories')}
                >
                  <span>Calorieën</span> {getSortIcon('calories')}
                </th>
                <th 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: 'right', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    ...getHighlightStyle('waist')
                  }}
                  onClick={() => handleSort('waist')}
                >
                  <span>Taille (cm)</span> {getSortIcon('waist')}
                </th>
                <th 
                  style={{ 
                    padding: '8px 12px', 
                    textAlign: 'right', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    ...getHighlightStyle('workout')
                  }}
                  onClick={() => handleSort('workout')}
                >
                  <span>Training (min)</span> {getSortIcon('workout')}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', minWidth: '100px' }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(entry => (
                editingEntry && editingEntry.id === entry.id ? (
                  // Edit row
                  <tr key={`edit-${entry.id}`} style={{ borderBottom: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="date"
                        name="date"
                        value={editValues.date}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        step="0.1"
                        name="weight"
                        value={editValues.weight}
                        onChange={handleInputChange}
                        placeholder="75.0"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        name="calories"
                        value={editValues.calories}
                        onChange={handleInputChange}
                        placeholder="2000"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        step="0.1"
                        name="waist"
                        value={editValues.waist}
                        onChange={handleInputChange}
                        placeholder="85.0"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        name="workout"
                        value={editValues.workout}
                        onChange={handleInputChange}
                        placeholder="45"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          marginRight: '8px',
                          cursor: 'pointer'
                        }}
                        title="Opslaan"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                        title="Annuleren"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </td>
                  </tr>
                ) : (
                  // Normal row
                  <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 12px' }}>{formatDate(entry.date)}</td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      ...getHighlightStyle('weight')
                    }}>
                      {entry.weight !== null && entry.weight !== undefined ? entry.weight.toFixed(1) : '-'}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      ...getHighlightStyle('calories')
                    }}>
                      {entry.calories || '-'}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      ...getHighlightStyle('waist')
                    }}>
                      {entry.waist !== null && entry.waist !== undefined ? entry.waist.toFixed(1) : '-'}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      ...getHighlightStyle('workout')
                    }}>
                      {entry.workout || '-'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(entry)}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          marginRight: '8px',
                          cursor: 'pointer'
                        }}
                        title="Bewerken"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                        title="Verwijderen"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Geen gezondheidsgegevens beschikbaar.
        </p>
      )}
    </div>
  );
};

export default HealthEntriesList; 