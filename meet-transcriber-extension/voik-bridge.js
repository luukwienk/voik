// voik-bridge.js - Content script dat draait op de Voik webapp
// Bridget chrome.storage naar de webapp via postMessage

console.log('[Voik Bridge] Content script geladen op Voik webapp');

// Luister naar requests van de webapp
window.addEventListener('message', async (event) => {
  // Alleen berichten van dezelfde origin accepteren
  if (event.source !== window) return;

  if (event.data?.type === 'VOIK_GET_PENDING_AUDIO') {
    console.log('[Voik Bridge] Webapp vraagt om audio data');

    try {
      const result = await chrome.storage.local.get(['pendingAudio']);

      if (result.pendingAudio) {
        console.log('[Voik Bridge] Audio data gevonden, sturen naar webapp');
        window.postMessage({
          type: 'VOIK_PENDING_AUDIO_RESPONSE',
          success: true,
          data: result.pendingAudio
        }, '*');
      } else {
        console.log('[Voik Bridge] Geen pending audio gevonden');
        window.postMessage({
          type: 'VOIK_PENDING_AUDIO_RESPONSE',
          success: false,
          error: 'Geen audio gevonden. Maak eerst een opname met de Chrome extension.'
        }, '*');
      }
    } catch (err) {
      console.error('[Voik Bridge] Error:', err);
      window.postMessage({
        type: 'VOIK_PENDING_AUDIO_RESPONSE',
        success: false,
        error: 'Kon audio niet ophalen: ' + err.message
      }, '*');
    }
  }

  if (event.data?.type === 'VOIK_CLEAR_PENDING_AUDIO') {
    console.log('[Voik Bridge] Webapp vraagt om audio te verwijderen');
    try {
      await chrome.storage.local.remove(['pendingAudio']);
      window.postMessage({
        type: 'VOIK_CLEAR_AUDIO_RESPONSE',
        success: true
      }, '*');
    } catch (err) {
      console.error('[Voik Bridge] Clear error:', err);
    }
  }

  // Firebase config en auth token opslaan voor directe uploads
  if (event.data?.type === 'VOIK_SET_FIREBASE_CONFIG') {
    console.log('[Voik Bridge] Firebase config ontvangen');
    try {
      await chrome.storage.local.set({
        firebaseConfig: {
          projectId: event.data.projectId,
          storageBucket: event.data.storageBucket,
          authToken: event.data.authToken,
          userId: event.data.userId,
          timestamp: Date.now()
        }
      });
      window.postMessage({
        type: 'VOIK_FIREBASE_CONFIG_SAVED',
        success: true
      }, '*');
    } catch (err) {
      console.error('[Voik Bridge] Firebase config error:', err);
      window.postMessage({
        type: 'VOIK_FIREBASE_CONFIG_SAVED',
        success: false,
        error: err.message
      }, '*');
    }
  }

  // Firebase config ophalen (voor popup)
  if (event.data?.type === 'VOIK_GET_FIREBASE_CONFIG') {
    try {
      const result = await chrome.storage.local.get(['firebaseConfig']);
      window.postMessage({
        type: 'VOIK_FIREBASE_CONFIG_RESPONSE',
        success: !!result.firebaseConfig,
        data: result.firebaseConfig
      }, '*');
    } catch (err) {
      window.postMessage({
        type: 'VOIK_FIREBASE_CONFIG_RESPONSE',
        success: false,
        error: err.message
      }, '*');
    }
  }
});

// Laat de webapp weten dat de bridge beschikbaar is
window.postMessage({ type: 'VOIK_BRIDGE_READY' }, '*');
console.log('[Voik Bridge] Bridge ready signal verzonden');
