// CalendarConfigModal.jsx - Verbeterde versie
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSync, faPlus, faCheck, faCalendarPlus, faShareAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { createCalendar, shareCalendarWithUser } from '../services/googleCalendar';

const CalendarConfigModal = ({ 
  isOpen, 
  onClose, 
  availableCalendars = [], 
  selectedCalendars = [], 
  toggleCalendar, 
  fetchAvailableCalendars,
  isLoading
}) => {
  const [newCalendarName, setNewCalendarName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareCalendarId, setShareCalendarId] = useState('');
  const [shareRole, setShareRole] = useState('reader');
  const [activeTab, setActiveTab] = useState('calendars');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset messages when tab changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  if (!isOpen) return null;

  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCalendarName.trim()) {
      setError('Vul een naam in voor de agenda');
      return;
    }

    try {
      const newCalendar = await createCalendar(newCalendarName);
      setSuccess(`Agenda "${newCalendarName}" is succesvol aangemaakt!`);
      setNewCalendarName('');
      // Refresh the list of available calendars
      fetchAvailableCalendars();
    } catch (error) {
      setError(`Agenda kon niet worden aangemaakt: ${error.message || 'Onbekende fout'}`);
    }
  };

  const handleShareCalendar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shareEmail.trim()) {
      setError('Vul een e-mailadres in');
      return;
    }

    if (!shareCalendarId) {
      setError('Selecteer een agenda om te delen');
      return;
    }

    try {
      await shareCalendarWithUser(shareCalendarId, shareEmail, shareRole);
      setSuccess(`Agenda is succesvol gedeeld met ${shareEmail}!`);
      setShareEmail('');
    } catch (error) {
      setError(`Agenda kon niet worden gedeeld: ${error.message || 'Onbekende fout'}`);
    }
  };

  // Get calendar by ID for display purposes
  const getCalendarById = (id) => {
    return availableCalendars.find(cal => cal.id === id) || { summary: id };
  };

  // Controleer welke agenda's in Google Calendar als 'selected' zijn gemarkeerd
  const isSelectedInGoogle = (calendarId) => {
    const calendar = availableCalendars.find(cal => cal.id === calendarId);
    return calendar?.selected === true;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#555',
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Agenda-instellingen</h2>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
        }}>
          <button 
            onClick={() => setActiveTab('calendars')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'calendars' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'calendars' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'calendars' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Mijn Agenda's
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'create' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'create' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Agenda Aanmaken
          </button>
          <button 
            onClick={() => setActiveTab('share')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'share' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'share' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'share' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Agenda Delen
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'calendars' && (
          <div>
            <div style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#2196F3', marginTop: '3px' }} />
              <div>
                <p style={{ margin: '0 0 8px 0' }}>De app toont automatisch alle agenda's die zichtbaar zijn in Google Calendar.</p>
                <p style={{ margin: '0' }}>Als je een agenda mist, controleer dan of deze zichtbaar is in Google Calendar zelf.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Beschikbare Agenda's</h3>
              <button 
                onClick={fetchAvailableCalendars}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#2196F3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FontAwesomeIcon icon={faSync} spin={isLoading} />
                Vernieuwen
              </button>
            </div>

            {isLoading ? (
              <p>Agenda's worden geladen...</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableCalendars.length === 0 ? (
                  <p>Geen agenda's gevonden. Probeer te vernieuwen of voeg een nieuwe agenda toe.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {availableCalendars.map(calendar => (
                      <li 
                        key={calendar.id}
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: calendar.backgroundColor || '#ccc',
                            flexShrink: 0
                          }}
                        />
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          flex: 1,
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedCalendars.includes(calendar.id)}
                            onChange={() => toggleCalendar(calendar.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {calendar.summary}
                              {calendar.selected && (
                                <span style={{ 
                                  fontSize: '0.7em', 
                                  color: '#fff',
                                  backgroundColor: '#4CAF50',
                                  padding: '2px 6px',
                                  borderRadius: '10px'
                                }}>
                                  Zichtbaar in Google
                                </span>
                              )}
                            </div>
                            {calendar.description && (
                              <div style={{ fontSize: '0.8em', color: '#666' }}>
                                {calendar.description}
                              </div>
                            )}
                            {calendar.primary && (
                              <div style={{ fontSize: '0.8em', color: '#4CAF50' }}>
                                Primaire Agenda
                              </div>
                            )}
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <h4>Geselecteerde Agenda's ({selectedCalendars.length})</h4>
              {selectedCalendars.length === 0 ? (
                <p>Geen agenda's geselecteerd. Selecteer minimaal één agenda om afspraken te zien.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {selectedCalendars.map(calendarId => {
                    const calendar = getCalendarById(calendarId);
                    const isAutoSelected = isSelectedInGoogle(calendarId);
                    
                    return (
                      <li 
                        key={calendarId}
                        style={{
                          padding: '8px 10px',
                          backgroundColor: isAutoSelected ? '#e8f5e9' : '#f5f5f5',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: isAutoSelected ? '1px solid #81c784' : 'none'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {calendar.summary}
                          {isAutoSelected && (
                            <span style={{ fontSize: '0.7em', color: '#4CAF50' }}>
                              (Auto-geselecteerd)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => toggleCalendar(calendarId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f44336',
                            fontSize: '16px'
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div>
            <h3>Nieuwe Agenda Aanmaken</h3>
            
            {error && (
              <div style={{
                padding: '10px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                padding: '10px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {success}
              </div>
            )}
            
            <form onSubmit={handleCreateCalendar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Naam van de agenda:
                </label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Voer agenda naam in"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faCalendarPlus} />
                Agenda Aanmaken
              </button>
            </form>
          </div>
        )}

        {activeTab === 'share' && (
          <div>
            <h3>Agenda Delen</h3>
            
            {error && (
              <div style={{
                padding: '10px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                padding: '10px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {success}
              </div>
            )}
            
            <form onSubmit={handleShareCalendar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Selecteer te delen agenda:
                </label>
                <select
                  value={shareCalendarId}
                  onChange={(e) => setShareCalendarId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                  required
                >
                  <option value="">-- Selecteer een agenda --</option>
                  {availableCalendars.map(calendar => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  E-mailadres:
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Voer e-mailadres in om te delen"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Toegangsniveau:
                </label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                >
                  <option value="freeBusyReader">Alleen beschikbaarheid zien (details verbergen)</option>
                  <option value="reader">Alle afspraakdetails zien</option>
                  <option value="writer">Afspraken kunnen wijzigen</option>
                  <option value="owner">Afspraken wijzigen en delen beheren</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faShareAlt} />
                Agenda Delen
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarConfigModal;