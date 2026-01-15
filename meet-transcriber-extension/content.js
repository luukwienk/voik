// content.js - Google Meet detectie en communicatie
// Dit script draait op meet.google.com pagina's

console.log('[Voik Content] Content script geladen op:', window.location.href);

// Huidige meeting state
let meetingState = {
  isInMeeting: false,
  meetingCode: null,
  title: null
};

// Detecteer of we in een actieve meeting zitten
function detectMeetingStatus() {
  // Check URL voor meeting code
  const urlMatch = window.location.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})$/i);
  const meetingCode = urlMatch ? urlMatch[1] : null;

  // Check voor meeting UI elementen
  // De data-meeting-code attribuut is aanwezig wanneer in meeting
  const meetingElement = document.querySelector('[data-meeting-code]');
  const isInMeeting = !!meetingElement || !!meetingCode;

  // Haal meeting title op (indien beschikbaar)
  let title = null;

  // Probeer titel uit verschillende plaatsen te halen
  // Meeting titel in de top bar
  const titleElement = document.querySelector('[data-meeting-title]');
  if (titleElement) {
    title = titleElement.textContent;
  }

  // Of uit de document titel
  if (!title && document.title) {
    // Google Meet - meeting code format
    const titleMatch = document.title.match(/^(.+?)\s*[-|]\s*Google Meet/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }

  // Update state
  const wasInMeeting = meetingState.isInMeeting;
  meetingState = {
    isInMeeting,
    meetingCode,
    title: title || meetingCode || 'Google Meet'
  };

  // Notify als status veranderd is
  if (wasInMeeting !== isInMeeting) {
    notifyMeetingStatusChange();
  }

  return meetingState;
}

// Stuur meeting status naar background script
function notifyMeetingStatusChange() {
  try {
    chrome.runtime.sendMessage({
      type: meetingState.isInMeeting ? 'MEETING_JOINED' : 'MEETING_LEFT',
      meetingCode: meetingState.meetingCode,
      title: meetingState.title
    });
  } catch (err) {
    // Extension context might be invalidated
    console.log('[Voik Content] Kon status niet versturen:', err);
  }
}

// Luister naar berichten van popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Voik Content] Bericht ontvangen:', message.type);

  switch (message.type) {
    case 'GET_MEETING_INFO':
      detectMeetingStatus();
      sendResponse({
        isInMeeting: meetingState.isInMeeting,
        meetingCode: meetingState.meetingCode,
        title: meetingState.title
      });
      return true;

    case 'SHOW_RECORDING_INDICATOR':
      showRecordingIndicator();
      return true;

    case 'HIDE_RECORDING_INDICATOR':
      hideRecordingIndicator();
      return true;
  }
});

// Optionele discrete opname indicator
let recordingIndicator = null;

function showRecordingIndicator() {
  if (recordingIndicator) return;

  recordingIndicator = document.createElement('div');
  recordingIndicator.id = 'voik-recording-indicator';
  recordingIndicator.innerHTML = `
    <style>
      #voik-recording-indicator {
        position: fixed;
        top: 8px;
        right: 8px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 20px;
        font-family: -apple-system, sans-serif;
        font-size: 12px;
        pointer-events: none;
        animation: voik-fade-in 0.3s ease;
      }
      #voik-recording-indicator .dot {
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        animation: voik-pulse 1s ease-in-out infinite;
      }
      @keyframes voik-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes voik-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <span class="dot"></span>
    <span>Voik opname</span>
  `;

  document.body.appendChild(recordingIndicator);
}

function hideRecordingIndicator() {
  if (recordingIndicator) {
    recordingIndicator.remove();
    recordingIndicator = null;
  }
}

// Observeer DOM veranderingen voor meeting status updates
const observer = new MutationObserver(() => {
  detectMeetingStatus();
});

// Start observer wanneer DOM klaar is
function init() {
  detectMeetingStatus();

  // Observer voor meeting UI changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-meeting-code', 'data-meeting-title']
  });

  // Periodieke check (backup voor als observer mist)
  setInterval(detectMeetingStatus, 5000);

  console.log('[Voik Content] Geïnitialiseerd, meeting status:', meetingState);
}

// Wacht tot DOM geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup bij navigatie
window.addEventListener('beforeunload', () => {
  observer.disconnect();
  hideRecordingIndicator();
});
