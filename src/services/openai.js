import { readTasksAloud } from './textToSpeech';
import { addEventToCalendar } from './googleCalendar';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  assistantId: 'asst_Zty5VY4aPP94Y5ubNEyLW7kd',
  dangerouslyAllowBrowser: true,
});

const functions = [
  {
    name: 'generateTasks',
    description: 'Generate tasks from input text',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
  },
  {
    name: 'readTasksAloud',
    description: 'Read tasks aloud using TTS',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              completed: { type: 'boolean' },
            },
            required: ['id', 'text', 'completed'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'planTaskInCalendar',
    description: 'Schedule a task in the Google Calendar',
    parameters: {
      type: 'object',
      properties: {
        taskDescription: { type: 'string' },
        startDateTime: { type: 'string', format: 'date-time' },
        endDateTime: { type: 'string', format: 'date-time' }
      },
      required: ['taskDescription', 'startDateTime', 'endDateTime']
    }
  },
  {
    name: 'generateNotes',
    description: 'Generate notes from input text',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
  },
];

export async function handleAICommand(input, currentTasks, currentNotes) {
  console.log('User input:', input);
  console.log('Current tasks:', currentTasks);
  console.log('Current notes:', currentNotes);

  // Verbeterde prompt voor meer conversatiecontext
  const messages = [
    {
      role: 'system',
      content: `Je bent een behulpzame assistent die kan helpen met taken en notities. 
      Je kunt nieuwe taken genereren, bestaande taken voorlezen, taken in de agenda plannen en notities maken.
      Reageer op een natuurlijke, conversationele manier. Als je een actie uitvoert, leg dan ook uit wat je gedaan hebt.
      Als de gebruiker een vraag stelt of een gesprek wil voeren, reageer dan als een behulpzame assistent zonder 
      noodzakelijkerwijs een functie aan te roepen.`
    },
    { role: 'user', content: input },
  ];

  // Include current tasks and notes in the message
  if (currentTasks && currentTasks.length > 0) {
    messages.push({
      role: 'system',
      content: `Huidige taken: ${JSON.stringify(currentTasks)}`
    });
  }
  
  if (currentNotes && currentNotes.length > 0) {
    messages.push({
      role: 'system',
      content: `Huidige notities: ${JSON.stringify(currentNotes)}`
    });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    functions,
    temperature: 0.7, // Iets hogere temperature voor meer gevarieerde antwoorden
  });

  console.log('Completion response:', completion);

  const aiMessage = completion.choices[0].message;

  if (aiMessage.function_call) {
    const { name, arguments: args } = aiMessage.function_call;
    const parsedArgs = JSON.parse(args);
    console.log('Function name:', name);
    console.log('Function arguments:', parsedArgs);

    switch (name) {
      case 'generateTasks':
        const newTasks = await generateTasks(parsedArgs.input);
        return { 
          type: 'tasks', 
          data: newTasks,
          message: `Ik heb de volgende ${newTasks.length > 1 ? 'taken' : 'taak'} toegevoegd: ${newTasks.join(', ')}`
        };
      case 'readTasksAloud':
        await readTasksAloud(parsedArgs.tasks);
        return { 
          type: 'action', 
          data: 'Taken worden voorgelezen',
          message: 'Ik lees je taken nu voor.'
        };
      case 'planTaskInCalendar':
        try {
          const result = await planTaskInCalendar(parsedArgs.taskDescription, parsedArgs.startDateTime, parsedArgs.endDateTime);
          return { 
            type: 'action', 
            data: result,
            message: `Ik heb "${parsedArgs.taskDescription}" ingepland van ${new Date(parsedArgs.startDateTime).toLocaleString()} tot ${new Date(parsedArgs.endDateTime).toLocaleString()}.`
          };
        } catch (error) {
          console.error('Error scheduling task in calendar:', error);
          return { 
            type: 'error', 
            data: error.message,
            message: `Er is een fout opgetreden bij het inplannen: ${error.message}`
          };
        }
      case 'generateNotes':
        const newNotes = await generateNotes(parsedArgs.input);
        return { 
          type: 'notes', 
          data: newNotes,
          message: `Ik heb een nieuwe notitie gemaakt.`
        };
      default:
        console.error('Unknown function call:', name);
        return { 
          type: 'error', 
          data: `Received an unknown function call: ${name}`,
          message: 'Er is een onbekende functie aangeroepen. Probeer het opnieuw.'
        };
    }
  } else if (aiMessage.content) {
    // Direct antwoord zonder functie aanroep
    return { 
      type: 'text', 
      data: aiMessage.content,
      message: aiMessage.content
    };
  } else {
    console.error('Unknown response structure:', aiMessage);
    return { 
      type: 'error', 
      data: 'Received an unknown response type from AI.',
      message: 'Er is een onbekende respons van de AI ontvangen. Probeer het opnieuw.'
    };
  }
}

