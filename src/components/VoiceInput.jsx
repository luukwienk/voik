import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { handleAICommand } from '../services/openai';

const VoiceInput = ({ currentTasks, onInputComplete, onTextChange, language = 'en-US' }) => {
  const { isListening, recognizedText, error, startListening, stopListening } = useSpeechRecognition(language);
  const processedRef = useRef(false);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      processedRef.current = false; // Reset the processed flag when starting to listen
    }
  };

  useEffect(() => {
    if (!isListening && recognizedText && !processedRef.current) {
      // When recognition stops and we have text, handle the AI command
      const processInput = async () => {
        try {
          console.log('Processing input:', recognizedText);
          const result = await handleAICommand(recognizedText, currentTasks);
          processedRef.current = true; // Mark as processed
          
          if (onInputComplete) {
            onInputComplete(result);
          }
        } catch (error) {
          console.error(error);
        }
      };

      processInput();
    }
    if (onTextChange) {
      onTextChange(recognizedText);
    }
  }, [recognizedText, isListening, currentTasks, onTextChange, onInputComplete]);

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