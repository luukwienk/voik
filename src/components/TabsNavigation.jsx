import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTasks, faStickyNote, faClock, faSearch } from '@fortawesome/free-solid-svg-icons';

const TabsNavigation = ({ currentTab, onTabChange }) => {
  // Als currentTab niet wordt doorgegeven, gebruik dan lokale state
  const [value, setValue] = useState(currentTab || 0);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '10px' }}>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            borderBottom: currentTab === 0 ? '2px solid #333' : 'none',
            color: currentTab === 0 ? '#333' : '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleChange(0)}
        >
          <FontAwesomeIcon icon={faTasks} />
          
        </div>
        <div
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            borderBottom: currentTab === 1 ? '2px solid #333' : 'none',
            color: currentTab === 1 ? '#333' : '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleChange(1)}
        >
          <FontAwesomeIcon icon={faStickyNote} />
          
        </div>
        <div
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            borderBottom: currentTab === 2 ? '2px solid #333' : 'none',
            color: currentTab === 2 ? '#333' : '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleChange(2)}
        >
          <FontAwesomeIcon icon={faClock} />
          
        </div>
        {/* Nieuwe tab voor taakenoverzicht */}
        <div
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            borderBottom: currentTab === 3 ? '2px solid #333' : 'none',
            color: currentTab === 3 ? '#333' : '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleChange(3)}
        >
          <FontAwesomeIcon icon={faSearch} />
          
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;