# Voik - Voice Task Manager

Voik is a voice-activated task management application that allows users to create and manage tasks using voice commands.

## Features

- Planner Board (columns = lists): select up to 5 lists, drag to reorder columns and tasks, add tasks per column.
- Task lists and overview: rich editor (TipTap), search/table view with filters and bulk actions.
- Realtime chat assistant: text and voice modes (OpenAI Realtime) for tasks and calendar.
- Google Calendar integration: schedule tasks and manage events.

## Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of [Node.js and npm](https://nodejs.org/)
* You have a Google account for Calendar integration
* You have an OpenAI account for voice recognition capabilities

## Installing Voik

To install Voik, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/luukwienk/voik.git
   ```
2. Navigate to the project directory:
   ```
   cd voik
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Configuration

1. Copy the `.env.example` file to `.env`:
   ```
   cp .env.example .env
   ```
2. Open the `.env` file and fill in your API keys:
   ```
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
   VITE_OPENAI_API_KEY=your-openai-api-key
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_GOOGLE_API_KEY=your-google-api-key
   VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## Using Voik

To use Voik, follow these steps:

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your web browser and navigate to `http://localhost:5173`

### Planner Board
- Open the Board tab (columns icon in the navbar).
- Use the dropdown to select up to 5 lists as columns (persisted in `localStorage` under `voik_planner_columns`).
- Drag to reorder columns; drag tasks within or across columns (tasks land where you drop them).
- Add a task per column using the inline Add field.

### Chat Assistant
- Click the floating chat button to open the assistant.
- Type a message or click the mic to start/stop voice. Allow mic permission and set `VITE_OPENAI_API_KEY` in `.env`.

### Calendar
- Desktop split view: on desktop, the Task List appears on the left and the Google Calendar on the right. On mobile, you’ll see just one surface at a time.
- Drag tasks to calendar: grab a task card (not the reorder grip) and drop it onto a time slot to create a Google Calendar event.
- Reorder vs. schedule: use the grip icon (⋮) on a task to reorder within the list; drag the card body itself to schedule it on the calendar.
- Default calendar: open Calendar Settings (gear button on the calendar) to pick a default target calendar for new events. Stored in `localStorage`.
- Opens in Google: clicking a calendar event opens the native Google Calendar event page (Meet links, notes, etc.) in a new tab.
- Day view + scroll to now: the calendar defaults to Day view on Today and auto‑scrolls to the current time.
- Full day scroll: time range spans 00:00–23:59.
- Smart deduplication: events from multiple calendars with the same invite (iCalUID) are grouped so you don’t see duplicates. The app prefers your default calendar (or a selected one) as the displayed source.
- Subtle source label: calendar cards show a small label with the agenda name.

Tips
- If drag doesn’t create events, confirm you authenticated Google with write access (owner/writer) for the selected/default calendar.
- If you see duplicates after changes, use the Refresh button in Calendar Settings; dedupe happens on iCalUID and title+time.
- On iPad the app behaves like mobile for layout purposes.

## Transcription (Background, Long Recordings)

- After stopping a recording, click "Upload & Transcribe (achtergrond)" to upload audio and process it in the background.
- The audio is uploaded to Firebase Storage and a Cloud Function transcribes it in chunks. Status appears in the list as "Wachtend" or "Bezig" until completion.
- Very long meetings are supported; you can navigate away while it processes.

Deployment notes:
- Backend function lives in `functions/` and requires `OPENAI_API_KEY` as an environment variable/secret.
- The function triggers on uploads to `transcriptions/{uid}/{docId}.webm` and writes results to Firestore at `users/{uid}/transcriptions/{docId}`.

## Contributing to Voik

To contribute to Voik, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

Before opening a PR, run `npm run lint` and manually smoke‑test: create/edit tasks, Board drag/drop, Chat (text + voice), calendar sync, and PWA via `npm run preview`.

## Contact

If you want to contact me, you can reach me at `<luukwienk@gmail.com>`.

## MCP Integration

Voik (TaskBuddy) has a **Model Context Protocol (MCP) server** that allows Claude Desktop to access and manage your tasks.

See [MCP_INTEGRATION.md](./MCP_INTEGRATION.md) for:
- TaskBuddy MCP setup and usage
- RAG Knowledge Base MCP integration
- Combined workflows (task management + knowledge search)
- Claude Desktop configuration

**Quick Start:**
- TaskBuddy MCP: `C:\Projects\taskbuddy-mcp\`
- RAG MCP: `C:\Projects\rag-mcp\`

## License

This project uses the following license: [MIT License](<link_to_license>).
