// popup.js - Voik Meet Transcriber Popup
// Start opname door recorder tab te openen

// DOM elementen
const elements = {
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text'),
  meetingInfo: document.getElementById('meeting-info'),
  meetingTitle: document.getElementById('meeting-title'),
  captureTab: document.getElementById('capture-tab'),
  captureMic: document.getElementById('capture-mic'),
  btnStart: document.getElementById('btn-start'),
  errorSection: document.getElementById('error-section'),
  errorMessage: document.getElementById('error-message'),
  meetWarning: document.getElementById('meet-warning')
};

// State
let state = {
  meetingTitle: '',
  isOnMeetTab: false
};

// Initialiseer popup
async function init() {
  // Check of we op een Meet tab zijn
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.isOnMeetTab = tab?.url?.includes('meet.google.com');

  if (!state.isOnMeetTab) {
    showMeetWarning();
    return;
  }

  // Haal meeting info op via content script
  try {
    const meetingInfo = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_INFO' });
    if (meetingInfo?.title) {
      state.meetingTitle = meetingInfo.title;
      elements.meetingTitle.textContent = meetingInfo.title;
      elements.meetingInfo.classList.remove('hidden');
    }
  } catch (err) {
    console.log('[Voik] Kon meeting info niet ophalen:', err);
  }

  // Laad opgeslagen voorkeuren
  loadPreferences();

  // Setup event listeners
  setupEventListeners();

  // Update UI
  elements.statusIndicator.classList.add('idle');
  elements.statusText.textContent = 'Klaar om op te nemen';
}

function loadPreferences() {
  chrome.storage.local.get(['captureTab', 'captureMic'], (result) => {
    if (result.captureTab !== undefined) {
      elements.captureTab.checked = result.captureTab;
    }
    if (result.captureMic !== undefined) {
      elements.captureMic.checked = result.captureMic;
    }
  });
}

function savePreferences() {
  chrome.storage.local.set({
    captureTab: elements.captureTab.checked,
    captureMic: elements.captureMic.checked
  });
}

function setupEventListeners() {
  elements.captureTab.addEventListener('change', savePreferences);
  elements.captureMic.addEventListener('change', savePreferences);
  elements.btnStart.addEventListener('click', startRecording);
}

async function startRecording() {
  const captureTab = elements.captureTab.checked;
  const captureMic = elements.captureMic.checked;

  if (!captureTab && !captureMic) {
    showError('Selecteer minimaal een audiobron');
    return;
  }

  hideError();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Haal tab capture stream ID op
    let tabStreamId = null;
    if (captureTab) {
      tabStreamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(streamId);
          }
        });
      });
    }

    // Open recorder tab met parameters
    const recorderUrl = new URL(chrome.runtime.getURL('recorder.html'));
    recorderUrl.searchParams.set('streamId', tabStreamId || '');
    recorderUrl.searchParams.set('captureTab', captureTab);
    recorderUrl.searchParams.set('captureMic', captureMic);
    recorderUrl.searchParams.set('title', state.meetingTitle || '');

    chrome.tabs.create({ url: recorderUrl.toString() });

    // Sluit popup
    window.close();

  } catch (err) {
    console.error('[Voik] Start recording error:', err);
    showError('Kon opname niet starten: ' + err.message);
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorSection.classList.remove('hidden');
}

function hideError() {
  elements.errorSection.classList.add('hidden');
}

function showMeetWarning() {
  elements.meetWarning.classList.remove('hidden');
  elements.btnStart.disabled = true;
  elements.captureTab.disabled = true;
  elements.captureMic.disabled = true;
}

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', init);
