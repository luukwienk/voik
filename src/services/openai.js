import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: This is not recommended for production
});

export async function generateTasks(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates task lists. Interpret the input you receive as the output from someone who is trying to convey a list of tasks. If the input is unclear, distill the tasks from it the best you can. Provide your response as a JSON array of task strings. When the input is a single word or only a few words, add it as a task. When you are in doubt what tasks to extract from the input provide a short funny response, indicating that you want the user to try the input again" },
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

export async function updateTasks(currentTasks, updatePrompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that updates task lists. Provide your response as a JSON array of task strings." },
        { role: "user", content: `Current tasks: ${JSON.stringify(currentTasks)}. Update request: ${updatePrompt}` }
      ],
      temperature: 0.7,
    });

    const tasksString = completion.choices[0].message.content;
    let tasks;
    try {
      tasks = JSON.parse(tasksString);
      if (!Array.isArray(tasks)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Error parsing tasks:', parseError);
      // If parsing fails, split the string by newlines as a fallback
      tasks = tasksString.split('\n').filter(task => task.trim() !== '');
    }

    return tasks;
  } catch (error) {
    console.error('Error updating tasks:', error);
    throw new Error('Failed to update tasks. Please try again.');
  }
}

export async function generateAgendaDetails(taskText, schedulingInfo) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant that generates detailed agenda items based on tasks and scheduling information."
        },
        { 
          role: "user", 
          content: `Generate an agenda item for the following task: "${taskText}". The user provided this scheduling information: "${schedulingInfo}"`
        }
      ],
      tools: [{
        type: "function",
        function: {
          name: "create_calendar_event",
          description: "Create a calendar event based on the task and scheduling information",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the event"
              },
              description: {
                type: "string",
                description: "A description of the event"
              },
              date: {
                type: "string",
                description: "The date of the event in YYYY-MM-DD format"
              },
              time: {
                type: "string",
                description: "The time of the event in HH:MM format"
              },
              duration: {
                type: "string",
                description: "The duration of the event (e.g., '1 hour', '30 minutes')"
              }
            },
            required: ["title", "description", "date", "time", "duration"]
          }
        }
      }],
      tool_choice: "auto"
    });

    const responseMessage = completion.choices[0].message;
    
    if (responseMessage.tool_calls) {
      const functionCall = responseMessage.tool_calls[0].function;
      const functionArgs = JSON.parse(functionCall.arguments);
      return functionArgs;
    } else {
      throw new Error('No function call in the response');
    }
  } catch (error) {
    console.error('Error generating agenda details:', error);
    throw new Error('Failed to generate agenda details. Please try again.');
  }
}
