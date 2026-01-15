// components/MiniRecorder.jsx
// Compact recording overlay for embedding in PlannerBoard
import { useState, useCallback } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTranscriptionUpload } from '../hooks/useTranscriptionUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faPause,
  faPlay,
  faStop,
  faUpload,
  faTimes,
  faRedo,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/MiniRecorder.css';

function MiniRecorder({ user, onClose, onUploadComplete }) {
  const {
    isRecording,
    isPaused,
    formattedDuration,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    hasRecording,
    duration
  } = useAudioRecording();

  const { uploading, progress, error: uploadError, uploadAndQueueTranscription } = useTranscriptionUpload(user);
  const [title, setTitle] = useState('');

  const handleUpload = useCallback(async () => {
    if (!audioBlob) return;
    try {
      await uploadAndQueueTranscription({
        audioBlob,
        title: title.trim() || `Quick Recording ${new Date().toLocaleDateString('nl-NL')}`,
        tags: ['quick-record'],
        language: 'nl',
        durationSec: duration,
        formattedDuration,
        mimeType: audioBlob.type || 'audio/webm'
      });
      resetRecording();
      setTitle('');
      if (onUploadComplete) onUploadComplete();
      if (onClose) onClose();
    } catch (e) {
      // Error is surfaced via uploadError state
    }
  }, [audioBlob, title, duration, formattedDuration, uploadAndQueueTranscription, resetRecording, onUploadComplete, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    resetRecording();
    if (onClose) onClose();
  }, [isRecording, stopRecording, resetRecording, onClose]);

  const error = recordingError || uploadError;

  return (
    <div className="mini-recorder-overlay">
      <div className="mini-recorder">
        <div className="mini-recorder-header">
          <span className="mini-recorder-title">
            {isRecording && <span className="recording-dot" />}
            {isRecording ? 'Recording...' : hasRecording ? 'Review' : 'Quick Record'}
          </span>
          <button className="mini-recorder-close" onClick={handleClose} title="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="mini-recorder-duration">{formattedDuration}</div>

        {audioUrl && !isRecording && (
          <div className="mini-recorder-audio">
            <audio src={audioUrl} controls />
          </div>
        )}

        <div className="mini-recorder-controls">
          {!isRecording && !hasRecording && (
            <button className="mini-btn primary large" onClick={startRecording}>
              <FontAwesomeIcon icon={faMicrophone} /> Start
            </button>
          )}

          {isRecording && (
            <>
              <button className="mini-btn secondary" onClick={isPaused ? resumeRecording : pauseRecording}>
                <FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="mini-btn danger" onClick={stopRecording}>
                <FontAwesomeIcon icon={faStop} /> Stop
              </button>
            </>
          )}

          {hasRecording && !isRecording && (
            <div className="mini-recorder-save">
              <input
                type="text"
                className="mini-title-input"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="mini-btn-row">
                <button className="mini-btn secondary" onClick={resetRecording} title="New recording">
                  <FontAwesomeIcon icon={faRedo} />
                </button>
                <button
                  className="mini-btn primary flex-1"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <FontAwesomeIcon icon={faUpload} />
                  {uploading ? `${progress}%` : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mini-error">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default MiniRecorder;
