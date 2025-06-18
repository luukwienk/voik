// src/services/realtime/functions.js
export const realtimeFunctions = [
    {
      type: "function",
      name: "add_tasks",
      description: "Voeg nieuwe taken toe aan de huidige takenlijst",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: { type: "string" },
            description: "Array van taken om toe te voegen"
          }
        },
        required: ["tasks"]
      }
    },
    {
      type: "function",
      name: "get_tasks_from_list",
      description: "Haal alle taken op uit een specifieke takenlijst",
      parameters: {
        type: "object",
        properties: {
          list_name: {
            type: "string",
            description: "Naam van de takenlijst (bijv. 'Today', 'Boodschappen', etc.)"
          }
        },
        required: ["list_name"]
      }
    },
    {
      type: "function", 
      name: "add_calendar_event",
      description: "Plan een afspraak in Google Calendar",
      parameters: {
        type: "object",
        properties: {
          title: { 
            type: "string",
            description: "Titel van de afspraak"
          },
          start_time: { 
            type: "string", 
            format: "date-time",
            description: "Start tijd in ISO 8601 format"
          },
          end_time: { 
            type: "string", 
            format: "date-time",
            description: "Eind tijd in ISO 8601 format"
          }
        },
        required: ["title", "start_time", "end_time"]
      }
    },
    {
      type: "function",
      name: "search_tasks",
      description: "Zoek taken in alle lijsten",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Zoekterm"
          }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "complete_task",
      description: "Markeer een taak als voltooid",
      parameters: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
            description: "ID van de taak"
          }
        },
        required: ["task_id"]
      }
    },
    {
      type: "function",
      name: "get_calendar_events",
      description: "Haal agenda items op voor een bepaalde periode",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            format: "date",
            description: "Start datum (YYYY-MM-DD)"
          },
          end_date: {
            type: "string",
            format: "date",
            description: "Eind datum (YYYY-MM-DD)"
          }
        },
        required: ["start_date", "end_date"]
      }
    },
    {
      type: "function",
      name: "list_all_tasks",
      description: "Toon alle taken uit alle lijsten",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      type: "function",
      name: "switch_task_list",
      description: "Wissel naar een andere takenlijst",
      parameters: {
        type: "object",
        properties: {
          list_name: {
            type: "string",
            description: "Naam van de takenlijst om naar te wisselen"
          }
        },
        required: ["list_name"]
      }
    }
  ];