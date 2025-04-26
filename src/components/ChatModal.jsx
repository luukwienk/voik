import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faComment } from '@fortawesome/free-solid-svg-icons';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { handleAICommand } from '../services/openai';

const ChatModal = ({ 
  isOpen, 
  onClose, 
  currentTasks, 
  currentNotes, 
  updateTaskList,
  updateNoteList,
  currentTaskList,
  currentNoteList
}) => {
  const [messages, setMessages] = useState([
    { text: "Hallo! Hoe kan ik je vandaag helpen?", isUser: false }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleChatSubmit = async (text) => {
    // Add user message immediately
    const userMessage = { text, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Set processing state
    setIsProcessing(true);
    
    try {
      // Process with AI
      const result = await handleAICommand(
        text, 
        currentTasks?.items || [], 
        currentNotes?.items || []
      );
      
      // Gebruik de message van het resultaat indien beschikbaar
      let responseMessage = result.message || "Er is iets fout gegaan. Probeer het opnieuw.";
      
      // Voer de juiste acties uit op basis van het type
      switch (result.type) {
        case 'tasks':
          const newTasks = result.data.map(task => ({
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: task,
            completed: false
          }));
          
          updateTaskList(currentTaskList, {
            items: [...newTasks, ...(currentTasks?.items || [])]
          });
          break;
          
        case 'notes':
          const newNotes = result.data.map(note => ({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: note
          }));
          
          updateNoteList(currentNoteList, {
            items: [...newNotes, ...(currentNotes?.items || [])]
          });
          break;
          
        case 'action':
          // Action is al uitgevoerd door de handleAICommand functie
          break;
          
        case 'text':
          // Geen aanvullende actie nodig
          break;
          
        case 'error':
          console.error('Error in AI processing:', result.data);
          break;
      }
      
      // Add AI response message
      setMessages(prev => [...prev, { text: responseMessage, isUser: false }]);
      
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev, 
        { 
          text: "Er is een fout opgetreden bij het verwerken van je bericht. Probeer het later opnieuw.", 
          isUser: false 
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <h3>Chat Assistent</h3>
          <button onClick={onClose} className="close-button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <ChatMessage 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser} 
            />
          ))}
          
          {isProcessing && (
            <div className="processing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput 
          onSubmit={handleChatSubmit} 
          isProcessing={isProcessing} 
        />
      </div>
      
      <style jsx>{`
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
        }
        
        .chat-modal {
          background-color: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
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
          max-height: calc(80vh - 140px);
        }
        
        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 8px 0 8px 44px;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          background-color: #999;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 1s;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .chat-modal {
            background-color: #1e1e1e;
          }
          
          .chat-header {
            border-bottom: 1px solid #333;
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
          
          .dot {
            background-color: #bbb;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatModal;