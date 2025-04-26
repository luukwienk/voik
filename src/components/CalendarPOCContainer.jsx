import React, { useState } from 'react';
import Kalend, { CalendarView } from 'kalend';
import 'kalend/dist/styles/index.css';

// Simplified calendar component without task integration
const CalendarPOCContainer = () => {
  const [calendarView, setCalendarView] = useState(CalendarView.WEEK);
  
  // Hard-coded sample events
  const sampleEvents = [
    {
      id: 'event-1',
      startAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      endAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      summary: 'Sample Event 1',
      color: '#3498db'
    },
    {
      id: 'event-2',
      startAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      endAt: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
      summary: 'Sample Event 2',
      color: '#2ecc71'
    }
  ];

  const onEventClick = (event) => {
    console.log('Event clicked:', event);
  };

  const onNewEventClick = (data) => {
    console.log('New event slot clicked:', data);
  };

  return (
    <div className="calendar-container" style={{ height: 'calc(100vh - 280px)', padding: '10px', backgroundColor: 'white' }}>
      <Kalend
        events={sampleEvents}
        initialDate={new Date().toISOString()}
        hourHeight={60}
        initialView={calendarView}
        onViewChange={setCalendarView}
        showTimeLine={true}
        autoScroll={true}
        onEventClick={onEventClick}
        onNewEventClick={onNewEventClick}
        style={{
          primaryColor: '#2196F3',
          baseColor: '#f5f5f5',
          inverseBaseColor: '#333',
        }}
      />
    </div>
  );
};

export default CalendarPOCContainer;