import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendarDrag.css'; // Import onze custom CSS
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTrash, faSync, faCog, faCheck, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import CalendarConfigModal from './CalendarConfigModal';
import '../styles/calendarResponsive.css';
import '../styles/centeredLayout.css';

// Initialize the localizer with moment
const localizer = momentLocalizer(moment);

// Create a DnD-enabled Calendar component
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Generate a unique ID for new events
const generateEventId = () => `temp-event-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get date range for fetching events
const getDateRange = (view, date) => {
  const today = date || new Date();
  let start, end;
  
  if (view === 'day') {
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  } else if (view === 'week') {
    // Start of the week (Sunday)
    start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);
    
    // End of the week (Saturday)
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (view === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  }
  
  return { start, end };
};

const BigCalendarView = ({ tasks, currentTaskList, moveTask }) => {
  // State for calendar configuration
  const [view, setView] = useState('day');
  const [date, setDate] = useState(new Date());
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  // Default calendar for new events
  const [defaultCalendarId, setDefaultCalendarId] = useState(() => {
    try {
      return localStorage.getItem('voik_default_calendar') || '';
    } catch {
      return '';
    }
  });
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState('');
  
  // Show success notification after adding task to calendar
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Visible date range state
  const [visibleRange, setVisibleRange] = useState(() => {
    const { start, end } = getDateRange('week', new Date());
    return { start, end };
  });
  
  // Reference to the calendar container for drag & drop
  const calendarRef = useRef(null);
  
  // Google Calendar functionality from custom hook
  const { 
    events: googleEvents, 
    isLoading, 
    error, 
    fetchEvents, 
    addEvent, 
    updateEvent, 
    deleteEvent,
    availableCalendars,
    selectedCalendars,
    fetchAvailableCalendars,
    toggleCalendar,
    isInitialized
  } = useGoogleCalendar();
  
  // Auto-hide success notification after delay
  useEffect(() => {
    if (showSuccessNotification) {
      const timer = setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  // Show dismissible error toast when hook error changes
  useEffect(() => {
    if (error) {
      setErrorToastMessage(String(error));
      setShowErrorToast(true);
      const t = setTimeout(() => setShowErrorToast(false), 6000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [error]);
  
  // Combine Google events
  useEffect(() => {
    // console.log('Google events received:', googleEvents);
    setAllEvents([...googleEvents]);
  }, [googleEvents]);

  // Persist default calendar selection
  useEffect(() => {
    try {
      if (defaultCalendarId) {
        localStorage.setItem('voik_default_calendar', defaultCalendarId);
      } else {
        localStorage.removeItem('voik_default_calendar');
      }
    } catch {}
  }, [defaultCalendarId]);

  // Helper: choose a writable calendar id
  const pickWritableCalendarId = useCallback(() => {
    const sel = Array.isArray(selectedCalendars) ? selectedCalendars : [];
    const writableRoles = new Set(['owner', 'writer']);
    const acals = availableCalendars || [];
    // Prefer explicitly set default calendar if writable
    if (defaultCalendarId) {
      const defCal = acals.find(c => c.id === defaultCalendarId);
      if (defCal && writableRoles.has(defCal.accessRole)) return defaultCalendarId;
    }
    // Prefer selected calendars with write access
    for (const id of sel) {
      const cal = acals.find(c => c.id === id);
      if (cal && writableRoles.has(cal.accessRole)) return id;
    }
    // Fallback to primary if available
    const primary = acals.find(c => c.primary && writableRoles.has(c.accessRole));
    if (primary) return primary.id;
    // Fallback to first selected
    if (sel.length > 0) return sel[0];
    // Last resort
    return 'primary';
  }, [availableCalendars, selectedCalendars, defaultCalendarId]);

  // Ensure available calendars are fetched once initialized
  useEffect(() => {
    if (isInitialized && !isLoading && availableCalendars.length === 0) {
      fetchAvailableCalendars().catch(() => {});
    }
  }, [isInitialized, isLoading, availableCalendars.length, fetchAvailableCalendars]);

  // Fetch initial events on component mount
  useEffect(() => {
    // Fetch events for the initial view
    const { start, end } = getDateRange(view, date);
    fetchEvents(start.toISOString(), end.toISOString());
  }, [fetchEvents, view, date]);
  
  // Handle view change
  const handleViewChange = useCallback((newView) => {
    setView(newView);
    const { start, end } = getDateRange(newView, date);
    setVisibleRange({ start, end });
    // Fetch events for the new date range
    fetchEvents(start.toISOString(), end.toISOString());
  }, [date, fetchEvents]);
  
  // Handle date change
  const handleDateChange = useCallback((newDate) => {
    setDate(newDate);
    const { start, end } = getDateRange(view, newDate);
    setVisibleRange({ start, end });
    // Fetch events for the new date range
    fetchEvents(start.toISOString(), end.toISOString());
  }, [view, fetchEvents]);

  // Handle dropping a task on the calendar via React Big Calendar external DnD
  const handleDropFromOutside = useCallback(({ start, end, allDay }) => {
    try {
      const taskData = typeof window !== 'undefined' ? window.__voikDragTask : null;
      if (!taskData || !taskData.title) return;

      const eventStart = start instanceof Date ? start : new Date(start);
      let eventEnd = end instanceof Date ? end : new Date(end);
      if (!eventEnd || eventEnd <= eventStart) {
        eventEnd = new Date(eventStart);
        eventEnd.setHours(eventStart.getHours() + 1);
      }

      const newEvent = {
        title: taskData.title,
        start: eventStart,
        end: eventEnd,
        allDay: Boolean(allDay),
        resource: {
          color: taskData.completed ? '#888888' : '#3498db',
          isTask: true,
          taskData
        }
      };

      const timeFormat = new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric', minute: 'numeric', weekday: 'short', month: 'short', day: 'numeric'
      });

      addEvent(newEvent, pickWritableCalendarId())
        .then(() => {
          setSuccessMessage(`Task "${taskData.title}" scheduled for ${timeFormat.format(eventStart)}`);
          setShowSuccessNotification(true);
        })
        .catch((error) => {
          console.error('Could not add event to Google Calendar:', error);
          alert('Could not add event to calendar. Please try again.');
        })
        .finally(() => {
          setIsDragOver(false);
          try { delete window.__voikDragTask; } catch {}
        });
    } catch (err) {
      console.error('Error in handleDropFromOutside:', err);
    }
  }, [addEvent, selectedCalendars]);
  
  // Handle drag over states
  const handleRBCDragOver = useCallback((date, e) => {
    try {
      if (e && e.preventDefault) e.preventDefault();
      setIsDragOver(true);
    } catch (err) {
      console.error('Error in RBC drag over handler:', err);
    }
  }, []);
  
  const handleDragLeave = () => {
    setIsDragOver(false);
    
    // Remove highlighting from all hour cells
    if (calendarRef.current) {
      const hourElements = calendarRef.current.querySelectorAll('.rbc-time-slot');
      hourElements.forEach(el => {
        el.classList.remove('calendar-drop-target');
      });
    }
  };
  
  // Handle event click: open Google Calendar event in new tab if possible
  const handleEventClick = (event) => {
    try {
      const candidates = [
        event?.resource?.originalEvent?.htmlLink,
        event?.originalEvent?.resource?.originalEvent?.htmlLink,
        event?.originalEvent?.htmlLink,
        event?.url
      ].filter(Boolean);
      const link = candidates[0];
      if (link && typeof window !== 'undefined') {
        window.open(link, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch (err) {
      console.error('Error opening Google Calendar link:', err);
    }
    // Fallback: use internal modal
    setSelectedEvent(event);
  };
  
  // Handle event resize and drag
  const handleEventResize = ({ event, start, end }) => {
    // console.log("Event resize completed:", { event, start, end });
    
    try {
      // Create updated event
      const updatedEvent = {
        ...event,
        start: start,
        end: end,
        allDay: event.allDay
      };
  
      // console.log("Updated event to send to Google Calendar:", updatedEvent);
  
      // Update the event
      updateEvent(updatedEvent).catch(error => {
        console.error("Could not update event:", error);
        // Revert the change in UI if update fails
        alert("Failed to update event. Please try again.");
      });
    } catch (error) {
      console.error("Error in handleEventResize:", error);
    }
  };
  
  const handleEventDrop = ({ event, start, end, allDay }) => {
    // console.log("Event drag completed:", { event, start, end, allDay });
    
    try {
      // Create updated event
      const updatedEvent = {
        ...event,
        start: start,
        end: end,
        allDay: allDay !== undefined ? allDay : event.allDay
      };
  
      // console.log("Updated event to send to Google Calendar:", updatedEvent);
  
      // Update the event
      updateEvent(updatedEvent).catch(error => {
        console.error("Could not update event:", error);
        // Revert the change in UI if update fails
        alert("Failed to update event. Please try again.");
      });
    } catch (error) {
      console.error("Error in handleEventDrop:", error);
    }
  };
  
  // Create a new event by clicking on the calendar
  const handleSelectSlot = ({ start, end }) => {
    // console.log('Slot selected:', { start, end });
    const eventTitle = prompt('Enter event name:');
    
    if (eventTitle && eventTitle.trim()) {
      // Create event in RBC format
      const newEvent = {
        title: eventTitle.trim(),
        start: start,
        end: end,
        allDay: !start.getHours() && !end.getHours()
      };
      
      // console.log('Creating new event:', newEvent);
      
      // Add to Google Calendar
      addEvent(newEvent, pickWritableCalendarId())
        .then(createdEvent => {
          // console.log('Event successfully created:', createdEvent);
          // Event will be added to the view via the useEffect hook that listens to googleEvents
        })
        .catch(error => {
          console.error("Could not add event:", error);
          alert("Could not add event. Please try again.");
        });
    }
  };
  
  // Delete selected event
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // console.log('Attempting to delete event:', selectedEvent);
    
    // Check if we have an ID to delete
    const eventId = selectedEvent.id;
    if (!eventId) {
      console.error('Cannot delete event without ID');
      setSelectedEvent(null);
      return;
    }
    
    // Get calendarId from the event if available
    const calendarId = selectedEvent.resource?.calendarId || 
                       selectedEvent.originalEvent?.calendarId || 
                       'primary';
    
    // console.log(`Deleting event ${eventId} from calendar ${calendarId}`);
    
    deleteEvent(eventId, calendarId)
      .then(() => {
        // console.log('Event successfully deleted');
        // Remove from local state (this is now handled in the hook)
        setSelectedEvent(null);
      })
      .catch(error => {
        console.error("Could not delete event:", error);
        alert("Could not delete event. Please try again.");
      });
  };
  
  // Update selected event
  const handleUpdateEvent = () => {
    if (selectedEvent) {
      updateEvent(selectedEvent)
        .then(() => {
          setSelectedEvent(null);
        })
        .catch(error => {
          console.error("Could not update event:", error);
          alert("Failed to update event. Please try again.");
        });
    }
  };
  
  // Refresh events for the visible date range
  const handleRefreshEvents = () => {
    const { start, end } = getDateRange(view, date);
    fetchEvents(start.toISOString(), end.toISOString());
  };
  
  // Convert events to format expected by React Big Calendar
  const mapEventsForBigCalendar = useCallback((events) => {
    return events.map(event => ({
      id: event.id,
      title: event.summary || event.title,
      start: new Date(event.startAt || event.start),
      end: new Date(event.endAt || event.end),
      allDay: event.allDay,
      resource: event.resource, // preserve resource (includes Google originalEvent)
      // Keep original data for our custom handlers
      originalEvent: event
    }));
  }, []);
  
  // Compute events array for React Big Calendar
  // Choose preferred calendar id for dedupe selection
  const preferredCalendarId = useMemo(() => {
    if (defaultCalendarId) return defaultCalendarId;
    const primary = (availableCalendars || []).find(c => c.primary);
    if (primary) return primary.id;
    if (Array.isArray(selectedCalendars) && selectedCalendars.length > 0) return selectedCalendars[0];
    return 'primary';
  }, [defaultCalendarId, availableCalendars, selectedCalendars]);

  const calendarEvents = useMemo(() => {
    const mapped = mapEventsForBigCalendar(allEvents);

    // Group by iCalUID (stable id across calendars) or fallback to title+time
    const groups = new Map();
    for (const e of mapped) {
      // Hide non-synced local task placeholders if any slip in
      if (e?.resource?.isTask && e?.resource?.isGoogleEvent !== true) continue;
      const iCalUID = e?.resource?.originalEvent?.iCalUID || null;
      const timeKey = `${+new Date(e.start)}|${+new Date(e.end)}|${e.title || ''}`;
      const key = iCalUID || timeKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }

    // From each group, pick a single representative with preference to preferredCalendarId
    const result = [];
    for (const [, arr] of groups) {
      const exact = arr.find(ev => ev?.resource?.calendarId === preferredCalendarId);
      const selected = exact || arr.find(ev => (selectedCalendars || []).includes(ev?.resource?.calendarId));
      result.push(selected || arr[0]);
    }
    return result;
  }, [allEvents, mapEventsForBigCalendar, preferredCalendarId, selectedCalendars]);
  
  // console.log('Events for React Big Calendar:', calendarEvents);
  
  // Scroll to current time on initial render
  const scrollToNow = useMemo(() => {
    const now = new Date();
    return new Date(1970, 0, 1, now.getHours(), now.getMinutes(), 0, 0);
  }, []);
  
  // Custom event component for React Big Calendar
  const EventComponent = ({ event }) => {
    const isCompleted = event.resource?.isTask && event.resource?.taskData?.completed;
    const color = event.resource?.color || event.originalEvent?.color || '#3498db';

    const startTime = moment(event.start).format('HH:mm');
    const endTime = moment(event.end).format('HH:mm');
    const timeString = `${startTime} - ${endTime}`;

    const durationMins = Math.max(1, Math.round((new Date(event.end) - new Date(event.start)) / 60000));

    // Prefer description; fall back to title for primary text
    const rawDescription = event.originalEvent?.description 
      || event.resource?.description 
      || event.resource?.taskData?.text 
      || '';

    const getPlainText = (html) => {
      if (!html) return '';
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return (temp.textContent || temp.innerText || '').trim();
    };
    const plainDescription = getPlainText(rawDescription);

    const primaryText = plainDescription || event.title || '';
    const secondaryText = plainDescription ? (event.title || '') : '';

    // Compact for short events; superCompact hides time to prioritize description
    const compact = durationMins <= 45;
    const superCompact = durationMins <= 30;

    // Determine source label (calendar summary)
    const calId = event.resource?.calendarId;
    const calSummary = (availableCalendars || []).find(c => c.id === calId)?.summary;

    return (
      <div
        title={primaryText}
        style={{
          backgroundColor: isCompleted ? '#888888' : color,
          color: 'white',
          borderRadius: 4,
          padding: compact ? '2px 4px' : '4px 6px',
          opacity: isCompleted ? 0.7 : 1,
          cursor: 'grab',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 2 : 3,
          height: '100%',
          position: 'relative'
        }}
      >
        {calSummary && (
          <div style={{
            position: 'absolute',
            top: 2,
            right: 4,
            background: 'rgba(255,255,255,0.85)',
            color: '#1b1b1b',
            borderRadius: 3,
            padding: '0 4px',
            fontSize: 10,
            lineHeight: '14px',
            maxWidth: '70%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={calSummary}>
            {calSummary}
          </div>
        )}
        {/* Always show description (or title fallback) at the top */}
        <div style={{
          fontWeight: 500,
          fontSize: compact ? 12 : 13,
          lineHeight: 1.15,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 1 : 2,
          WebkitBoxOrient: 'vertical',
          whiteSpace: 'normal'
        }}>
          {primaryText}
        </div>
        {/* Time directly under the description (hide for very short events) */}
        {!superCompact && (
          <div style={{
            fontSize: compact ? 11 : 12,
            opacity: 0.95,
            lineHeight: 1.1
          }}>
            {timeString}
          </div>
        )}
        {/* Optional: show title below when description exists */}
        {secondaryText && (
          <div style={{
            fontSize: compact ? 11 : 12,
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.95
          }}>
            {secondaryText}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div 
      className="calendar-container" 
      ref={calendarRef}
      style={{
        height: '100%',
        padding: '10px',
        backgroundColor: isDragOver ? '#e3f2fd' : 'white',
        border: isDragOver ? '2px dashed #2196F3' : 'none',
        transition: 'background 0.2s, border 0.2s',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      // DOM-level drag leave to clear overlay when leaving calendar container
      onDragOver={(e) => { if (e.preventDefault) e.preventDefault(); }}
      onDragLeave={handleDragLeave}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading" style={{ 
          position: 'absolute', 
          bottom: '12px', 
          left: '12px', 
          zIndex: 10,
          padding: '8px 16px',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderRadius: '4px',
          color: '#0d47a1',
          border: '1px solid rgba(13, 71, 161, 0.2)',
          pointerEvents: 'none'
        }}>
          Loading calendar...
        </div>
      )}
      
      {/* Error message */}
      {showErrorToast && (
        <div className="error" style={{ 
          position: 'absolute', 
          bottom: '12px', 
          left: '12px', 
          zIndex: 10,
          padding: '8px 16px',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderRadius: '6px',
          color: '#b71c1c',
          border: '1px solid rgba(211, 47, 47, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <span style={{ maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {errorToastMessage}
          </span>
          <button
            onClick={() => setShowErrorToast(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b71c1c',
              cursor: 'pointer',
              padding: '4px 6px',
              fontSize: 14
            }}
            aria-label="Melding sluiten"
            title="Sluiten"
          >
            ×
          </button>
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
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2196F3'
          }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '18px' }} />
            Drop task to schedule at this time
          </div>
        </div>
      )}
      
      {/* React Big Calendar with Drag and Drop */}
      <DragAndDropCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        defaultView={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleDateChange}
        onSelectEvent={handleEventClick}
        onSelectSlot={handleSelectSlot}
        selectable={true}
        resizable={true}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        draggableAccessor={() => true}
        resizableAccessor={() => true}
        components={{
          event: EventComponent
        }}
        tooltipAccessor={(evt) => (evt.originalEvent?.description || evt.resource?.taskData?.text || evt.title || '')}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.resource?.color || event.originalEvent?.color || '#3498db',
            cursor: 'move'
          }
        })}
        popup
        longPressThreshold={10}
        step={15}
        timeslots={4}
        min={new Date(new Date().setHours(0, 0, 0, 0))}
        max={new Date(new Date().setHours(23, 59, 59, 999))}
        scrollToTime={scrollToNow}
        dragFromOutsideItem={() => (typeof window !== 'undefined' && window.__voikDragTask) ? { title: window.__voikDragTask.title } : null}
        onDropFromOutside={handleDropFromOutside}
        onDragOver={handleRBCDragOver}
      />
      
      {/* Success notification */}
      {showSuccessNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '250px',
          maxWidth: '80%',
          textAlign: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: '18px' }} />
          {successMessage}
        </div>
      )}
      
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
          <h3>Event Details</h3>
          <input
            value={selectedEvent.title}
            onChange={e => setSelectedEvent({
              ...selectedEvent,
              title: e.target.value,
              originalEvent: {
                ...selectedEvent.originalEvent,
                summary: e.target.value
              }
            })}
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
              title="Save"
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
              title="Delete"
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
              title="Cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Calendar settings and refresh buttons */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
        zIndex: 5
      }}>
        <button
          onClick={() => setIsConfigModalOpen(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Calendar settings"
        >
          <FontAwesomeIcon icon={faCog} style={{ marginRight: '8px' }} />
          Settings
        </button>
        
        <button
          onClick={handleRefreshEvents}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Refresh Google Calendar events"
        >
          <FontAwesomeIcon icon={faSync} style={{ marginRight: '8px' }} />
          Refresh
        </button>
      </div>
      
      {/* Calendar Configuration Modal */}
      <CalendarConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        availableCalendars={availableCalendars}
        selectedCalendars={selectedCalendars}
        toggleCalendar={toggleCalendar}
        fetchAvailableCalendars={fetchAvailableCalendars}
        isLoading={isLoading}
        defaultCalendarId={defaultCalendarId}
        setDefaultCalendarId={setDefaultCalendarId}
      />
    </div>
  );
};

export default BigCalendarView;  
