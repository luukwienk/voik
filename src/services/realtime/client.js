// src/services/realtime/client.js
import { AudioProcessor } from './audio';
import { realtimeFunctions } from './functions';
import { debugLog, debugError, debugWarn } from '../../utils/debug';

export class RealtimeClient {
  // getClientSecret: async () => ({ clientSecret, model }). The secret is a
  // short-lived Realtime token minted server-side; the API key stays there.
  constructor(getClientSecret) {
    if (!getClientSecret) {
      throw new Error('getClientSecret is required');
    }
    
    this.getClientSecret = getClientSecret;
    this.ws = null;
    this.audioProcessor = new AudioProcessor();
    this.eventHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.isDisconnecting = false;
    this.pingInterval = null;
    this.sessionUrl = null;
    this.recordingStartTime = null;
    this.audioDataSent = false;
    
    this.sessionConfig = {
      voice: 'alloy',
      instructions: `Je bent TaskBuddy, een behulpzame AI-assistent die helpt met taken en calendar planning. 
      Reageer altijd in het Nederlands. Wees vriendelijk, beknopt en actiegericht. 
      
      BELANGRIJK voor taken vragen: 
      - Als iemand vraagt "welke taken heb ik" of "wat staat er op mijn lijst", gebruik dan EERST get_tasks_from_list
      - Als de context al taken bevat, noem deze dan concreet op
      - Als iemand naar een specifieke lijst vraagt, gebruik get_tasks_from_list met die lijstnaam
      - Wees specifiek: noem de taken bij naam, niet alleen het aantal`,
      tools: realtimeFunctions,
      tool_choice: 'auto',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      audio_format: { type: 'audio/pcm', rate: 24000 }
    };
  }

