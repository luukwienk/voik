// src/components/RealtimeStatus.jsx
import React from 'react';

const RealtimeStatus = ({ isConnected, isRecording, isSpeaking }) => {
  return (
    <div className="realtime-status">
      <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      {isRecording && <span className="recording-indicator">🎤 Luisteren...</span>}
      {isSpeaking && <span className="speaking-indicator">🔊 Spreekt...</span>}
      
      <style>{`
        .realtime-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ccc;
          transition: background-color 0.3s ease;
        }
        
        .status-dot.connected {
          background-color: #4CAF50;
        }
        
        .status-dot.disconnected {
          background-color: #f44336;
        }
        
        .recording-indicator {
          color: #f44336;
          animation: pulse 1.5s infinite;
        }
        
        .speaking-indicator {
          color: #2196F3;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .realtime-status {
            color: #bbb;
          }
          
          .status-dot {
            background-color: #666;
          }
          
          .recording-indicator {
            color: #ff6b6b;
          }
          
          .speaking-indicator {
            color: #64b5f6;
          }
        }
      `}</style>
    </div>
  );
};

export default RealtimeStatus;