// recorder.js - Audio recording in a separate tab

let audioContext = null;
let mediaRecorder = null;
let recordedChunks = [];
let tabStream = null;
let micStream = null;
let isRecording = false;
let startTime = null;
let timerInterval = null;
let audioBlob = null;
let duration = 0;

// URL parameters
const params = new URLSearchParams(window.location.search);
const tabStreamId = params.get('streamId');
const captureTab = params.get('captureTab') === 'true';
const captureMic = params.get('captureMic') === 'true';
const meetingTitle = params.get('title') || '';

// DOM elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const errorEl = document.getElementById('error');
const controlsStart = document.getElementById('controls-start');
const controlsRecording = document.getElementById('controls-recording');
const uploadStatusEl = document.getElementById('upload-status');
const uploadMessageEl = document.getElementById('upload-message');
const infoEl = document.getElementById('info');
const languageSelect = document.getElementById('language-select');

// Initialize
async function init() {
  if (!tabStreamId && captureTab) {
    showError('No stream ID received. Close this tab and try again via the extension.');
    return;
  }

  // Update info text
  let sources = [];
  if (captureTab) sources.push('Meet tab audio');
  if (captureMic) sources.push('microphone');
  if (sources.length > 0) {
    infoEl.textContent = `Recording includes: ${sources.join(' + ')}`;
  }

  setStatus('ready', 'Ready to record');
}

function setStatus(state, text) {
  statusDot.className = 'status-dot ' + state;
  statusText.textContent = text;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
  setStatus('', 'Error');
}

function hideError() {
  errorEl.style.display = 'none';
}

async function startRecording() {
  hideError();
  recordedChunks = [];

  try {
    // Audio context
    audioContext = new AudioContext({ sampleRate: 44100 });
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Stereo destination: Left = mic (me), Right = tab (others)
    // We create a stereo stream with ChannelMergerNode
    const channelMerger = audioContext.createChannelMerger(2);
    const destination = audioContext.createMediaStreamDestination();
    channelMerger.connect(destination);

    // Tab audio capture -> RIGHT channel (others)
    if (captureTab && tabStreamId) {
      try {
        tabStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: tabStreamId
            }
          },
          video: false
        });

        const tabSource = audioContext.createMediaStreamSource(tabStream);
        const tabGain = audioContext.createGain();
        tabGain.gain.value = 1.0;
        tabSource.connect(tabGain);

        // Tab to RIGHT channel (index 1)
        tabGain.connect(channelMerger, 0, 1);

        // Also to speakers so you can still hear others
        tabGain.connect(audioContext.destination);
      } catch (err) {
        console.error('[Recorder] Tab capture error:', err);
        showError('Could not capture Meet audio: ' + err.message);
        return;
      }
    }

    // Microphone capture -> LEFT channel (me)
    // Small delay to let Chrome's permission UI settle after tab capture
    if (captureMic) {
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
          video: false
        });

        const micSource = audioContext.createMediaStreamSource(micStream);
        const micGain = audioContext.createGain();
        micGain.gain.value = 1.0;
        micSource.connect(micGain);

        // Mic to LEFT channel (index 0)
        micGain.connect(channelMerger, 0, 0);
      } catch (err) {
        console.error('[Recorder] Mic capture error:', err);
        if (!tabStream) {
          showError('Could not access microphone: ' + err.message);
          return;
        }
        // Continue without microphone if we have tab audio
      }
    }

    // Check if we have any audio sources
    if (!tabStream && !micStream) {
      showError('No audio sources available');
      return;
    }

    // MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(recordedChunks, { type: mimeType });

      // Auto-upload immediately
      controlsRecording.classList.add('hidden');
      uploadStatusEl.classList.add('show');
      setStatus('ready', 'Uploading...');
      uploadToVoik();
    };

    // Start!
    mediaRecorder.start(1000);
    isRecording = true;
    startTime = Date.now();

    // UI
    controlsStart.classList.add('hidden');
    controlsRecording.classList.remove('hidden');
    languageSelect.disabled = true;
    setStatus('recording', 'Recording...');

    // Timer
    timerInterval = setInterval(updateTimer, 100);

  } catch (err) {
    console.error('[Recorder] Start error:', err);
    showError('Could not start recording: ' + err.message);
    cleanup();
  }
}

function stopRecording() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  duration = Math.floor((Date.now() - startTime) / 1000);

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  isRecording = false;
  cleanup();
}

