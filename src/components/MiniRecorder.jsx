// components/MiniRecorder.jsx
// Compact recording overlay with auto-upload on stop
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTranscriptionUpload } from '../hooks/useTranscriptionUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faPause,
  faPlay,
  faStop,
  faTimes,
  faSpinner,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/MiniRecorder.css';

function MiniRecorder({ user, onClose, onUploadComplete }) {
  const {
    isRecording,
    isPaused,
    formattedDuration,
    audioBlob,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    duration
  } = useAudioRecording();

  const { uploading, progress, error: uploadError, uploadAndQueueTranscription } = useTranscriptionUpload(user);
  const [language, setLanguage] = useState('auto');
  const [uploadComplete, setUploadComplete] = useState(false);
  const hasTriggeredUpload = useRef(false);
  const savedDuration = useRef(null);
  const savedFormattedDuration = useRef(null);

  const languageOptions = [
    { code: 'auto', label: 'Auto', flag: '🔄' },
    { code: 'nl', label: 'NL', flag: '🇳🇱' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'cs', label: 'CS', flag: '🇨🇿' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ];

  // Generate auto title like "Recording Jan 15, 14:30"
  const generateTitle = () => {
    const now = new Date();
    return `Recording ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  // Save duration when recording to use after stop
  useEffect(() => {
    if (isRecording) {
      savedDuration.current = duration;
      savedFormattedDuration.current = formattedDuration;
    }
  }, [isRecording, duration, formattedDuration]);

  // Auto-upload when audioBlob becomes available (after stop)
  useEffect(() => {
    if (audioBlob && !hasTriggeredUpload.current && !uploading) {
      hasTriggeredUpload.current = true;

      const doUpload = async () => {
        try {
          await uploadAndQueueTranscription({
            audioBlob,
            title: generateTitle(),
            tags: ['quick-record'],
            language: language,
            durationSec: savedDuration.current || duration,
            formattedDuration: savedFormattedDuration.current || formattedDuration,
            mimeType: audioBlob.type || 'audio/webm'
          });
          setUploadComplete(true);
          if (onUploadComplete) onUploadComplete();
          // Auto-close after brief success indication
          setTimeout(() => {
            if (onClose) onClose();
          }, 1000);
        } catch (e) {
          // Error is surfaced via uploadError state
          hasTriggeredUpload.current = false; // Allow retry
        }
      };

      doUpload();
    }
  }, [audioBlob, uploading, language, duration, formattedDuration, uploadAndQueueTranscription, onUploadComplete, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      // Just close without saving if still recording
      resetRecording();
    }
    if (onClose) onClose();
  }, [isRecording, resetRecording, onClose]);

  const error = recordingError || uploadError;

  // Determine current state for UI
  const isUploading = uploading || (audioBlob && !uploadComplete && !error);
  const showSuccess = uploadComplete && !error;

  return (
    <div className="mini-recorder-overlay">
      <div className="mini-recorder">
        <div className="mini-recorder-header">
          <span className="mini-recorder-title">
            {isRecording && <span className="recording-dot" />}
            {isRecording ? 'Recording...' : isUploading ? 'Uploading...' : showSuccess ? 'Done!' : 'Quick Record'}
          </span>
          <button className="mini-recorder-close" onClick={handleClose} title="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="mini-recorder-duration">
          {isUploading || showSuccess ? (savedFormattedDuration.current || formattedDuration) : formattedDuration}
        </div>

        {!isUploading && !showSuccess && (
          <div className="mini-recorder-language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRecording}
            >
              {languageOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.flag} {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mini-recorder-controls">
          {!isRecording && !audioBlob && !isUploading && !showSuccess && (
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

          {isUploading && (
            <div className="mini-upload-status">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Uploading... {progress > 0 ? `${progress}%` : ''}</span>
            </div>
          )}

          {showSuccess && (
            <div className="mini-upload-status success">
              <FontAwesomeIcon icon={faCheck} />
              <span>Uploaded successfully</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mini-error">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
            <button className="mini-btn secondary small" onClick={() => { hasTriggeredUpload.current = false; }}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiniRecorder;
