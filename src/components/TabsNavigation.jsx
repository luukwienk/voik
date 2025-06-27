// Updated TabsNavigation.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, 
  faClock, 
  faSearch, 
  faHeartbeat, 
  faMicrophone,
  faTrophy,
  faCog,
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/tabs.css';

const TabsNavigation = ({ currentTab, onTabChange, signOut }) => {
  // Als currentTab niet wordt doorgegeven, gebruik dan lokale state
  const [value, setValue] = useState(currentTab || 0);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  return (
    <div className="tabs-navigation" style={{
      position: isMobile ? 'fixed' : 'relative',
      bottom: isMobile ? 0 : 'auto',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      boxShadow: isMobile ? '0 -2px 10px rgba(0, 0, 0, 0.1)' : 'none',
      zIndex: 1000,
      padding: isMobile ? '8px 0' : '0',
      transition: 'all 0.3s ease',
      paddingBottom: isMobile ? 'calc(8px + env(safe-area-inset-bottom))' : undefined
    }}>
      <div className="tabs-container" style={{
        maxWidth: isMobile ? '100%' : '1680px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0'
      }}>
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
          <FontAwesomeIcon icon={faClock} />
        </div>
        <div
          className={`tab-item ${currentTab === 2 ? 'active' : ''}`}
          onClick={() => handleChange(2)}
        >
          <FontAwesomeIcon icon={faSearch} />
        </div>
        {/* Health tracker tab */}
        <div
          className={`tab-item ${currentTab === 3 ? 'active' : ''}`}
          onClick={() => handleChange(3)}
        >
          <FontAwesomeIcon icon={faHeartbeat} />
        </div>
        {/* Transcription tab */}
        <div
          className={`tab-item ${currentTab === 4 ? 'active' : ''}`}
          onClick={() => handleChange(4)}
        >
          <FontAwesomeIcon icon={faMicrophone} />
        </div>
        {/* Success tracker tab */}
        <div
          className={`tab-item ${currentTab === 5 ? 'active' : ''}`}
          onClick={() => handleChange(5)}
        >
          <FontAwesomeIcon icon={faTrophy} />
        </div>
        {/* Settings tab */}
        <div
          className={`tab-item ${currentTab === 6 ? 'active' : ''}`}
          onClick={() => handleChange(6)}
        >
          <FontAwesomeIcon icon={faCog} />
        </div>
        {/* Visuele scheiding voor logout */}
        <div style={{ flex: '0 0 16px' }} />
        {/* Logout tab altijd zichtbaar */}
        <div
          className="tab-item"
          onClick={signOut}
          title="Uitloggen"
          aria-label="Uitloggen"
          style={{ color: '#2196F3' }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;