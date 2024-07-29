import React from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';

const VoiceInput = ({ onInputComplete, onTextChange, language = 'en-US' }) => {
  const { isListening, recognizedText, error, startListening, stopListening } = useSpeechRecognition(language);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      if (onInputComplete) {
        onInputComplete(recognizedText);
      }
    } else {
      startListening();
    }
  };

  React.useEffect(() => {
    if (onTextChange) {
      onTextChange(recognizedText);
    }
  }, [recognizedText, onTextChange]);

  return (
    <div className="voice-input">
      <div className="controls">
        <button onClick={handleToggleListening}>
          <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
          {isListening ? ' Stop' : ' Start'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VoiceInput;
