import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';

const ChatButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="chat-button"
    >
      <FontAwesomeIcon icon={faComment} />
      
      <style jsx>{`
        .chat-button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #2196F3;
          color: white;
          border: none;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 90;
          transition: all 0.2s;
        }
        
        .chat-button:hover {
          background-color: #1976d2;
          transform: scale(1.05);
        }
        
        .chat-button:active {
          transform: scale(0.95);
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .chat-button {
            background-color: #1976d2;
          }
          
          .chat-button:hover {
            background-color: #2196F3;
          }
        }
      `}</style>
    </button>
  );
};

export default ChatButton;