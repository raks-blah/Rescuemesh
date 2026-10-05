# RescueMesh implementation plan

## Scope

Build the initial frontend for RescueMesh as a frontend-only Next.js application using TypeScript and Tailwind CSS. The first release provides a navigable landing page and role-based operational views for Citizen/Victim, EMT, Dispatcher, and Hospital. It uses safe sample operational data for layout demonstration only. Offline transport, peer-to-peer messaging, backend persistence, voice transcription, and open-weight AI triage are intentionally represented as extension boundaries, not implemented features.

## Design direction

- **Design movement:** Field operations console meets calm civic technology. The interface should feel like an instrument panel for high-pressure work, not a marketing dashboard.
- **Core principles:** (1) orient users in one glance, (2) reserve high-salience color for urgent actions, (3) show system state plainly, and (4) make every role feel like part of one coordinated mesh.
- **Color philosophy:** Near-black navy and slate create visual stability in emergency conditions. Signal orange is the ownable brand accent for action and movement; mint/teal indicates network health and successful coordination; red is reserved for true urgency.
- **Layout paradigm:** A persistent command rail anchors the experience while the workspace changes by role. Content is organized as an operational canvas with a single priority zone, not as a generic centered marketing grid.
- **Signature elements:** A segmented “mesh” mark made of connected nodes; compact uppercase eyebrow labels; signal bars and route-like dotted map lines used as status motifs.
- **Interaction philosophy:** Role switches are explicit and reversible. Buttons state their intent. Static demo data is clearly treated as sample operational data, and future integrations are called out without pretending to work.
- **Animation:** Use restrained 150–220ms transitions for focus, hover, and panel entry. Avoid looping motion except for the subtle live status pulse and SOS confirmation state.
- **Typography system:** Use a system sans stack with strong numeric readability. Uppercase tracking is reserved for labels; headings use tight, bold display sizing; body copy stays compact and high contrast.
- **Brand essence:** Emergency response that keeps coordinating when the network doesn't. Personality: steady, prepared, human.
- **Brand voice:** Direct, reassuring, operational. Example lines: “Stay visible. Stay connected.” and “This workspace is ready for local-first integrations.”
- **Wordmark & logo:** A three-node connected mark paired with the RescueMesh wordmark; the mark doubles as a compact signal indicator in the rail.
- **Signature brand color:** Signal orange `#ff6b4a`, used as a recognizable action cue rather than a decorative gradient.

## Project structure

- `app/` — Next.js App Router entry, global styling, metadata, and route manifest support.
- `components/` — Reusable shell, navigation, cards, status chips, map mock, and role views.
- `lib/` — Types and sample operational data boundaries. Future API/offline/P2P adapters can replace these modules without changing the views.
- `public/` — Static route manifest and local brand assets.
- `plan.md` / `TODO.md` — Product decisions and acceptance clauses for the initial frontend.

## Extension boundaries

- `lib/data.ts` is intentionally the only source of demo operational records.
- Future `lib/adapters/` modules can provide local storage, sync, P2P transport, backend APIs, and open-weight AI triage without changing presentational components.
- Triage and voice-report panels are UI shells only; they do not infer, transcribe, or fabricate results.
