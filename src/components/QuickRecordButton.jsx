// components/QuickRecordButton.jsx
// Floating microphone button for quick recording
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import '../styles/MiniRecorder.css';

function QuickRecordButton({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`quick-record-button ${isActive ? 'is-active' : ''}`}
      title="Quick Record"
    >
      <FontAwesomeIcon icon={faMicrophone} />
    </button>
  );
}

export default QuickRecordButton;
