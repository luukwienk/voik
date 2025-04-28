import { addEventToCalendar, fetchGoogleCalendarEvents } from './googleCalendar';
import OpenAI from 'openai';
import { db, collection, getDocs } from '../firebase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  assistantId: 'asst_Zty5VY4aPP94Y5ubNEyLW7kd',
  dangerouslyAllowBrowser: true,
});

const functions = [
  {
    name: 'generateTasks',
    description: 'Genereer taken uit de input tekst',
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
    description: 'Lees taken voor met TTS',
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
    description: 'Plan een taak in de Google Calendar',
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
    description: 'Genereer notities uit de input tekst',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
  },
  {
    name: 'getCalendarEvents',
    description: 'Haal agenda-items op uit Google Calendar voor een bepaalde periode',
    parameters: {
      type: 'object',
      properties: {
        timeMin: { type: 'string', format: 'date-time' },
        timeMax: { type: 'string', format: 'date-time' }
      },
      required: ['timeMin', 'timeMax'],
    },
  },
  {
    name: 'getAllTaskLists',
    description: 'Geeft een overzicht van alle takenlijsten met hun taken terug.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
];

export async function handleAICommand({ text, currentTasks = [], currentNotes = [], conversationHistory = [], userId = null }) {
  console.log('handleAICommand aangeroepen met userId:', userId);
  try {
    const messages = [
      {
        role: 'system',
        content: `Je bent een slimme assistent die helpt met taken en notities beheren. 
        Je kunt taken toevoegen, verwijderen, voltooien en prioriteren.
        Je kunt ook notities maken en beheren.
        Gebruik een vriendelijke en professionele toon.
        Reageer in het Nederlands.
        
        Maak je antwoorden leesbaar door markdown te gebruiken. Bijvoorbeeld:
        - Gebruik **dikgedrukte tekst** voor belangrijke informatie
        - Gebruik *schuingedrukte tekst* voor nadruk
        - Gebruik opsommingstekens (-, *) voor lijsten
        - Gebruik \`code\` voor technische termen
        - Gebruik > voor citaten
        - Gebruik [links](url) voor verwijzingen
        
        Wanneer je taken wilt toevoegen, roep dan de generateTasks functie aan.
        Wanneer je notities wilt toevoegen, roep dan de generateNotes functie aan.
        Wanneer je taken wilt voorlezen, roep dan de readTasksAloud functie aan.
        Wanneer je een taak wilt inplannen, roep dan de planTaskInCalendar functie aan.
        
        Als de gebruiker een vraag stelt of een gesprek wil voeren, reageer dan als een behulpzame assistent zonder noodzakelijkerwijs een functie aan te roepen.`
      }
    ];

    // Voeg alle openstaande taken toe
    if (currentTasks && currentTasks.length > 0) {
      const openTasks = currentTasks
        .filter(task => !task.completed)
        .map(task => ({
          id: task.id,
          text: task.text,
          priority: task.priority || 'normal',
          dueDate: task.dueDate || null
        }));

      if (openTasks.length > 0) {
        messages.push({
          role: 'system',
          content: `Openstaande taken: ${JSON.stringify(openTasks)}`
        });
      }
    }

    // Voeg notities toe
    if (currentNotes && currentNotes.length > 0) {
      const sortedNotes = [...currentNotes].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      const recentNotes = sortedNotes
        .slice(0, 10)
        .map(note => ({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt || new Date().toISOString()
        }));

      if (recentNotes.length > 0) {
        messages.push({
          role: 'system',
          content: `Recente notities: ${JSON.stringify(recentNotes)}`
        });
      }
    }

    // Voeg conversatiegeschiedenis toe
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Voeg huidige input toe
    messages.push({
      role: 'user',
      content: text
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: messages,
      functions: functions,
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiMessage = response.choices[0].message;

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
        case 'getCalendarEvents':
          const events = await getCalendarEvents(parsedArgs.timeMin, parsedArgs.timeMax);
          return events;
        case 'getAllTaskLists':
          console.log('getAllTaskLists functie aangeroepen, userId beschikbaar:', Boolean(userId));
          if (!userId) {
            return {
              type: 'error',
              data: 'Geen userId beschikbaar voor ophalen van alle takenlijsten.',
              message: 'Kan geen takenlijsten ophalen zonder gebruikers-id.'
            };
          }
          const allTaskLists = await getAllTaskListsFromDatabase(userId);
          // Converteer het object naar een leesbaar formaat
          const formattedLists = Object.entries(allTaskLists).map(([listName, list]) => ({
            name: listName,
            itemCount: list.items?.length || 0
          }));
          
          // Bouw een leesbaar antwoord
          const message = formattedLists.length > 0
            ? `Je hebt ${formattedLists.length} takenlijst${formattedLists.length === 1 ? '' : 'en'}:\n` +
              formattedLists.map(list => `- ${list.name} (${list.itemCount} ${list.itemCount === 1 ? 'taak' : 'taken'})`).join('\n')
            : 'Je hebt nog geen takenlijsten.';
          
          return {
            type: 'text',
            data: formattedLists,
            message: message
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
  } catch (error) {
    console.error('Error in handleAICommand:', error);
    return {
      type: 'error',
      data: 'Er is een fout opgetreden bij het verwerken van je verzoek. Probeer het later opnieuw.'
    };
  }
}

export async function generateTasks(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Je bent een behulpzame assistent die takenlijsten genereert. Interpreteer de input als iemand die een lijst met taken probeert over te brengen. Als de input onduidelijk is, destilleer hier de taken uit op de beste manier. Geef je antwoord als een JSON-array van taakstrings. Als de input een enkel woord of slechts enkele woorden is, voeg dit toe als een taak. Als je twijfelt welke taken je uit de input moet halen, geef dan een kort grappig antwoord dat aangeeft dat je wilt dat de gebruiker de input opnieuw probeert."
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
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Je bent een behulpzame assistent die notities genereert. Interpreteer de input als iemand die notities probeert over te brengen. Verander de input niet, maar behandel het als een transcript dat als notitie moet worden opgeslagen. Geef je antwoord als een JSON-array van een notitiestring. Als de input een enkel woord of slechts enkele woorden is, voeg dit toe als een notitie. Als je twijfelt welke notities je uit de input moet halen, geef dan een kort grappig antwoord dat aangeeft dat je wilt dat de gebruiker de input opnieuw probeert."
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

function parseAIResponse(response, currentTasks, currentNotes) {
  try {
    // Controleer eerst op JSON-reactie
    if (response.startsWith('{') || response.startsWith('[')) {
      try {
        const parsed = JSON.parse(response);
        
        // Als het een array is met strings, is het waarschijnlijk een lijst met taken
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return {
            type: 'tasks',
            data: parsed
          };
        }
        
        // Als het een object is met een specifiek type
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.type === 'tasks' && Array.isArray(parsed.data)) {
            return parsed;
          }
          if (parsed.type === 'notes' && Array.isArray(parsed.data)) {
            return parsed;
          }
        }
      } catch (e) {
        // Als JSON-parsing faalt, ga door met tekstanalyse
      }
    }

    const lowerResponse = response.toLowerCase();
    
    // Detecteer taken op basis van meerdere patronen
    if (lowerResponse.includes('taak') || 
        lowerResponse.includes('taken') ||
        lowerResponse.includes('to-do') ||
        lowerResponse.includes('todo') ||
        lowerResponse.includes('to do')) {
      
      // Extraheer taken uit de tekst
      const tasks = response
        .split('\n')
        .filter(line => {
          const lowerLine = line.toLowerCase();
          // Filter introductiezinnen eruit
          return !lowerLine.includes('hier zijn je taken:') && 
                 !lowerLine.includes('ik heb de volgende taken toegevoegd:') &&
                 !lowerLine.includes('nieuwe taken:') &&
                 !lowerLine.includes('to-do lijst:') &&
                 line.trim().length > 0;
        })
        .map(line => {
          // Verwijder opsommingstekens en nummering
          return line.replace(/^[-\d\s.]+/, '').trim();
        })
        .filter(line => {
          // Filter lege regels en korte zinnen eruit
          return line.length > 0 && 
                 line.length > 3 && // Filter korte zinnen
                 !line.toLowerCase().includes('taak') && // Filter verwijzingen naar taken
                 !line.toLowerCase().includes('todo');
        });
      
      if (tasks.length > 0) {
        return {
          type: 'tasks',
          data: tasks
        };
      }
    }

    // Detecteer notities op basis van meerdere patronen
    if (lowerResponse.includes('notitie') || 
        lowerResponse.includes('notities') ||
        lowerResponse.includes('note') ||
        lowerResponse.includes('notes')) {
      
      const notes = response
        .split('\n')
        .filter(line => {
          const lowerLine = line.toLowerCase();
          return !lowerLine.includes('hier zijn je notities:') && 
                 !lowerLine.includes('ik heb de volgende notities toegevoegd:') &&
                 !lowerLine.includes('nieuwe notities:') &&
                 line.trim().length > 0;
        })
        .map(line => line.replace(/^[-\d\s.]+/, '').trim())
        .filter(line => line.length > 0);
      
      if (notes.length > 0) {
        return {
          type: 'notes',
          data: notes
        };
      }
    }

    // Als geen specifieke taken of notities zijn gedetecteerd, behandel als tekst
    return {
      type: 'text',
      data: response
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      type: 'error',
      data: 'Er is een fout opgetreden bij het verwerken van de AI-respons.'
    };
  }
}

async function getCalendarEvents(timeMin, timeMax) {
  try {
    console.log('Fetching calendar events from', timeMin, 'to', timeMax);
    
    // Wacht op initialisatie van de Google Calendar API
    if (!gapi.client || !gapi.client.calendar) {
      console.log('Google Calendar API not initialized, initializing...');
      await initClient();
    }
    
    // Gebruik Google Calendar API direct als fetchGoogleCalendarEvents niet beschikbaar is
    let events;
    try {
      // Probeer de utility functie te gebruiken
      events = await fetchGoogleCalendarEvents(timeMin, timeMax, 'primary');
    } catch (error) {
      console.log('Fallback to direct gapi call:', error);
      // Fallback naar directe gapi call als alternatief
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
        timeZone: 'Europe/Amsterdam' // Voeg timezone toe voor consistente resultaten
      });
      events = response.result.items;
    }
    
    // Log events voor debugging
    console.log('Retrieved events:', events);
    
    // Transformeer de events in een markdown-vriendelijk formaat
    const formattedEvents = events.map(event => ({
      summary: event.summary || 'Ongetiteld',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || 'Geen locatie',
      description: event.description || ''
    }));

    // Sorteer events op datum (oudste eerst)
    formattedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Bouw een markdown tabel met events
    let markdownResponse = `## Je agenda van ${new Date(timeMin).toLocaleDateString()} tot ${new Date(timeMax).toLocaleDateString()}\n\n`;
    
    if (formattedEvents.length === 0) {
      markdownResponse += "Je hebt geen afspraken in deze periode.";
    } else {
      markdownResponse += "| Datum | Tijd | Omschrijving | Locatie |\n";
      markdownResponse += "|-------|------|--------------|--------|\n";
      
      formattedEvents.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const datumStr = startDate.toLocaleDateString('nl-NL', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Format tijd-range
        const startTijd = startDate.toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'});
        const eindTijd = endDate.toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'});
        const tijdStr = `${startTijd} - ${eindTijd}`;
        
        markdownResponse += `| ${datumStr} | ${tijdStr} | ${event.summary} | ${event.location} |\n`;
      });
    }

    return {
      type: 'text',
      data: formattedEvents,
      message: markdownResponse
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      type: 'error',
      data: error.message,
      message: `Er is een fout opgetreden bij het ophalen van je agenda: ${error.message}`
    };
  }
}

export async function getAllTaskListsFromDatabase(userId) {
  console.log('getAllTaskListsFromDatabase aangeroepen met userId:', userId);
  if (!userId) {
    console.error('No userId provided for database operation');
    return {
      type: 'error',
      data: 'User authentication required',
      message: 'Je moet ingelogd zijn om deze actie uit te voeren.'
    };
  }
  try {
    const tasksCollection = collection(db, 'users', userId, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollection);
    const allTaskLists = {};
    tasksSnapshot.forEach((doc) => {
      allTaskLists[doc.id] = {
        items: doc.data().items || []
      };
    });
    return allTaskLists;
  } catch (error) {
    console.error('Fout bij ophalen van alle takenlijsten:', error);
    throw error;
  }
}




