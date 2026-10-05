# RescueMesh

RescueMesh is a frontend foundation for emergency response that keeps coordinating when the network does not. The interface gives each role a focused operational workspace without inventing an AI model, fabricating triage conclusions, or connecting to real patient data.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The managed Preview uses the same port.

For a production check:

```bash
npm ci
npm run build
```

The Next.js configuration uses static export, so `npm run build` writes the publishable site to `out/`. The managed Webdev build contract runs `npm ci && npm run build` and publishes that `out/` directory. There is no application server or database in this frontend-only stage.

## Offline-first architecture

The application is an application-owned PWA. `public/sw.js` caches the application shell and static assets, `public/manifest.webmanifest` provides install metadata, and `components/ServiceWorkerRegistration.tsx` registers the worker in the browser. The app shell can be reopened from the cache when the network is unavailable.

The Citizen SOS flow requests browser geolocation, generates an emergency ID, and transactionally writes the timestamp, coordinates, status, severity, and description to IndexedDB. The same transaction adds an `emergency.created` event to the local sync queue. It can save while the browser is offline.

When connectivity returns, the client requests a browser Background Sync registration when supported. The Service Worker signals that queued work is ready, but no fake network response or server acknowledgment is claimed. A real backend synchronization adapter can consume `getPendingSyncEvents()` later.

The global Online / Offline indicator reflects `navigator.onLine` and browser `online` / `offline` events. It does not make server requests or pretend that a network connection exists.

The EMT triage workspace records observed consciousness, breathing, bleeding, an optional measured heart rate, and free-text observations. Saved notes are stored in the current browser's local storage per patient ID; they are not synced to a server, shared with other devices, or used to assign a triage priority or diagnosis.

Queue status, handoff confirmations, voice-report references, and notifications are shared between role views in the same browser and persisted locally. They are not a replacement for authenticated server-side patient records. The Wireless panel is explicitly a **Local Mesh Simulation**; node connections and test messages do not use real radios or communicate with other devices.

Dashboard cards use a restrained, pointer-edge BorderGlow treatment. It responds near card edges, follows reduced-motion preferences through the site's global motion styles, and does not intercept card clicks.

## Role navigation

The left rail and landing page switch between four client-side workspaces:

- **Citizen / Victim:** browser geolocation, an IndexedDB-backed SOS action, location and network posture, locally saved emergency records, nearby responders, hospitals, emergency points, and local alerts.
- **EMT:** active SOS queue, operational map, patient information, voice-report boundary, and a clinician-entered triage workspace with no automated conclusion.
- **Dispatcher:** queue pressure, map visibility, active patients, EMTs, ambulances, and hospital availability.
- **Hospital:** incoming patients, priority, vitals, ETA, emergency-department load, and available beds.

## Project structure

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | App Router entry point. |
| `app/layout.tsx` | Metadata, PWA manifest link, and Service Worker registration. |
| `app/globals.css` | Tailwind layers, tokens, map surface, and responsive utility styles. |
| `components/RescueMeshApp.tsx` | Role-aware shell, navigation, landing page, and role dashboards. |
| `components/CitizenView.tsx` | Citizen SOS workflow, live browser network state, geolocation permission, and local queue status. |
| `components/MapPanel.tsx` | Interactive OpenStreetMap surface, sample incident markers, and browser location controls. |
| `components/HospitalMap.tsx` | Nearby OpenStreetMap hospital search, map markers, and external directions. |
| `components/ServiceWorkerRegistration.tsx` | Client-side Service Worker registration. |
| `lib/data.ts` | Typed, safe sample operational records used only to demonstrate layout. |
| `lib/emergency-store.ts` | IndexedDB emergency records and the pending `emergency.created` synchronization queue. |
| `public/sw.js` | Application-shell cache, offline navigation fallback, and sync-ready event signaling. |
| `public/manifest.webmanifest` | Application-owned PWA install manifest. |
| `public/offline.html` | Cached fallback document for a navigation that cannot be served from the app shell. |
| `public/manus-routes.json` | Webdev route manifest for the current page set. |
| `plan.md` | Approved design and implementation decisions. |
| `TODO.md` | Initial frontend outcome clauses. |

## Future integration boundaries

The current UI keeps sample operational records behind `lib/data.ts` and local SOS records behind `lib/emergency-store.ts`. Future adapters can be introduced under `lib/adapters/` without changing the page shell:

