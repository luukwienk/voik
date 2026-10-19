// Voik: record and transcribe conversations (in-app, PWA on mobile, Meet extension)
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAuth } from './hooks/useAuth';
import { useAccess } from './hooks/useAccess';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MeetImport from './components/MeetImport';
import Landing from './pages/Landing';
import Home from './pages/Home';
import NoAccess from './pages/NoAccess';
import ExtensionInstall from './pages/ExtensionInstall';
import { debugLog, debugError } from './utils/debug';

function App() {
  const { user, authReady, signOut } = useAuth();
  const access = useAccess(user);
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

  // One route besides the app itself; Netlify serves index.html for every path
  if (window.location.pathname.replace(/\/$/, '') === '/extensie') {
    return <ExtensionInstall user={user} />;
  }

  if (!authReady || (user && access === 'checking')) return <div className="app-splash" />;
  if (!user) return <Landing />;
  if (access === 'denied') return <NoAccess user={user} signOut={signOut} />;

  return (
    <div className="App">
      <Home
        user={user}
        signOut={signOut}
        pendingTranscriptionId={pendingTranscriptionId}
        onNavigateToTranscription={handleNavigateToTranscription}
        onClearPendingTranscription={() => setPendingTranscriptionId(null)}
      />

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
