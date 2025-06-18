import React from 'react';
import '../styles/header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-logo-center">
          <span className="app-logo">Voik</span>
        </div>
      </div>
    </header>
  );
}

export default Header;