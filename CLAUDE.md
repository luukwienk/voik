# CLAUDE.md - AI Context for Voik

## Project Overview

**Voik** records conversations and transcribes them, also in Dutch. React + Vite PWA on Firebase (Auth, Firestore, Storage, Cloud Functions v2) with OpenAI Whisper for transcription.

Recording paths:
- In-app recording (browser and mobile PWA): `MiniRecorder` → `useTranscriptionUpload`
- Google Meet: Chrome extension in `meet-transcriber-extension/` (stereo: left = me, right = others), handed to the app via `?import=meet` → `MeetImport`

The earlier full app (planner, tasks, calendar, health, success, realtime chat, MCP) was removed on 2026-10-19 and is preserved at git tag `archive/taskbuddy-full-2026-10`.

## Quick Start

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Project Structure

```
src/
├── App.jsx                     # Header + transcription view, extension bridge
├── SignIn.jsx
├── firebase.js
├── components/
│   ├── TranscriptionTab.jsx    # List + record button
│   ├── TranscriptionList.jsx   # List, detail, retry, downloads
│   ├── TranscriptionAIActions.jsx  # Calls runTranscriptionAIAction
│   ├── MiniRecorder.jsx / QuickRecordButton.jsx
│   └── MeetImport.jsx          # Receives audio from the extension
├── hooks/                      # useAuth, useAudioRecording, useTranscriptions,
│                               # useTranscriptionUpload, useTranscriptionRealtime
└── utils/debug.js              # Use debugLog, not console.log
functions/index.js              # Cloud Functions
firestore.rules, storage.rules  # Deployed with firebase deploy
meet-transcriber-extension/     # Chrome extension
```

## Cloud Functions

Region **europe-west4**, Node 22, all in `functions/index.js`.

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onAudioUploaded` | Storage finalize | Transcribe an uploaded recording |
| `retryTranscription` | Callable | Retry a failed or stuck transcription |
| `runTranscriptionAIAction` | Callable | Summary, action items, email, etc. (`gpt-4.1-mini`) |

Transcription: FFmpeg silence detection → speech chunks → Whisper, 5 in parallel, 90 s timeout with retries; a chunk that keeps failing becomes a `[…]` gap. Exhausted OpenAI credits (`insufficient_quota`) fail the whole run with a clear error instead.

Retrigger a transcription without the UI: rewrite the Storage object onto itself (new generation → finalize event).

## Access and secrets

- Invite-only: Firestore `config/access { emails: [...] }`, lowercase. Read by `firestore.rules` and the functions. Not in this repo (public).
- `OPENAI_API_KEY` is a functions secret. It must never be in a `VITE_` variable. Functions pin the secret version at deploy, so redeploy after rotating it.

| Functions env var | Default | Purpose |
|-------------------|---------|---------|
| `FUNCTION_REGION` | `europe-west4` | Deploy region |
| `PARALLEL_TRANSCRIPTIONS` | `5` | Concurrent Whisper calls |
| `CHUNK_SECONDS` | `120` | Max chunk length |
| `SILENCE_THRESHOLD_DB` | `-35` | VAD threshold |
| `AI_ACTION_MODEL` | `gpt-4.1-mini` | Model for AI actions |

## Deploy

`firebase deploy --only functions,firestore:rules,storage --project voik-c5246`. The frontend deploys on Netlify from `main`.
