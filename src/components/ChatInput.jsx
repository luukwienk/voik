import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const ChatInput = ({ onSubmit, isProcessing }) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44); // baseline height
  const inputRef = useRef(null);
  const { 
    isListening, 
    recognizedText, 
    error: speechError, 
    startListening, 
    stopListening 
  } = useSpeechRecognition('nl-NL');

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      // Reset height to auto to get the correct scrollHeight
      inputRef.current.style.height = 'auto';
      
      // Calculate new height (with a min of 44px)
      const newHeight = Math.max(44, Math.min(inputRef.current.scrollHeight, 120));
      inputRef.current.style.height = `${newHeight}px`;
      setInputHeight(newHeight);
    }
  };

  useEffect(() => {
    if (recognizedText) {
      setInputText(recognizedText);
      // Schedule a resize after state update
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [recognizedText]);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-resize the input field when text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputText(''); // Clear input when starting to listen
      startListening();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onSubmit(inputText.trim());
      setInputText('');
      stopListening(); // Stop listening if active
      // Reset height after clearing
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Luisteren..." : "Type een bericht..."}
          disabled={isProcessing}
          rows={1}
          className={`chat-input-textarea ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
          style={{ height: `${inputHeight}px` }}
        />
        
        <div className="input-buttons">
          {isListening && (
            <div className="listening-indicator">
              <div className="pulse-dot"></div>
              <div className="pulse-dot"></div>
              <div className="pulse-dot"></div>
            </div>
          )}
          
          <button 
            type="button"
            onClick={handleToggleListening}
            className={`voice-button ${isListening ? 'active' : ''}`}
            disabled={isProcessing}
            title={isListening ? "Stop met luisteren" : "Start spraakherkenning"}
          >
            <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
          </button>
          
          <button 
            type="submit"
            className="send-button"
            disabled={!inputText.trim() || isProcessing}
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
      
      {speechError && <div className="speech-error">{speechError}</div>}
      
      <style jsx>{`
        .chat-input-container {
          border-top: 1px solid #eee;
          padding: 12px;
          background: white;
          border-radius: 0 0 8px 8px;
        }
        
        .chat-input-form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        
        .chat-input-textarea {
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
        
        .chat-input-textarea:focus {
          border-color: #888;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }
        
        .chat-input-textarea.listening {
          border-color: #f44336;
          background-color: #fff8f8;
          box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
        }
        
        .chat-input-textarea.processing {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .input-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          position: relative;
        }
        
        .listening-indicator {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          background-color: rgba(244, 67, 54, 0.1);
          padding: 4px 8px;
          border-radius: 12px;
        }
        
        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #f44336;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .pulse-dot:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .pulse-dot:nth-child(3) {
          animation-delay: 1s;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        .voice-button, .send-button {
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
          color: #222;
        }
        
        .voice-button:hover, .send-button:hover {
          background-color: #f5f5f5;
        }
        
        .voice-button.active {
          color: #f44336;
          background-color: #fff0f0;
        }
        
        .send-button {
          color: #2196F3;
        }
        
        .send-button:hover {
          background-color: #e3f2fd;
        }
        
        .send-button:disabled {
          color: #ccc;
          cursor: not-allowed;
          background: none;
        }
        
        .speech-error {
          color: #f44336;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .chat-input-container {
            background: #1e1e1e;
            border-top: 1px solid #333;
          }
          
          .chat-input-textarea {
            background-color: #2c2c2c;
            border-color: #444;
            color: #fff;
          }
          
          .chat-input-textarea:focus {
            border-color: #666;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
          }
          
          .chat-input-textarea.listening {
            border-color: #f44336;
            background-color: #3c2c2c;
            box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
          }
          
          .listening-indicator {
            background-color: rgba(244, 67, 54, 0.2);
          }
          
          .voice-button, .send-button {
            color: #eee;
          }
          
          .voice-button:hover, .send-button:hover {
            background-color: #333;
          }
          
          .voice-button.active {
            background-color: #3c2c2c;
          }
          
          .send-button {
            color: #64b5f6;
          }
          
          .send-button:hover {
            background-color: #1a2733;
          }
          
          .send-button:disabled {
            color: #555;
            background: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInput;