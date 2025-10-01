Voik Cloud Functions

Background transcription trigger for long recordings.

Deploy
- Install Firebase CLI and login: `npm i -g firebase-tools && firebase login`
- From repo root: `cd functions && npm install`
- Set secret: `firebase functions:secrets:set OPENAI_API_KEY`
- Deploy: `firebase deploy --only functions`

Config
- Trigger: Storage finalize on `transcriptions/{uid}/{docId}.{ext}`
- Requires Firebase project with Firestore + Storage enabled
- Optional env:
  - `FUNCTION_REGION` (default `us-central1`)
  - `CHUNK_SECONDS` (default `120`)
  - `CHUNK_OVERLAP_SECONDS` (default `2`)
  - `TRANSCRIBE_MODEL` (default `whisper-1`)

Notes
- ffmpeg is bundled with `ffmpeg-static` and used via `fluent-ffmpeg`
- Function writes status and transcript to Firestore at `users/{uid}/transcriptions/{docId}`

