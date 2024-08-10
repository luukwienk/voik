import React from 'react';
import TabsNavigation from './TabsNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Header({ user, signOut, currentTab, setCurrentTab }) {
  return (
    <header className="app-header">
      <div className="header-top">
        {user && <span className="user-email">{user.email}</span>}
        <button onClick={signOut} className="sign-out-btn">
          <FontAwesomeIcon icon={faSignOutAlt} /> 
        </button>
      </div>
      <TabsNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </header>
  );
}

export default Header;
