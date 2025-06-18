import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSync, 
  faCalendarPlus, 
  faShareAlt, 
  faInfoCircle, 
  faCheck, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
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
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Reset messages when tab changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Render nothing if modal is closed
  if (!isOpen) return null;

  const displayNotification = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
  };

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
      displayNotification('success', `Agenda "${newCalendarName}" aangemaakt`);
      setNewCalendarName('');
      
      // Refresh the list of available calendars
      fetchAvailableCalendars();
    } catch (error) {
      setError(`Agenda kon niet worden aangemaakt: ${error.message || 'Onbekende fout'}`);
      displayNotification('error', 'Fout bij aanmaken agenda');
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

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setError('Vul een geldig e-mailadres in');
      return;
    }

    try {
      await shareCalendarWithUser(shareCalendarId, shareEmail, shareRole);
      
      // Get the calendar name for the notification
      const calendarName = availableCalendars.find(cal => cal.id === shareCalendarId)?.summary || shareCalendarId;
      
      setSuccess(`Agenda is succesvol gedeeld met ${shareEmail}!`);
      displayNotification('success', `Agenda "${calendarName}" gedeeld met ${shareEmail}`);
      setShareEmail('');
    } catch (error) {
      setError(`Agenda kon niet worden gedeeld: ${error.message || 'Onbekende fout'}`);
      displayNotification('error', 'Fout bij delen van agenda');
    }
  };

  // Get calendar by ID for display purposes
  const getCalendarById = (id) => {
    return availableCalendars.find(cal => cal.id === id) || { summary: id };
  };

  // Check which calendars are marked as 'selected' in Google Calendar
  const isSelectedInGoogle = (calendarId) => {
    const calendar = availableCalendars.find(cal => cal.id === calendarId);
    return calendar?.selected === true;
  };

  const getAccessRoleLabel = (role) => {
    switch(role) {
      case 'freeBusyReader': return 'Alleen beschikbaarheid';
      case 'reader': return 'Leestoegang';
      case 'writer': return 'Kan wijzigen';
      case 'owner': return 'Eigenaar';
      default: return role;
    }
  };

  // Handle selecting all visible calendars from Google
  const selectAllVisibleCalendars = () => {
    const visibleCalendars = availableCalendars
      .filter(cal => cal.selected)
      .map(cal => cal.id);
      
    // Add all visible calendars that are not already selected
    visibleCalendars.forEach(calId => {
      if (!selectedCalendars.includes(calId)) {
        toggleCalendar(calId);
      }
    });
    
    displayNotification('success', 'Alle zichtbare agenda\'s geselecteerd');
  };

  // Handle deselecting all calendars
  const deselectAllCalendars = () => {
    // Remove all calendars except primary
    selectedCalendars.forEach(calId => {
      if (calId !== 'primary') { // Optionally keep primary selected
        toggleCalendar(calId);
      }
    });
    
    displayNotification('info', 'Agenda\'s gedeselecteerd');
  };

  return (
    <div className="calendar-config-modal-overlay" style={{
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
      <div className="calendar-config-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          className="close-button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#555',
            width: 'auto',
            height: 'auto',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Sluiten"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Agenda-instellingen</h2>

        {/* Floating notification */}
        {showNotification && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            borderRadius: '4px',
            backgroundColor: notification.type === 'success' ? '#e8f5e9' : 
                              notification.type === 'error' ? '#ffebee' : '#e3f2fd',
            color: notification.type === 'success' ? '#2e7d32' : 
                   notification.type === 'error' ? '#c62828' : '#1565c0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1,
            maxWidth: '90%',
            animation: 'fadeInOut 5s ease-in-out',
          }}>
            <FontAwesomeIcon icon={
              notification.type === 'success' ? faCheck : 
              notification.type === 'error' ? faExclamationTriangle : faInfoCircle
            } />
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
        }}>
          <button 
            onClick={() => setActiveTab('calendars')}
            className={`tab ${activeTab === 'calendars' ? 'active' : ''}`}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'calendars' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'calendars' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'calendars' ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Mijn Agenda's
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'create' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'create' ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Agenda Aanmaken
          </button>
          <button 
            onClick={() => setActiveTab('share')}
            className={`tab ${activeTab === 'share' ? 'active' : ''}`}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'share' ? '2px solid #2196F3' : 'none',
              color: activeTab === 'share' ? '#2196F3' : '#555',
              fontWeight: activeTab === 'share' ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Agenda Delen
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'calendars' && (
          <div className="calendars-tab">
            <div className="info-box" style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#2196F3', marginTop: '3px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 8px 0' }}>
                  De agenda-component toont standaard alle agenda's die je in Google Calendar zichtbaar hebt gemaakt.
                </p>
                <p style={{ margin: '0' }}>
                  Als je een agenda mist, controleer dan of deze zichtbaar is in je Google Calendar instellingen.
                </p>
              </div>
            </div>
            
            <div className="section-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: 0 }}>Beschikbare Agenda's</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={fetchAvailableCalendars}
                  disabled={isLoading}
                  className="refresh-button"
                  style={{
                    background: 'none',
                    border: '1px solid #2196F3',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: '#2196F3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    height: 'auto',
                    fontSize: '14px',
                  }}
                >
                  <FontAwesomeIcon icon={faSync} spin={isLoading} />
                  Vernieuwen
                </button>
              </div>
            </div>

            <div className="calendar-actions" style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <button 
                onClick={selectAllVisibleCalendars}
                style={{
                  backgroundColor: '#e3f2fd',
                  color: '#2196F3',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s ease',
                  height: 'auto',
                }}
              >
                Selecteer alle zichtbare agenda's
              </button>
              <button 
                onClick={deselectAllCalendars}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#757575',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s ease',
                  height: 'auto',
                }}
              >
                Deselecteer alle agenda's
              </button>
            </div>

            {isLoading ? (
              <div className="loading-indicator" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px 0',
                color: '#757575',
                gap: '10px',
              }}>
                <FontAwesomeIcon icon={faSync} spin />
                <span>Agenda's worden geladen...</span>
              </div>
            ) : (
              <div className="calendars-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableCalendars.length === 0 ? (
                  <div className="empty-state" style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: '#757575',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                  }}>
                    <p>Geen agenda's gevonden.</p>
                    <p>Probeer te vernieuwen of voeg een nieuwe agenda toe.</p>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {availableCalendars.map(calendar => (
                      <li 
                        key={calendar.id}
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: selectedCalendars.includes(calendar.id) ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                        }}
                      >
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          flex: 1,
                          cursor: 'pointer',
                          position: 'relative',
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedCalendars.includes(calendar.id)}
                            onChange={() => toggleCalendar(calendar.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: calendar.backgroundColor || '#ccc',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '6px'
                            }}>
                              <span style={{ fontWeight: calendar.primary ? '600' : '400' }}>
                                {calendar.summary}
                              </span>
                              {calendar.selected && (
                                <span style={{ 
                                  fontSize: '0.7em', 
                                  color: '#fff',
                                  backgroundColor: '#4CAF50',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  Zichtbaar in Google
                                </span>
                              )}
                              {calendar.primary && (
                                <span style={{ 
                                  fontSize: '0.7em', 
                                  color: '#fff',
                                  backgroundColor: '#1976d2',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  Primair
                                </span>
                              )}
                              {calendar.accessRole && calendar.accessRole !== 'owner' && (
                                <span style={{ 
                                  fontSize: '0.7em', 
                                  color: '#fff',
                                  backgroundColor: '#757575',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {getAccessRoleLabel(calendar.accessRole)}
                                </span>
                              )}
                            </div>
                            {calendar.description && (
                              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                {calendar.description}
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

            <div className="selected-calendars-section" style={{ marginTop: '24px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Geselecteerde Agenda's 
                <span style={{ 
                  backgroundColor: '#e3f2fd',
                  color: '#2196F3',
                  fontSize: '14px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 'normal',
                }}>
                  {selectedCalendars.length}
                </span>
              </h4>
              {selectedCalendars.length === 0 ? (
                <div className="empty-selected" style={{
                  padding: '16px',
                  backgroundColor: '#fff9c4',
                  borderRadius: '8px',
                  color: '#ffa000',
                  marginBottom: '16px',
                  border: '1px solid #ffecb3',
                }}>
                  <p style={{ margin: 0 }}>Geen agenda's geselecteerd. Selecteer minimaal één agenda om afspraken te zien.</p>
                </div>
              ) : (
                <ul className="selected-calendars-list" style={{ 
                  listStyle: 'none', 
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedCalendars.map(calendarId => {
                    const calendar = getCalendarById(calendarId);
                    const isAutoSelected = isSelectedInGoogle(calendarId);
                    
                    return (
                      <li 
                        key={calendarId}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: isAutoSelected ? '#e8f5e9' : '#f5f5f5',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: isAutoSelected ? '1px solid #c8e6c9' : '1px solid #eeeeee',
                          gap: '8px',
                        }}
                      >
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontSize: '14px',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: availableCalendars.find(cal => cal.id === calendarId)?.backgroundColor || '#ccc',
                              flexShrink: 0
                            }}
                          />
                          {calendar.summary}
                        </span>
                        <button
                          onClick={() => toggleCalendar(calendarId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#757575',
                            fontSize: '14px',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 'auto',
                            height: 'auto',
                          }}
                          aria-label="Verwijderen"
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
          <div className="create-tab">
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Nieuwe Agenda Aanmaken</h3>
            
            {error && (
              <div className="error-message" style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginTop: '3px' }} />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="success-message" style={{
                padding: '12px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <FontAwesomeIcon icon={faCheck} style={{ marginTop: '3px' }} />
                <span>{success}</span>
              </div>
            )}
            
            <form onSubmit={handleCreateCalendar}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                }}>
                  Naam van de agenda:
                </label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Voer agenda naam in"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease',
                  }}
                  required
                />
                <p style={{ 
                  margin: '8px 0 0', 
                  fontSize: '14px', 
                  color: '#757575' 
                }}>
                  De agenda wordt aangemaakt in je Google-account en direct zichtbaar in de app.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease',
                  height: 'auto',
                }}
              >
                <FontAwesomeIcon icon={faCalendarPlus} />
                Agenda Aanmaken
              </button>
            </form>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="share-tab">
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Agenda Delen</h3>
            
            {error && (
              <div className="error-message" style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginTop: '3px' }} />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="success-message" style={{
                padding: '12px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <FontAwesomeIcon icon={faCheck} style={{ marginTop: '3px' }} />
                <span>{success}</span>
              </div>
            )}
            
            <form onSubmit={handleShareCalendar}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                }}>
                  Selecteer te delen agenda:
                </label>
                <select
                  value={shareCalendarId}
                  onChange={(e) => setShareCalendarId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    transition: 'border-color 0.2s ease',
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
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                }}>
                  E-mailadres:
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Voer e-mailadres in om te delen"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease',
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                }}>
                  Toegangsniveau:
                </label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    transition: 'border-color 0.2s ease',
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
                  padding: '12px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease',
                  height: 'auto',
                }}
              >
                <FontAwesomeIcon icon={faShareAlt} />
                Agenda Delen
              </button>
            </form>
          </div>
        )}
      </div>
      
      {/* Add keyframe animation for notifications */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px) translateX(-50%); }
            10% { opacity: 1; transform: translateY(0) translateX(-50%); }
            90% { opacity: 1; transform: translateY(0) translateX(-50%); }
            100% { opacity: 0; transform: translateY(-20px) translateX(-50%); }
          }
        `
      }} />
    </div>
  );
};

export default CalendarConfigModal;