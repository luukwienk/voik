// UnifiedCalendarView.jsx
import React, { useState, useEffect, useRef } from 'react';
import Kalend, { CalendarView } from 'kalend';
import 'kalend/dist/styles/index.css';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTrash, faSync } from '@fortawesome/free-solid-svg-icons';
import { kalendEventToGoogleEvent } from '../utils/taskEventUtils';

// Genereer een uniek ID voor nieuwe events
const generateEventId = () => `temp-event-${Math.random().toString(36).substr(2, 9)}`;

// Pas getDateRange aan zodat deze view en datum accepteert
const getDateRange = (view, date) => {
  const today = date || new Date();
  let timeMin, timeMax;
  if (view === CalendarView.DAY) {
    timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  } else if (view === CalendarView.THREE_DAYS) {
    timeMin = new Date(today);
    timeMax = new Date(today);
    timeMax.setDate(timeMax.getDate() + 2);
    timeMax.setHours(23, 59, 59);
  } else if (view === CalendarView.WEEK) {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    timeMin = new Date(today);
    timeMin.setDate(diff);
    timeMin.setHours(0, 0, 0, 0);
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 6);
    timeMax.setHours(23, 59, 59, 999);
  } else if (view === CalendarView.MONTH) {
    timeMin = new Date(today.getFullYear(), today.getMonth(), 1);
    timeMax = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  }
  return { timeMin, timeMax };
};

