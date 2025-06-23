// components/TranscriptionList.jsx
import React, { useState, useMemo } from 'react';
import { useTranscriptions } from '../hooks/useTranscriptions';
import '../styles/TranscriptionList.css';

function TranscriptionList({ user }) {
  const {
    transcriptions,
    isLoading,
    error,
    updateTranscription,
    deleteTranscription,
    exportTranscription,
    searchTranscriptions
  } = useTranscriptions(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTranscription, setSelectedTranscription] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const filteredTranscriptions = useMemo(() => {
    if (!searchTerm) return transcriptions;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return transcriptions.filter(t => 
      t.text?.toLowerCase().includes(lowercaseSearch) ||
      t.title?.toLowerCase().includes(lowercaseSearch) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
    );
  }, [transcriptions, searchTerm]);

  const handleEdit = (transcription) => {
    setEditingId(transcription.id);
    setEditTitle(transcription.title);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateTranscription(editingId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (id) => {
    await deleteTranscription(id);
    setShowDeleteConfirm(null);
    if (selectedTranscription?.id === id) {
      setSelectedTranscription(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Onbekend';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="transcription-list loading">
        <div className="loading-spinner">Transcripties laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transcription-list error">
        <div className="error-message">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-list">
      <div className="list-header">
        <h2>Mijn Transcripties</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Zoek in transcripties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="transcription-grid">
        {filteredTranscriptions.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <p>Geen transcripties gevonden voor "{searchTerm}"</p>
            ) : (
              <p>Je hebt nog geen transcripties. Maak je eerste opname!</p>
            )}
          </div>
        ) : (
          filteredTranscriptions.map(transcription => (
            <div
              key={transcription.id}
              className={`transcription-card ${selectedTranscription?.id === transcription.id ? 'selected' : ''}`}
              onClick={() => setSelectedTranscription(transcription)}
            >
              <div className="card-header">
                {editingId === transcription.id ? (
                  <div className="edit-title">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>✓</button>
                    <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}>✗</button>
                  </div>
                ) : (
                  <h3>{transcription.title}</h3>
                )}
                <div className="card-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(transcription);
                    }}
                    title="Bewerk titel"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportTranscription(transcription, 'txt');
                    }}
                    title="Download als tekst"
                  >
                    📥
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(transcription.id);
                    }}
                    title="Verwijder"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-meta">
                <span className="meta-item">
                  📅 {formatDate(transcription.createdAt)}
                </span>
                <span className="meta-item">
                  ⏱️ {formatDuration(transcription.duration)}
                </span>
                {transcription.tags?.length > 0 && (
                  <div className="tags">
                    {transcription.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-preview">
                {transcription.text.substring(0, 150)}...
              </div>

              {showDeleteConfirm === transcription.id && (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <p>Weet je zeker dat je deze transcriptie wilt verwijderen?</p>
                  <div className="confirm-actions">
                    <button
                      className="btn danger"
                      onClick={() => handleDelete(transcription.id)}
                    >
                      Verwijder
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Annuleer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedTranscription && (
        <div className="transcription-detail-modal" onClick={() => setSelectedTranscription(null)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{selectedTranscription.title}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedTranscription(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-meta">
              <span>📅 {formatDate(selectedTranscription.createdAt)}</span>
              <span>⏱️ {formatDuration(selectedTranscription.duration)}</span>
              <span>🌐 {selectedTranscription.language?.toUpperCase() || 'NL'}</span>
              {selectedTranscription.cost && (
                <span>💰 ${selectedTranscription.cost.toFixed(3)}</span>
              )}
            </div>

            {selectedTranscription.tags?.length > 0 && (
              <div className="detail-tags">
                {selectedTranscription.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-text">
              {selectedTranscription.text}
            </div>

            <div className="detail-actions">
              <button
                className="btn primary"
                onClick={() => exportTranscription(selectedTranscription, 'txt')}
              >
                📥 Download TXT
              </button>
              <button
                className="btn secondary"
                onClick={() => exportTranscription(selectedTranscription, 'json')}
              >
                📥 Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TranscriptionList;