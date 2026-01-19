# CLAUDE.md - AI Context for Voik

This file provides context for AI assistants working on the Voik codebase.

## Project Overview

**Voik** is a voice-activated task management PWA built with React + Vite. It integrates with Firebase (auth, Firestore, Storage), Google Calendar, and OpenAI Realtime API for voice interactions.

### Core Features
- **Planner Board**: Kanban-style columns with drag-and-drop (react-beautiful-dnd)
- **Task Lists**: Rich text editor (TipTap), search/filter, bulk actions
- **Realtime Chat**: Text and voice modes via OpenAI Realtime API
- **Google Calendar**: Two-way sync, drag tasks to schedule events
- **Transcriptions**: Record audio, upload to Firebase, transcribe via Cloud Functions
- **Health Tracking**: Personal health entries and statistics

## Quick Start

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build
npm run lint       # Run ESLint
npm run format     # Format with Prettier
npm run format:check  # Check formatting
```

## Project Structure

```
src/
├── components/          # React components
│   ├── health/          # Health tracking feature
│   ├── settings/        # Settings pages
│   └── success/         # Success tracking
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Firebase authentication
│   ├── useTasks.js      # Task CRUD operations
│   ├── useGoogleCalendar.js  # Calendar integration
│   ├── useRealtimeChat.js    # OpenAI Realtime chat
│   └── useTranscriptions.js  # Audio transcription
├── services/
│   ├── googleCalendar.js     # Google Calendar API
│   └── realtime/             # OpenAI Realtime client
│       ├── client.js         # WebSocket connection
│       ├── audio.js          # Audio processing
│       └── functions.js      # Tool definitions
├── utils/
│   ├── debug.js              # Debug logging (use debugLog, not console.log)
│   ├── bigCalendarUtils.js   # Calendar helpers
│   └── taskEventUtils.js     # Task-event utilities
├── styles/              # CSS files
├── firebase.js          # Firebase initialization
└── App.jsx              # Main app component

functions/               # Firebase Cloud Functions (transcription)
meet-transcriber-extension/  # Chrome extension for Google Meet
```

## Key Patterns

### State Management
- **Firebase Firestore** for persistent data (tasks, lists, transcriptions)
- **React hooks** for local state and Firebase subscriptions
- **localStorage** for user preferences (planner columns, calendar settings)

### Drag-and-Drop
Uses `react-beautiful-dnd` in two contexts:
1. **PlannerBoard.jsx**: Reorder columns and tasks across lists
2. **BigCalendarView.jsx**: Drag tasks onto calendar to create events

### Debug Logging
Use the debug utilities instead of `console.log`:
```javascript
import { debugLog, debugError, debugWarn } from '../utils/debug';

debugLog('Development-only log');  // Only logs in DEV mode
debugError('Always logged');       // Errors always show
```

### Google Calendar Integration
- OAuth handled in `useGoogleCalendar.js`
- Event CRUD in `services/googleCalendar.js`
- Smart deduplication by iCalUID for shared calendars

## Environment Variables

All variables prefixed with `VITE_` are exposed to the client.

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase project configuration |
| `VITE_OPENAI_API_KEY` | OpenAI Realtime API (voice chat) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_GOOGLE_API_KEY` | Google Calendar API key |
| `VITE_GOOGLE_CLIENT_SECRET` | Google OAuth secret |

See `.env.example` for the full list.

## Pre-PR Checklist

1. Run `npm run lint` - fix any errors
2. Run `npm run format:check` - ensure formatting is correct
3. Test manually:
   - Create/edit/delete tasks
   - Drag tasks in Planner Board
   - Chat assistant (text + voice if possible)
   - Calendar sync and event creation
4. Check mobile responsiveness (iPad behaves as mobile)
5. No `console.log` statements (use `debugLog` from `utils/debug.js`)

## Related Repositories

- **TaskBuddy MCP**: `C:\Projects\taskbuddy-mcp\` - MCP server for Claude Desktop
- **RAG MCP**: `C:\Projects\rag-mcp\` - Knowledge base semantic search

## Common Tasks

### Adding a new task field
1. Update Firestore schema in `useTasks.js`
2. Add UI in `TaskEditorModal.jsx`
3. Update `TaskItem.jsx` for display

### Adding a new settings option
1. Add to `components/settings/Settings.jsx`
2. Store in localStorage or Firestore user preferences

### Modifying calendar behavior
1. Calendar rendering: `BigCalendarView.jsx`
2. Google API calls: `services/googleCalendar.js`
3. State management: `hooks/useGoogleCalendar.js`
