import { gapi } from 'gapi-script';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let isInitialized = false;

export const isGoogleClientReady = () => {
  return isInitialized && gapi.auth2 && gapi.auth2.getAuthInstance() && gapi.auth2.getAuthInstance().isSignedIn.get();
};

export const initClient = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        isInitialized = true;
        resolve();
      }).catch(error => {
        console.error("Error initializing GAPI client:", error);
        reject(error);
      });
    });
  });
};

export const handleGoogleCalendarAuth = async () => {
  if (!isInitialized) {
    await initClient();
  }
  if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error("Error signing in to Google:", error);
      throw error;
    }
  }
};

export const addEventToCalendar = async (event) => {
  if (!isGoogleClientReady()) {
    await handleGoogleCalendarAuth();
  }

  try {
    const response = await gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event
    });
    console.log('Event added successfully:', response);
    return response;
  } catch (error) {
    console.error("Error adding event to calendar:", error);
    throw error;
  }
};