export async function generateTasks(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates task lists. Interpret the input you receive as the output from someone who is trying to convey a list of tasks. If the input is unclear, distill the tasks from it the best you can. Provide your response as a JSON array of task strings. When the input is a single word or only a few words, add it as a task. When you are in doubt what tasks to extract from the input provide a short funny response, indicating that you want the user to try the input again"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let tasks;

    // Remove Markdown code block syntax if present
    const jsonString = content.replace(/^```json\n|\n```$/g, '').trim();

    try {
      tasks = JSON.parse(jsonString);
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }
    } catch (parseError) {
      console.error('Error parsing tasks:', parseError);
      // If parsing fails, split by commas and remove quotes
      tasks = jsonString.split(',').map(task => task.replace(/^["'\s]+|["'\s]+$/g, ''));
    }

    // Ensure each task is a string and non-empty
    tasks = tasks.map(task => task.toString().trim()).filter(task => task !== '');

    return tasks;
  } catch (error) {
    console.error('Error generating tasks:', error);
    throw new Error('Failed to generate tasks. Please try again.');
  }
}

export async function generateNotes(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates notes. Interpret the input you receive as the output from someone who is trying to convey a notes. Do not alter the input but treat it as a transcript that need to be saved as a note. Provide your response as a JSON array of a note string. When the input is a single word or only a few words, add it as a note. When you are in doubt what notes to extract from the input provide a short funny response, indicating that you want the user to try the input again"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let notes;

    // Remove Markdown code block syntax if present
    const jsonString = content.replace(/^```json\n|\n```$/g, '').trim();

    try {
      notes = JSON.parse(jsonString);
      if (!Array.isArray(notes)) {
        notes = [notes];
      }
    } catch (parseError) {
      console.error('Error parsing notes:', parseError);
      // If parsing fails, split by commas and remove quotes
      notes = jsonString.split(',').map(note => note.replace(/^["'\s]+|["'\s]+$/g, ''));
    }

    // Ensure each note is a string and non-empty
    notes = notes.map(note => note.toString().trim()).filter(note => note !== '');

    return notes;
  } catch (error) {
    console.error('Error generating notes:', error);
    throw new Error('Failed to generate notes. Please try again.');
  }
}

async function planTaskInCalendar(taskDescription, startDateTime, endDateTime) {
  console.log('Planning task in calendar:', taskDescription);
  console.log('Received Start DateTime:', startDateTime);
  console.log('Received End DateTime:', endDateTime);

  // Validate the date-time values
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  console.log('Parsed Start DateTime:', start);
  console.log('Parsed End DateTime:', end);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const errorMsg = 'Invalid date-time values provided.';
    console.error(errorMsg);
    console.error('Invalid Start DateTime:', startDateTime);
    console.error('Invalid End DateTime:', endDateTime);
    return `Failed to schedule task in calendar: ${errorMsg}`;
  }

  try {
    const event = {
      summary: taskDescription,
      start: {
        dateTime: start.toISOString(),  // Ensure it's in ISO 8601 format
        timeZone: 'Europe/Amsterdam',  // You can change 'UTC' to your desired time zone
      },
      end: {
        dateTime: end.toISOString(),  // Ensure it's in ISO 8601 format
        timeZone: 'Europe/Amsterdam',  // You can change 'UTC' to your desired time zone
      },
    };

    console.log('Event to be added:', event);

    await addEventToCalendar(event);
    console.log("Event added successfully");
    return "Task scheduled in calendar successfully";
  } catch (error) {
    console.error("Failed to schedule task in calendar:", error);
    return `Failed to schedule task in calendar: ${error.message}. Please ensure you're signed in to Google Calendar and try again.`;
  }
}




