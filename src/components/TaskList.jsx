import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import EditTask from './EditTask';
import VoiceInput from './VoiceInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy, faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import { generateAgendaDetails } from '../services/openai';
import { gapi } from 'gapi-script';

const TaskList = ({ tasks, onToggleCompletion, onDeleteTask, onUpdateTask, onCreateAgendaItem, onAddTask }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [recordingTaskId, setRecordingTaskId] = useState(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false);
  const [generatedAgenda, setGeneratedAgenda] = useState(null);
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);

  useEffect(() => {
    const loadGoogleApi = async () => {
      try {
        await new Promise((resolve) => gapi.load('client:auth2', resolve));
        await gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          scope: "https://www.googleapis.com/auth/calendar.events"
        });
        setIsGoogleApiReady(true);
      } catch (error) {
        console.error('Error initializing Google API:', error);
        alert('Failed to initialize Google Calendar. Some features may not work.');
      }
    };
    loadGoogleApi();
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText);
      setNewTaskText('');
    }
  };

  const copyTasksToClipboard = () => {
    const taskText = tasks.map(task => `${task.completed ? '✓' : '☐'} ${task.text}`).join('\n');
    navigator.clipboard.writeText(taskText).then(() => {
      alert('Copied tasks!');
    }, (err) => {
      console.error('Could not copy tasks: ', err);
    });
  };

  const handleStartRecording = (taskId) => {
    setRecordingTaskId(taskId);
  };

  const handleVoiceInputComplete = async (text) => {
    setVoiceInput(text);
    const task = tasks.find(t => t.id === recordingTaskId);
    setIsGeneratingAgenda(true);
    try {
      const agendaDetails = await generateAgendaDetails(task.text, text);
      setGeneratedAgenda(agendaDetails);
      onCreateAgendaItem(task, agendaDetails);
    } catch (error) {
      console.error('Failed to generate agenda details:', error);
      alert('Failed to generate agenda details. Please try again.');
    } finally {
      setIsGeneratingAgenda(false);
      setRecordingTaskId(null);
      setVoiceInput('');
    }
  };

  const calculateEndTime = (date, startTime, duration) => {
    try {
      const [hours, minutes] = duration.split(' ')[0].split(':').map(Number);
      const endTime = new Date(`${date}T${startTime}`);
      if (isNaN(endTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      endTime.setMinutes(endTime.getMinutes() + (minutes || 0));
      endTime.setHours(endTime.getHours() + (hours || 0));
      return endTime.toISOString();
    } catch (error) {
      console.error('Error calculating end time:', error);
      // Return a default end time (e.g., 1 hour from start)
      const defaultEnd = new Date(`${date}T${startTime}`);
      defaultEnd.setHours(defaultEnd.getHours() + 1);
      return defaultEnd.toISOString();
    }
  };

  const handleSaveToCalendar = async (agendaItem) => {
    if (!isGoogleApiReady) {
      alert('Google Calendar API is not ready. Please try again in a moment.');
      return;
    }

    const event = {
      summary: agendaItem.title,
      description: agendaItem.description,
      start: {
        dateTime: `${agendaItem.date}T${agendaItem.time}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: calculateEndTime(agendaItem.date, agendaItem.time, agendaItem.duration),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    try {
      console.log('Attempting to sign in to Google...');
      await gapi.auth2.getAuthInstance().signIn();
      console.log('Successfully signed in, creating calendar event...');
      
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      
      console.log('Event created: %s', response.result.htmlLink);
      alert(`Event "${agendaItem.title}" added to Google Calendar!`);
      setGeneratedAgenda(null);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      if (error.error === 'popup_blocked_by_browser') {
        alert('Please allow popups for this site to sign in to Google Calendar.');
      } else {
        alert(`Failed to add event to Google Calendar: ${error.message || 'Unknown error'}`);
      }
    }
  };

  if (tasks.length === 0) {
    return <p>No tasks yet. Press Start, speak. Take your time. Press Stop when ready.</p>;
  }

  return (
    <div className="task-list">
      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task"
        />
        <button type="submit">+</button>
      </form>
      <div className="task-list-header">
        <h3>Taskslist:</h3>
        <button onClick={copyTasksToClipboard} className="copy-list-btn" title="Copy list">
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </div>
      <Droppable droppableId="droppable-tasks" key={tasks.map(t => t.id).join(',')}>
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <span className="drag-handle">☰</span>
                    {editingTaskId === task.id ? (
                      <EditTask
                        task={task}
                        onSave={(updatedText) => {
                          onUpdateTask(task.id, updatedText);
                          setEditingTaskId(null);
                        }}
                        onCancel={() => setEditingTaskId(null)}
                      />
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => onToggleCompletion(task.id)}
                        />
                        <span className="task-text">{task.text}</span>
                        <button onClick={() => setEditingTaskId(task.id)} className="edit-task-btn">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => onDeleteTask(task.id)} className="delete-task-btn">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button onClick={() => handleStartRecording(task.id)} className="create-agenda-btn">
                          <FontAwesomeIcon icon={faCalendarPlus} />
                        </button>
                      </>
                    )}
                    {recordingTaskId === task.id && (
                      <div className="voice-input-container">
                        <p>Please say the date and time for the appointment.</p>
                        <VoiceInput
                          onInputComplete={handleVoiceInputComplete}
                          onTextChange={setVoiceInput}
                        />
                        <p>Recognized: {voiceInput}</p>
                        {isGeneratingAgenda && <p>Generating agenda details...</p>}
                      </div>
                    )}
                    {generatedAgenda && recordingTaskId === task.id && (
                      <div className="generated-agenda">
                        <h4>Generated Agenda Item:</h4>
                        <p>Title: {generatedAgenda.title}</p>
                        <p>Description: {generatedAgenda.description}</p>
                        <p>Date: {generatedAgenda.date}</p>
                        <p>Time: {generatedAgenda.time}</p>
                        <p>Duration: {generatedAgenda.duration}</p>
                        <button onClick={() => handleSaveToCalendar(generatedAgenda)}>
                          Save to Calendar
                        </button>
                      </div>
                    )}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </div>
  );
};

export default TaskList;
