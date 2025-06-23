// components/TranscriptionTab.jsx
import React, { useState } from 'react';
import TranscriptionRecorder from './TranscriptionRecorder';
import TranscriptionList from './TranscriptionList';
import '../styles/TranscriptionTab.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faClipboardList } from '@fortawesome/free-solid-svg-icons';

function TranscriptionTab({ user, onTasksExtracted }) {
  const [activeView, setActiveView] = useState('recorder');
  const [refreshList, setRefreshList] = useState(0);

  const handleTranscriptionSaved = () => {
    setRefreshList(prev => prev + 1);
    setActiveView('list');
  };

  const handleTasksExtracted = (tasks) => {
    if (onTasksExtracted) {
      onTasksExtracted(tasks);
    }
  };

  return (
    <div className="transcription-tab">
      <div className="transcription-nav">
        <button
          className={`nav-btn ${activeView === 'recorder' ? 'active' : ''}`}
          onClick={() => setActiveView('recorder')}
        >
          <span className="nav-icon"><FontAwesomeIcon icon={faMicrophone} /></span>
          <span className="nav-text">Nieuwe Opname</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          <span className="nav-icon"><FontAwesomeIcon icon={faClipboardList} /></span>
          <span className="nav-text">Mijn Transcripties</span>
        </button>
      </div>

      <div className="transcription-content">
        {activeView === 'recorder' ? (
          <TranscriptionRecorder 
            user={user} 
            onSaved={handleTranscriptionSaved}
          />
        ) : (
          <TranscriptionList 
            user={user} 
            key={refreshList}
            onTasksExtracted={handleTasksExtracted}
          />
        )}
      </div>
    </div>
  );
}

export default TranscriptionTab;