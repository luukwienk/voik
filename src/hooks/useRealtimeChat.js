// src/hooks/useRealtimeChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeClient } from '../services/realtime';
import { addEventToCalendar } from '../services/googleCalendar';

export function useRealtimeChat({ 
  onTaskAdd,
  onTaskComplete,
  onTaskSearch,
  onCalendarEventAdd,
  onGetTasksFromList,
  getSystemContext,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [currentModality, setCurrentModality] = useState('text'); // Track current modality
  
  const clientRef = useRef(null);
  const unsubscribersRef = useRef([]);
  const currentModalityRef = useRef('text'); // Ref for current modality
  
  // Store callbacks in refs to prevent re-initialization
  const callbacksRef = useRef({
    onTaskAdd,
    onTaskComplete,
    onTaskSearch,
    onCalendarEventAdd,
    onGetTasksFromList,
    getSystemContext
  });
  
  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onTaskAdd,
      onTaskComplete,
      onTaskSearch,
      onCalendarEventAdd,
      onGetTasksFromList,
      getSystemContext
    };
  }, [onTaskAdd, onTaskComplete, onTaskSearch, onCalendarEventAdd, onGetTasksFromList, getSystemContext]);

  // Update the ref when modality changes
  useEffect(() => {
    currentModalityRef.current = currentModality;
  }, [currentModality]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('VITE_OPENAI_API_KEY not found');
      setError('OpenAI API key niet gevonden');
      return;
    }
    
    const client = new RealtimeClient(apiKey);
    clientRef.current = client;
    unsubscribersRef.current = [];

    const setupListeners = () => {
      unsubscribersRef.current.push(client.on('connected', () => setIsConnected(true)));
      unsubscribersRef.current.push(client.on('disconnected', () => setIsConnected(false)));
      unsubscribersRef.current.push(client.on('recording.started', () => setIsRecording(true)));
      unsubscribersRef.current.push(client.on('recording.stopped', () => setIsRecording(false)));
      unsubscribersRef.current.push(client.on('speech.started', () => setIsSpeaking(false)));
      unsubscribersRef.current.push(client.on('audio.done', () => setIsSpeaking(false)));
      unsubscribersRef.current.push(client.on('error', (e) => setError(e.message)));

      // Handle audio delta based on current modality
      unsubscribersRef.current.push(client.on('response.audio.delta', (delta) => {
        // Only play audio and set speaking if we're in voice mode
        if (currentModalityRef.current === 'voice') {
          setIsSpeaking(true);
          // Play audio only in voice mode
          clientRef.current.audioProcessor.playAudio(delta);
        }
      }));

      // Handle incoming messages
      const handleMessage = (msg, isUser = false) => {
        setMessages(prev => [...prev, { 
          id: msg.id, 
          text: msg.content || msg.text, 
          isUser,
          modality: currentModalityRef.current 
        }]);
      };
      
      // User transcription (only in voice mode)
      unsubscribersRef.current.push(client.on('conversation.item.input_audio_transcription.completed', (data) => {
        if (currentModalityRef.current === 'voice' && data.transcript) {
          handleMessage({ 
            id: data.item_id || `user-transcript-${Date.now()}`, 
            content: data.transcript 
          }, true);
        }
      }));
      
      // Assistant messages
      unsubscribersRef.current.push(client.on('assistant.message', (msg) => {
        handleMessage(msg, false); // Always show assistant messages regardless of modality
      }));
      
      // Handle streaming text updates
      let currentMessageId = null;
      let currentText = '';
      
      unsubscribersRef.current.push(client.on('text.delta', (delta) => {
        if (!currentMessageId) {
          currentMessageId = `msg-${Date.now()}`;
          setMessages(prev => [...prev, { 
            id: currentMessageId, 
            text: delta, 
            isUser: false, 
            isStreaming: true,
            modality: currentModalityRef.current 
          }]);
          currentText = delta;
        } else {
          currentText += delta;
          setMessages(prev => prev.map(m => 
            m.id === currentMessageId ? { ...m, text: currentText } : m
          ));
        }
      }));
      
      unsubscribersRef.current.push(client.on('text.done', (fullText) => {
        if (currentMessageId) {
          setMessages(prev => prev.map(m => 
            m.id === currentMessageId ? { ...m, text: fullText || currentText, isStreaming: false } : m
          ));
          currentMessageId = null;
          currentText = '';
        }
      }));

      // Handle function calls
      unsubscribersRef.current.push(client.on('function.call', async (functionCall) => {
        await handleFunctionCall(functionCall);
      }));
    };

    setupListeners();
    client.connect().catch(e => setError(e.message));

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      client.disconnect();
    };
  }, []); // Remove currentModality dependency - don't reinitialize client on modality changes

  const handleFunctionCall = useCallback(async ({ name, arguments: args, call_id }) => {
    const sendResult = (output) => {
      clientRef.current?.send({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: call_id,
          output: JSON.stringify(output)
        }
      });
    };

    try {
      switch (name) {
        case 'add_tasks':
          if (callbacksRef.current.onTaskAdd) callbacksRef.current.onTaskAdd(args.tasks);
          sendResult({ 
            success: true, 
            type: 'TASKS_ADDED',
            message: `${args.tasks?.length || 0} taken toegevoegd.` 
          });
          break;
        case 'get_tasks_from_list':
          if (callbacksRef.current.onGetTasksFromList) {
            const result = callbacksRef.current.onGetTasksFromList(args.list_name);
            sendResult({ 
              success: true,
              type: 'TASKS',
              ...result
            });
          } else {
            sendResult({ 
              success: false,
              type: 'ERROR',
              error: 'get_tasks_from_list niet geïmplementeerd'
            });
          }
          break;
        case 'complete_task':
          if (callbacksRef.current.onTaskComplete) callbacksRef.current.onTaskComplete(args.task_id);
          sendResult({ 
            success: true, 
            type: 'TASK_COMPLETED',
            message: `Taak voltooid.` 
          });
          break;
        case 'search_tasks':
          if (callbacksRef.current.onTaskSearch) {
            const results = callbacksRef.current.onTaskSearch(args.query);
            sendResult({ 
              success: true, 
              type: 'SEARCH_RESULTS',
              results 
            });
          } else {
            sendResult({ 
              success: false,
              type: 'ERROR',
              error: 'onTaskSearch niet geïmplementeerd'
            });
          }
          break;
        case 'add_calendar_event':
          if (callbacksRef.current.onCalendarEventAdd) {
            const result = await callbacksRef.current.onCalendarEventAdd(args);
            sendResult({ 
              success: true, 
              type: 'CALENDAR_EVENT_ADDED',
              eventId: result.id 
            });
          } else {
            sendResult({ 
              success: false,
              type: 'ERROR',
              error: 'onCalendarEventAdd niet geïmplementeerd'
            });
          }
          break;
        default:
          sendResult({ 
            success: false, 
            type: 'ERROR',
            error: `Onbekende functie: ${name}` 
          });
      }
    } catch (error) {
      sendResult({ 
        success: false, 
        type: 'ERROR',
        error: error.message 
      });
    }
    
    // Trigger response after function call with correct modality
    setTimeout(() => {
      if (clientRef.current && clientRef.current.ws?.readyState === WebSocket.OPEN) {
        const modalities = currentModalityRef.current === 'voice' ? ['text', 'audio'] : ['text'];
        clientRef.current.createResponse({ modalities });
      }
    }, 250);
  }, []); // Remove currentModality dependency - use refs instead

  const startConversation = async () => {
    try {
      setError(null);
      setCurrentModality('voice'); // Set to voice mode
      
      if (!clientRef.current.ws || clientRef.current.ws.readyState !== WebSocket.OPEN) {
        await clientRef.current.connect();
      }
      await clientRef.current.startRecording();
      
      const systemContext = callbacksRef.current.getSystemContext ? callbacksRef.current.getSystemContext() : {};
      clientRef.current.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [{
            type: 'input_text',
            text: `Context: ${JSON.stringify(systemContext)}. User is using VOICE input. Respond with both text and audio.`
          }]
        }
      });
      
      // Note: createResponse will be called automatically when user starts speaking
    } catch (error) {
      setError('Kon gesprek niet starten');
    }
  };

  const stopConversation = () => {
    clientRef.current?.stopRecording();
  };

  const sendTextMessage = (text) => {
    if (!text.trim()) return;
    
    setCurrentModality('text'); // Set to text mode
    setMessages(prev => [...prev, { 
      id: `user-${Date.now()}`, 
      text, 
      isUser: true,
      modality: 'text' 
    }]);
    
    const systemContext = callbacksRef.current.getSystemContext ? callbacksRef.current.getSystemContext() : {};
    clientRef.current.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [{
          type: 'input_text',
          text: `Context: ${JSON.stringify(systemContext)}. User is using TEXT input. Respond with text only, no audio.`
        }]
      }
    });

    clientRef.current.sendMessage(text);
    // Force text-only response
    clientRef.current.createResponse({ modalities: ['text'] });
  };

  const cancelResponse = () => {
    clientRef.current?.cancelResponse();
  };

  return {
    isConnected,
    isRecording,
    isSpeaking,
    messages,
    error,
    startConversation,
    stopConversation,
    sendTextMessage,
    cancelResponse,
    currentModality, // Expose current modality
  };
}