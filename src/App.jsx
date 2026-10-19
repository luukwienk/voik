// Voik: record and transcribe conversations (in-app, PWA on mobile, Meet extension)
import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import { useAuth } from './hooks/useAuth';
import SignIn from './SignIn';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import TranscriptionTab from './components/TranscriptionTab';
import MeetImport from './components/MeetImport';
import { debugLog, debugError } from './utils/debug';

function App() {
  const { user, signOut } = useAuth();
  const [showMeetImport, setShowMeetImport] = useState(false);
  const [pendingTranscriptionId, setPendingTranscriptionId] = useState(null);

  // URL parameters from the Meet extension: ?import=meet and ?transcription=<id>
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);

    if (params.get('import') === 'meet') {
      setShowMeetImport(true);
    }

    const transcriptionId = params.get('transcription');
    if (transcriptionId) {
      setPendingTranscriptionId(transcriptionId);
    }

    if (params.has('import') || params.has('transcription')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  // Share Firebase config with the Chrome extension for direct uploads
  useEffect(() => {
    if (!user) return;

    async function shareFirebaseConfig() {
      try {
        const token = await user.getIdToken(true);
        window.postMessage({
          type: 'VOIK_SET_FIREBASE_CONFIG',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          authToken: token,
          userId: user.uid
        }, '*');
        debugLog('[App] Firebase config shared with extension');
      } catch (err) {
        debugError('[App] Could not share Firebase config:', err);
      }
    }

    shareFirebaseConfig();

    // ID tokens expire after an hour
    const tokenRefreshInterval = setInterval(shareFirebaseConfig, 30 * 60 * 1000);
    return () => clearInterval(tokenRefreshInterval);
  }, [user]);

  const handleNavigateToTranscription = useCallback((transcriptionId) => {
    setPendingTranscriptionId(transcriptionId);
  }, []);

  if (!user) return <SignIn user={user} />;

  return (
    <div className="App">
      <header className="app-header">
        <span className="app-title">TaskBuddy</span>
        <button className="app-signout" onClick={signOut} title="Uitloggen" aria-label="Uitloggen">
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </header>

      <ErrorBoundary>
        <main className="app-main">
          <TranscriptionTab
            user={user}
            pendingTranscriptionId={pendingTranscriptionId}
            onNavigateToTranscription={handleNavigateToTranscription}
            onClearPendingTranscription={() => setPendingTranscriptionId(null)}
          />
        </main>
      </ErrorBoundary>

      <PWAInstallPrompt />

      {showMeetImport && (
        <MeetImport
          user={user}
          onClose={() => setShowMeetImport(false)}
          onSuccess={() => setShowMeetImport(false)}
        />
      )}
    </div>
  );
}

// Register service worker for PWA functionality
serviceWorkerRegistration.register();

export default App;
