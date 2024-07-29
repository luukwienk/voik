import { gapi } from 'gapi-script';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";



const updateSigninStatus = (isSignedIn) => {
    if (isSignedIn) {
      console.log("User is signed in");
      // Possibly update application state or UI
    } else {
      console.log("User is not signed in");
      // Handle UI changes or state updates
    }
  };
  
  export const initClient = () => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      }).catch(error => {
        console.error("Error loading GAPI client for API", error);
      });
    });
  };
  
  export const handleAuthClick = () => {
    const GoogleAuth = gapi.auth2.getAuthInstance();
    if (!GoogleAuth.isSignedIn.get()) {
      GoogleAuth.signIn();
    } else {
      GoogleAuth.signOut();
    }
  };

export const addEventToCalendar = (event) => {
  return gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  });
};