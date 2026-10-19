// Start screen after sign-in: record, Meet, and the list of transcriptions
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faVideo, faSignOutAlt, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import ErrorBoundary from '../components/ErrorBoundary';
import TranscriptionTab from '../components/TranscriptionTab';
import { useExtensionStatus, canInstallExtension } from '../hooks/useExtensionStatus';
import Brand from '../components/Brand';
import '../styles/pages.css';

function Home({ user, signOut, pendingTranscriptionId, onNavigateToTranscription, onClearPendingTranscription }) {
  const [showRecorder, setShowRecorder] = useState(false);
  const extension = useExtensionStatus();
  const desktopChrome = canInstallExtension();

  const meetTile = extension === 'installed'
    ? { href: 'https://meet.google.com/', target: '_blank', text: 'Open Meet en klik op het TaskBuddy-icoon in Chrome.' }
    : { href: '/extensie', text: desktopChrome ? 'Installeer eerst de Chrome-extensie.' : 'Werkt in Chrome op je computer.' };

  return (
    <div className="page page-app">
      <header className="topbar">
        <Brand />
        <div className="topbar-user">
          <span className="topbar-email">{user.email}</span>
          <button className="btn btn-ghost btn-icon" onClick={signOut} title="Uitloggen" aria-label="Uitloggen">
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </header>

      <section className="tiles">
        <button className="tile tile-primary" onClick={() => setShowRecorder(true)}>
          <FontAwesomeIcon icon={faMicrophone} className="tile-icon" />
          <span className="tile-title">Neem op</span>
          <span className="tile-text">Via de microfoon van dit apparaat.</span>
        </button>
        <a className="tile" href={meetTile.href} target={meetTile.target} rel="noreferrer">
          <FontAwesomeIcon icon={faVideo} className="tile-icon" />
          <span className="tile-title">Google Meet opnemen</span>
          <span className="tile-text">{meetTile.text}</span>
        </a>
      </section>

      {extension === 'missing' && desktopChrome && (
        <a className="banner" href="/extensie">
          <FontAwesomeIcon icon={faPuzzlePiece} />
          <span>Neem ook Meet-gesprekken op: installeer de Chrome-extensie →</span>
        </a>
      )}

      <ErrorBoundary>
        <main className="app-main">
          <TranscriptionTab
            user={user}
            showRecorder={showRecorder}
            onShowRecorder={setShowRecorder}
            pendingTranscriptionId={pendingTranscriptionId}
            onNavigateToTranscription={onNavigateToTranscription}
            onClearPendingTranscription={onClearPendingTranscription}
          />
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default Home;
