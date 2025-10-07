# Repository Guidelines

## Project Structure & Module Organization
The Vite/React app lives in `src/`. Feature surfaces are composed from `src/components/` with shared state encapsulated in `src/hooks/`. External integrations (Firebase auth, Google Calendar, OpenAI) reside in `src/services/`, while cross-cutting utilities such as logging live in `src/utils/`. Styling is split between `App.css`, global `index.css`, and scoped resources in `src/styles/`. Static assets belong in `src/assets/` and `public/`. Production builds are emitted to `dist/`; never commit the contents. Deployment-specific settings live in `.netlify/`.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Use `npm run dev` for the Vite dev server (default on `http://localhost:5173`). Run `npm run build` to create an optimized bundle in `dist/`, and `npm run preview` to smoke-test that bundle locally. Quality-gate code with `npm run lint`, which applies the root ESLint rules before opening a pull request.

## Coding Style & Naming Conventions
ESLint enforces the React 18 recommendations, so resolve lint warnings rather than disable rules. Stick to 2-space indentation, single quotes, and trailing commas where ESLint expects them. Components and hooks ship as functional components; name component files and exports in `PascalCase`, hooks in `camelCase` prefixed with `use`, and utilities in lower camel case. Keep side effects inside hooks and favor pure render functions for components.

## Testing Guidelines
A formal test harness is not yet wired in. When adding functionality, co-locate future `*.test.jsx` or `*.test.js` files beside the modules they cover and target Vitest or Jest for compatibility with Vite. Until automated coverage exists, verify critical flows manually: create and edit tasks, exercise voice transcription, calendar sync, and PWA install prompts via `npm run preview`. Document any QA steps in the pull request.

## Commit & Pull Request Guidelines
Recent commits (`progress tracker 2.0`, `export tasks`) show concise, lowercase summaries; follow that pattern with present-tense imperatives under 72 characters. Reference issues using `#123` when applicable and group related changes per commit. Pull requests should describe scope, call out environment or migration steps, attach UI screenshots for visual tweaks, and confirm that `npm run lint` and manual smoke tests passed.

## Configuration & Secrets
Copy `.env.example` to `.env` and supply valid Firebase, Google, and OpenAI credentials—Vite exposes keys prefixed with `VITE_`. Never commit populated `.env` files or share secrets in tickets. Review `.netlify/` before deploying to ensure redirects and headers align with new routes.

## Planner Board Guidelines

- Data model & storage
  - Tasks are stored per list in Firestore at `users/{uid}/tasks/{listName}` with `{ items: Task[] }`.
  - Task shape: `{ id, title, text (HTML from TipTap), completed, ... }`. When `title` is missing, derive it from the first line of `text` (implemented in `useTasks`).

- Update contracts (do not break)
  - Bulk update: `updateTaskList(listName, { items })` to replace or reorder a list’s items.
  - Single item update: call `updateTaskList(taskObjectWith.list)` (the hook detects an object and updates that task in place).

- Board behaviour (columns as lists)
  - Columns represent list names; user can select up to 5 columns. Selection and order are persisted in `localStorage` under key `voik_planner_columns`. Default includes `Today` when available.
  - Drag-and-drop uses react-beautiful-dnd with a React 18 StrictMode wrapper. Do not remove the wrapper pattern used in `PlannerBoard`.
  - Droppable ids: `list-{listName}`. Draggable ids for tasks: `{listName}::{task.id}` (avoid collisions across columns).
  - Within-column reorder: compute new array and call `updateTaskList(list, { items })`.
  - Cross-column move: remove from source, insert into destination at `destination.index`, then call `updateTaskList(source, { items })` and `updateTaskList(dest, { items })`.

- Calendar drag vs board drag
  - Board uses react-beautiful-dnd only. Calendar drag remains native HTML5 in `DraggableTaskItem` for the regular TaskList. Do not mix native DnD into the Board subtree.

- Navigation wiring
  - Board has its own tab (id `7`) in `TabsNavigation.jsx` and is handled in `ResponsiveMainContent.jsx`. Keep this id stable unless all usages are updated.

