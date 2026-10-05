# RescueMesh implementation audit

**Audit basis:** direct inspection of the current source tree, not the visual presence of UI cards or buttons. The report distinguishes code that executes and persists data from UI that only displays sample values.

## Executive summary

| Area | Current status | Bottom line |
| --- | --- | --- |
| Citizen SOS | **Real and working locally** | Creates a record, requests browser geolocation, persists to IndexedDB, and adds a local sync-queue event. |
| PWA shell | **Real and working with limits** | A real Service Worker caches the shell and assets. Offline reload works after the app has been opened/cached once. |
| Offline synchronization | **Partially implemented** | The queue is real, but no adapter sends queued events to the FastAPI backend or marks them synced. |
| FastAPI backend | **Real code, not fully operational in this environment** | Routes, schemas, SQLAlchemy models, and PostgreSQL connection handling exist. No database URL is configured, and the frontend does not call these APIs. |
| Role dashboards | **Placeholder/static** | EMT, dispatcher, and hospital screens render arrays from `lib/data.ts`; they do not query the backend or share records. |
| AI/Qwen/Ollama | **Not implemented** | No Qwen3-4B, Ollama, inference call, structured output, or human-confirmation flow exists. |
| Voice/Whisper | **Not implemented** | The EMT panel explicitly says recording integration is not connected. |
| Map/routing/P2P | **Not implemented** | The map is CSS/SVG-like layout, routing is not algorithmic, and WebRTC is absent. |

## 1. Citizen SOS

### REAL AND WORKING

- **The SOS button creates an emergency record locally.**
  - `components/CitizenView.tsx` calls `createEmergencyId()`, creates an `EmergencyRecord`, and calls `saveEmergency(record)`.
  - The record contains ID, ISO timestamp, coordinates or null, `queued` status, severity, description, and `syncState: "pending"`.
- **Browser location permission is requested.**
  - `requestBrowserLocation()` calls `navigator.geolocation.getCurrentPosition()` with high accuracy, timeout, and cache settings.
  - If permission is denied or unavailable, the record is still saved with `latitude: null` and `longitude: null`; the UI reports that state instead of inventing coordinates.
- **IndexedDB persistence is real.**
  - `lib/emergency-store.ts` opens the `rescuemesh-local` database.
  - The `emergencies` object store persists records with a timestamp index.
- **Offline local saving is real.**
  - `saveEmergency()` does not call the network. It writes directly to IndexedDB, so the SOS can be created when the browser is offline.
- **The local event queue is real.**
  - The same IndexedDB transaction writes an `emergency.created` event to the `syncQueue` object store.
  - `getPendingSyncEvents()` reads pending queue events and the Citizen UI displays their count.

### PARTIALLY IMPLEMENTED

- **Later synchronization is only prepared, not performed.**
  - `requestEmergencySync()` requests the browser Background Sync tag `rescuemesh-emergency-sync` when supported.
  - The Service Worker sends `RESCUEMESH_SYNC_READY` to clients.
  - There is no code that reads a queue event and POSTs it to `/api/emergencies`, no retry/backoff implementation, no conflict handling, and no code that marks an event `synced`.
- The queue is therefore a **real durable outbox**, but not yet a functioning offline-to-backend sync pipeline.

## 2. PWA and offline behavior

### REAL AND WORKING

- **A real Service Worker exists:** `public/sw.js`.
- **Registration is real:** `components/ServiceWorkerRegistration.tsx` calls `navigator.serviceWorker.register("/sw.js", { scope: "/" })`.
- **The app shell is cached:** the install handler caches `/`, `/manifest.webmanifest`, `/favicon.svg`, and `/offline.html` under `rescuemesh-shell-v1`.
- **Navigation fallback is implemented:** navigation requests use the network first and fall back to the cached shell or offline page.
- **Runtime Next.js assets are cached:** successful `/_next/`, `.css`, and `.js` responses are added to the cache.
- **PWA metadata is real:** `public/manifest.webmanifest` is linked via `app/layout.tsx`, and the managed project is configured as `application_owned` PWA mode.
- **Local data persists independently of the Service Worker:** IndexedDB stores emergency records and the queue.

### PARTIALLY IMPLEMENTED

- Offline app loading works **after an online visit has installed/activated the Service Worker and cached the required assets**. It is not a first-visit offline bootstrap.
- The Service Worker does not synchronize data itself. Its sync event only notifies the page that work is ready.
- No cache invalidation/update UX, explicit offline integration test, or backend sync adapter exists.

## 3. Backend

### REAL AND WORKING AS CODE

