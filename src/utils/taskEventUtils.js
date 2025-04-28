// taskEventUtils.js - Utilities for converting between tasks and calendar events

/**
 * Converts a task to a calendar event format compatible with Kalend
 * 
 * @param {Object} task - The task object to convert
 * @param {Date} [startTime=null] - Optional start time (defaults to today at 9 AM)
 * @param {number} [durationHours=1] - Duration in hours (defaults to 1 hour)
 * @returns {Object} A Kalend-compatible event object
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
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    summary,
    color: task.completed ? '#888888' : '#000000',
    isTask: true,
    taskData: task
  };
};

/**
 * Converts a list of tasks to Kalend calendar events
 * 
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Array of Kalend-compatible event objects
 */
export const tasksToEvents = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) return [];
  
  return tasks.map(task => taskToEvent(task));
};

/**
 * Converts a Google Calendar event to a Kalend-compatible format
 * 
 * @param {Object} googleEvent - The Google Calendar event object
 * @returns {Object} A Kalend-compatible event object
 */
export const googleEventToKalendEvent = (googleEvent) => {
  // Skip certain types of events that have weird formatting
  if (
    googleEvent.summary && (
      googleEvent.summary.includes('"blocks"') || 
      googleEvent.summary.includes('Commands') || 
      googleEvent.summary.includes('{"key"')
    )
  ) {
    return null;
  }
  
  // Handle all-day events (date only) and regular events (with time)
  const start = googleEvent.start.dateTime || googleEvent.start.date;
  const end = googleEvent.end.dateTime || googleEvent.end.date;
  
  return {
    id: googleEvent.id,
    startAt: start,
    endAt: end,
    summary: googleEvent.summary || 'Untitled Event',
    color: googleEvent.colorId ? getColorFromId(googleEvent.colorId) : '#3498db',
    isGoogleEvent: true,
    originalEvent: googleEvent
  };
};

/**
 * Converts an array of Google Calendar events to Kalend-compatible format
 * 
 * @param {Array} googleEvents - Array of Google Calendar event objects
 * @returns {Array} Array of Kalend-compatible event objects
 */
export const googleEventsToKalendEvents = (googleEvents) => {
  if (!googleEvents || !Array.isArray(googleEvents)) return [];
  
  return googleEvents
    .map(googleEventToKalendEvent)
    .filter(event => event !== null);
};

/**
 * Converts a Kalend event to Google Calendar format
 * 
 * @param {Object} kalendEvent - The Kalend event object
 * @param {string} [timeZone='Europe/Amsterdam'] - The time zone to use
 * @returns {Object} A Google Calendar-compatible event object
 */
export const kalendEventToGoogleEvent = (kalendEvent, timeZone = 'Europe/Amsterdam') => {
  return {
    summary: kalendEvent.summary,
    start: {
      dateTime: kalendEvent.startAt,
      timeZone: timeZone,
    },
    end: {
      dateTime: kalendEvent.endAt,
      timeZone: timeZone,
    },
    colorId: getColorIdFromHex(kalendEvent.color)
  };
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