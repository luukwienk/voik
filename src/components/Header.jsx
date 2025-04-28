import React from 'react';
import TabsNavigation from './TabsNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Header({ user, signOut, currentTab, setCurrentTab }) {
  return (
    <header className="app-header">
      <TabsNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </header>
  );
}

export default Header;