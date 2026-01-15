// recorder.js - Audio opname in een apart tabblad

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
const postRecording = document.getElementById('post-recording');
const playback = document.getElementById('playback');
const sizeInfo = document.getElementById('size-info');
const infoEl = document.getElementById('info');

// Initialiseer
async function init() {
  if (!tabStreamId && captureTab) {
    showError('Geen stream ID ontvangen. Sluit dit tabblad en probeer opnieuw via de extension.');
    return;
  }

  // Update info text
  let sources = [];
  if (captureTab) sources.push('Meet tab audio');
  if (captureMic) sources.push('microfoon');
  if (sources.length > 0) {
    infoEl.textContent = `De opname bevat: ${sources.join(' + ')}`;
  }

  setStatus('ready', 'Klaar om op te nemen');
}

function setStatus(state, text) {
  statusDot.className = 'status-dot ' + state;
  statusText.textContent = text;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
  setStatus('', 'Fout');
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

    // Stereo destination: Left = mic (ik), Right = tab (anderen)
    // We maken een stereo stream met ChannelMergerNode
    const channelMerger = audioContext.createChannelMerger(2);
    const destination = audioContext.createMediaStreamDestination();
    channelMerger.connect(destination);

    // Tab audio capture -> RIGHT channel (anderen)
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

        // Tab naar RIGHT channel (index 1)
        tabGain.connect(channelMerger, 0, 1);

        // Ook naar speakers zodat je anderen nog hoort
        tabGain.connect(audioContext.destination);
      } catch (err) {
        console.error('[Recorder] Tab capture error:', err);
        showError('Kon Meet audio niet capturen: ' + err.message);
        return;
      }
    }

    // Microfoon capture -> LEFT channel (ik)
    if (captureMic) {
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

        // Mic naar LEFT channel (index 0)
        micGain.connect(channelMerger, 0, 0);
      } catch (err) {
        console.error('[Recorder] Mic capture error:', err);
        if (!tabStream) {
          showError('Kon microfoon niet openen: ' + err.message);
          return;
        }
        // Continue zonder microfoon als we tab audio hebben
      }
    }

    // Check of we iets hebben
    if (!tabStream && !micStream) {
      showError('Geen audiobronnen beschikbaar');
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
      playback.src = URL.createObjectURL(audioBlob);
      sizeInfo.textContent = `Duur: ${formatTime(duration)} | Grootte: ${formatSize(audioBlob.size)}`;

      // Show post-recording UI
      controlsRecording.classList.add('hidden');
      postRecording.classList.add('show');
      setStatus('ready', 'Opname voltooid');
    };

    // Start!
    mediaRecorder.start(1000);
    isRecording = true;
    startTime = Date.now();

    // UI
    controlsStart.classList.add('hidden');
    controlsRecording.classList.remove('hidden');
    setStatus('recording', 'Opname bezig...');

    // Timer
    timerInterval = setInterval(updateTimer, 100);

  } catch (err) {
    console.error('[Recorder] Start error:', err);
    showError('Kon opname niet starten: ' + err.message);
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

  try {
    // Get Firebase config from storage
    const result = await chrome.storage.local.get(['firebaseConfig']);
    const config = result.firebaseConfig;

    if (!config || !config.authToken) {
      // Fallback: open Voik met audio in storage
      const base64 = await blobToBase64(audioBlob);
      await chrome.storage.local.set({
        pendingAudio: {
          data: base64,
          duration,
          meetingTitle,
          timestamp: Date.now(),
          mimeType: 'audio/webm;codecs=opus',
          size: audioBlob.size
        }
      });
      window.open('http://localhost:5173?import=meet', '_blank');
      return;
    }

    // Direct upload
    setStatus('', 'Uploaden...');
    document.querySelectorAll('button').forEach(b => b.disabled = true);

    const docId = crypto.randomUUID();
    const path = `transcriptions/${config.userId}/${docId}.webm`;

    // Create Firestore doc
    await createFirestoreDoc(config, docId, {
      title: meetingTitle || `Meet opname ${new Date().toLocaleDateString('nl-NL')}`,
      duration,
      size: audioBlob.size
    });

    // Upload to Storage
    await uploadToStorage(config, path, audioBlob);

    // Update doc
    await updateFirestoreDoc(config, docId, path);

    setStatus('ready', 'Upload voltooid!');
    setTimeout(() => {
      window.open('http://localhost:5173', '_blank');
    }, 1000);

  } catch (err) {
    console.error('[Recorder] Upload error:', err);
    showError('Upload mislukt: ' + err.message);
    document.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

async function createFirestoreDoc(config, docId, meta) {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users/${config.userId}/transcriptions/${docId}`;

  const now = new Date().toISOString();
  const doc = {
    fields: {
      title: { stringValue: meta.title },
      tags: { arrayValue: { values: [{ stringValue: 'google-meet' }] } },
      language: { stringValue: 'nl' },
      duration: { integerValue: String(meta.duration) },
      processingStatus: { stringValue: 'queued' },
      storagePath: { stringValue: '' },
      audioSize: { integerValue: String(meta.size) },
      userId: { stringValue: config.userId },
      source: { stringValue: 'meet-extension' },
      // Stereo channel info voor speaker diarization
      stereoChannels: { mapValue: { fields: {
        left: { stringValue: 'Ik' },
        right: { stringValue: 'Anderen' }
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

function downloadRecording() {
  if (!audioBlob) return;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(audioBlob);
  a.download = `meet-recording-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.webm`;
  a.click();
}

function newRecording() {
  postRecording.classList.remove('show');
  controlsStart.classList.remove('hidden');
  timerEl.textContent = '00:00';
  audioBlob = null;
  duration = 0;
  setStatus('ready', 'Klaar om op te nemen');
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Event listeners (nodig voor Chrome Extension CSP)
document.getElementById('btn-start').addEventListener('click', startRecording);
document.getElementById('btn-stop').addEventListener('click', stopRecording);
document.getElementById('btn-upload').addEventListener('click', uploadToVoik);
document.getElementById('btn-download').addEventListener('click', downloadRecording);
document.getElementById('btn-new').addEventListener('click', newRecording);

// Start
init();
