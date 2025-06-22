import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faMicrophone } from '@fortawesome/free-solid-svg-icons';

const RealtimeChatInput = ({ 
  onSendText, 
  onVoiceClick,
  isRecording = false,
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  const handleVoiceButtonClick = () => {
    if (!disabled) {
      onVoiceClick();
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
          placeholder="Stel een vraag of geef een commando..."
          disabled={isProcessing || disabled || isRecording}
          rows={1}
          className={`input-textarea ${isProcessing || isRecording ? 'processing' : ''}`}
          style={{ height: `${inputHeight}px` }}
        />
        
        <div className="input-actions">
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            disabled={disabled}
            title={isRecording ? 'Stop opname' : 'Start opname'}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
          
          <button 
            type="submit"
            className="send-btn"
            disabled={!inputText.trim() || isProcessing || disabled || isRecording}
            title="Verstuur bericht"
          >
            {isProcessing ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
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
          background-color: #f8f8f8;
        }
        
        .input-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .voice-btn, .send-btn {
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
        
        .voice-btn:hover:not(:disabled) {
          background-color: #f0f0f0;
          color: #222;
        }
        
        .voice-btn.recording {
          background-color: #ffdddd;
          color: #d32f2f;
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
          
           .input-textarea.processing {
             background-color: #252525;
           }

          .voice-btn, .send-btn {
            color: #bbb;
          }
          
          .voice-btn:hover:not(:disabled) {
            background-color: #333;
            color: #fff;
          }
          
          .voice-btn.recording {
            background-color: #4d2323;
            color: #ff8a80;
          }
          
          .send-btn:hover:not(:disabled) {
            background-color: #1a2733;
          }
        }
      `}</style>
    </div>
  );
};

export default RealtimeChatInput;