// src/services/realtime/audio.js
export class AudioProcessor {
  constructor() {
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentSource = null;
    this.audioWorkletNode = null;
    this.stream = null;
  }

  async initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000, // Match OpenAI's expected sample rate
      });
    }
  }

  async startRecording() {
    try {
      // Initialize audio context
      await this.initializeAudioContext();
      
      // Stop any ongoing playback before starting recording
      this.stopPlayback();
      
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create audio source
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use AudioWorkletNode if available, fallback to ScriptProcessor
      if (this.audioContext.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        try {
          // First, we need to create and register the worklet processor
          const processorCode = `
            class AudioProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.bufferSize = 2048;
                this.buffer = new Float32Array(this.bufferSize);
                this.bufferIndex = 0;
              }
              
              process(inputs, outputs, parameters) {
                const input = inputs[0];
                if (input.length > 0) {
                  const inputData = input[0];
                  
                  for (let i = 0; i < inputData.length; i++) {
                    this.buffer[this.bufferIndex++] = inputData[i];
                    
                    if (this.bufferIndex >= this.bufferSize) {
                      // Convert to PCM16 and send
                      const pcm16 = new Int16Array(this.bufferSize);
                      for (let j = 0; j < this.bufferSize; j++) {
                        const s = Math.max(-1, Math.min(1, this.buffer[j]));
                        pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                      }
                      
                      this.port.postMessage({
                        type: 'audio',
                        buffer: pcm16.buffer
                      }, [pcm16.buffer]);
                      
                      this.bufferIndex = 0;
                    }
                  }
                }
                return true;
              }
            }
            registerProcessor('audio-processor', AudioProcessor);
          `;
          
          const blob = new Blob([processorCode], { type: 'application/javascript' });
          const workletUrl = URL.createObjectURL(blob);
          await this.audioContext.audioWorklet.addModule(workletUrl);
          
          this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
          
          this.audioWorkletNode.port.onmessage = (e) => {
            if (e.data.type === 'audio') {
              const base64 = this.arrayBufferToBase64(e.data.buffer);
              if (this.onAudioData) {
                this.onAudioData(base64);
              }
            }
          };
          
          source.connect(this.audioWorkletNode);
          this.audioWorkletNode.connect(this.audioContext.destination);
          
          URL.revokeObjectURL(workletUrl);
        } catch (error) {
          console.warn('AudioWorklet failed, falling back to ScriptProcessor:', error);
          this.setupScriptProcessor(source);
        }
      } else {
        // Fallback to ScriptProcessor
        this.setupScriptProcessor(source);
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  setupScriptProcessor(source) {
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32 to PCM16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convert to base64
      const buffer = pcm16.buffer;
      const base64 = this.arrayBufferToBase64(buffer);
      
      // Send audio data
      if (this.onAudioData) {
        this.onAudioData(base64);
      }
    };
    
    // Connect nodes
    source.connect(processor);
    processor.connect(this.audioContext.destination);
    
    // Store processor for cleanup
    this.processor = processor;
    this.source = source;
  }

  stopRecording() {
    // Disconnect and cleanup audio nodes
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Improved playAudio for OpenAI Realtime API PCM16 format
  async playAudio(base64Audio) {
    try {
      console.log('Playing audio chunk, length:', base64Audio.length);
      
      // Initialize audio context if needed
      await this.initializeAudioContext();
      
      // Decode base64 to array buffer
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(pcm16.length);
      
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }
      
      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        float32.length,
        24000 // sample rate must match
      );
      
      audioBuffer.getChannelData(0).set(float32);
      
      // Add to queue
      this.audioQueue.push(audioBuffer);
      
      // Play if not already playing
      if (!this.isPlaying) {
        this.playQueue();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async playQueue() {
    this.isPlaying = true;
    
    while (this.audioQueue.length > 0) {
      const audioBuffer = this.audioQueue.shift();
      
      try {
        // Create and play buffer source
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(this.audioContext.destination);
        
        // Wait for playback to complete
        await new Promise((resolve) => {
          this.currentSource.onended = () => {
            this.currentSource = null;
            resolve();
          };
          this.currentSource.start(0);
        });
      } catch (error) {
        console.error('Error playing audio buffer:', error);
        this.currentSource = null;
      }
    }
    
    this.isPlaying = false;
  }

  // Stop all audio playback (for interruption)
  stopPlayback() {
    // Stop current source
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }
    
    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;
  }

  // Helper function to convert ArrayBuffer to base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  // Cleanup method
  cleanup() {
    this.stopPlayback();
    this.stopRecording();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }
  }
}