// components/TranscriptionAIActions.jsx
import React, { useState } from 'react';
import '../styles/TranscriptionAIActions.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faFileAlt,
  faListCheck,
  faEnvelope,
  faBullseye,
  faGlobe,
  faCommentDots
} from '@fortawesome/free-solid-svg-icons';

const AI_ACTIONS = [
  { 
    id: 'summarize', 
    label: 'Samenvatting', 
    icon: faFileAlt,
    description: 'Maak een beknopte samenvatting'
  },
  { 
    id: 'tasks', 
    label: 'Taken Extraheren', 
    icon: faListCheck,
    description: 'Haal alle actiepunten eruit'
  },
  { 
    id: 'email', 
    label: 'Email Opstellen', 
    icon: faEnvelope,
    description: 'Maak een professionele email'
  },
  { 
    id: 'keypoints', 
    label: 'Belangrijke Punten', 
    icon: faBullseye,
    description: 'Identificeer hoofdpunten'
  },
  { 
    id: 'translate', 
    label: 'Vertalen (EN)', 
    icon: faGlobe,
    description: 'Vertaal naar Engels'
  },
  { 
    id: 'custom', 
    label: 'Eigen Vraag', 
    icon: faCommentDots,
    description: 'Stel je eigen vraag'
  }
];

function TranscriptionAIActions({ transcription, onTasksExtracted }) {
  const [showActions, setShowActions] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState(null);

  const handleActionClick = async (action) => {
    if (action.id === 'custom' && !customPrompt.trim()) {
      setSelectedAction(action);
      return;
    }

    setSelectedAction(action);
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = getPromptForAction(action.id, transcription.text);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { 
              role: 'system', 
              content: 'Je bent een behulpzame AI-assistent. Reageer altijd in het Nederlands, tenzij anders gevraagd. Wees beknopt en to-the-point.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('AI verwerking mislukt');
      }

      const data = await response.json();
      const aiResult = data.choices[0].message.content;
      
      setResult({
        action: action,
        content: aiResult,
        timestamp: new Date()
      });
      
    } catch (err) {
      console.error('AI processing error:', err);
      setError('Kon AI verwerking niet uitvoeren. Probeer het opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPromptForAction = (actionId, text) => {
    const prompts = {
      summarize: `Maak een beknopte samenvatting (max 5 zinnen) van deze transcriptie:\n\n${text}`,
      tasks: `Extraheer alle concrete actiepunten en taken uit deze transcriptie. Geef ze als een genummerde lijst. Focus alleen op echte taken, geen algemene uitspraken:\n\n${text}`,
      keypoints: `Wat zijn de 3-5 belangrijkste punten uit deze transcriptie? Geef alleen de kernpunten:\n\n${text}`,
      email: `Schrijf een professionele follow-up email op basis van deze transcriptie. Houd het kort en zakelijk:\n\n${text}`,
      translate: `Translate the following transcription to English. Maintain the tone and style:\n\n${text}`,
      custom: `${customPrompt}\n\nTranscriptie:\n${text}`
    };
    return prompts[actionId];
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result.content);
    // Visuele feedback zou hier kunnen
  };

  const handleAddTasks = () => {
    if (result?.action.id === 'tasks' && onTasksExtracted) {
      // Parse taken uit het resultaat
      const taskLines = result.content.split('\n').filter(line => line.match(/^\d+\./));
      const tasks = taskLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
      onTasksExtracted(tasks);
      
      // Sluit het resultaat panel
      setResult(null);
      setShowActions(false);
    }
  };

  const handleCloseResult = () => {
    setResult(null);
    setSelectedAction(null);
    setCustomPrompt('');
  };

  if (!showActions) {
    return (
      <button
        className="btn primary"
        style={{ marginTop: '12px' }}
        onClick={() => setShowActions(true)}
        title="AI Acties"
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} /> AI Acties
      </button>
    );
  }

  return (
    <div className="ai-actions-container">
      {/* Actions Menu */}
      {!result && (
        <div className="ai-actions-menu">
          <div className="ai-actions-header">
            <h4>AI Acties</h4>
            <button 
              className="close-btn"
              onClick={() => {
                setShowActions(false);
                setSelectedAction(null);
                setCustomPrompt('');
              }}
            >
              ✕
            </button>
          </div>

          {selectedAction?.id === 'custom' && !isProcessing ? (
            <div className="custom-prompt-container">
              <textarea
                placeholder="Wat wil je weten over deze transcriptie?"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="custom-prompt-input"
                autoFocus
              />
              <div className="custom-prompt-actions">
                <button
                  className="btn secondary"
                  onClick={() => {
                    setSelectedAction(null);
                    setCustomPrompt('');
                  }}
                >
                  Terug
                </button>
                <button
                  className="btn primary"
                  onClick={() => handleActionClick(selectedAction)}
                  disabled={!customPrompt.trim()}
                >
                  Verstuur
                </button>
              </div>
            </div>
          ) : (
            <div className="ai-actions-list">
              {AI_ACTIONS.map(action => (
                <button
                  key={action.id}
                  className={`ai-action-item ${isProcessing && selectedAction?.id === action.id ? 'processing' : ''}`}
                  onClick={() => handleActionClick(action)}
                  disabled={isProcessing}
                >
                  <span className="action-icon"><FontAwesomeIcon icon={action.icon} /></span>
                  <div className="action-info">
                    <span className="action-label">{action.label}</span>
                    <span className="action-description">{action.description}</span>
                  </div>
                  {isProcessing && selectedAction?.id === action.id && (
                    <span className="processing-indicator">⏳</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="ai-error-message">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div className="ai-result-panel">
          <div className="ai-result-header">
            <div className="result-title">
              <span className="result-icon"><FontAwesomeIcon icon={result.action.icon} /></span>
              <h4>{result.action.label}</h4>
            </div>
            <button className="close-btn" onClick={handleCloseResult}>
              ✕
            </button>
          </div>

          <div className="ai-result-content">
            <pre>{result.content}</pre>
          </div>

          <div className="ai-result-actions">
            <button
              className="btn secondary"
              onClick={handleCopyResult}
            >
              📋 Kopiëren
            </button>
            
            {result.action.id === 'tasks' && onTasksExtracted && (
              <button
                className="btn primary"
                onClick={handleAddTasks}
              >
                ➕ Toevoegen aan Taken
              </button>
            )}

            {result.action.id === 'email' && (
              <button
                className="btn primary"
                onClick={() => {
                  // Hier zou je naar email client kunnen gaan
                  window.location.href = `mailto:?body=${encodeURIComponent(result.content)}`;
                }}
              >
                <FontAwesomeIcon icon={faEnvelope} /> Open in Email
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TranscriptionAIActions;