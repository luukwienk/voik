// components/TranscriptionRecorder.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { TranscriptionService } from '../services/transcription';
import '../styles/TranscriptionRecorder.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faPause,
  faPlay,
  faStop,
  faSave,
  faTimes,
  faCheck,
  faTrash,
  faFileAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

function TranscriptionRecorder({ user, onSaved }) {
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
    estimatedCost
  } = useAudioRecording();

  const { saveTranscription } = useTranscriptions(user);
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const audioRef = useRef(null);
  const transcriptionService = useRef(
    new TranscriptionService(import.meta.env.VITE_OPENAI_API_KEY)
  );

  const handleTranscribe = useCallback(async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      const result = await transcriptionService.current.transcribeAudio(audioBlob, {
        language: 'nl',
        prompt: 'Dit is een Nederlandse transcriptie.'
      });

      setTranscriptionResult(result);
      setShowSaveDialog(true);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError(error.message || 'Transcriptie mislukt');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob]);

  const handleSave = useCallback(async () => {
    if (!transcriptionResult) return;

    try {
      const transcriptionData = {
        title: title.trim() || `Transcriptie ${new Date().toLocaleDateString('nl-NL')}`,
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        formattedDuration: formattedDuration,
        segments: transcriptionResult.segments || [],
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        audioSize: audioBlob.size,
        cost: estimatedCost.estimatedCost
      };

      await saveTranscription(transcriptionData);
      
      if (onSaved) {
        onSaved();
      }
      
      resetRecording();
      setTranscriptionResult(null);
      setTitle('');
      setTags('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Save error:', error);
      setTranscriptionError('Kon transcriptie niet opslaan');
    }
  }, [transcriptionResult, title, tags, formattedDuration, audioBlob, estimatedCost, saveTranscription, resetRecording, onSaved]);

  const handleCancel = useCallback(() => {
    setShowSaveDialog(false);
    setTranscriptionResult(null);
  }, []);

  const error = recordingError || transcriptionError;

  return (
    <div className="transcription-recorder">
      <div className="recorder-section">
        <div className="recorder-header">
          <h3>Audio Opname</h3>
          {isRecording && (
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Opname actief
            </div>
          )}
        </div>

        <div className="recorder-controls">
          {!isRecording && !hasRecording && (
            <button 
              className="recorder-btn primary"
              onClick={startRecording}
            >
              <FontAwesomeIcon icon={faMicrophone} /> Start Opname
            </button>
          )}

          {isRecording && (
            <>
              <button 
                className="recorder-btn secondary"
                onClick={isPaused ? resumeRecording : pauseRecording}
              >
                <FontAwesomeIcon icon={isPaused ? faPlay : faPause} /> {isPaused ? 'Hervat' : 'Pauzeer'}
              </button>
              <button 
                className="recorder-btn danger"
                onClick={stopRecording}
              >
                <FontAwesomeIcon icon={faStop} /> Stop
              </button>
            </>
          )}

          {hasRecording && !isRecording && (
            <>
              <button 
                className="recorder-btn primary"
                onClick={handleTranscribe}
                disabled={isTranscribing}
              >
                <FontAwesomeIcon icon={faFileAlt} /> {isTranscribing ? 'Transcriberen...' : 'Transcribeer'}
              </button>
              <button 
                className="recorder-btn secondary"
                onClick={resetRecording}
              >
                <FontAwesomeIcon icon={faTrash} /> Nieuwe Opname
              </button>
            </>
          )}
        </div>

        <div className="recorder-info">
          {(isRecording || hasRecording) && (
            <>
              <div className="info-item">
                <span className="info-label">Duur:</span>
                <span className="info-value">{formattedDuration}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Geschatte kosten:</span>
                <span className="info-value">{estimatedCost.formattedCost}</span>
              </div>
            </>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="audio-player">
            <audio ref={audioRef} src={audioUrl} controls />
          </div>
        )}

        {error && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        )}
      </div>

      {showSaveDialog && transcriptionResult && (
        <div className="save-dialog">
          <h3>Transcriptie Opslaan</h3>
          
          <div className="form-group">
            <label htmlFor="title">Titel</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Geef een titel aan deze transcriptie"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (komma gescheiden)</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meeting, ideeën, notities"
            />
          </div>

          <div className="transcription-preview">
            <h4>Transcriptie Preview</h4>
            <div className="preview-text">
              {transcriptionResult.text.substring(0, 500)}
              {transcriptionResult.text.length > 500 && '...'}
            </div>
            <div className="preview-info">
              <span>Totaal: {transcriptionResult.text.split(' ').length} woorden</span>
              <span>Taal: {transcriptionResult.language}</span>
            </div>
          </div>

          <div className="dialog-actions">
            <button 
              className="btn secondary"
              onClick={handleCancel}
            >
              <FontAwesomeIcon icon={faTimes} /> Annuleer
            </button>
            <button 
              className="btn primary"
              onClick={handleSave}
            >
              <FontAwesomeIcon icon={faSave} /> Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TranscriptionRecorder;