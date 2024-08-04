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
      },
      required: ['taskDescription'],
    },
  },
];

export async function handleAICommand(input, currentTasks) {
  console.log('User input:', input);

  const messages = [
    {
      role: 'system',
      content: 'I am an AI that can generate tasks, read them aloud, and schedule tasks in a calendar. Based on the user input, decide the appropriate action.'
    },
    { role: 'user', content: input },
  ];

  // Always include current tasks in the message
  messages.push({
    role: 'user',
    content: JSON.stringify({ currentTasks: currentTasks })
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    functions,
    temperature: 0.5,
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
        return { type: 'tasks', data: newTasks };
      case 'readTasksAloud':
        await readTasksAloud(parsedArgs.tasks);
        return { type: 'action', data: 'Tasks read aloud' };
        case 'planTaskInCalendar':
          try {
            const result = await planTaskInCalendar(parsedArgs.taskDescription);
            return { type: 'action', data: result };
          } catch (error) {
            console.error('Error scheduling task in calendar:', error);
            return { type: 'error', data: error.message };
          }
        // ... other cases ...
      }
  } else {
    // If no function call was determined, return the AI's text response
    return { type: 'text', data: aiMessage.content };
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

async function planTaskInCalendar(taskDescription) {
  console.log('Planning task in calendar:', taskDescription);
  const event = {
    summary: taskDescription,
    start: {
      dateTime: new Date().toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Los_Angeles',
    },
  };

  try {
    await addEventToCalendar(event);
    console.log("Event added successfully");
    return "Task scheduled in calendar successfully";
  } catch (error) {
    console.error("Failed to add event:", error);
    throw new Error("Failed to schedule task in calendar. Please try again.");
  }
}