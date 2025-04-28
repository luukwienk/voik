// Updated TabsNavigation.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, 
  faStickyNote, 
  faClock, 
  faSearch, 
  faHeartbeat 
} from '@fortawesome/free-solid-svg-icons';
import '../styles/tabs.css';

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
    <div className="tabs-navigation">
      <div className="tabs-container">
        <div
          className={`tab-item ${currentTab === 0 ? 'active' : ''}`}
          onClick={() => handleChange(0)}
        >
          <FontAwesomeIcon icon={faTasks} />
        </div>
        <div
          className={`tab-item ${currentTab === 1 ? 'active' : ''}`}
          onClick={() => handleChange(1)}
        >
          <FontAwesomeIcon icon={faStickyNote} />
        </div>
        <div
          className={`tab-item ${currentTab === 2 ? 'active' : ''}`}
          onClick={() => handleChange(2)}
        >
          <FontAwesomeIcon icon={faClock} />
        </div>
        <div
          className={`tab-item ${currentTab === 3 ? 'active' : ''}`}
          onClick={() => handleChange(3)}
        >
          <FontAwesomeIcon icon={faSearch} />
        </div>
        {/* Health tracker tab */}
        <div
          className={`tab-item ${currentTab === 4 ? 'active' : ''}`}
          onClick={() => handleChange(4)}
        >
          <FontAwesomeIcon icon={faHeartbeat} />
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;