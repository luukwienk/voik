// background.js - Voik Meet Transcriber Service Worker
// Minimal service worker - most functionality is now in recorder.js

// Cleanup on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Voik BG] Extension installed/updated');
});

// Message handler for content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Meeting status updates from content script (optional logging)
  if (message.type === 'MEETING_JOINED' || message.type === 'MEETING_LEFT') {
    console.log('[Voik BG]', message.type, message.title || '');
  }
  return false;
});
