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
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
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
    toggleCalendar
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
  
  // Combine Google events
  useEffect(() => {
    console.log('Google events received:', googleEvents);
    setAllEvents([...googleEvents]);
  }, [googleEvents]);
  
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
  
  // Handle dropping a task on the calendar
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      // Get dropped task data
      const data = e.dataTransfer.getData('text/plain');
      if (!data || !calendarRef.current) {
        console.log("No data or calendar ref found");
        return;
      }
      
      console.log("Drop data:", data);
      
      let taskData;
      try {
        taskData = JSON.parse(data);
      } catch (error) {
        console.error("Could not parse drop data:", error);
        return;
      }
      
      if (!taskData || !taskData.title) {
        console.log("Invalid task data", taskData);
        return;
      }
      
      // Calculate time based on drop position and current calendar view
      const rect = calendarRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Get information from the current calendar view
      const viewHeight = rect.height;
      const viewWidth = rect.width;
      const dayCount = view === 'day' ? 1 : view === 'week' ? 7 : 31; // Approximate for month
      
      // Calculate which day was targeted (horizontal position)
      const dayWidth = viewWidth / dayCount;
      const dayIndex = Math.floor(mouseX / dayWidth);
      
      // Calculate the target date
      let targetDate = new Date(date);
      if (view === 'week') {
        // In week view, adjust for the day of the week (0 = Sunday)
        const currentDay = targetDate.getDay();
        targetDate.setDate(targetDate.getDate() - currentDay + dayIndex);
      } else if (view === 'month') {
        // In month view, this is more complex, but we can approximate
        // Get the first day of the month
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const startOffset = firstDay.getDay(); // Days from Sunday
        targetDate.setDate(1 + dayIndex - startOffset);
      }
      
      // Calculate the hour (vertical position)
      const workdayStart = 7; // Start at 7 AM
      const workdayHours = 12; // 12 hour display
      const hourHeight = viewHeight / workdayHours;
      const hourOfDay = Math.floor(mouseY / hourHeight) + workdayStart;
      
      // Create a new date with the calculated time
      const eventStart = new Date(targetDate);
      eventStart.setHours(hourOfDay, 0, 0, 0);
      
      // Event ends 1 hour later by default
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + 1);
      
      console.log("Creating event at:", eventStart.toLocaleString(), "to", eventEnd.toLocaleString());
      
      // Format the time for display
      const timeFormat = new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      // Create the new event using task data
      const newEvent = {
        title: taskData.title,
        start: eventStart,
        end: eventEnd,
        allDay: false,
        resource: {
          color: taskData.completed ? '#888888' : '#3498db',
          isTask: true,
          taskData: taskData,
          description: taskData.description || ''
        }
      };
      
      console.log("New event:", newEvent);
      
      // Add to Google Calendar
      addEvent(newEvent)
        .then((createdEvent) => {
          console.log("Event successfully added:", createdEvent);
          
          // Show success notification
          setSuccessMessage(`Task "${taskData.title}" scheduled for ${timeFormat.format(eventStart)}`);
          setShowSuccessNotification(true);
        })
        .catch(error => {
          console.error("Could not add event to Google Calendar:", error);
          alert("Could not add event to calendar. Please try again.");
        });
    } catch (err) {
      console.error('Error adding task to calendar:', err);
    }
  };
  
  // Handle drag over states
  const handleDragOver = (e) => {
    e.preventDefault();
    
    // Check if this is a task being dragged (from data transfer type)
    try {
      const types = Array.from(e.dataTransfer.types || []);
      if (types.includes('text/plain')) {
        setIsDragOver(true);
        
        // Add styling to show where the event will be placed
        const rect = calendarRef.current.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        
        // Calculate the hour element that's being hovered
        const hourHeight = rect.height / 12; // Approximate for 12 visible hours
        const hourIndex = Math.floor(mouseY / hourHeight);
        
        // Find and highlight the hour cell (this would need to be adjusted based on your DOM structure)
        const hourElements = calendarRef.current.querySelectorAll('.rbc-time-slot');
        hourElements.forEach((el, index) => {
          if (index === hourIndex) {
            el.classList.add('calendar-drop-target');
          } else {
            el.classList.remove('calendar-drop-target');
          }
        });
      }
    } catch (err) {
      console.error('Error in drag over handler:', err);
    }
  };
  
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
  
  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };
  
  // Handle event resize and drag
  const handleEventResize = ({ event, start, end }) => {
    console.log("Event resize completed:", { event, start, end });
    
    try {
      // Create updated event
      const updatedEvent = {
        ...event,
        start: start,
        end: end,
        allDay: event.allDay
      };
  
      console.log("Updated event to send to Google Calendar:", updatedEvent);
  
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
    console.log("Event drag completed:", { event, start, end, allDay });
    
    try {
      // Create updated event
      const updatedEvent = {
        ...event,
        start: start,
        end: end,
        allDay: allDay !== undefined ? allDay : event.allDay
      };
  
      console.log("Updated event to send to Google Calendar:", updatedEvent);
  
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
    console.log('Slot selected:', { start, end });
    const eventTitle = prompt('Enter event name:');
    
    if (eventTitle && eventTitle.trim()) {
      // Create event in RBC format
      const newEvent = {
        title: eventTitle.trim(),
        start: start,
        end: end,
        allDay: !start.getHours() && !end.getHours()
      };
      
      console.log('Creating new event:', newEvent);
      
      // Add to Google Calendar
      addEvent(newEvent)
        .then(createdEvent => {
          console.log('Event successfully created:', createdEvent);
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
    
    console.log('Attempting to delete event:', selectedEvent);
    
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
    
    console.log(`Deleting event ${eventId} from calendar ${calendarId}`);
    
    deleteEvent(eventId, calendarId)
      .then(() => {
        console.log('Event successfully deleted');
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
      // Keep original data for our custom handlers
      originalEvent: event
    }));
  }, []);
  
  // Compute events array for React Big Calendar
  const calendarEvents = useMemo(() => {
    return mapEventsForBigCalendar(allEvents);
  }, [allEvents, mapEventsForBigCalendar]);
  
  console.log('Events for React Big Calendar:', calendarEvents);
  
  // Custom event component for React Big Calendar
  const EventComponent = ({ event }) => {
    console.log('Rendering event in EventComponent:', event);
    const isCompleted = event.resource?.isTask && event.resource?.taskData?.completed;
    const color = event.resource?.color || event.originalEvent?.color || '#3498db';
    
    // Format the time
    const startTime = moment(event.start).format('HH:mm');
    const endTime = moment(event.end).format('HH:mm');
    const timeString = `${startTime} - ${endTime}`;
    
    return (
      <div style={{ 
        backgroundColor: isCompleted ? '#888888' : color,
        color: 'white',
        borderRadius: '4px',
        padding: '4px 6px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        opacity: isCompleted ? 0.7 : 1,
        cursor: 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minHeight: '40px',
        height: '100%',
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          fontWeight: 'bold',
          fontSize: '14px',
          lineHeight: '1.2'
        }}>
          {event.title}
        </div>
        <div style={{ 
          fontSize: '12px',
          opacity: 0.9,
          lineHeight: '1.2'
        }}>
          {timeString}
        </div>
      </div>
    );
  };
  
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
          Loading calendar...
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
        min={new Date(new Date().setHours(5, 0, 0))}  // 05:00
        max={new Date(new Date().setHours(18, 0, 0))} // 18:00
        dragFromOutsideItem={isDragOver ? () => true : null}
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
      />
    </div>
  );
};

export default BigCalendarView;