  async connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      debugLog('Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.isDisconnecting = false;

    try {
      debugLog('Connecting to OpenAI Realtime API...');
      
      // A fresh token per connect: they expire within minutes
      const { clientSecret, model } = await this.getClientSecret();
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      
      debugLog('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${clientSecret}`
      ]);
      
      this.setupEventHandlers();
      
      // Setup audio data handler
      this.audioProcessor.onAudioData = (audioData) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendAudio(audioData);
        }
      };
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 15000);
        
        const handleOpen = () => {
          clearTimeout(timeout);
          debugLog('WebSocket connected successfully');
          resolve();
        };
        
        const handleError = (error) => {
          clearTimeout(timeout);
          debugError('WebSocket error during connection:', error);
          reject(new Error('WebSocket connection failed'));
        };
        
        this.ws.addEventListener('open', handleOpen, { once: true });
        this.ws.addEventListener('error', handleError, { once: true });
      });
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startPingInterval();
      
    } catch (error) {
      this.isConnecting = false;
      debugError('Connection error:', error);
      this.emit('error', error);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isDisconnecting) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      debugLog('WebSocket opened, sending session.update with configuration...');
      
      // Send session configuration after connection
      this.send({
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions: this.sessionConfig.instructions,
          tools: this.sessionConfig.tools,
          tool_choice: this.sessionConfig.tool_choice,
          output_modalities: ['audio'],
          audio: {
            input: {
              format: this.sessionConfig.audio_format,
              turn_detection: this.sessionConfig.turn_detection
            },
            output: {
              format: this.sessionConfig.audio_format,
              voice: this.sessionConfig.voice
            }
          }
        }
      });
      
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerEvent(data);
      } catch (error) {
        debugError('Error parsing message:', error);
      }
    };

    this.ws.onerror = (error) => {
      debugError('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = (event) => {
      debugLog('Disconnected from Realtime API', event.code, event.reason);
      this.stopPingInterval();
      
      // Clear session URL
      this.sessionUrl = null;
      
      // Handle unexpected disconnection
      if (!this.isDisconnecting && event.code !== 1000) {
        this.emit('disconnected', { unexpected: true });
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      } else {
        this.emit('disconnected', { unexpected: false });
      }
    };
  }

  handleServerEvent(event) {
    debugLog('Server event:', event.type, event); // Log het hele event object
    
    // Log ALLE events die "transcript" bevatten
    if (JSON.stringify(event).includes('transcript') && !event.type.includes('response')) {
      debugLog('POSSIBLE USER TRANSCRIPT EVENT:', event);
    }
    
    // Voeg deze case toe voor andere mogelijke transcriptie events:
    if (event.type.includes('transcription') || event.type.includes('audio')) {
      debugLog('Audio/Transcription related event:', event);
    }
    
    switch (event.type) {
      case 'error':
        debugError('Server error:', event.error);
        this.emit('server.error', event.error);
        break;
        
      case 'session.created':
        debugLog('Session created:', event.session);
        this.emit('session.created', event.session);
        break;
        
      case 'session.updated':
        debugLog('Session updated:', event.session);
        this.emit('session.updated', event.session);
        break;
        
      case 'response.content_part.added':
        // Check if this contains transcription
        if (event.part?.transcript) {
          this.emit('conversation.item.input_audio_transcription.completed', {
            transcript: event.part.transcript,
            item_id: event.item_id
          });
        }
        break;

      case 'response.output_audio_transcript.delta':
        // Another possible transcription event
        if (event.transcript) {
          this.emit('conversation.item.input_audio_transcription.completed', {
            transcript: event.transcript,
            item_id: event.item_id
          });
        }
        break;
        
      case 'response.output_audio_transcript.done':
        // Dit is het transcriptie event voor de ASSISTANT (niet de user)
        if (event.transcript) {
          debugLog('Assistant audio transcript:', event.transcript);
          // VOEG DIT TOE - emit als assistant message
          this.emit('assistant.message', {
            id: event.item_id || `assistant-transcript-${Date.now()}`,
            content: event.transcript
          });
        }
        break;
        
      case 'conversation.item.added':
        debugLog('FULL conversation item:', event.item);
        
        // Check voor user audio transcripties in conversation items
        if (event.item?.role === 'user' && event.item?.content) {
          // Loop door content array voor audio transcripties
          const audioContent = event.item.content.find(c => c.type === 'input_audio' && c.transcript);
          if (audioContent) {
            this.emit('conversation.item.input_audio_transcription.completed', {
              transcript: audioContent.transcript,
              item_id: event.item.id
            });
          }
        }
        
        // Handle assistant messages
        if (event.item?.role === 'assistant' && event.item?.content?.[0]?.text) {
          this.emit('assistant.message', {
            id: event.item.id,
            content: event.item.content[0].text
          });
        }
        break;
        
      case 'response.output_audio.delta':
        if (event.delta) {
          // Always emit the event, let the hook decide what to do
          this.emit('response.audio.delta', event.delta);
          // Audio playback is now controlled by the hook based on modality
        }
        break;
        
      case 'response.output_audio.done':
        this.emit('audio.done');
        this.emit('response.complete', event);
        break;
        
      case 'response.output_text.delta':
        this.emit('text.delta', event.delta);
        break;
        
      case 'response.output_text.done':
        this.emit('text.done', event.text);
        break;
        
      case 'response.function_call_arguments.done':
        this.emit('function.call', {
          name: event.name,
          arguments: JSON.parse(event.arguments),
          call_id: event.call_id
        });
        break;
        
      case 'input_audio_buffer.speech_started':
        // User started speaking - interrupt any ongoing audio
        this.audioProcessor.stopPlayback();
        this.emit('speech.started');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.stopped');
        break;
        
      case 'response.done':
        this.emit('response.complete', event);
        break;
        
      case 'rate_limits.updated':
        debugLog('Rate limits:', event.rate_limits);
        break;
        
      default:
        debugWarn(`Unknown server event: ${event.type}`);
    }
  }

  sendAudio(base64Audio) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
      this.audioDataSent = true;
    } else {
      debugWarn('WebSocket not ready for sending:', { type: 'input_audio_buffer.append', audio: base64Audio });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      debugWarn('WebSocket not ready for sending:', data.type);
    }
  }

  async startRecording() {
    try {
      this.audioDataSent = false; // Reset flag bij start
      await this.audioProcessor.startRecording();
      this.recordingStartTime = Date.now();
      this.emit('recording.started');
    } catch (error) {
      debugError('Failed to start recording:', error);
      this.emit('recording.error', error);
      throw error;
    }
  }

  stopRecording() {
    this.audioProcessor.stopRecording();
    
    // Check of we überhaupt audio data hebben verzonden
    if (this.recordingStartTime && this.audioDataSent) {
      const recordingDuration = Date.now() - this.recordingStartTime;
      // debugLog(`Recording duration: ${recordingDuration}ms`); // Debug log verwijderd
      
      if (recordingDuration > 500) {
        this.send({ type: 'input_audio_buffer.commit' });
      } else {
        debugLog('Skipping commit - recording too short');
        this.send({ type: 'input_audio_buffer.clear' });
      }
    } else {
      debugLog('No audio data sent - clearing buffer');
      this.send({ type: 'input_audio_buffer.clear' });
    }
    
    this.recordingStartTime = null;
    this.audioDataSent = false; // reset flag
    this.emit('recording.stopped');
  }

  // Send a text message
  sendMessage(text) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    });
  }

  // Create a response. The GA API takes a single output modality; audio
  // responses also stream a transcript, so 'audio' covers voice mode.
  createResponse({ modalities = ['text', 'audio'], ...config } = {}) {
    this.send({
      type: 'response.create',
      response: {
        output_modalities: modalities.includes('audio') ? ['audio'] : ['text'],
        ...config
      }
    });
  }

  // Update session configuration
  updateSession(config) {
    this.send({
      type: 'session.update',
      session: config
    });
  }

  // Cancel current response
  cancelResponse() {
    this.send({ type: 'response.cancel' });
    this.audioProcessor.stopPlayback();
    this.emit('response.cancelled');
  }

  disconnect() {
    this.isDisconnecting = true;
    this.stopPingInterval();
    
    // Stop recording and playback
    this.audioProcessor.cleanup();
    
    // Close WebSocket
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
    
    // Clear recording start time
    this.recordingStartTime = null;
    
    this.emit('disconnected', { unexpected: false });
  }

  // Reconnection logic
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    debugLog(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isDisconnecting) {
        this.connect().catch(debugError);
      }
    }, delay);
  }

  // Ping to keep connection alive
  startPingInterval() {
    // Clear any existing interval first
    this.stopPingInterval();
    
    // OpenAI Realtime API doesn't support ping messages
    // Instead, we'll just monitor the connection state
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Connection is still open, do nothing
        // debugLog('WebSocket connection is alive'); // Debug log verwijderd
      } else if (this.ws) {
        debugLog('WebSocket connection lost');
        this.stopPingInterval();
      }
    }, 30000);
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Event emitter pattern
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    };
  }

  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          debugError(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}