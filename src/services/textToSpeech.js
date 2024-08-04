import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: This is for development purposes only
});

export const readTasksAloud = async (tasks) => {
  if (!tasks || tasks.length === 0) {
    throw new Error('No tasks to read aloud');
  }

  const taskText = tasks.map(task => task.text).join('. ');

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: taskText,
    });

    const reader = response.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        return pump();
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
      }
    });

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createBufferSource();
    const audioBuffer = await new Response(stream).arrayBuffer();
    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
    
    source.buffer = decodedAudio;
    source.connect(audioContext.destination);
    source.start();
    
  } catch (error) {
    console.error('Error generating speech:', error);
  }
};
