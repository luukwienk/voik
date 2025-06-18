import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ChatMessage from './ChatMessage';
import RealtimeChatInput from './RealtimeChatInput';
import RealtimeStatus from './RealtimeStatus';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import useMediaQuery from '../hooks/useMediaQuery';

const ChatModal = ({ 
  isOpen, 
  onClose, 
  tasks,
  currentTasks, 
  updateTaskList,
  currentTaskList,
  userId 
}) => {
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  
  const {
    isConnected,
    isRecording,
    isSpeaking,
    messages,
    startConversation,
    stopConversation,
    sendTextMessage,
    error
  } = useRealtimeChat({ 
    userId, 
    tasks: tasks || {},
    currentTasks: tasks?.[currentTaskList] || { items: [] },
    updateTaskList: (listId, updates) => updateTaskList(listId, updates),
    currentTaskList
  });

  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      // iOS Safari specific fixes
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle mode toggle
  const handleToggleMode = () => {
    if (inputMode === 'text') {
      // Switching to voice
      setInputMode('voice');
      // Stop any ongoing recording when switching modes
      if (isRecording) {
        stopConversation();
      }
    } else {
      // Switching to text
      setInputMode('text');
      // Stop recording if active
      if (isRecording) {
        stopConversation();
      }
    }
  };

  // Handle text send
  const handleSendText = (text) => {
    if (text && sendTextMessage) {
      sendTextMessage(text);
    }
  };

  // Handle voice button click
  const handleVoiceButton = () => {
    if (isRecording) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <h3>TaskBuddy Assistant</h3>
          <div className="header-controls">
            <RealtimeStatus 
              isConnected={isConnected} 
              isRecording={isRecording}
              isSpeaking={isSpeaking}
            />
            <button onClick={onClose} className="close-button">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <ChatMessage 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser} 
            />
          ))}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Voice mode UI */}
        {inputMode === 'voice' && (
          <div className="voice-mode-container">
            <button 
              onClick={handleVoiceButton}
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              disabled={!isConnected}
              title={!isConnected ? 'Wachten op verbinding...' : isRecording ? 'Stop opname' : 'Start opname'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            <p className="voice-mode-hint">
              {isRecording ? 'Aan het luisteren...' : 'Tap om te spreken'}
            </p>
          </div>
        )}
        
        {/* Text/Voice input */}
        <RealtimeChatInput 
          onSendText={handleSendText}
          onToggleMode={handleToggleMode}
          inputMode={inputMode}
          isProcessing={isSpeaking}
          disabled={!isConnected}
        />
      </div>
      
      <style>{`
        .chat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          ${isMobile ? `
            height: 100dvh;
            /* iOS Safari specific fixes */
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          ` : ''}
        }
        
        .chat-modal {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          height: ${isMobile ? '100dvh' : '80vh'};
          max-width: 500px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          position: relative;
          ${isMobile ? `
            border-radius: 0;
            width: 100%;
            max-width: 100%;
            height: 100dvh;
            /* iOS Safari specific fixes */
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          ` : ''}
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
          background-color: white;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          color: #222;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          color: #666;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        
        .close-button:hover {
          background-color: #f0f0f0;
          color: #222;
        }
        
        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          min-height: 200px;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 8px 0;
          font-size: 14px;
        }
        
        .voice-mode-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          border-top: 1px solid #eee;
        }
        
        .voice-button {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          background-color: #f0f0f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        
        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .voice-button:not(:disabled):hover {
          background-color: #e0e0e0;
        }
        
        .voice-button.recording {
          background-color: #ff4444;
          color: white;
          animation: pulse 1.5s infinite;
        }
        
        .voice-mode-hint {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .chat-modal {
            background-color: #1e1e1e;
          }
          
          .chat-header {
            border-bottom: 1px solid #333;
            background-color: #1e1e1e;
          }
          
          .chat-header h3 {
            color: #fff;
          }
          
          .close-button {
            color: #bbb;
          }
          
          .close-button:hover {
            background-color: #333;
            color: #fff;
          }
          
          .voice-mode-container {
            border-top: 1px solid #333;
          }
          
          .voice-button {
            background-color: #333;
            color: #fff;
          }
          
          .voice-button:not(:disabled):hover {
            background-color: #444;
          }
          
          .voice-button.recording {
            background-color: #ff4444;
          }
          
          .voice-mode-hint {
            color: #999;
          }
          
          .error-message {
            background-color: #442222;
            color: #ff8888;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatModal;