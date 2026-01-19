// googleCalendar.js - Met verbeterde OAuth scopes
import { gapi } from 'gapi-script';
import { debugLog, debugError, debugWarn } from '../utils/debug';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Meer specifieke scope definities om verschillende toegangsniveaus correct te behandelen
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",           // Volledige toegang tot alle agenda's
  "https://www.googleapis.com/auth/calendar.readonly",  // Alleen-lezen toegang
  "https://www.googleapis.com/auth/calendar.events",    // Beheer van evenementen
  "https://www.googleapis.com/auth/calendar.events.readonly", // Alleen-lezen toegang tot evenementen
  "https://www.googleapis.com/auth/calendar.settings.readonly", // Alleen-lezen toegang tot agenda-instellingen
  "https://www.googleapis.com/auth/calendar.addons.execute", // Voor add-ons
].join(' '); // Google verwacht scopes als spatie-gescheiden string

let isInitialized = false;

export const isGoogleClientReady = () => {
  return isInitialized && gapi.auth2 && gapi.auth2.getAuthInstance() && gapi.auth2.getAuthInstance().isSignedIn.get();
};

export const initClient = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      debugLog("Initializing Google API client with scopes:", SCOPES);
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        isInitialized = true;
        debugLog("Google API client initialized successfully");
        resolve();
      }).catch(error => {
        debugError("Error initializing GAPI client:", error);
        reject(error);
      });
    });
  });
};

export const handleGoogleCalendarAuth = async () => {
  if (!isInitialized) {
    debugLog("Initializing GAPI client before authentication");
    await initClient();
  }
  
  try {
    debugLog("Requesting authentication with scopes:", SCOPES);
    // Force consent to ensure we get the right permissions
    const authOptions = { 
      prompt: 'consent', 
      scope: SCOPES 
    };
    
    const authResult = await gapi.auth2.getAuthInstance().signIn(authOptions);
    
    // Log de verkregen scope om te debuggen
    const grantedScopes = authResult.getGrantedScopes();
    debugLog("Authentication successful. Granted scopes:", grantedScopes);
    
    // Debug check: controleer of we de juiste scopes hebben gekregen
    if (!grantedScopes.includes("https://www.googleapis.com/auth/calendar")) {
      debugWarn("Warning: Full calendar access not granted in scopes");
    }
    
    return authResult;
  } catch (error) {
    debugError("Error signing in to Google:", error);
    throw error;
  }
};

// Verbeterde functie voor het ophalen van beschikbare agenda's
export const listAvailableCalendars = async () => {
  debugLog("Attempting to list available calendars");
  
  if (!isGoogleClientReady()) {
    debugLog("Google client not ready, initiating authentication...");
    await handleGoogleCalendarAuth();
  }

  try {
    debugLog("Calling calendarList.list API");
    const response = await gapi.client.calendar.calendarList.list({
      showHidden: false, // Alleen zichtbare agenda's ophalen
      minAccessRole: 'reader' // Minimaal leestoegang nodig
    });
    
    debugLog('Available calendars from Google:', response.result.items);
    
    // Controleer op nextPageToken voor paginering (voor gebruikers met veel agenda's)
    if (response.result.nextPageToken) {
      debugLog('More calendars available, consider implementing pagination');
    }
    
    return response.result.items.map(calendar => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor,
      selected: calendar.selected, // Dit veld geeft aan of de agenda zichtbaar is in Google Calendar UI
      primary: calendar.primary,
      accessRole: calendar.accessRole
    }));
  } catch (error) {
    debugError("Error fetching available calendars:", error);
    if (error.result && error.result.error) {
      debugError("API Error details:", error.result.error);
      
      // Specifieke foutafhandeling voor authenticatieproblemen
      if (error.result.error.code === 403 && 
          error.result.error.status === "PERMISSION_DENIED") {
        debugError("Permission denied! This might be a scope issue. Re-authenticating...");
        
        // Probeer opnieuw te authenticeren met de juiste scopes
        await handleGoogleCalendarAuth();
        
        // Probeer de aanroep nog een keer
        debugLog("Retrying calendarList.list after re-authentication");
        const retryResponse = await gapi.client.calendar.calendarList.list({
          showHidden: false,
          minAccessRole: 'reader'
        });
        
        debugLog('Retry successful! Available calendars:', retryResponse.result.items);
        
        return retryResponse.result.items.map(calendar => ({
          id: calendar.id,
          summary: calendar.summary,
          description: calendar.description,
          backgroundColor: calendar.backgroundColor,
          foregroundColor: calendar.foregroundColor,
          selected: calendar.selected,
          primary: calendar.primary,
          accessRole: calendar.accessRole
        }));
      }
    }
    
    throw error; // Als de retry ook niet werkt, gooi de error door
  }
};

// De rest van je functies blijft hetzelfde
// Voeg hier de overige functies toe uit je oorspronkelijke bestand...

// Add event to a specific Google Calendar
export const addEventToCalendar = async (event, calendarId = 'primary') => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  if (!event) {
    throw new Error("Cannot add null or undefined event");
  }

  try {
    // Basic validation of the event object
    if (!event.summary) {
      debugWarn("Event missing summary, setting default", event);
      event.summary = "Untitled Event";
    }
    
    if (!event.start || !event.end) {
      throw new Error("Event missing start or end time");
    }
    
    const response = await gapi.client.calendar.events.insert({
      'calendarId': calendarId,
      'resource': event
    });
    debugLog('Event added successfully to calendar', calendarId, ':', response);
    return response;
  } catch (error) {
    debugError(`Error adding event to calendar ${calendarId}:`, error);
    throw error;
  }
};

