import React from 'react';
import TabsNavigation from './TabsNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Header({ user, signOut, currentTab, setCurrentTab }) {
  return (
    <header className="app-header">
      <div className="header-top" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={signOut} className="sign-out-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faSignOutAlt} /> 
        </button>
      </div>
      <TabsNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </header>
  );
}

export default Header;