- **A real FastAPI app exists:** `backend/app/main.py`.
- **Emergency routes exist:** `backend/app/api/routes/emergencies.py` implements POST, list, get-by-ID, and PATCH.
- **Resource routes exist:** `backend/app/api/routes/resources.py` implements CRUD-style endpoints for patients, responders, hospitals, and ambulances.
- **Incoming data is validated:** `backend/app/api/schemas.py` uses strict Pydantic models, enums, text limits, coordinate bounds, nonnegative bed counts, and UUID types.
- **PostgreSQL support is real:** `backend/app/db/models.py` defines SQLAlchemy PostgreSQL UUID, JSON, timestamp, and relational columns. `backend/app/db/session.py` creates a psycopg-backed engine from `DATABASE_URL` and normalizes standard PostgreSQL URL schemes.
- **Error handling exists:** missing configuration returns structured `503 database_not_configured`; missing resources return structured 404s; database conflicts and failures have handlers.
- **Secrets are not hardcoded:** `backend/.env.example` contains variable names only.

### PARTIALLY IMPLEMENTED

- **The backend is not connected to the frontend.** There are no browser `fetch()` or API-client calls from the role views to the FastAPI routes. The Citizen SOS currently stops at IndexedDB.
- **Real database persistence is conditional.** The current environment has no configured `DATABASE_URL`; `/health` reports `database_configured: false`, and database-backed routes return 503 until a PostgreSQL/Supabase URL is supplied.
- `initialize_database()` uses `Base.metadata.create_all()` for the initial stage; production-grade migrations, indexes beyond the basic model indexes, authentication, authorization, audit logs, and lifecycle management are not implemented.
- **Mock/static data is used extensively in the frontend.** `lib/data.ts` is explicitly the source of SOS requests, responders, hospitals, dispatcher counts, incoming patients, and emergency points for the non-Citizen views.

## 4. AI / Qwen3-4B / Ollama

### PLACEHOLDER / NOT IMPLEMENTED

All requested AI capabilities are absent from the source:

- No Qwen3-4B model reference or model configuration exists.
- No Ollama URL, client, model pull, or Ollama HTTP call exists.
- No EMT report is sent to an inference service.
- No structured triage JSON schema or parser exists.
- No AI result is displayed in EMT or dispatcher workflows.
- No human confirmation or approval state exists.
- No fake hard-coded AI response exists either; the current code intentionally avoids pretending that AI is connected.

Evidence: the EMT view in `components/RescueMeshApp.tsx` explicitly renders **“No AI model is connected in this frontend”** and **“Recording integration not connected.”**

## 5. Voice / Whisper

### PLACEHOLDER / NOT IMPLEMENTED

- The EMT voice panel contains a microphone icon and a button, but there is no `MediaRecorder`, audio stream, file upload, audio persistence, or recording state.
- No Whisper package, endpoint, transcription request, or transcript storage exists.
- No transcript is sent to Qwen3-4B because neither Whisper nor Qwen3-4B is connected.
- The UI explicitly labels this as **“Recording integration not connected”** and **“No transcript generated.”**

## 6. Dispatcher

### PLACEHOLDER / NOT IMPLEMENTED

- Dispatcher data is rendered from `sosRequests`, `dispatcherStats`, and related arrays in `lib/data.ts`.
- The dispatcher does not read the Citizen IndexedDB database, call the backend, subscribe to events, or receive an emergency created by another browser.
- The “Last sync 09:42” label is static display data, not a synchronization timestamp.
- AI-generated information is not present, so there is no separation between AI-generated and human-confirmed data yet. The workflow needs explicit provenance fields before AI is added.

## 7. Hospital

### REAL AS CODE / PLACEHOLDER IN UI

- Backend hospital models and CRUD routes exist in `backend/app/db/models.py`, `backend/app/api/schemas.py`, and `backend/app/api/routes/resources.py`.
- The Hospital UI is not connected to those routes. Incoming patients, vitals, ETAs, departments, bed counts, ED load, and capacity cards are hard-coded in `lib/data.ts` and JSX.
- The hospital does not receive Citizen/EMT emergency information in the current frontend.

## 8. Routing

### PLACEHOLDER / NOT IMPLEMENTED

- No Dijkstra implementation exists.
- No A* implementation exists.
- No graph, edge weights, road network, geocoding, travel-time service, or route calculation exists.
- Hospital availability and distance are displayed as static fields but are not inputs to any routing function.
- The `Route` icon and “Mesh route active” label in `components/MapPanel.tsx` are visual elements only.

## 9. Map

### IMPLEMENTED — OpenStreetMap maps

- `components/MapPanel.tsx` and `components/HospitalMap.tsx` render interactive Leaflet maps using attributed OpenStreetMap tiles; no API key is required.
- The operational map supports panning, zooming, browser geolocation, and illustrative sample markers.
- The citizen and EMT hospital map queries Nominatim for mapped hospitals near the user's actual browser coordinates, shows straight-line distances, and links to OpenStreetMap directions.
- Map tiles and nearby search require internet access. Hospital results depend on community-mapped data; the maps do not represent verified live dispatch positions, road travel times, or hospital capacity.

## 10. P2P / WebRTC

