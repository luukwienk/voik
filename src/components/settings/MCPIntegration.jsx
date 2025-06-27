import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faKey, 
  faCheck, 
  faCopy, 
  faTrash,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './MCPIntegration.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MCPIntegration = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [config, setConfig] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load existing sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/sessions/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []); // Fallback to empty array
      } else {
        // Don't crash on error, just log it
        console.warn('Could not load sessions:', response.status);
        setSessions([]);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setSessions([]); // Set empty array on error
    }
  };

  const generateConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      setConfig(data.config);
      setSuccess(true);
      
      // Reload sessions
      await loadSessions();
      
      // Auto-copy to clipboard
      await copyToClipboard(JSON.stringify(data.config, null, 2));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const revokeSession = async (sessionId) => {
    if (!confirm('Weet je zeker dat je deze sessie wilt intrekken?')) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await loadSessions();
      }
    } catch (err) {
      console.error('Error revoking session:', err);
    }
  };

  return (
    <div className="mcp-integration">
      <div className="mcp-header">
        <h2>
          <FontAwesomeIcon icon={faRobot} /> Claude Koppeling
        </h2>
        <p className="mcp-description">
          Verbind Claude met je TaskBuddy taken zodat je Claude kunt vragen om taken toe te voegen, 
          te bekijken of te beheren.
        </p>
      </div>

      {/* Instructions */}
      <div className="mcp-instructions">
        <h3>Hoe werkt het?</h3>
        <ol>
          <li>Klik op "Genereer Configuratie" hieronder</li>
          <li>De configuratie wordt automatisch gekopieerd</li>
          <li>Open Claude Desktop</li>
          <li>Ga naar Settings → Developer → Model Context Protocol</li>
          <li>Plak de configuratie</li>
          <li>Herstart Claude Desktop</li>
          <li>Test met "Wat staat er op mijn takenlijst?"</li>
        </ol>
      </div>

      {/* Generate Button */}
      {!config && (
        <div className="mcp-actions">
          <button 
            onClick={generateConfig} 
            disabled={loading}
            className="mcp-generate-btn"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Genereren...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faKey} /> Genereer Configuratie
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mcp-alert mcp-alert-error">
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}

      {/* Success Message & Config */}
      {success && config && (
        <div className="mcp-success-section">
          <div className="mcp-alert mcp-alert-success">
            <FontAwesomeIcon icon={faCheck} /> Configuratie succesvol gegenereerd en gekopieerd!
          </div>
          
          <div className="mcp-config-container">
            <div className="mcp-config-header">
              <h4>Claude Configuratie</h4>
              <button 
                onClick={() => copyToClipboard(JSON.stringify(config, null, 2))}
                className="mcp-copy-btn"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                {copied ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
            <pre className="mcp-config-code">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
          
          <button 
            onClick={() => {
              setConfig(null);
              setSuccess(false);
            }}
            className="mcp-new-session-btn"
          >
            Nieuwe Sessie Genereren
          </button>
        </div>
      )}

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="mcp-sessions">
          <h3>Actieve Sessies</h3>
          <div className="mcp-sessions-list">
            {sessions.map(session => (
              <div key={session.id} className="mcp-session-item">
                <div className="mcp-session-info">
                  <p className="mcp-session-id">Sessie ID: {session.id.substring(0, 8)}...</p>
                  <p className="mcp-session-dates">
                    Aangemaakt: {new Date(session.createdAt).toLocaleDateString('nl-NL')}
                  </p>
                  <p className="mcp-session-dates">
                    Verloopt: {new Date(session.expiresAt).toLocaleDateString('nl-NL')}
                  </p>
                  {session.lastUsed && (
                    <p className="mcp-session-dates">
                      Laatst gebruikt: {new Date(session.lastUsed).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => revokeSession(session.id)}
                  className="mcp-revoke-btn"
                  title="Sessie intrekken"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mcp-info-box">
        <FontAwesomeIcon icon={faInfoCircle} />
        <div>
          <strong>Privacy & Veiligheid</strong>
          <p>
            Sessies verlopen automatisch na 7 dagen. Je kunt op elk moment sessies intrekken. 
            Claude heeft alleen toegang tot je taken, niet tot andere persoonlijke gegevens.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MCPIntegration;