// Fetch calendar events from a specific Google Calendar
export const fetchGoogleCalendarEvents = async (timeMin, timeMax, calendarId = 'primary', maxResults = 100) => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    const response = await gapi.client.calendar.events.list({
      'calendarId': calendarId,
      'timeMin': timeMin || new Date().toISOString(),
      'timeMax': timeMax,
      'maxResults': maxResults,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    return response.result.items;
  } catch (error) {
    debugError(`Error fetching events from calendar ${calendarId}:`, error);
    throw error;
  }
};

// Update existing events in a specific Google Calendar
export const updateEventInCalendar = async (eventId, updatedEvent, calendarId = 'primary') => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  if (!eventId) {
    throw new Error("Cannot update event without a valid event ID");
  }

  if (!updatedEvent) {
    throw new Error("Cannot update with empty event data");
  }

  try {
    debugLog(`Updating event ${eventId} in calendar ${calendarId} with data:`, updatedEvent);
    
    // Ensure the event has required fields
    if (!updatedEvent.start || !updatedEvent.end) {
      throw new Error("Event must have start and end times");
    }
    
    if (!updatedEvent.summary) {
      updatedEvent.summary = "Untitled Event";
    }
    
    const response = await gapi.client.calendar.events.update({
      'calendarId': calendarId,
      'eventId': eventId,
      'resource': updatedEvent
    });
    
    debugLog(`Event ${eventId} updated successfully in calendar ${calendarId}`, response);
    return response;
  } catch (error) {
    // Try to provide more specific error details
    let errorMessage = `Error updating event ${eventId} in calendar ${calendarId}`;
    
    if (error.result && error.result.error) {
      // Extract Google API error details
      errorMessage += `: ${error.result.error.message}`;
      
      // Special handling for common errors
      if (error.result.error.code === 404) {
        errorMessage += " (Event not found)";
      } else if (error.result.error.code === 403) {
        errorMessage += " (Permission denied - you may not have access to modify this calendar)";
      } else if (error.result.error.code === 401) {
        errorMessage += " (Unauthorized - please sign in again)";
      }
    }
    
    debugError(errorMessage, error);
    throw error;
  }
};

// Delete events from a specific Google Calendar
export const deleteEventFromCalendar = async (eventId, calendarId = 'primary') => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  if (!eventId) {
    throw new Error("Cannot delete event without a valid event ID");
  }

  try {
    debugLog(`Sending delete request for event ${eventId} from calendar ${calendarId}`);
    
    const response = await gapi.client.calendar.events.delete({
      'calendarId': calendarId,
      'eventId': eventId
    });
    
    debugLog(`Event ${eventId} deleted successfully from calendar ${calendarId}`, response);
    return response;
  } catch (error) {
    // Try to provide more specific error details
    let errorMessage = `Error deleting event ${eventId} from calendar ${calendarId}`;
    
    if (error.result && error.result.error) {
      // Extract Google API error details
      errorMessage += `: ${error.result.error.message}`;
      
      // Special handling for common errors
      if (error.result.error.code === 404) {
        errorMessage += " (Event not found - it may have been already deleted)";
      } else if (error.result.error.code === 403) {
        errorMessage += " (Permission denied - you may not have access to this calendar)";
      } else if (error.result.error.code === 401) {
        errorMessage += " (Unauthorized - please sign in again)";
      }
    }
    
    debugError(errorMessage, error);
    throw error;
  }
};

// Get detailed information about a specific calendar
export const getCalendarDetails = async (calendarId) => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    const response = await gapi.client.calendar.calendars.get({
      'calendarId': calendarId
    });
    return response.result;
  } catch (error) {
    debugError(`Error getting details for calendar ${calendarId}:`, error);
    throw error;
  }
};

// Create a new calendar
export const createCalendar = async (summary, description = '', location = '', timeZone = 'Europe/Amsterdam') => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    const response = await gapi.client.calendar.calendars.insert({
      'resource': {
        'summary': summary,
        'description': description,
        'location': location,
        'timeZone': timeZone
      }
    });
    debugLog('Calendar created successfully:', response.result);
    return response.result;
  } catch (error) {
    debugError('Error creating calendar:', error);
    throw error;
  }
};

// Update user's permissions for a calendar (share to another user)
export const shareCalendarWithUser = async (calendarId, userEmail, role = 'reader') => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    // Valid roles: "none", "freeBusyReader", "reader", "writer", "owner"
    const response = await gapi.client.calendar.acl.insert({
      'calendarId': calendarId,
      'resource': {
        'scope': {
          'type': 'user',
          'value': userEmail
        },
        'role': role
      }
    });
    debugLog(`Calendar ${calendarId} shared with ${userEmail} as ${role}`);
    return response.result;
  } catch (error) {
    debugError(`Error sharing calendar ${calendarId} with ${userEmail}:`, error);
    throw error;
  }
};

// Get all ACL rules (permissions) for a calendar
export const getCalendarPermissions = async (calendarId) => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    const response = await gapi.client.calendar.acl.list({
      'calendarId': calendarId
    });
    return response.result.items;
  } catch (error) {
    debugError(`Error getting permissions for calendar ${calendarId}:`, error);
    throw error;
  }
};