### PLACEHOLDER / NOT IMPLEMENTED

- No WebRTC APIs exist: no `RTCPeerConnection`, data channel, signaling, ICE handling, or peer identity.
- “Mesh status,” “Local-first transport,” and “Mesh route active” are labels and visual states only.
- There is no local peer-to-peer sharing of emergency records, responder status, or alerts.

## Category summary

### REAL AND WORKING

- Citizen SOS record creation in the browser.
- Browser geolocation permission request and honest unavailable-location handling.
- IndexedDB emergency persistence.
- Durable IndexedDB pending sync queue.
- Service Worker registration and app-shell caching.
- PWA manifest and offline navigation fallback.
- FastAPI route definitions, Pydantic validation, SQLAlchemy PostgreSQL models, environment-based database configuration, and structured API errors.

### PARTIALLY IMPLEMENTED

- Offline-to-online synchronization: queue and Background Sync signaling exist, but no backend transport, retry, acknowledgment, or state transition exists.
- PostgreSQL/Supabase persistence: backend code supports it, but no database is configured in the current environment and the frontend is not connected.
- Hospital, dispatcher, EMT, and responder data models/API routes: the server side exists, but the role dashboards do not consume it.
- Offline app loading: real after Service Worker installation and cache population, not a first-visit offline bootstrap.

### PLACEHOLDER / NOT IMPLEMENTED

- Qwen3-4B and Ollama.
- Structured AI triage JSON.
- Human confirmation of AI recommendations.
- Whisper, audio capture, and transcript flow.
- Dispatcher sharing of real emergency records.
- Real hospital receiving workflow.
- Real map integration.
- Dijkstra/A* routing.
- WebRTC/P2P transport.
- Authentication, role authorization, audit trail, and production migrations.

## Exact next steps for a working hackathon demo

### Phase 1 — Connect one real end-to-end emergency path

1. Start PostgreSQL locally or create a Supabase project; set `DATABASE_URL` in `backend/.env`.
2. Add a frontend API client using `NEXT_PUBLIC_API_BASE_URL` for the FastAPI server.
3. Add a sync adapter that drains `syncQueue` when online:
   - POST each `emergency.created` payload to `/api/emergencies`.
   - Store the returned server ID and server status locally.
   - Mark the queue event synced only after a real 2xx response.
   - Retry with bounded exponential backoff; preserve the event on failure.
4. Add a dispatcher polling or Server-Sent Events endpoint that lists real emergencies and refreshes the dispatcher queue.
5. Replace only the dispatcher emergency queue first; leave decorative cards clearly labeled as unavailable until their data source is wired.

### Phase 2 — Make EMT and hospital workflows real

1. Add authenticated role identity and authorization boundaries.
2. Load responders, ambulances, hospitals, beds, and patients from the backend.
3. Add assignment endpoints for dispatcher-to-EMT and ambulance-to-emergency transitions.
4. Add hospital handoff records with patient, vitals, ETA, destination, and confirmation timestamps.
5. Render provenance on every triage field: `human_entered`, `ai_suggested`, `human_confirmed`, or `unavailable`.

### Phase 3 — Add the real voice and AI chain

1. Implement EMT recording with browser `MediaRecorder`; persist an uploadable audio blob locally when offline.
2. Add a backend transcription adapter for Whisper (local Whisper service or a separately deployed open-weight service); persist transcript status and errors.
3. Run Ollama with the selected Qwen3-4B model outside the browser; never expose Ollama directly to the public client.
4. Add a backend triage endpoint that accepts transcript/observations and returns schema-validated JSON containing recommendation, confidence, rationale, warnings, and model metadata.
5. Require an EMT/human confirmation action before a triage result changes priority, dispatch, or hospital handoff state.
6. Store the original human observations, raw transcript, AI output, and confirmation event separately for auditability.

### Phase 4 — Add real map, routing, and P2P

1. Select a map provider and add a browser-safe public configuration value; render real coordinates and live markers.
2. Use a routing provider or a local graph implementation for Dijkstra/A*; weight routes by travel time, road availability, hazard closures, and hospital capacity.
3. Add a route service that returns route geometry, distance, ETA, selected hospital, and the capacity snapshot used.
4. Add WebRTC data channels with a signaling/relay service, peer discovery, message IDs, TTLs, signatures, deduplication, and eventual reconciliation with the backend.
5. Treat P2P records as untrusted until validated and reconciled; retain the offline outbox as the durable local source.

### Hackathon demo slice recommended

For a credible demo, implement this narrow chain before attempting every feature:

**Citizen presses SOS offline → IndexedDB record + queue → connectivity returns → real FastAPI POST → dispatcher sees the record → dispatcher assigns an EMT → EMT records observations → human enters/approves triage → hospital receives a real handoff with ETA and bed availability.**

Keep the current visual shell, but replace each static panel only when its underlying API/data path is real.