- Styling & theming
  - Board styles live in `src/styles/plannerBoard.css` and use CSS variables for light/dark theming. Prefer CSS classes over inline styles for new board code.
  - Cards are compact; column headers are sticky; on mobile, columns scroll horizontally.

- Safety & performance
  - Do not write to Firestore before tasks have loaded (respect `tasksLoaded` state in hooks).
  - Use immutable updates when reordering/moving items.

- QA checklist (manual)
  - Reorder tasks within a column; move tasks across columns; refresh and verify persistence.
  - Reorder columns; verify selection and order persist via localStorage.
  - Open and save a task via `TaskEditorModal` from the board.
  - Mobile: horizontal scroll of columns; drag within the viewport.

- Commits & PRs
  - Keep commits focused (e.g., board-only changes). Follow the existing style: concise, lowercase, imperative; include `npm run lint` and manual QA notes in PR.

- Line endings / diffs (optional)
  - To avoid Windows line-ending churn, consider a repo-level `.gitattributes` that normalizes LF for `*.js, *.jsx, *.css, *.json, *.md, *.html, *.yml`. Propose this in a separate PR to keep feature diffs clean.

## Background Transcription (Cloud Functions)

- Architecture
  - Audio uploads to Firebase Storage at `transcriptions/{uid}/{docId}.webm`
  - Cloud Function (`onAudioUploaded`) triggers on Storage finalize event
  - Function transcodes audio, splits into chunks, sends to OpenAI Whisper API
  - Results written to Firestore at `users/{uid}/transcriptions/{docId}`

- Setup requirements
  - Firebase Storage bucket must exist (default: `{project-id}.firebasestorage.app`)
  - CORS must be configured on the Storage bucket to allow browser uploads
  - Cloud Function must be deployed with `OPENAI_API_KEY` secret
  - Billing must be enabled on Firebase project (Cloud Functions requirement)

- CORS configuration (required for browser uploads)
  - Create `cors.json` with origins, methods, and headers (see file in repo root)
  - Apply with: `gsutil cors set cors.json gs://{bucket-name}.firebasestorage.app`
  - Verify bucket name matches `VITE_FIREBASE_STORAGE_BUCKET` in `.env`
  - Common issue: old bucket format (`.appspot.com`) vs new format (`.firebasestorage.app`)

- Cloud Function deployment
  - Install Firebase CLI: `npm install -g firebase-tools`
  - Login and set project: `firebase login && firebase use {project-id}`
  - Install function dependencies: `cd functions && npm install`
  - Set OpenAI secret: `firebase functions:secrets:set OPENAI_API_KEY`
  - Deploy: `firebase deploy --only functions`
  - Enable required APIs if prompted (Secret Manager, Cloud Build, etc.)
  - Grant permissions if needed: `gcloud projects add-iam-policy-binding {project-id} --member=serviceAccount:{service-account} --role=roles/storage.admin`

- Environment variables (must match)
  - `.env` locally: `VITE_FIREBASE_STORAGE_BUCKET={bucket-name}.firebasestorage.app`
  - Netlify: Update environment variable with same bucket name
  - Restart dev server after changing `.env`

- Processing flow
  - Status progression: `queued` → `processing` → `completed` (or `error`)
  - App displays "transcriptie wordt verwerkt" during processing
  - No real-time updates; user must refresh to see completion
  - Processing time: ~30-60 seconds for short clips, longer for chunks of 2+ minutes
  - View results: Firestore Console → `users/{uid}/transcriptions/{docId}` → `text` field

- Files involved
  - `src/hooks/useTranscriptionUpload.js` - handles upload to Storage
  - `functions/index.js` - Cloud Function for background processing
  - `functions/package.json` - function dependencies and Node version
  - `cors.json` - CORS configuration for Storage bucket

- Troubleshooting
  - CORS errors: verify bucket name matches `.env`, reapply CORS with `gsutil`
  - Function not triggering: check deployment with `firebase functions:list`
  - Processing stuck: check function logs with `firebase functions:log --only onAudioUploaded`
  - Permission errors: ensure billing enabled, grant service account permissions
  - Secret not found: ensure `OPENAI_API_KEY` secret is set with `firebase functions:secrets:set`
