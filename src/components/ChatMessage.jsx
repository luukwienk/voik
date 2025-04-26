import React from 'react';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-avatar">
        {isUser ? 
          <div className="user-avatar">U</div> : 
          <div className="ai-avatar">AI</div>
        }
      </div>
      <div className="message-content">
        <div className="message-text">{message}</div>
      </div>
      
      <style jsx>{`
        .chat-message {
          display: flex;
          margin-bottom: 16px;
          align-items: flex-start;
        }
        
        .user-message {
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin: 0 8px;
        }
        
        .user-avatar {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .ai-avatar {
          background-color: #222;
          color: white;
        }
        
        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .user-message .message-content {
          background-color: #222;
          color: white;
          border-top-right-radius: 4px;
        }
        
        .ai-message .message-content {
          background-color: #f0f0f0;
          color: #222;
          border-top-left-radius: 4px;
        }
        
        .message-text {
          font-size: 14px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .user-avatar {
            background-color: #444;
            color: #fff;
          }
          
          .ai-avatar {
            background-color: #222;
            color: #fff;
          }
          
          .user-message .message-content {
            background-color: #444;
            color: #fff;
          }
          
          .ai-message .message-content {
            background-color: #222;
            color: #eee;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;