import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRobot } from '@fortawesome/free-solid-svg-icons';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`message-container ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        <FontAwesomeIcon icon={isUser ? faUser : faRobot} />
      </div>
      <div className="message-content">
        {message}
      </div>
      
      <style jsx>{`
        .message-container {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          max-width: 85%;
        }
        
        .message-container.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #666;
        }
        
        .message-container.user .message-avatar {
          background-color: #2196F3;
          color: white;
        }
        
        .message-container.assistant .message-avatar {
          background-color: #f0f0f0;
          color: #666;
        }
        
        .message-content {
          background-color: #f0f0f0;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          color: #222;
        }
        
        .message-container.user .message-content {
          background-color: #2196F3;
          color: white;
          border-radius: 16px 16px 0 16px;
        }
        
        .message-container.assistant .message-content {
          background-color: #f0f0f0;
          color: #222;
          border-radius: 16px 16px 16px 0;
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .message-avatar {
            background-color: #333;
            color: #bbb;
          }
          
          .message-container.user .message-avatar {
            background-color: #1976D2;
            color: white;
          }
          
          .message-container.assistant .message-avatar {
            background-color: #333;
            color: #bbb;
          }
          
          .message-content {
            background-color: #333;
            color: #eee;
          }
          
          .message-container.user .message-content {
            background-color: #1976D2;
            color: white;
          }
          
          .message-container.assistant .message-content {
            background-color: #333;
            color: #eee;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;