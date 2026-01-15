// components/MeetImport.jsx
// Handelt audio import van de Chrome Extension af

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscriptionUpload } from '../hooks/useTranscriptionUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAudio,
  faUpload,
  faPlay,
  faTimes,
  faCheck,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

function MeetImport({ user, onClose, onSuccess }) {
  const [pendingAudio, setPendingAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  const { uploading, progress, error: uploadError, uploadAndQueueTranscription } = useTranscriptionUpload(user);

  // Haal audio op via postMessage naar extension bridge
  useEffect(() => {
    let timeoutId;
    let bridgeReady = false;

    function handleMessage(event) {
      if (event.source !== window) return;

      // Bridge is klaar
      if (event.data?.type === 'VOIK_BRIDGE_READY') {
        console.log('[MeetImport] Bridge ready, requesting audio...');
        bridgeReady = true;
        window.postMessage({ type: 'VOIK_GET_PENDING_AUDIO' }, '*');
      }

      // Audio response ontvangen
      if (event.data?.type === 'VOIK_PENDING_AUDIO_RESPONSE') {
        clearTimeout(timeoutId);

        if (event.data.success && event.data.data) {
          const { data, duration, meetingTitle, mimeType, size, timestamp } = event.data.data;

          // Check of data niet te oud is (max 1 uur)
          const age = Date.now() - timestamp;
          if (age > 3600000) {
            setError('De opname is verlopen. Maak een nieuwe opname.');
            window.postMessage({ type: 'VOIK_CLEAR_PENDING_AUDIO' }, '*');
            setLoading(false);
            return;
          }

          // Converteer base64 naar blob
          try {
            const byteCharacters = atob(data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType || 'audio/webm;codecs=opus' });

            setPendingAudio({
              duration,
              meetingTitle,
              mimeType,
              size,
              timestamp
            });
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
            setTitle(meetingTitle || `Meet opname ${new Date().toLocaleDateString('nl-NL')}`);
          } catch (err) {
            console.error('[MeetImport] Base64 decode error:', err);
            setError('Kon audio niet decoderen');
          }
        } else {
          setError(event.data.error || 'Geen audio gevonden');
        }
        setLoading(false);
      }
    }

    window.addEventListener('message', handleMessage);

    // Request audio data (bridge might already be ready)
    setLoading(true);
    setError(null);

    // Probeer direct te communiceren (bridge kan al geladen zijn)
    window.postMessage({ type: 'VOIK_GET_PENDING_AUDIO' }, '*');

    // Timeout als we geen response krijgen
    timeoutId = setTimeout(() => {
      if (!bridgeReady) {
        setError('Chrome extension niet gedetecteerd. Installeer de Voik Meet Transcriber extension en herlaad de pagina.');
        setLoading(false);
      }
    }, 3000);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const handleUpload = useCallback(async () => {
    if (!audioBlob) return;

    try {
      await uploadAndQueueTranscription({
        audioBlob,
        title: title.trim() || `Meet opname ${new Date().toLocaleDateString('nl-NL')}`,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        language: 'nl',
        durationSec: pendingAudio?.duration || 0,
        formattedDuration: formatDuration(pendingAudio?.duration || 0),
        mimeType: pendingAudio?.mimeType || 'audio/webm;codecs=opus'
      });

      // Verwijder pending audio uit storage via bridge
      window.postMessage({ type: 'VOIK_CLEAR_PENDING_AUDIO' }, '*');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Error wordt getoond via uploadError state
    }
  }, [audioBlob, title, tags, pendingAudio, uploadAndQueueTranscription, onSuccess]);

  const handleDiscard = useCallback(() => {
    // Verwijder pending audio uit storage via bridge
    window.postMessage({ type: 'VOIK_CLEAR_PENDING_AUDIO' }, '*');

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (onClose) {
      onClose();
    }
  }, [audioUrl, onClose]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="meet-import-modal">
        <div className="meet-import-content">
          <div className="meet-import-loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Audio laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !audioBlob) {
    return (
      <div className="meet-import-modal">
        <div className="meet-import-content">
          <div className="meet-import-error">
            <h3>Import mislukt</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={onClose}>
              Sluiten
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meet-import-modal">
      <div className="meet-import-content">
        <div className="meet-import-header">
          <FontAwesomeIcon icon={faFileAudio} className="header-icon" />
          <h2>Google Meet Opname Importeren</h2>
          <button className="close-btn" onClick={handleDiscard} title="Sluiten">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {pendingAudio && (
          <div className="meet-import-info">
            <div className="info-item">
              <span className="label">Duur:</span>
              <span className="value">{formatDuration(pendingAudio.duration)}</span>
            </div>
            <div className="info-item">
              <span className="label">Grootte:</span>
              <span className="value">{formatSize(pendingAudio.size)}</span>
            </div>
            {pendingAudio.meetingTitle && (
              <div className="info-item">
                <span className="label">Meeting:</span>
                <span className="value">{pendingAudio.meetingTitle}</span>
              </div>
            )}
          </div>
        )}

        {audioUrl && (
          <div className="meet-import-preview">
            <audio ref={audioRef} src={audioUrl} controls />
          </div>
        )}

        <div className="meet-import-form">
          <div className="form-group">
            <label htmlFor="import-title">Titel</label>
            <input
              id="import-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Geef een titel aan deze transcriptie"
            />
          </div>

          <div className="form-group">
            <label htmlFor="import-tags">Tags (komma gescheiden)</label>
            <input
              id="import-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meeting, google-meet, notities"
            />
          </div>
        </div>

        {(uploadError || error) && (
          <div className="meet-import-error-message">
            {uploadError || error}
          </div>
        )}

        {uploading && (
          <div className="meet-import-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">Uploaden... {progress}%</span>
          </div>
        )}

        <div className="meet-import-actions">
          <button
            className="btn btn-secondary"
            onClick={handleDiscard}
            disabled={uploading}
          >
            <FontAwesomeIcon icon={faTimes} /> Annuleren
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !audioBlob}
          >
            <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
            {uploading ? `Uploaden... ${progress}%` : 'Upload & Transcribeer'}
          </button>
        </div>
      </div>

      <style>{`
        .meet-import-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .meet-import-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .meet-import-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .meet-import-header .header-icon {
          font-size: 24px;
          color: #1a73e8;
        }

        .meet-import-header h2 {
          flex: 1;
          margin: 0;
          font-size: 18px;
        }

        .meet-import-header .close-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #666;
          border-radius: 4px;
        }

        .meet-import-header .close-btn:hover {
          background: #f0f0f0;
        }

        .meet-import-loading,
        .meet-import-error {
          padding: 40px;
          text-align: center;
        }

        .meet-import-loading p {
          margin-top: 16px;
          color: #666;
        }

        .meet-import-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px 20px;
          background: #f8f9fa;
        }

        .meet-import-info .info-item {
          display: flex;
          flex-direction: column;
        }

        .meet-import-info .label {
          font-size: 12px;
          color: #666;
        }

        .meet-import-info .value {
          font-weight: 500;
        }

        .meet-import-preview {
          padding: 16px 20px;
        }

        .meet-import-preview audio {
          width: 100%;
          height: 40px;
        }

        .meet-import-form {
          padding: 16px 20px;
        }

        .meet-import-form .form-group {
          margin-bottom: 16px;
        }

        .meet-import-form label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .meet-import-form input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .meet-import-form input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        .meet-import-error-message {
          margin: 0 20px 16px;
          padding: 12px;
          background: #ffebee;
          color: #c62828;
          border-radius: 6px;
          font-size: 14px;
        }

        .meet-import-progress {
          padding: 0 20px 16px;
        }

        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #1a73e8;
          transition: width 0.3s ease;
        }

        .progress-text {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }

        .meet-import-actions {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .meet-import-actions .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .meet-import-actions .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .meet-import-actions .btn-primary {
          background: #1a73e8;
          color: white;
        }

        .meet-import-actions .btn-primary:hover:not(:disabled) {
          background: #1557b0;
        }

        .meet-import-actions .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .meet-import-actions .btn-secondary:hover:not(:disabled) {
          background: #e8e8e8;
        }
      `}</style>
    </div>
  );
}

export default MeetImport;
