import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faMicrophone, faKeyboard } from '@fortawesome/free-solid-svg-icons';

const RealtimeChatInput = ({ 
  onSendText, 
  onToggleMode,
  inputMode = 'text',
  isProcessing = false,
  disabled = false 
}) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.max(44, Math.min(inputRef.current.scrollHeight, 120));
      inputRef.current.style.height = `${newHeight}px`;
      setInputHeight(newHeight);
    }
  };

  // Focus input when switching to text mode
  useEffect(() => {
    if (inputMode === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);

  // Auto-resize when text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing && !disabled) {
      onSendText(inputText.trim());
      setInputText('');
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleModeToggle = () => {
    if (!disabled) {
      onToggleMode();
    }
  };

  return (
    <div className="realtime-chat-input">
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type een bericht..."
          disabled={isProcessing || disabled || inputMode !== 'text'}
          rows={1}
          className={`input-textarea ${isProcessing ? 'processing' : ''}`}
          style={{ 
            height: `${inputHeight}px`,
            display: inputMode === 'text' ? 'block' : 'none'
          }}
        />
        
        {inputMode === 'voice' && (
          <div className="voice-mode-placeholder">
            <span className="voice-mode-text">Voice modus actief</span>
          </div>
        )}
        
        <div className="input-actions">
          <button
            type="button"
            onClick={handleModeToggle}
            className={`mode-toggle-btn ${inputMode === 'voice' ? 'active' : ''}`}
            disabled={disabled}
            title={inputMode === 'text' ? 'Schakel naar voice' : 'Schakel naar tekst'}
          >
            <FontAwesomeIcon 
              icon={inputMode === 'text' ? faMicrophone : faKeyboard} 
            />
          </button>
          
          {inputMode === 'text' && (
            <button 
              type="submit"
              className="send-btn"
              disabled={!inputText.trim() || isProcessing || disabled}
              title="Verstuur bericht"
            >
              {isProcessing ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
            </button>
          )}
        </div>
      </form>
      
      <style jsx>{`
        .realtime-chat-input {
          padding: 12px;
          background: white;
          border-top: 1px solid #eee;
        }
        
        .input-form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        
        .input-textarea {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 12px 16px;
          font-size: 14px;
          min-height: 44px;
          max-height: 120px;
          resize: none;
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
          line-height: 1.4;
          overflow-y: auto;
        }
        
        .input-textarea:focus {
          border-color: #888;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }
        
        .input-textarea.processing {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .voice-mode-placeholder {
          flex: 1;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 20px;
          padding: 0 16px;
        }
        
        .voice-mode-text {
          color: #666;
          font-size: 14px;
          font-style: italic;
        }
        
        .input-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .mode-toggle-btn, .send-btn {
          background: none;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }
        
        .mode-toggle-btn:hover:not(:disabled) {
          background-color: #f0f0f0;
          color: #222;
        }
        
        .mode-toggle-btn.active {
          background-color: #e3f2fd;
          color: #2196F3;
        }
        
        .send-btn {
          color: #2196F3;
        }
        
        .send-btn:hover:not(:disabled) {
          background-color: #e3f2fd;
        }
        
        .send-btn:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .realtime-chat-input {
            background: #1e1e1e;
            border-top-color: #333;
          }
          
          .input-textarea {
            background-color: #2c2c2c;
            border-color: #444;
            color: #fff;
          }
          
          .input-textarea:focus {
            border-color: #666;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
          }
          
          .voice-mode-placeholder {
            background-color: #2c2c2c;
          }
          
          .voice-mode-text {
            color: #999;
          }
          
          .mode-toggle-btn, .send-btn {
            color: #bbb;
          }
          
          .mode-toggle-btn:hover:not(:disabled) {
            background-color: #333;
            color: #fff;
          }
          
          .mode-toggle-btn.active {
            background-color: #1a2733;
            color: #64b5f6;
          }
          
          .send-btn {
            color: #64b5f6;
          }
          
          .send-btn:hover:not(:disabled) {
            background-color: #1a2733;
          }
          
          .send-btn:disabled {
            color: #555;
          }
        }
      `}</style>
    </div>
  );
};

export default RealtimeChatInput;