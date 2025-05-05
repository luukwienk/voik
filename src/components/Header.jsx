import React from 'react';
import TabsNavigation from './TabsNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import '../styles/header.css';

function Header({ user, signOut, currentTab, setCurrentTab }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="tabs-container">
          <TabsNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
        </div>
        
        <div className="header-actions">
          <button
            onClick={signOut}
            className="sign-out-button"
            title="Uitloggen"
            aria-label="Uitloggen"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;