import React from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';

const TaskFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  availableLists, 
  selectedLists, 
  setSelectedLists 
}) => {
  return (
    <div className="search-filter-bar" style={{ 
      marginBottom: '20px', 
      display: 'flex', 
      gap: '10px', 
      padding: '15px', 
      backgroundColor: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <input 
        type="text" 
        placeholder="Zoeken in taken..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ 
          flexGrow: 1, 
          padding: '10px', 
          borderRadius: '4px', 
          border: '1px solid #ddd'
        }}
      />
      <MultiSelectDropdown 
        options={availableLists}
        selectedOptions={selectedLists}
        onChange={setSelectedLists}
        placeholder="Selecteer lijsten"
      />
    </div>
  );
};

export default TaskFilters;