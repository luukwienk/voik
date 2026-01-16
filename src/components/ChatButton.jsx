import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/ChatButton.css';

const ChatButton = ({ onClick }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <button
      onClick={onClick}
      className="chat-button"
      style={{
        bottom: isMobile ? '76px' : '24px',
        right: isMobile ? '16px' : '24px'
      }}
    >
      <FontAwesomeIcon icon={faComment} />
    </button>
  );
};

export default ChatButton;
