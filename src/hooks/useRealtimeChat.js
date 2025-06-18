// src/hooks/useRealtimeChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeClient } from '../services/realtime';
import { addEventToCalendar } from '../services/googleCalendar';

export function useRealtimeChat({ 
  userId, 
  tasks,
  currentTasks, 
  updateTaskList,
  currentTaskList
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  
  const clientRef = useRef(null);
  const unsubscribersRef = useRef([]);

  // Initialize client and event handlers
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_OPENAI_API_KEY not found in environment variables');
      setError('OpenAI API key niet gevonden');
      return;
    }
    
    console.log('Initializing RealtimeClient with API key:', apiKey.substring(0, 10) + '...');

    const client = new RealtimeClient(apiKey);
    const unsubscribers = [];
    
    // Connection events
    unsubscribers.push(
      client.on('connected', () => {
        setIsConnected(true);
        setError(null);
        console.log('Connected to Realtime API');
      })
    );
    
    unsubscribers.push(
      client.on('disconnected', ({ unexpected }) => {
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
        
        if (unexpected) {
          setError('Verbinding onverwacht verbroken');
        }
      })
    );
    
    // Recording events
    unsubscribers.push(
      client.on('recording.started', () => {
        setIsRecording(true);
      })
    );
    
    unsubscribers.push(
      client.on('recording.stopped', () => {
        setIsRecording(false);
      })
    );
    
    unsubscribers.push(
      client.on('recording.error', (error) => {
        setIsRecording(false);
        setError('Microfoon fout: ' + error.message);
      })
    );
    
    // Speech events
    unsubscribers.push(
      client.on('speech.started', () => {
        console.log('User started speaking');
        setIsSpeaking(false); // Stop AI speaking when user starts
      })
    );
    
    unsubscribers.push(
      client.on('speech.stopped', () => {
        console.log('User stopped speaking');
      })
    );
    
    // Message events
    unsubscribers.push(
      client.on('assistant.message', (message) => {
        setMessages(prev => [...prev, {
          id: message.id,
          text: message.content,
          isUser: false
        }]);
      })
    );
    
    // Audio events
    unsubscribers.push(
      client.on('response.audio.delta', () => {
        setIsSpeaking(true);
      })
    );
    
    unsubscribers.push(
      client.on('audio.done', () => {
        setIsSpeaking(false);
      })
    );
    
    unsubscribers.push(
      client.on('response.audio.done', () => {
        setIsSpeaking(false);
      })
    );
    
    // Text streaming events
    let currentMessageId = null;
    let currentText = '';
    
    unsubscribers.push(
      client.on('text.delta', (delta) => {
        if (!currentMessageId) {
          currentMessageId = `msg-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: currentMessageId,
            text: delta,
            isUser: false,
            isStreaming: true
          }]);
          currentText = delta;
        } else {
          currentText += delta;
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageId 
              ? { ...msg, text: currentText }
              : msg
          ));
        }
      })
    );
    
    unsubscribers.push(
      client.on('text.done', () => {
        if (currentMessageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          ));
          currentMessageId = null;
          currentText = '';
        }
      })
    );
    
    // Function call events
    unsubscribers.push(
      client.on('function.call', async (functionCall) => {
        console.log('Function call:', functionCall);
        await handleFunctionCall(functionCall);
      })
    );
    
    // Response events
    unsubscribers.push(
      client.on('response.complete', () => {
        setIsSpeaking(false);
      })
    );
    
    // Error events
    unsubscribers.push(
      client.on('error', (error) => {
        console.error('Realtime error:', error);
        setError('Verbindingsfout');
      })
    );
    
    unsubscribers.push(
      client.on('server.error', (error) => {
        console.error('Server error:', error);
        setError(`Server fout: ${error.message || 'Onbekende fout'}`);
      })
    );
    
    clientRef.current = client;
    unsubscribersRef.current = unsubscribers;
    
    // Auto-connect
    client.connect().catch(err => {
      console.error('Initial connection failed:', err);
      setError('Kon geen verbinding maken');
    });
    
    // Cleanup
    return () => {
      console.log('Cleaning up useRealtimeChat...');
      // Unsubscribe all event listeners
      unsubscribers.forEach(unsub => unsub());
      // Disconnect client properly
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []); // Empty deps, only run once

  // Function call handler
  const handleFunctionCall = useCallback(async ({ name, arguments: args, call_id }) => {
    console.log(`Executing function: ${name}`, args);
    
    const sendFunctionResult = (output) => {
      clientRef.current.send({
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
        case 'add_tasks': {
          if (!args.tasks || !Array.isArray(args.tasks)) {
            sendFunctionResult({
              success: false,
              error: 'Geen taken opgegeven'
            });
            return;
          }
          
          const newTasks = args.tasks.map(taskText => ({
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: taskText,
            title: taskText.split('\n')[0].substring(0, 50),
            completed: false,
            createdAt: new Date().toISOString()
          }));
          
          const currentItems = currentTasks?.items || [];
          await updateTaskList(currentTaskList, {
            items: [...newTasks, ...currentItems]
          });
          
          sendFunctionResult({
            success: true,
            message: `${newTasks.length} ${newTasks.length === 1 ? 'taak' : 'taken'} toegevoegd aan "${currentTaskList}"`,
            added: newTasks.length
          });
          
          // Trigger response - langere delay voor stabiliteit
          setTimeout(() => {
            console.log('Triggering response after get_tasks_from_list');
            if (clientRef.current && clientRef.current.ws?.readyState === WebSocket.OPEN) {
              clientRef.current.send({
                type: 'response.create',
                response: {
                  modalities: ['text', 'audio']
                }
              });
            } else {
              console.warn('WebSocket not ready for response.create');
            }
          }, 500); // Verhoogd van 100ms naar 500ms
          break;
        }
        
        case 'add_calendar_event': {
          try {
            const event = {
              summary: args.title,
              start: {
                dateTime: args.start_time,
                timeZone: 'Europe/Amsterdam'
              },
              end: {
                dateTime: args.end_time,
                timeZone: 'Europe/Amsterdam'
              },
              description: args.description || ''
            };
            
            const result = await addEventToCalendar(event);
            
            sendFunctionResult({
              success: true,
              message: `Afspraak "${args.title}" ingepland`,
              eventId: result.id
            });
          } catch (error) {
            sendFunctionResult({
              success: false,
              error: `Kon afspraak niet inplannen: ${error.message}`
            });
          }
          break;
        }
        
        case 'search_tasks': {
          const searchQuery = (args.query || '').toLowerCase();
          const searchResults = [];
          
          // Search through all task lists
          if (tasks && typeof tasks === 'object') {
            Object.entries(tasks).forEach(([listName, list]) => {
              if (list && list.items && Array.isArray(list.items)) {
                list.items.forEach(task => {
                  if (task.text.toLowerCase().includes(searchQuery) ||
                      (task.title && task.title.toLowerCase().includes(searchQuery))) {
                    searchResults.push({
                      ...task,
                      list: listName
                    });
                  }
                });
              }
            });
          }
          
          sendFunctionResult({
            success: true,
            results: searchResults,
            count: searchResults.length,
            query: args.query
          });
          break;
        }
        
        case 'complete_task': {
          let taskFound = false;
          let taskDetails = null;
          
          // Find task in all lists
          if (tasks && typeof tasks === 'object') {
            for (const [listName, list] of Object.entries(tasks)) {
              if (list && list.items && Array.isArray(list.items)) {
                const taskIndex = list.items.findIndex(t => t.id === args.task_id);
                if (taskIndex !== -1) {
                  taskFound = true;
                  taskDetails = { ...list.items[taskIndex], list: listName };
                  
                  // Update task
                  const updatedItems = [...list.items];
                  updatedItems[taskIndex] = {
                    ...updatedItems[taskIndex],
                    completed: true,
                    completedAt: new Date().toISOString()
                  };
                  
                  await updateTaskList(listName, { items: updatedItems });
                  break;
                }
              }
            }
          }
          
          if (taskFound) {
            sendFunctionResult({
              success: true,
              message: `Taak "${taskDetails.title || taskDetails.text}" voltooid`,
              task: taskDetails
            });
          } else {
            sendFunctionResult({
              success: false,
              error: 'Taak niet gevonden'
            });
          }
          break;
        }
        
        case 'get_calendar_events': {
          // This would need Google Calendar integration
          sendFunctionResult({
            success: false,
            error: 'Calendar integratie nog niet geïmplementeerd'
          });
          break;
        }
        
        case 'list_all_tasks': {
          const allTasks = [];
          
          if (tasks && typeof tasks === 'object') {
            Object.entries(tasks).forEach(([listName, list]) => {
              if (list && list.items && Array.isArray(list.items)) {
                list.items.forEach(task => {
                  allTasks.push({
                    ...task,
                    list: listName
                  });
                });
              }
            });
          }
          
          sendFunctionResult({
            success: true,
            tasks: allTasks,
            count: allTasks.length,
            lists: Object.keys(tasks || {})
          });
          break;
        }
        
        case 'switch_task_list': {
          const { list_name } = args;
          
          if (!list_name) {
            sendFunctionResult({
              success: false,
              error: 'Geen lijstnaam opgegeven'
            });
            return;
          }
          
          if (tasks && tasks[list_name]) {
            // Dit zou eigenlijk de UI moeten updaten, maar dat kunnen we niet direct
            // We geven feedback dat de lijst bestaat
            sendFunctionResult({
              success: true,
              message: `Takenlijst "${list_name}" bestaat. Je kunt taken toevoegen aan deze lijst.`,
              current_list: currentTaskList,
              requested_list: list_name
            });
          } else {
            sendFunctionResult({
              success: false,
              error: `Takenlijst "${list_name}" bestaat niet`,
              available_lists: Object.keys(tasks || {})
            });
          }
          break;
        }
        
        case 'get_tasks_from_list': {
          const { list_name } = args;
          
          if (!list_name) {
            sendFunctionResult({
              success: false,
              error: 'Geen lijstnaam opgegeven'
            });
            return;
          }
          
          if (tasks && tasks[list_name]) {
            const taskList = tasks[list_name];
            const taskItems = taskList.items || [];
            
            sendFunctionResult({
              success: true,
              list_name: list_name,
              tasks: taskItems,
              count: taskItems.length,
              message: taskItems.length > 0 
                ? `Lijst "${list_name}" bevat ${taskItems.length} taken` 
                : `Lijst "${list_name}" is leeg`
            });
          } else {
            sendFunctionResult({
              success: false,
              error: `Takenlijst "${list_name}" bestaat niet`,
              available_lists: Object.keys(tasks || {})
            });
          }
          
          // Trigger een response na de function call - langere delay
          setTimeout(() => {
            console.log('Triggering response after add_tasks');
            if (clientRef.current && clientRef.current.ws?.readyState === WebSocket.OPEN) {
              clientRef.current.send({
                type: 'response.create',
                response: {
                  modalities: ['text', 'audio']
                }
              });
            }
          }, 500);
          break;
        }
        
        default:
          console.warn(`Unknown function: ${name}`);
          sendFunctionResult({
            success: false,
            error: `Onbekende functie: ${name}`
          });
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      sendFunctionResult({
        success: false,
        error: error.message
      });
    }
  }, [tasks, currentTasks, currentTaskList, updateTaskList]);

  // Start conversation with recording
  const startConversation = async () => {
    try {
      setError(null);
      
      // Ensure connection
      if (!clientRef.current.ws || clientRef.current.ws.readyState !== WebSocket.OPEN) {
        await clientRef.current.connect();
      }
      
      // Start recording
      await clientRef.current.startRecording();
      
      // Send initial context
      clientRef.current.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [
            {
              type: 'input_text',  // Changed from 'text' to 'input_text'
              text: `Context voor de gebruiker:
              - Huidige takenlijst: "${currentTaskList}" met ${currentTasks?.items?.length || 0} taken
              - Alle takenlijsten: ${Object.keys(tasks || {}).join(', ')}
              - Tijdzone: Europe/Amsterdam
              
              Gebruik de beschikbare functies om taken te beheren.`
            }
          ]
        }
      });
      
      // Start speaking indicator when AI starts responding
      setIsSpeaking(true);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Kon gesprek niet starten');
      setIsRecording(false);
    }
  };

  // Stop conversation
  const stopConversation = () => {
    if (clientRef.current) {
      clientRef.current.stopRecording();
    }
  };

  // Send text message
  const sendTextMessage = (text) => {
    if (!text.trim()) return;
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      text,
      isUser: true
    }]);
    
    // Send to API
    clientRef.current.sendMessage(text);
    
    // Create response
    clientRef.current.createResponse();
    
    // Start speaking indicator
    setIsSpeaking(true);
  };

  // Cancel current response
  const cancelResponse = () => {
    if (clientRef.current) {
      clientRef.current.cancelResponse();
      setIsSpeaking(false);
    }
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
    cancelResponse
  };
}