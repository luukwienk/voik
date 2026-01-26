Voik Cloud Functions

Background transcription trigger for long recordings with VAD (Voice Activity Detection) to reduce Whisper hallucinations.

## Deploy
- Install Firebase CLI and login: `npm i -g firebase-tools && firebase login`
- From repo root: `cd functions && npm install`
- Set secret: `firebase functions:secrets:set OPENAI_API_KEY`
- Deploy: `firebase deploy --only functions`

## Config
- Trigger: Storage finalize on `transcriptions/{uid}/{docId}.{ext}`
- Requires Firebase project with Firestore + Storage enabled

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `FUNCTION_REGION` | `us-central1` | Cloud Functions region |
| `TRANSCRIBE_MODEL` | `whisper-1` | OpenAI transcription model |
| `CHUNK_SECONDS` | `120` | Max chunk duration for transcription |
| `CHUNK_OVERLAP_SECONDS` | `2` | Overlap between chunks |
| `SILENCE_THRESHOLD_DB` | `-35` | dB threshold for silence detection |
| `SILENCE_MIN_DURATION` | `1.0` | Min silence duration (seconds) to detect |
| `SPEECH_GAP_MERGE` | `3.0` | Merge speech segments closer than this (seconds) |

## Features

### VAD Preprocessing
Uses ffmpeg's `silencedetect` filter to identify speech segments and only transcribe those, avoiding Whisper hallucinations during silence.

### Hallucination Post-Filter
Removes common Whisper artifacts:
- Random URLs/domains
- Repeated phrases (3+ consecutive)
- Foreign script hallucinations (Sinhalese, etc.)
- Stock phrases ("thank you for watching", etc.)

### Stereo Meet Recordings
Chrome extension recordings are stereo (left=mic, right=tab audio). The function:
1. Separates channels
2. Transcribes each with VAD
3. Merges with speaker labels (`[Me]`, `[Others]`)

## Notes
- ffmpeg bundled via `ffmpeg-static` + `ffprobe-static`
- Function writes status and transcript to Firestore at `users/{uid}/transcriptions/{docId}`