const UnifiedCalendarView = ({ tasks, currentTaskList, moveTask }) => {
  // State voor kalender configuratie
  const [calendarView, setCalendarView] = useState(CalendarView.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  
  // Referentie naar de kalender container voor drag & drop
  const calendarRef = useRef(null);
  
  // Google Calendar functionaliteit van onze custom hook
  const { 
    events: googleEvents, 
    isLoading, 
    error, 
    fetchEvents, 
    addEvent, 
    updateEvent, 
    deleteEvent 
  } = useGoogleCalendar();

  // State voor zichtbaar datumbereik
  const [visibleRange, setVisibleRange] = useState(null);

  // Combineer de Google events
  useEffect(() => {
    setAllEvents([...googleEvents]);
  }, [googleEvents]);

  // Initialiseer visibleRange bij eerste render
  useEffect(() => {
    if (!visibleRange) {
      const { timeMin, timeMax } = getDateRange(CalendarView.WEEK, new Date());
      setVisibleRange({ timeMin, timeMax }); // Zet Date-objecten in de state
    }
  }, [visibleRange]);

  // Minimalistische handlers voor stabiele navigatie
  const handleViewChange = (newView) => {
    setCalendarView(newView);
    const { timeMin, timeMax } = getDateRange(newView, selectedDate);
    setVisibleRange({ timeMin, timeMax });
  };

  const handleDateSelect = (date) => {
    const newDate = typeof date === 'string' ? new Date(date) : date;
    setSelectedDate(newDate);
    const { timeMin, timeMax } = getDateRange(calendarView, newDate);
    setVisibleRange({ timeMin, timeMax });
  };

  // Verwerk het neerzetten van een taak op de kalender
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      // Haal neergezette taakgegevens op
      const data = e.dataTransfer.getData('text/plain');
      if (!data || !calendarRef.current) {
        console.log("Geen data of kalender ref gevonden");
        return;
      }
      
      console.log("Drop data:", data);
      
      let taskData;
      try {
        taskData = JSON.parse(data);
      } catch (error) {
        console.error("Kon drop data niet parsen:", error);
        return;
      }
      
      if (!taskData || !taskData.title) {
        console.log("Ongeldige taakgegevens", taskData);
        return;
      }
      
      // Bereken tijd op basis van droppositie
      const rect = calendarRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const x = e.clientX - rect.left;
      console.log("Drop positie:", { x, y, rect });
      
      const hourHeight = 60; // Hoogte per uur in Kalend
      const startHour = 7; // Kalender begint om 7 uur
      let hour = Math.floor(y / hourHeight) + startHour;
      
      // Beperk uur tot geldig bereik (0-23)
      hour = Math.max(0, Math.min(23, hour));
      
      // Maak nieuwe datum op het berekende uur
      const dropDate = selectedDate || new Date();
      const eventStart = new Date(dropDate);
      eventStart.setHours(hour, 0, 0, 0);
      
      // Event eindigt 1 uur later
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + 1);
      
      console.log("Event aanmaken van:", eventStart, "tot:", eventEnd);
      
      // Maak het nieuwe event aan
      const newEvent = {
        id: generateEventId(),
        startAt: eventStart.toISOString(),
        endAt: eventEnd.toISOString(),
        summary: taskData.title || 'Taak',
        color: taskData.completed ? '#888888' : '#3498db',
        isFromTask: true,
        taskData: taskData
      };
      
      console.log("Nieuw event:", newEvent);
      
      // Toevoegen aan Google Calendar
      const googleEvent = kalendEventToGoogleEvent(newEvent);
      addEvent(googleEvent)
        .then((createdEvent) => {
          console.log("Event succesvol toegevoegd:", createdEvent);
          
          // Update ook meteen de UI voor betere UX
          setAllEvents(prevEvents => [...prevEvents, {
            ...newEvent, 
            id: createdEvent.id || newEvent.id,
            isGoogleEvent: true
          }]);
        })
        .catch(error => {
          console.error("Kon event niet toevoegen aan Google Calendar:", error);
          alert("Kon event niet toevoegen aan de kalender. Probeer het opnieuw.");
        });
    } catch (err) {
      console.error('Fout bij het toevoegen van taak aan kalender:', err);
    }
  };

  // Verwerk drag over states
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Verwerk event klik
  const onEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Verwerk event update (slepen/grootte wijzigen)
  const onEventDragFinish = (prev, event, updatedEvent) => {
    console.log("Event slepen voltooid:", { prev, event, updatedEvent });
    
    try {
      // Controleer welke structuur we hebben gekregen voor updatedEvent
      // Het kan een array zijn of een object met start/eind tijden
      let startAt, endAt;
      
      if (Array.isArray(updatedEvent)) {
        // Onverwachte array - laten we de data uit het 'event' of 'prev' object gebruiken
        console.log("updatedEvent is een array, gebruik event/prev data");
        if (event && event.startAt && event.endAt) {
          startAt = event.startAt;
          endAt = event.endAt;
        } else if (prev && prev.startAt && prev.endAt) {
          startAt = prev.startAt;
          endAt = prev.endAt;
        } else {
          console.error("Kan geen geldige start/eind tijden vinden");
          return;
        }
      } else {
        // Normale case - updatedEvent bevat startAt/endAt
        startAt = updatedEvent.startAt;
        endAt = updatedEvent.endAt;
      }
      
      // Controleer of we geldige datumtijden hebben
      if (!startAt || !endAt) {
        console.error("Ongeldige start of eind tijd:", { startAt, endAt });
        return;
      }
      
      console.log("Gebruikte tijden voor update:", { startAt, endAt });
      
      // Controleer of ze het juiste formaat hebben
      if (typeof startAt === 'string' && !startAt.includes('T')) {
        // Converteer naar datetime-formaat als het een datum is
        startAt = new Date(startAt + 'T00:00:00').toISOString();
      }
      
      if (typeof endAt === 'string' && !endAt.includes('T')) {
        // Converteer naar datetime-formaat als het een datum is
        endAt = new Date(endAt + 'T23:59:59').toISOString();
      }
      
      // Maak een correct gestructureerd event voor update
      const eventToUpdate = {
        ...event,
        startAt: startAt,
        endAt: endAt,
        id: event.id
      };

      console.log("Bijgewerkt event dat naar Google Calendar wordt gestuurd:", eventToUpdate);

      // Als het een Google event is, update het in Google Calendar
      if (event.isGoogleEvent) {
        updateEvent(eventToUpdate).catch(error => {
          console.error("Kon event niet updaten:", error);
          // Herstel de wijziging in UI als de update mislukt
          setAllEvents(prevEvents => 
            prevEvents.map(e => e.id === event.id ? event : e)
          );
        });
      } else {
        // Voor lokale events, update alleen de lokale state
        setAllEvents(prevEvents => 
          prevEvents.map(e => e.id === event.id ? eventToUpdate : e)
        );
      }
    } catch (error) {
      console.error("Fout in onEventDragFinish:", error);
    }
  };

  // Maak een nieuw event door op de kalender te klikken
  const onNewEventClick = (data) => {
    const { startAt, endAt } = data;
    const eventTitle = prompt('Voer evenementnaam in:');
    
    if (eventTitle && eventTitle.trim()) {
      const newEvent = {
        id: generateEventId(),
        startAt,
        endAt,
        summary: eventTitle.trim(),
        color: '#3498db'
      };
      
      addEvent(newEvent).catch(error => {
        console.error("Kon event niet toevoegen:", error);
      });
    }
  };

  // Verwijder het geselecteerde event
  const handleDeleteEvent = () => {
    if (selectedEvent && selectedEvent.isGoogleEvent) {
      deleteEvent(selectedEvent.id)
        .then(() => {
          setSelectedEvent(null);
        })
        .catch(error => {
          console.error("Kon event niet verwijderen:", error);
        });
    } else {
      // Voor niet-Google events, verwijder alleen uit lokale state
      setAllEvents(events => events.filter(e => e.id !== selectedEvent.id));
      setSelectedEvent(null);
    }
  };

  // Update het geselecteerde event (vanuit modal)
  const handleUpdateEvent = () => {
    if (selectedEvent) {
      if (selectedEvent.isGoogleEvent) {
        updateEvent(selectedEvent)
          .then(() => {
            setSelectedEvent(null);
          })
          .catch(error => {
            console.error("Kon event niet updaten:", error);
          });
      } else {
        // Update lokale events
        setAllEvents(events => 
          events.map(e => e.id === selectedEvent.id ? selectedEvent : e)
        );
        setSelectedEvent(null);
      }
    }
  };

  // Handler om events te verversen bij navigatie
  const handlePageChange = (dateRange) => {
    if (dateRange && dateRange.start && dateRange.end) {
      const timeMin = new Date(dateRange.start);
      const timeMax = new Date(dateRange.end);
      setVisibleRange({ timeMin, timeMax }); // Zet Date-objecten in de state
      console.log('Ververs events voor bereik:', { timeMin, timeMax });
      fetchEvents(timeMin.toISOString(), timeMax.toISOString());
    }
  };

  // Haal alle events van het huidige jaar op
  const fetchFullYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const timeMin = new Date(year, 0, 1).toISOString();
    const timeMax = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
    console.log('Fetch events voor heel jaar:', { timeMin, timeMax });
    fetchEvents(timeMin, timeMax);
  };

  // Bij eerste render: haal alles op voor het jaar
  useEffect(() => {
    fetchFullYear();
  }, []);

  // Vernieuw events voor het hele jaar
  const handleRefreshEvents = () => {
    fetchFullYear();
  };

  console.log('Events naar Kalend:', allEvents);

  if (allEvents.length > 0) {
    console.log('Voorbeeld event:', allEvents[0]);
  }

  return (
    <div 
      className="calendar-container" 
      ref={calendarRef}
      style={{
        height: 'calc(100vh - 280px)',
        padding: '10px',
        backgroundColor: isDragOver ? '#e3f2fd' : 'white',
        border: isDragOver ? '2px dashed #2196F3' : 'none',
        transition: 'background 0.2s, border 0.2s',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading" style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 10,
          padding: '8px 16px',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderRadius: '4px',
          color: '#0d47a1',
          border: '1px solid rgba(13, 71, 161, 0.2)'
        }}>
          Kalender laden...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error" style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 10,
          padding: '8px 16px',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderRadius: '4px',
          color: '#d32f2f',
          border: '1px solid rgba(211, 47, 47, 0.2)'
        }}>
          {error}
        </div>
      )}
      
      {/* Drag indicator overlay */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: 'rgba(33,150,243,0.05)',
          border: '2px dashed #2196F3',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Zet taak neer om te plannen
          </div>
        </div>
      )}
      
      {/* Functionele, veilige Kalend component: alleen event handlers en fetch bij navigatie */}
      <Kalend
        events={allEvents}
        onEventClick={onEventClick}
        onEventDragFinish={onEventDragFinish}
        onNewEventClick={onNewEventClick}
        onPageChange={handlePageChange} // Alleen fetchEvents, geen state updates
        style={{
          primaryColor: '#2196F3',
          baseColor: '#f5f5f5',
          inverseBaseColor: '#333',
        }}
        customHeaders={false}
      />
      
      {/* Event details modal */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          padding: '24px',
          zIndex: 1001,
          minWidth: '320px'
        }}>
          <h3>Eventdetails</h3>
          <input
            value={selectedEvent.summary}
            onChange={e => setSelectedEvent({ ...selectedEvent, summary: e.target.value })}
            style={{ width: '100%', marginBottom: '16px', padding: '8px', fontSize: '16px' }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleUpdateEvent}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#000', 
                fontSize: '20px', 
                padding: '6px', 
                borderRadius: '4px' 
              }}
              title="Opslaan"
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button onClick={handleDeleteEvent}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#000', 
                fontSize: '20px', 
                padding: '6px', 
                borderRadius: '4px' 
              }}
              title="Verwijderen"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <button onClick={() => setSelectedEvent(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#888', 
                fontSize: '16px', 
                padding: '6px', 
                borderRadius: '4px' 
              }}
              title="Annuleren"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
      
      {/* Refresh knop in rechterbenedenhoek */}
      <button
        onClick={handleRefreshEvents}
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          padding: '8px 16px',
          backgroundColor: '#4285F4',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 5
        }}
        title="Google Calendar events vernieuwen"
      >
        <FontAwesomeIcon icon={faSync} style={{ marginRight: '8px' }} />
        Vernieuwen
      </button>
    </div>
  );
};

export default UnifiedCalendarView;