# RescueMesh initial frontend outcomes

- Create a clean, professional emergency-response interface using Next.js, TypeScript, and Tailwind CSS.
- Create a RescueMesh landing page with branding, a short explanation, and navigation actions for “I Need Help”, “I'm an EMT”, “Dispatcher”, and “Hospital”.
- Create a Citizen/Victim screen with a large SOS button, current location, online/offline indicator, nearby responders, nearby hospitals, nearby emergency points, and local alerts.
- Create an EMT screen with active SOS requests, a map, patient information, a voice report section, and a triage section.
- Create a Dispatcher screen with an emergency queue, a map, active patients, active EMTs, ambulances, and hospital availability.
- Create a Hospital screen with incoming patients, priority, vitals, ETA, emergency department status, and available beds.
- Make the interface functional enough to navigate between the landing page and all four role-specific screens, with clear role context and reusable navigation patterns.
- Keep the architecture modular so future offline-first communication, peer-to-peer sharing, backend APIs, voice transcription, and open-weight AI integrations remain replaceable and separate from presentation code.
- Do not implement an AI model, use the OpenAI API as core AI, fake AI functionality with hardcoded responses, add API keys, or add secrets in source code.
- Document the created file structure, architectural extension points, and commands required to install dependencies and run the frontend locally.