- A real backend synchronization adapter can consume the pending IndexedDB queue.
- Peer-to-peer transport can replace the local mesh status placeholder.
- Backend APIs can provide authenticated operational data and durable records.
- A real voice capture / transcription service can replace the voice-report boundary.
- A separately selected open-weight triage service can consume clinician-entered observations; the current interface does not call, simulate, or claim to be an AI model.

No API keys or secrets are required by this frontend.

## FastAPI backend

The modular backend lives in `backend/` and uses Python, FastAPI, SQLAlchemy, and PostgreSQL. A Supabase project is supported through its PostgreSQL connection string in `DATABASE_URL`. No credentials are committed.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL in backend/.env to your own PostgreSQL/Supabase connection string.
uvicorn app.main:app --reload --app-dir . --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`, with interactive docs at `/docs`. The backend exposes emergency CRUD routes plus patients, responders, hospitals, and ambulances. Missing database configuration returns a clear `503` for database-backed endpoints; `/health` remains available for diagnostics. The optional local voice pipeline uses faster-whisper and Ollama `qwen3:4b`; it returns explicit `503` errors until those local runtimes are installed and running.

## Local EMT voice-to-triage pipeline

Install the optional local voice dependencies from `backend/`:

```bash
pip install -r requirements-voice.txt
```

Install Ollama separately, start it, and pull the required local model:

```bash
ollama serve
ollama pull qwen3:4b
```

Configure the frontend with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` for local development. In a deployed frontend, set this variable to the externally hosted FastAPI origin at build time; it is not defaulted to localhost. Add both local and deployed frontend origins to backend `CORS_ORIGINS`.

When an EMT stops a recording, the browser immediately keeps the audio in IndexedDB and attempts `POST /api/voice/upload` before requesting transcription. Uploaded recordings are playable in the Voice Report panel, and the API serves them from `GET /media/voice/{file_id}`. The API validates the MIME type, checks the audio signature, caps uploads at 25 MB, and writes a UUID-named file beneath `VOICE_MEDIA_DIR` (default `backend/data/voice`) without using the supplied filename as a filesystem path. Duration is reported as unavailable because upload does not require a media-probing binary. A deployed backend must provide durable writable media storage; ephemeral function filesystems do not guarantee retention.

If the browser is offline, the recording stays in IndexedDB and is retried when connectivity returns. A failed upload offers retry and remove actions. Whisper runs only after upload succeeds, and triage runs only after transcription; either optional stage can fail without hiding or discarding the uploaded recording. `POST /api/voice/confirm` still requires a configured database to persist human confirmation.

Queue statuses, handoff confirmations, field notes, notification read state, and uploaded voice-report references are shared among the role workspaces in the current browser and stored in local storage. Background Sync can be requested for the existing SOS queue, but the project does not yet have a backend queue-consumer adapter, so the UI does not claim delivery or synchronization.

If the API, Whisper, or Ollama is unavailable, the UI shows an explicit error and a retry action where appropriate. It never fabricates a transcript or triage result. AI output is labelled for human verification and is not a diagnosis. The first Whisper model load may download the configured model; inference is local after the model is available.


## Interactive maps and nearby hospitals

All role maps use Leaflet with OpenStreetMap tiles and require no API key or paid map account. Maps support pan/zoom, show OpenStreetMap attribution, and offer browser geolocation where appropriate. Operational incident markers are illustrative sample data, not live dispatch coordinates.

The Citizen and EMT hospital map requests browser location when opened, then searches OpenStreetMap's Nominatim service for mapped hospitals within 10 km. Results are shown as clickable map markers and a nearby-hospital list sorted by straight-line distance. Selecting a hospital lets the user request a road route, see driving directions and an estimated distance/time on the map, start live browser-GPS tracking, or open turn-by-turn Google Maps navigation. Hospital search and routing need an internet connection and location permission; the underlying map tiles also need internet access. If the browser denies location permission, use the location button in the map.

Hospital data is community-mapped and may be incomplete. “Closest” ranks only mapped facilities by straight-line distance; it is not a clinical recommendation and does not confirm admission, beds, opening status, or capacity. Road routes and times are estimates from a public routing service and do not account for live traffic. If injured or in immediate danger, contact local emergency services instead of traveling without assistance.
