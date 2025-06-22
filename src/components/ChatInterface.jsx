import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import RealtimeChatInput from './RealtimeChatInput';
import RealtimeStatus from './RealtimeStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const ChatInterface = ({
  messages,
  isConnected,
  isRecording,
  isSpeaking,
  error,
  startConversation,
  stopConversation,
  sendTextMessage,
  onClose, // To allow closing the interface
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Unified voice button handler
  const handleVoiceClick = () => {
    if (isRecording) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="chat-interface-container">
      <div className="chat-header">
        <h3>TaskBuddy Assistant</h3>
        <div className="header-controls">
          <RealtimeStatus 
            isConnected={isConnected} 
            isRecording={isRecording}
            isSpeaking={isSpeaking}
          />
          {onClose && (
            <button onClick={onClose} className="close-button">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg.text} 
            isUser={msg.isUser} 
            isStreaming={msg.isStreaming}
          />
        ))}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <RealtimeChatInput 
        onSendText={sendTextMessage}
        onVoiceClick={handleVoiceClick}
        isRecording={isRecording}
        isProcessing={isSpeaking}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatInterface; 