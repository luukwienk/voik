import { useState } from 'react';
import { handleAICommand } from '../services/openai';

export function useVoiceInput(tasks, notes, currentTaskList, currentNoteList, updateTaskList, updateNoteList) {
  const [recognizedText, setRecognizedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVoiceInput = async (result) => {
    console.log('Voice input result:', result);
    setIsLoading(true);
    setError(null);
    setRecognizedText(result.recognizedText || '');
    
    try {
      const aiResult = await handleAICommand(result.recognizedText, tasks[currentTaskList]?.items || [], notes[currentNoteList]?.items || []);
      
      switch (aiResult.type) {
        case 'tasks':
          const newTasks = aiResult.data.map(task => ({
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: task,
            completed: false
          }));
          updateTaskList(currentTaskList, {
            items: [...newTasks, ...(tasks[currentTaskList]?.items || [])]
          });
          setAiResponse('New tasks have been added to your list.');
          break;
        case 'notes':
          const newNotes = aiResult.data.map(note => ({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: note
          }));
          updateNoteList(currentNoteList, {
            items: [...newNotes, ...(notes[currentNoteList]?.items || [])]
          });
          setAiResponse('New notes have been added to your list.');
          break;
        case 'action':
          setAiResponse(aiResult.data);
          break;
        case 'text':
          setAiResponse(aiResult.data);
          break;
        case 'error':
          setError(aiResult.data);
          break;
        default:
          console.error('Unknown result type:', aiResult.type);
          setError('Received an unknown response type from AI.');
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      setError('Failed to process AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { recognizedText, aiResponse, isLoading, error, handleVoiceInput, setRecognizedText };
}