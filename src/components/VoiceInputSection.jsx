import React from 'react';
import VoiceInput from './VoiceInput';

const VoiceInputSection = ({ handleVoiceInput, setRecognizedText, recognizedText, aiResponse, currentTasks }) => {
  return (
    <div className="voice-input-section">
      <VoiceInput 
        onInputComplete={handleVoiceInput} 
        setRecognizedText={setRecognizedText}
        recognizedText={recognizedText}
        aiResponse={aiResponse}
        currentTasks={currentTasks}  // Pass currentTasks here
      />
      <div className="prompt-display">
        {recognizedText && <p><b>You said:</b> {recognizedText}</p>}
        {aiResponse && <p><b>Response:</b> {aiResponse}</p>}
      </div>
    </div>
  );
};

export default VoiceInputSection;
