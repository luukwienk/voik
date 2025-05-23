import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { handleAICommand } from '../services/openai';

const VoiceInput = ({ 
  currentTasks, 
  onInputComplete, 
  setRecognizedText, 
  language = 'nl-NL',
  roundButtonStyle = false, // Nieuwe prop voor ronde knop styling
  userId
}) => {
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
          const result = await handleAICommand({
            text: recognizedText,
            currentTasks,
            userId
          });
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
  }, [recognizedText, isListening, currentTasks, onInputComplete, setRecognizedText, userId]);

  return (
    <div className="voice-input">
      {roundButtonStyle ? (
        <button
          onClick={handleToggleListening}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: isListening ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
        </button>
      ) : (
        <div className="controls">
          <button onClick={handleToggleListening}>
            <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
            {isListening ? ' Stop' : ' Start'}
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VoiceInput;