function cleanup() {
  if (tabStream) {
    tabStream.getTracks().forEach(t => t.stop());
    tabStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}

function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  timerEl.textContent = formatTime(elapsed);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadToVoik() {
  if (!audioBlob) return;

  const VOIK_URL = 'https://voik.netlify.app';

  try {
    // Get Firebase config from storage
    const result = await chrome.storage.local.get(['firebaseConfig']);
    const config = result.firebaseConfig;

    if (!config || !config.authToken) {
      // Fallback: open Voik with audio in storage
      const base64 = await blobToBase64(audioBlob);
      await chrome.storage.local.set({
        pendingAudio: {
          data: base64,
          duration,
          meetingTitle,
          language: languageSelect.value,
          timestamp: Date.now(),
          mimeType: 'audio/webm;codecs=opus',
          size: audioBlob.size
        }
      });
      await navigateToVoik(`${VOIK_URL}?import=meet`);
      return;
    }

    // Direct upload
    uploadMessageEl.textContent = 'Uploading...';

    const docId = crypto.randomUUID();
    const path = `transcriptions/${config.userId}/${docId}.webm`;

    // Create Firestore doc
    await createFirestoreDoc(config, docId, {
      title: meetingTitle || `Meet recording ${new Date().toLocaleDateString('en-US')}`,
      duration,
      size: audioBlob.size
    });

    // Upload to Storage
    await uploadToStorage(config, path, audioBlob);

    // Update doc
    await updateFirestoreDoc(config, docId, path);

    // Show success state
    uploadStatusEl.classList.add('success');
    uploadMessageEl.textContent = 'Uploaded!';
    setStatus('ready', 'Upload complete!');

    // Navigate to specific transcription and close this tab
    setTimeout(async () => {
      await navigateToVoik(`${VOIK_URL}?transcription=${docId}`);
      window.close();
    }, 1000);

  } catch (err) {
    console.error('[Recorder] Upload error:', err);
    showError('Upload failed: ' + err.message);
    uploadStatusEl.classList.remove('show');
    controlsStart.classList.remove('hidden');
  }
}

// Navigate to Voik - reuse existing tab if found, otherwise open new
async function navigateToVoik(url) {
  try {
    // Find existing Voik tab
    const tabs = await chrome.tabs.query({ url: 'https://voik.netlify.app/*' });

    if (tabs.length > 0) {
      // Reuse existing tab - update URL and focus it
      const existingTab = tabs[0];
      await chrome.tabs.update(existingTab.id, { url, active: true });
      await chrome.windows.update(existingTab.windowId, { focused: true });
    } else {
      // No existing tab, open new one
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    console.error('[Recorder] Navigation error:', err);
    // Fallback to simple window.open
    window.open(url, '_blank');
  }
}

async function createFirestoreDoc(config, docId, meta) {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${config.userId}/transcriptions/${docId}`;

  const selectedLanguage = languageSelect.value;
  const now = new Date().toISOString();
  const doc = {
    fields: {
      title: { stringValue: meta.title },
      tags: { arrayValue: { values: [{ stringValue: 'google-meet' }] } },
      language: { stringValue: selectedLanguage },
      duration: { integerValue: String(meta.duration) },
      processingStatus: { stringValue: 'queued' },
      storagePath: { stringValue: '' },
      audioSize: { integerValue: String(meta.size) },
      userId: { stringValue: config.userId },
      source: { stringValue: 'meet-extension' },
      // Stereo channel info for speaker diarization
      stereoChannels: { mapValue: { fields: {
        left: { stringValue: 'Me' },
        right: { stringValue: 'Others' }
      }}},
      createdAt: { timestampValue: now },
      updatedAt: { timestampValue: now }
    }
  };

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(doc)
  });

  if (!resp.ok) throw new Error('Firestore error: ' + resp.status);
}

async function uploadToStorage(config, path, blob) {
  const url = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${encodeURIComponent(path)}?uploadType=media`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
      'Content-Type': 'audio/webm'
    },
    body: blob
  });

  if (!resp.ok) throw new Error('Storage error: ' + resp.status);
}

async function updateFirestoreDoc(config, docId, path) {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${config.userId}/transcriptions/${docId}?updateMask.fieldPaths=storagePath&updateMask.fieldPaths=processingStatus&updateMask.fieldPaths=updatedAt`;

  const doc = {
    fields: {
      storagePath: { stringValue: path },
      processingStatus: { stringValue: 'processing' },
      updatedAt: { timestampValue: new Date().toISOString() }
    }
  };

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(doc)
  });

  if (!resp.ok) throw new Error('Firestore update error: ' + resp.status);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Event listeners (required for Chrome Extension CSP)
document.getElementById('btn-start').addEventListener('click', startRecording);
document.getElementById('btn-stop').addEventListener('click', stopRecording);

// Start
init();
