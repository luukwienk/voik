import { useState } from 'react';
import { handleAICommand } from '../services/openai';

export function useVoiceInput(tasks, notes, currentTaskList, currentNoteList, updateTaskList, updateNoteList, userId) {
  const [recognizedText, setRecognizedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const MAX_HISTORY_MESSAGES = 8;

  const handleVoiceInput = async (result) => {
    console.log('Voice input result:', result);
    setIsLoading(true);
    setError(null);
    setRecognizedText(result.recognizedText || '');
    
    try {
      const userHistoryItem = { role: 'user', content: result.recognizedText };
      const updatedHistory = [...conversationHistory, userHistoryItem];
      
      const aiResult = await handleAICommand({
        text: result.recognizedText, 
        currentTasks: tasks[currentTaskList]?.items || [], 
        currentNotes: notes[currentNoteList]?.items || [],
        conversationHistory: updatedHistory.slice(-MAX_HISTORY_MESSAGES),
        userId: userId
      });
      
      const assistantHistoryItem = { role: 'assistant', content: aiResult.message || aiResult.data };
      setConversationHistory([...updatedHistory, assistantHistoryItem].slice(-MAX_HISTORY_MESSAGES));
      
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
          setAiResponse(aiResult.message || 'Nieuwe taken zijn toegevoegd aan je lijst.');
          break;
        case 'notes':
          const newNotes = aiResult.data.map(note => ({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: note
          }));
          updateNoteList(currentNoteList, {
            items: [...newNotes, ...(notes[currentNoteList]?.items || [])]
          });
          setAiResponse(aiResult.message || 'Nieuwe notities zijn toegevoegd aan je lijst.');
          break;
        case 'action':
          setAiResponse(aiResult.message || aiResult.data);
          break;
        case 'text':
          setAiResponse(aiResult.message || aiResult.data);
          break;
        case 'error':
          setError(aiResult.message || aiResult.data);
          break;
        default:
          console.error('Unknown result type:', aiResult.type);
          setError('Er is een onbekend type respons ontvangen van de AI.');
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      setError('Er is een fout opgetreden bij het verwerken van de AI-respons. Probeer het opnieuw.');
      
      const errorHistoryItem = { role: 'assistant', content: 'Er is een fout opgetreden bij het verwerken van je verzoek.' };
      setConversationHistory([...conversationHistory, errorHistoryItem].slice(-MAX_HISTORY_MESSAGES));
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    recognizedText, 
    aiResponse, 
    isLoading, 
    error, 
    handleVoiceInput, 
    setRecognizedText,
    conversationHistory
  };
}