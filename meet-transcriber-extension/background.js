// background.js - Voik Meet Transcriber Service Worker
// Minimale service worker - de meeste functionaliteit zit nu in recorder.js

// Cleanup bij installatie/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Voik BG] Extension geinstalleerd/bijgewerkt');
});

// Message handler voor content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Meeting status updates van content script (optioneel loggen)
  if (message.type === 'MEETING_JOINED' || message.type === 'MEETING_LEFT') {
    console.log('[Voik BG]', message.type, message.title || '');
  }
  return false;
});
