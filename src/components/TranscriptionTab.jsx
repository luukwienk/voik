// components/TranscriptionTab.jsx
import { useState } from 'react';
import TranscriptionList from './TranscriptionList';
import QuickRecordButton from './QuickRecordButton';
import MiniRecorder from './MiniRecorder';
import '../styles/TranscriptionTab.css';

// The recorder overlay state lives in the parent so the start screen can open it too
function TranscriptionTab({ user, showRecorder, onShowRecorder, pendingTranscriptionId, onNavigateToTranscription, onClearPendingTranscription }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Refresh the list when a new recording is uploaded
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="transcription-tab">
      <TranscriptionList
        user={user}
        key={refreshKey}
        pendingTranscriptionId={pendingTranscriptionId}
        onClearPendingTranscription={onClearPendingTranscription}
      />

      {/* Quick Record Button */}
      <QuickRecordButton
        onClick={() => onShowRecorder(true)}
        isActive={showRecorder}
      />

      {/* Mini Recorder Overlay */}
      {showRecorder && (
        <MiniRecorder
          user={user}
          onClose={() => onShowRecorder(false)}
          onUploadComplete={handleUploadComplete}
          onNavigateToTranscription={onNavigateToTranscription}
        />
      )}
    </div>
  );
}

export default TranscriptionTab;
