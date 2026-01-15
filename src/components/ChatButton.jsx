import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import useMediaQuery from '../hooks/useMediaQuery';

const ChatButton = ({ onClick }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <button
      onClick={onClick}
      className="chat-button"
      style={{
        bottom: isMobile ? '90px' : '24px',
        zIndex: 1001
      }}
    >
      <FontAwesomeIcon icon={faComment} />

      <style jsx>{`
        .chat-button {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 14px rgba(33, 150, 243, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          right: 24px;
          font-size: 1.1rem;
          transition: all 0.2s ease;
        }

        .chat-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.45);
        }

        .chat-button:active {
          transform: scale(0.95);
        }

        /* Mobile */
        @media (max-width: 767px) {
          .chat-button {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            right: 16px;
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .chat-button {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          }

          .chat-button:hover {
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.5);
          }
        }
      `}</style>
    </button>
  );
};

export default ChatButton;
