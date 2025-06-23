// services/transcription.js
export class TranscriptionService {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    }
  
    async transcribeAudio(audioBlob, options = {}) {
      const {
        language = 'nl',
        prompt = '',
        temperature = 0,
        responseFormat = 'verbose_json'
      } = options;
  
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', responseFormat);
      
      if (prompt) {
        formData.append('prompt', prompt);
      }
      
      if (temperature > 0) {
        formData.append('temperature', temperature.toString());
      }
  
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: formData
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Transcription failed');
        }
  
        const result = await response.json();
        
        if (responseFormat === 'verbose_json') {
          return {
            text: result.text,
            language: result.language,
            duration: result.duration,
            segments: result.segments || [],
            words: result.words || []
          };
        }
        
        return { text: result };
      } catch (error) {
        console.error('Transcription error:', error);
        throw error;
      }
    }
  
    static getSupportedMimeType() {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];
  
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
      
      return 'audio/webm';
    }
  
    static calculateEstimatedCost(durationInSeconds) {
      const minutes = Math.ceil(durationInSeconds / 60);
      const costPerMinute = 0.006;
      return {
        minutes,
        estimatedCost: minutes * costPerMinute,
        formattedCost: `$${(minutes * costPerMinute).toFixed(3)}`
      };
    }
  }