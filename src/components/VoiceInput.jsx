import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { handleAICommand } from '../services/openai';

const VoiceInput = ({ currentTasks, onInputComplete, setRecognizedText, language = 'en-US' }) => {
  const { isListening, recognizedText, error, startListening, stopListening } = useSpeechRecognition(language);
  const processedRef = useRef(false);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      processedRef.current = false;
    }
  };

  useEffect(() => {
    setRecognizedText(recognizedText);  // Update recognized text in parent component
    if (!isListening && recognizedText && !processedRef.current) {
      const processInput = async () => {
        try {
          console.log('Processing input:', recognizedText);
          const result = await handleAICommand(recognizedText, currentTasks);
          processedRef.current = true;
          
          if (onInputComplete) {
            onInputComplete({ ...result, recognizedText });
          }
        } catch (error) {
          console.error(error);
        }
      };

      processInput();
    }
  }, [recognizedText, isListening, currentTasks, onInputComplete, setRecognizedText]);

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