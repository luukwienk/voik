// bigCalendarUtils.js - Utilities for converting between tasks and events for React Big Calendar

/**
 * Converts a task to a calendar event format compatible with React Big Calendar
 * 
 * @param {Object} task - The task object to convert
 * @param {Date} [startTime=null] - Optional start time (defaults to today at 9 AM)
 * @param {number} [durationHours=1] - Duration in hours (defaults to 1 hour)
 * @returns {Object} A React Big Calendar compatible event object
 */
export const taskToEvent = (task, startTime = null, durationHours = 1) => {
    // Handle HTML content in task text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = task.text || '';
    const cleanText = tempDiv.textContent || tempDiv.innerText || 'Task';
    
    // Take just the first line or first 30 characters for the summary
    const summary = cleanText.split('\n')[0].substring(0, 30);
    
    // Set default start time to today at 9 AM if not provided
    const start = startTime || new Date();
    if (!startTime) {
      start.setHours(9, 0, 0, 0);
    }
    
    // Calculate end time based on duration
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    
    return {
      id: `task-${task.id}`,
      title: summary,  // React Big Calendar uses 'title' instead of 'summary'
      start: start,    // React Big Calendar uses Date objects directly
      end: end,        // React Big Calendar uses Date objects directly
      resource: {      // Store additional info in resource property
        color: task.completed ? '#888888' : '#3498db',
        isTask: true,
        taskData: task,
        originalSummary: summary
      }
    };
  };
  
  /**
   * Converts a list of tasks to React Big Calendar events
   * 
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Array of React Big Calendar compatible event objects
   */
  export const tasksToEvents = (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.map(task => taskToEvent(task));
  };
  
  /**
   * Converts a Google Calendar event to a React Big Calendar compatible format
   * 
   * @param {Object} googleEvent - The Google Calendar event object
   * @returns {Object} A React Big Calendar compatible event object
   */
  export const googleEventToRbcEvent = (googleEvent) => {
    // Skip certain types of events that have weird formatting
    if (
      googleEvent.summary && (
        googleEvent.summary.includes('"blocks"') || 
        googleEvent.summary.includes('Commands') || 
        googleEvent.summary.includes('{"key"')
      )
    ) {
      console.log('Skipping event with invalid summary:', googleEvent.summary);
      return null;
    }
    
    // Debug the Google event structure
    console.log('Processing Google event:', googleEvent);
    
    // Handle all-day events (date only) and regular events (with time)
    const startDateTime = googleEvent.start?.dateTime || googleEvent.start?.date;
    const endDateTime = googleEvent.end?.dateTime || googleEvent.end?.date;
    
    // Check for valid dates
    if (!startDateTime || !endDateTime) {
      console.log('Missing start or end time in event:', googleEvent);
      return null;
    }
    
    // Create Date objects
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // Check if this is an all-day event (date without time)
    const isAllDay = !googleEvent.start.dateTime && googleEvent.start.date;
    
    const rbcEvent = {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      start: start,
      end: end,
      allDay: isAllDay,
      resource: {
        color: googleEvent.colorId ? getColorFromId(googleEvent.colorId) : '#3498db',
        isGoogleEvent: true,
        calendarId: googleEvent.calendarId || 'primary',
        originalEvent: googleEvent
      }
    };
    
    console.log('Converted to React Big Calendar event:', rbcEvent);
    return rbcEvent;
  };
  
  /**
   * Converts an array of Google Calendar events to React Big Calendar compatible format
   * 
   * @param {Array} googleEvents - Array of Google Calendar event objects
   * @returns {Array} Array of React Big Calendar compatible event objects
   */
  export const googleEventsToRbcEvents = (googleEvents) => {
    if (!googleEvents || !Array.isArray(googleEvents)) {
      console.log('No Google events to convert');
      return [];
    }
    
    console.log(`Converting ${googleEvents.length} Google events to RBC format`);
    
    const rbcEvents = googleEvents
      .map(googleEventToRbcEvent)
      .filter(event => event !== null);
      
    console.log(`Successfully converted ${rbcEvents.length} events`);
    return rbcEvents;
  };
  
  /**
   * Converts a React Big Calendar event to Google Calendar format
   * 
   * @param {Object} rbcEvent - The React Big Calendar event object
   * @param {string} [timeZone='Europe/Amsterdam'] - The time zone to use
   * @returns {Object} A Google Calendar compatible event object
   */
  export const rbcEventToGoogleEvent = (rbcEvent, timeZone = 'Europe/Amsterdam') => {
    // Debug the React Big Calendar event structure
    console.log('Converting RBC event to Google format:', rbcEvent);
    
    if (!rbcEvent) {
      console.error('Invalid event passed to rbcEventToGoogleEvent');
      return null;
    }
    
    if (!rbcEvent.start || !rbcEvent.end) {
      console.error('Event missing start or end time:', rbcEvent);
      return null;
    }
    
    // Check if it's an all-day event
    const isAllDay = rbcEvent.allDay;
    
    let eventResource = {
      summary: rbcEvent.title || rbcEvent.summary || 'Untitled Event',
      description: rbcEvent.resource?.description || rbcEvent.description || ''
    };
    
    // Add color if available
    if (rbcEvent.resource?.color) {
      eventResource.colorId = getColorIdFromHex(rbcEvent.resource.color);
    }
    
    // Handle all-day events differently
    if (isAllDay) {
      // For all-day events, use date (without time)
      // Format: YYYY-MM-DD
      const startDate = formatDateForGoogle(rbcEvent.start);
      
      // For all-day events, the end date should be the next day
      const endDate = new Date(rbcEvent.end);
      endDate.setDate(endDate.getDate() + 1); // Add 1 day
      
      eventResource.start = {
        date: startDate,
        timeZone: timeZone
      };
      
      eventResource.end = {
        date: formatDateForGoogle(endDate),
        timeZone: timeZone
      };
    } else {
      // Regular events with time
      // Make sure we're working with Date objects and not strings
      const startDate = rbcEvent.start instanceof Date ? 
        rbcEvent.start : new Date(rbcEvent.start);
      
      const endDate = rbcEvent.end instanceof Date ? 
        rbcEvent.end : new Date(rbcEvent.end);
      
      eventResource.start = {
        dateTime: startDate.toISOString(),
        timeZone: timeZone
      };
      
      eventResource.end = {
        dateTime: endDate.toISOString(),
        timeZone: timeZone
      };
    }
    
    console.log('Converted to Google Calendar event:', eventResource);
    return eventResource;
  };
  
  /**
   * Format a date for Google Calendar (YYYY-MM-DD)
   * 
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  const formatDateForGoogle = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
  
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
  
    return [year, month, day].join('-');
  };
  
  /**
   * Convert Google Calendar color ID to hex color
   * 
   * @param {string} colorId - Google Calendar color ID
   * @returns {string} Hex color code
   */
  export const getColorFromId = (colorId) => {
    const colors = {
      '1': '#7986cb', // Lavender
      '2': '#33b679', // Sage
      '3': '#8e24aa', // Grape
      '4': '#e67c73', // Flamingo
      '5': '#f6bf26', // Banana
      '6': '#f4511e', // Tangerine
      '7': '#039be5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3f51b5', // Blueberry
      '10': '#0b8043', // Basil
      '11': '#d60000', // Tomato
    };
    return colors[colorId] || '#3498db';
  };
  
  /**
   * Find the closest Google Calendar color ID for a given hex color
   * 
   * @param {string} hexColor - Hex color code
   * @returns {string} The closest Google Calendar color ID
   */
  export const getColorIdFromHex = (hexColor) => {
    if (!hexColor) return '9'; // Default to Blueberry
    
    const colors = {
      '#7986cb': '1', // Lavender
      '#33b679': '2', // Sage
      '#8e24aa': '3', // Grape
      '#e67c73': '4', // Flamingo
      '#f6bf26': '5', // Banana
      '#f4511e': '6', // Tangerine
      '#039be5': '7', // Peacock
      '#616161': '8', // Graphite
      '#3f51b5': '9', // Blueberry
      '#0b8043': '10', // Basil
      '#d60000': '11', // Tomato
    };
    
    // If exact match exists
    if (colors[hexColor.toLowerCase()]) {
      return colors[hexColor.toLowerCase()];
    }
    
    // For black and gray colors
    if (hexColor === '#000000' || hexColor === '#888888') {
      return '8'; // Graphite
    }
    
    // Default to Blueberry
    return '9';
  };