import React, { useState, useEffect } from 'react';
import Kalend, { CalendarView } from 'kalend';
import 'kalend/dist/styles/index.css';
import { handleGoogleCalendarAuth, isGoogleClientReady } from '../services/googleCalendar';

// Function to generate a unique ID
const generateEventId = () => `event-${Math.random().toString(36).substr(2, 9)}`;

const KalendPOC = ({ tasks, currentTaskList, moveTask }) => {
  const [events, setEvents] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const [calendarView, setCalendarView] = useState(CalendarView.WEEK);
  
  // Convert tasks to calendar events
  useEffect(() => {
    if (tasks && tasks[currentTaskList] && tasks[currentTaskList].items) {
      const kalendEvents = tasks[currentTaskList].items.map(task => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Extract the task text properly
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = task.text;
        const cleanText = tempDiv.textContent || tempDiv.innerText || 'Task';
        
        // Take just the first line or first 30 characters
        const shortTitle = cleanText.split('\n')[0].substring(0, 30);
        
        return {
          id: task.id,
          startAt: today.toISOString(),
          endAt: tomorrow.toISOString(),
          summary: shortTitle,
          color: task.completed ? '#888888' : '#000000',
          isTask: true,
          taskData: task
        };
      });
      setEvents(kalendEvents);
    }
  }, [tasks, currentTaskList]);

  // Initialize Google Calendar and fetch events
  useEffect(() => {
    const fetchGoogleEvents = async () => {
      try {
        if (!isGoogleClientReady()) {
          await handleGoogleCalendarAuth();
        }
        
        // This would be replaced with actual Google Calendar API call
        // For the POC, we'll just simulate Google events
        const now = new Date();
        const simulatedGoogleEvents = [
          {
            id: generateEventId(),
            startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
            endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30).toISOString(),
            summary: 'Team Meeting',
            color: '#333333',
            isGoogleEvent: true
          },
          {
            id: generateEventId(),
            startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0).toISOString(),
            endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0).toISOString(),
            summary: 'Client Call',
            color: '#555555',
            isGoogleEvent: true
          }
        ];
        
        setGoogleEvents(simulatedGoogleEvents);
        setIsCalendarReady(true);
      } catch (error) {
        console.error('Failed to fetch Google events:', error);
      }
    };
    
    fetchGoogleEvents();
  }, []);

  // Handle event click
  const onEventClick = (event) => {
    if (event.isTask) {
      alert(`Task clicked: ${event.summary}`);
    } else {
      alert(`Event clicked: ${event.summary}`);
    }
  };

  // Handle dragging events
  const onEventDragFinish = (prev, event, updatedEvent) => {
    console.log('Event dragged:', updatedEvent);
    if (event.isTask) {
      const task = event.taskData;
      const newStartDate = new Date(updatedEvent.startAt);
      
      alert(`Task "${event.summary}" scheduled for ${newStartDate.toLocaleDateString()}`);
      
      // Here you could implement the actual logic to update the task
    }
  };

  // Handle new event creation
  const onNewEventClick = (data) => {
    const { day, hour, startAt, endAt, view } = data;
    console.log('New event click:', data);
    
    // Prompt user for new event details
    const eventName = prompt('Enter event name:');
    if (eventName) {
      const newEvent = {
        id: generateEventId(),
        startAt: startAt,
        endAt: endAt,
        summary: eventName,
        color: '#000000'
      };
      
      // Add the new event
      setGoogleEvents([...googleEvents, newEvent]);
    }
  };

  // Filter and combine task events and Google events
  const filteredGoogleEvents = googleEvents.filter(event => 
    !(event.summary && (
      event.summary.includes('"blocks"') || 
      event.summary.includes('Commands') || 
      event.summary.includes('{"key"')
    ))
  );
  
  const allEvents = [...events, ...filteredGoogleEvents];

  return (
    <div className="calendar-container" style={{ height: '650px', padding: '20px', backgroundColor: 'white', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
          <button 
            onClick={() => setCalendarView(CalendarView.DAY)}
            style={{
              padding: '8px 16px',
              backgroundColor: calendarView === CalendarView.DAY ? '#000' : '#fff',
              color: calendarView === CalendarView.DAY ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Day
          </button>
          <button 
            onClick={() => setCalendarView(CalendarView.THREE_DAYS)}
            style={{
              padding: '8px 16px',
              backgroundColor: calendarView === CalendarView.THREE_DAYS ? '#000' : '#fff',
              color: calendarView === CalendarView.THREE_DAYS ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            3 Days
          </button>
          <button 
            onClick={() => setCalendarView(CalendarView.WEEK)}
            style={{
              padding: '8px 16px',
              backgroundColor: calendarView === CalendarView.WEEK ? '#000' : '#fff',
              color: calendarView === CalendarView.WEEK ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Week
          </button>
          <button 
            onClick={() => setCalendarView(CalendarView.MONTH)}
            style={{
              padding: '8px 16px',
              backgroundColor: calendarView === CalendarView.MONTH ? '#000' : '#fff',
              color: calendarView === CalendarView.MONTH ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Month
          </button>
        </div>
      </div>
      
      <Kalend
        events={allEvents}
        initialDate={new Date().toISOString()}
        hourHeight={60}
        initialView={calendarView}
        onViewChange={(newView) => setCalendarView(newView)}
        disabledViews={[CalendarView.AGENDA]}
        onEventClick={onEventClick}
        onEventDragFinish={onEventDragFinish}
        onNewEventClick={onNewEventClick}
        timeFormat={'24'}
        weekDayStart={'Monday'}
        calendarIDsHidden={[]}
        language={'nl'}
        customLanguage={LOCALES['nl']}
        autoScroll={true}
        draggingDisabledConditions={{
          summary: ['Holiday', 'Vacation'],
          allDay: [true],
          colour: ['red']
        }}
        customCss={{
          calendar: {
            backgroundColor: 'white',
            color: 'black',
            width: '100%'
          },
          event: {
            borderRadius: '2px',
          },
          header: {
            backgroundColor: 'white',
            color: 'black',
            width: '100%'
          },
        }}
      />
    </div>
  );
};

export default KalendPOC;