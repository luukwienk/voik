# Voik

Record conversations and get a transcript, also in Dutch (Google Meet's built-in transcripts do not support Dutch).

Three ways to record:
- **Browser**: record in the web app.
- **Mobile**: install the web app as a PWA and record on your phone.
- **Google Meet**: the Chrome extension in `meet-transcriber-extension/` records both sides of a call (left channel = you, right channel = the others) and uploads it to Voik.

Recordings upload to Firebase Storage. A Cloud Function cuts them into speech chunks, transcribes them with OpenAI Whisper and writes the text back. In the app you can retry failed transcriptions and run AI actions (summary, action items, follow-up email, key points, translation).

Access is invite-only (see Access below).

The full earlier app (task planner, calendar, health tracking, realtime chat) is preserved at git tag `archive/taskbuddy-full-2026-10`.

## Setup

```bash
npm install
cp .env.example .env   # fill in the VITE_FIREBASE_* values
npm run dev            # http://localhost:5173
npm run build
```

Functions (`functions/`, Node 22):

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions,firestore:rules,storage
```

The OpenAI key lives only in the functions secret. Never put it in a `VITE_` variable: those end up in the public JS bundle.

## Access

Firestore document `config/access` holds `{ emails: ["..."] }` (lowercase). Only verified Google accounts on that list can read or write their transcriptions, retry, or run AI actions. Uploads from other accounts are deleted without transcribing. Add or remove people by editing that document in the Firebase console.

## License

See `LICENSE`.
