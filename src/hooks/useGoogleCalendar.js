// useGoogleCalendar.js - Verbeterde versie voor automatisch laden van alle zichtbare agenda's
import { useState, useEffect, useCallback } from 'react';
import { 
  initClient, 
  isGoogleClientReady, 
  handleGoogleCalendarAuth, 
  fetchGoogleCalendarEvents,
  addEventToCalendar,
  updateEventInCalendar,
  deleteEventFromCalendar,
  listAvailableCalendars
} from '../services/googleCalendar';
import { googleEventsToRbcEvents, rbcEventToGoogleEvent } from '../utils/bigCalendarUtils';

export function useGoogleCalendar() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState([]);
  // Start met lege lijst, zullen we automatisch vullen met zichtbare agenda's
  const [selectedCalendars, setSelectedCalendars] = useState([]); 

  // Initialize Google Calendar client
  useEffect(() => {
    const initialize = async () => {
      try {
        await initClient();
        setIsInitialized(true);
        console.log('Google Calendar API initialized successfully');
        
        // Na initialisatie meteen agenda's ophalen
        if (isGoogleClientReady()) {
          const calendars = await fetchAvailableCalendars();
          
          // Automatisch alle zichtbare agenda's selecteren
          const visibleCalendars = calendars
            .filter(cal => cal.selected) // Alleen agenda's die in Google als 'selected' zijn gemarkeerd
            .map(cal => cal.id);
          
          console.log('Automatically selecting visible calendars:', visibleCalendars);
          setSelectedCalendars(visibleCalendars.length > 0 ? visibleCalendars : ['primary']);
        }
      } catch (error) {
        console.error("Failed to initialize Google API client:", error);
        setError("Failed to connect to Google Calendar.");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch available calendars
  const fetchAvailableCalendars = useCallback(async () => {
    if (!isInitialized) {
      console.log("Google API client not initialized yet");
      return [];
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (!isGoogleClientReady()) {
        console.log("Google client not ready, attempting authentication");
        await handleGoogleCalendarAuth();
      }

      const calendars = await listAvailableCalendars();
      console.log("Fetched available calendars:", calendars);
      setAvailableCalendars(calendars);
      
      // Hier automatisch alle zichtbare agenda's selecteren
      const visibleCalendars = calendars
        .filter(cal => cal.selected) // Alleen agenda's die als 'selected' zijn gemarkeerd in Google
        .map(cal => cal.id);
      
      // Alleen updaten als er daadwerkelijk zichtbare agenda's zijn
      if (visibleCalendars.length > 0) {
        console.log('Setting visible calendars:', visibleCalendars);
        setSelectedCalendars(visibleCalendars);
      } else if (selectedCalendars.length === 0) {
        // Als er geen zichtbare agenda's zijn, val terug op 'primary'
        setSelectedCalendars(['primary']);
      }
      
      return calendars;
    } catch (error) {
      console.error("Error loading calendars:", error);
      if (error.result && error.result.error) {
        setError(`Google Calendar error: ${error.result.error.message || "Unknown error"}`);
      } else {
        setError("Failed to load calendars. Please check your connection and try again.");
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, selectedCalendars]);

  // De rest van je hook implementatie blijft hetzelfde...
  
  // Fetch events from all selected calendars based on date range
  const fetchEvents = useCallback(async (timeMin, timeMax) => {
    if (!isInitialized) {
      console.log("Google API client not initialized yet");
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    // Als er geen geselecteerde agenda's zijn, probeer ze eerst op te halen
    if (selectedCalendars.length === 0) {
      try {
        await fetchAvailableCalendars();
      } catch (error) {
        console.error("Could not load available calendars:", error);
      }
    }

    try {
      console.log(`Fetching Google Calendar events from ${timeMin} to ${timeMax} for calendars:`, selectedCalendars);
      
      if (!isGoogleClientReady()) {
        console.log("Google client not ready, attempting authentication");
        await handleGoogleCalendarAuth();
      }

      // Fetch events from all selected calendars
      const allEvents = [];
      
      for (const calendarId of selectedCalendars) {
        try {
          console.log(`Fetching events for calendar: ${calendarId}`);
          const calendarEvents = await fetchGoogleCalendarEvents(timeMin, timeMax, calendarId);
          console.log(`Fetched ${calendarEvents.length} events from calendar ${calendarId}:`, calendarEvents);
          
          // Add calendarId to each event for tracking the source
          const eventsWithSource = calendarEvents.map(event => ({
            ...event,
            calendarId
          }));
          
          allEvents.push(...eventsWithSource);
        } catch (calendarError) {
          console.error(`Error fetching events for calendar ${calendarId}:`, calendarError);
          // Continue with other calendars even if one fails
        }
      }
      
      console.log("Fetched a total of", allEvents.length, "events from all calendars");
      
      // Debug the raw Google Calendar events
      console.log("Raw Google Calendar events:", allEvents);
      
      // Convert Google events to React Big Calendar format
      const rbcEvents = googleEventsToRbcEvents(allEvents);
      console.log("Converted to", rbcEvents.length, "React Big Calendar events:", rbcEvents);
      
      // Store the events in the right format for React Big Calendar
      const formattedEvents = rbcEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        resource: event.resource
      }));
      
      console.log("Final formatted events for RBC:", formattedEvents);
      
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (error) {
      console.error("Error loading events:", error);
      // More informative error message
      if (error.result && error.result.error) {
        setError(`Google Calendar error: ${error.result.error.message || "Unknown error"}`);
      } else {
        setError("Failed to load calendar events. Please check your connection and try again.");
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, selectedCalendars, fetchAvailableCalendars]);

  // De rest van je oorspronkelijke code voor addEvent, updateEvent, deleteEvent, etc...
  // Kopieer deze functies vanuit je oorspronkelijke hook

  // Add event to Google Calendar
  const addEvent = useCallback(async (event, calendarId = 'primary') => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Adding event to Google Calendar:", event, "in calendar:", calendarId);
      
      if (!isGoogleClientReady()) {
        console.log("Google client not ready, attempting authentication");
        await handleGoogleCalendarAuth();
      }

      // Convert React Big Calendar event to Google Calendar format
      const googleEvent = rbcEventToGoogleEvent(event);
      console.log("Converted event to Google format:", googleEvent);

      const response = await addEventToCalendar(googleEvent, calendarId);
      console.log("Google Calendar response:", response);
      
      if (!response || !response.result) {
        throw new Error("Invalid response from Google Calendar API");
      }
      
      // Extract date information from the Google Calendar response
      const startDateTime = response.result.start?.dateTime || response.result.start?.date;
      const endDateTime = response.result.end?.dateTime || response.result.end?.date;
      
      if (!startDateTime || !endDateTime) {
        console.warn("Missing start or end time in created event:", response.result);
      }
      
      // Create a React Big Calendar event from the response
      const newEvent = {
        id: response.result.id,
        title: response.result.summary,
        start: startDateTime ? new Date(startDateTime) : event.start,
        end: endDateTime ? new Date(endDateTime) : event.end,
        allDay: !response.result.start.dateTime,
        resource: {
          color: event.resource?.color || '#3498db',
          isGoogleEvent: true,
          calendarId: calendarId,
          originalEvent: response.result
        }
      };
      
      console.log("Adding new event to local state:", newEvent);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error("Error adding event:", error);
      // More informative error message
      if (error.result && error.result.error) {
        setError(`Failed to add event: ${error.result.error.message || "Unknown error"}`);
      } else {
        setError("Failed to add event to calendar. Please check your connection and try again.");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Update existing event
  const updateEvent = useCallback(async (event) => {
    console.log("Starting event update process for:", event);
    
    if (!event || !event.id) {
      console.error("Cannot update event without ID");
      return null;
    }

    // Get the calendar ID from the event's resource or default to primary
    const calendarId = event.resource?.calendarId || 
                       event.originalEvent?.calendarId || 
                       'primary';
    
    setIsLoading(true);
    setError(null);

    try {
      if (!isGoogleClientReady()) {
        await handleGoogleCalendarAuth();
      }

      console.log("Updating event in Google Calendar:", event, "in calendar:", calendarId);

      // Convert React Big Calendar event to Google Calendar format
      const googleEvent = rbcEventToGoogleEvent(event);
      
      // Ensure the updated event has the correct ID
      googleEvent.id = event.id;
      
      console.log("Sending event update to Google Calendar:", googleEvent);

      const response = await updateEventInCalendar(event.id, googleEvent, calendarId);
      console.log("Update successful, Google response:", response.result);
      
      // Get the updated event from the response
      const updatedEvent = {
        id: event.id,
        title: event.title,
        start: new Date(response.result.start.dateTime || response.result.start.date),
        end: new Date(response.result.end.dateTime || response.result.end.date),
        allDay: !response.result.start.dateTime,
        resource: {
          ...(event.resource || {}),
          calendarId: calendarId,
          isGoogleEvent: true,
          originalEvent: response.result
        }
      };
      
      // Update local events state
      setEvents(prev => {
        const updated = prev.map(e => e.id === event.id ? updatedEvent : e);
        console.log("Updated local event state after Google update");
        return updated;
      });
      
      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      
      // More specific error message
      if (error.result && error.result.error) {
        setError(`Failed to update event: ${error.result.error.message || "Unknown error"}`);
      } else {
        setError("Failed to update event. Please check your connection and try again.");
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Delete event
  const deleteEvent = useCallback(async (eventId, calendarId = 'primary') => {
    if (!eventId) {
      console.error("Cannot delete event without ID");
      return false;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (!isGoogleClientReady()) {
        await handleGoogleCalendarAuth();
      }

      console.log(`Attempting to delete event ${eventId} from calendar ${calendarId}`);
      
      // Find the event to get its calendar ID if not provided
      if (calendarId === 'primary') {
        const eventToDelete = events.find(e => e.id === eventId);
        if (eventToDelete?.resource?.calendarId) {
          calendarId = eventToDelete.resource.calendarId;
          console.log(`Found calendar ID in event: ${calendarId}`);
        }
      }

      await deleteEventFromCalendar(eventId, calendarId);
      console.log(`Successfully deleted event ${eventId} from calendar ${calendarId}`);
      
      // Update local events state
      setEvents(prev => {
        const filtered = prev.filter(e => e.id !== eventId);
        console.log(`Removed event from local state. Events count before: ${prev.length}, after: ${filtered.length}`);
        return filtered;
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
      
      // More descriptive error message
      if (error.result && error.result.error) {
        setError(`Failed to delete event: ${error.result.error.message || "Unknown error"}`);
      } else {
        setError("Failed to delete event. Please check your connection and try again.");
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [events, isInitialized]);

  // Toggle calendars to display
  const toggleCalendar = useCallback((calendarId) => {
    setSelectedCalendars(prev => {
      // If already selected, remove it
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } 
      // Otherwise, add it
      return [...prev, calendarId];
    });
  }, []);

  return {
    events,
    isLoading,
    error,
    isInitialized,
    availableCalendars,
    selectedCalendars,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchAvailableCalendars,
    toggleCalendar,
    setSelectedCalendars
  };
}