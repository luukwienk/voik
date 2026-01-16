// popup.js - Voik Meet Transcriber Popup
// Start recording by opening recorder tab

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

// Initialize popup
async function init() {
  // Check if we're on a Meet tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.isOnMeetTab = tab?.url?.includes('meet.google.com');

  if (!state.isOnMeetTab) {
    showMeetWarning();
    return;
  }

  // Get meeting info via content script
  try {
    const meetingInfo = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_INFO' });
    if (meetingInfo?.title) {
      state.meetingTitle = meetingInfo.title;
      elements.meetingTitle.textContent = meetingInfo.title;
      elements.meetingInfo.classList.remove('hidden');
    }
  } catch (err) {
    console.log('[Voik] Could not get meeting info:', err);
  }

  // Load saved preferences
  loadPreferences();

  // Setup event listeners
  setupEventListeners();

  // Update UI
  elements.statusIndicator.classList.add('idle');
  elements.statusText.textContent = 'Ready to record';
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
    showError('Select at least one audio source');
    return;
  }

  hideError();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Get tab capture stream ID
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

    // Open recorder tab with parameters
    const recorderUrl = new URL(chrome.runtime.getURL('recorder.html'));
    recorderUrl.searchParams.set('streamId', tabStreamId || '');
    recorderUrl.searchParams.set('captureTab', captureTab);
    recorderUrl.searchParams.set('captureMic', captureMic);
    recorderUrl.searchParams.set('title', state.meetingTitle || '');

    chrome.tabs.create({ url: recorderUrl.toString() });

    // Close popup
    window.close();

  } catch (err) {
    console.error('[Voik] Start recording error:', err);
    showError('Could not start recording: ' + err.message);
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

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
