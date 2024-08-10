import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTasks, faStickyNote } from '@fortawesome/free-solid-svg-icons';

const TabsNavigation = ({ onTabChange }) => {
  const [value, setValue] = useState(0);

  const handleChange = (newValue) => {
    setValue(newValue);
    onTabChange(newValue);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '10px' }}>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            borderBottom: value === 0 ? '2px solid #333' : 'none',
            color: value === 0 ? '#333' : '#555',
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
            borderBottom: value === 1 ? '2px solid #333' : 'none',
            color: value === 1 ? '#333' : '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => handleChange(1)}
        >
          <FontAwesomeIcon icon={faStickyNote} />
          
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;
