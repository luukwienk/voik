import React, { useState } from 'react';
import MCPIntegration from './MCPIntegration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faRobot, faUser, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import './Settings.css';

const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('mcp');

  return (
    <div className="settings-container">
      <h1 className="settings-title">
        <FontAwesomeIcon icon={faCog} /> Instellingen
      </h1>
      
      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === 'mcp' ? 'active' : ''}`}
          onClick={() => setActiveTab('mcp')}
        >
          <FontAwesomeIcon icon={faRobot} /> Claude Integratie
        </button>
        <button 
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FontAwesomeIcon icon={faUser} /> Profiel
        </button>
        <button 
          className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <FontAwesomeIcon icon={faShieldAlt} /> Privacy
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'mcp' && <MCPIntegration user={user} />}
        
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2>Profiel Informatie</h2>
            <div className="profile-info">
              <p><strong>Naam:</strong> {user.displayName || 'Niet ingesteld'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Account aangemaakt:</strong> {new Date(user.metadata.creationTime).toLocaleDateString('nl-NL')}</p>
            </div>
          </div>
        )}
        
        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h2>Privacy & Beveiliging</h2>
            <p>Je gegevens worden veilig opgeslagen in Firebase en zijn alleen toegankelijk voor jou.</p>
            <p>We delen je gegevens nooit met derden.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;