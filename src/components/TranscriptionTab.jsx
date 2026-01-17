// components/TranscriptionTab.jsx
import React, { useState } from 'react';
import TranscriptionList from './TranscriptionList';
import QuickRecordButton from './QuickRecordButton';
import MiniRecorder from './MiniRecorder';
import '../styles/TranscriptionTab.css';

function TranscriptionTab({ user, onTasksExtracted, pendingTranscriptionId, onNavigateToTranscription, onClearPendingTranscription }) {
  const [showMiniRecorder, setShowMiniRecorder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTasksExtracted = (tasks) => {
    if (onTasksExtracted) {
      onTasksExtracted(tasks);
    }
  };

  const handleUploadComplete = () => {
    // Refresh the list when a new recording is uploaded
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="transcription-tab">
      <TranscriptionList
        user={user}
        key={refreshKey}
        onTasksExtracted={handleTasksExtracted}
        pendingTranscriptionId={pendingTranscriptionId}
        onClearPendingTranscription={onClearPendingTranscription}
      />

      {/* Quick Record Button */}
      <QuickRecordButton
        onClick={() => setShowMiniRecorder(true)}
        isActive={showMiniRecorder}
      />

      {/* Mini Recorder Overlay */}
      {showMiniRecorder && (
        <MiniRecorder
          user={user}
          onClose={() => setShowMiniRecorder(false)}
          onUploadComplete={handleUploadComplete}
          onNavigateToTranscription={onNavigateToTranscription}
        />
      )}
    </div>
  );
}

export default TranscriptionTab;