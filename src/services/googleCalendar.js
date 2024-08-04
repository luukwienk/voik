import { gapi } from 'gapi-script';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let isInitialized = false;

const updateSigninStatus = (isSignedIn) => {
  if (isSignedIn) {
    console.log("User is signed in to Google");
  } else {
    console.log("User is not signed in to Google");
  }
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
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        isInitialized = true;
        resolve();
      }).catch(error => {
        console.error("Error initializing GAPI client:", error);
        reject(error);
      });
    });
  });
};

export const handleAuthClick = () => {
  if (!isInitialized) {
    console.error("Google API client not initialized. Call initClient first.");
    return;
  }
  const GoogleAuth = gapi.auth2.getAuthInstance();
  if (!GoogleAuth.isSignedIn.get()) {
    GoogleAuth.signIn().catch(error => {
      console.error("Error signing in:", error);
    });
  } else {
    GoogleAuth.signOut().catch(error => {
      console.error("Error signing out:", error);
    });
  }
};

export const addEventToCalendar = async (event) => {
  if (!isInitialized) {
    throw new Error('Google API client not initialized. Call initClient first.');
  }

  const GoogleAuth = gapi.auth2.getAuthInstance();
  if (!GoogleAuth.isSignedIn.get()) {
    throw new Error('User not signed in to Google. Call handleAuthClick first.');
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
    console.error("Error details:", error.result.error);
    throw error;
  }
};