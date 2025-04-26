import React, { useState, useEffect, useRef } from 'react';

const MultiSelectDropdown = ({ options, selectedOptions, onChange, placeholder = 'Selecteer...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // Sluit de dropdown als er buiten wordt geklikt
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleOption = (option) => {
    if (option === 'All Lists') {
      // Als 'All Lists' wordt geselecteerd, verwijder alle andere selecties
      onChange(['All Lists']);
    } else {
      let newSelection;
      
      if (selectedOptions.includes(option)) {
        // Verwijder deze optie als die al geselecteerd is
        newSelection = selectedOptions.filter(item => item !== option);
        
        // Als er niets meer geselecteerd is, selecteer dan 'All Lists'
        if (newSelection.length === 0) {
          newSelection = ['All Lists'];
        } else if (newSelection.includes('All Lists')) {
          // Als 'All Lists' nog steeds geselecteerd is, verwijder die
          newSelection = newSelection.filter(item => item !== 'All Lists');
        }
      } else {
        // Voeg deze optie toe en verwijder 'All Lists' indien geselecteerd
        newSelection = [...selectedOptions.filter(item => item !== 'All Lists'), option];
      }
      
      onChange(newSelection);
    }
  };
  
  const getDisplayText = () => {
    if (selectedOptions.includes('All Lists')) {
      return 'Alle lijsten';
    }
    
    if (selectedOptions.length === 1) {
      return selectedOptions[0];
    }
    
    return `${selectedOptions.length} lijsten geselecteerd`;
  };

  // Filter opties op basis van de zoekterm
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '200px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{getDisplayText()}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '5px',
          zIndex: 10,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Zoekbalk */}
          <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            <input
              type="text"
              placeholder="Zoeken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Opties */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div 
                key={option} 
                onClick={() => toggleOption(option)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  backgroundColor: selectedOptions.includes(option) ? '#f0f0f0' : 'transparent',
                  borderBottom: '1px solid #eee'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedOptions.includes(option)} 
                    onChange={() => {}} // Wordt afgehandeld door de onClick op de div
                    style={{ marginRight: '10px' }}
                  />
                  {option === 'All Lists' ? 'Alle lijsten' : option}
                </label>
              </div>
            ))
          ) : (
            <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
              Geen resultaten gevonden
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;