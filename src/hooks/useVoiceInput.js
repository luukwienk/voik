import { useState } from 'react';

export function useVoiceInput(lists, currentList, updateList) {
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
      // Set the recognized text
      setRecognizedText(result.recognizedText || '');

      switch (result.type) {
        case 'tasks':
          const newTasks = result.data.map(task => ({
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: task,
            completed: false
          }));
          updateList(currentList, {
            ...lists[currentList],
            items: [...newTasks, ...lists[currentList].items]
          });
          setAiResponse('New tasks have been added to your list.');
          break;
        case 'notes':
          const newNotes = result.data.map(note => ({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: note
          }));
          updateList(currentList, {
            ...lists[currentList],
            items: [...newNotes, ...lists[currentList].items]
          });
          setAiResponse('New notes have been added to your list.');
          break;
          case 'action':
            setAiResponse(result.data);
            break;
          case 'text':
            setAiResponse(result.data);
            break;
          case 'error':
            setError(result.data);
            break;
          default:
            console.error('Unknown result type:', result.type);
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