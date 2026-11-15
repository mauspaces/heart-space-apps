# Space Apps 2026 — team page text (Project tab). Copy each block into its field. English only.

## 1. Project Summary
H.E.A.R.T (Health Evaluation & Astronaut Readiness Tool) answers the challenge "Create Health Monitoring Software for Astronauts on Space Missions". On a Mars mission the doctor is not far in distance but in time: a radio message between Mars and Earth takes up to about 20 minutes one way (the speed-of-light delay), so a question and its answer can take well over 20 minutes and crews must understand their own health on board. H.E.A.R.T is an offline-first personal health console for astronauts and the Crew Medical Officer. It compares each astronaut with their own baseline (days 1–14) instead of population averages, and combines indicators (HRV, sleep, temperature, mood, hydration, exercise, radiation dose, balance) into patterns, so it can flag a possible early infection before fever appears. It shows an interactive 3D body hologram whose organs light up by status, a readiness score for critical tasks such as an EVA (Ready / Review / Not fit), a crew view with contagion alerts and per-astronaut privacy switches, a solar-storm shelter checklist, cumulative radiation against the 600 mSv career limit, and a medical packet to Earth that shows the real communication delay. It matters because it turns every astronaut into their own first responder when Earth cannot answer in time. It is a static web app built with Vite, vanilla JavaScript and Three.js. All health data is simulated and all thresholds are illustrative; it is not for clinical use.

## 2. Project Demonstration
<LINK to slides (max 7) or video (max 30 s) — TO FILL IN>

## 3. Project
https://github.com/mauspaces/heart-space-apps
Published app: https://mauspaces.github.io/heart-space-apps/

## 4. Project Details
**Data and variables.** A seeded generator creates 180 days of simulated data for four fictional crew roles (Commander, Pilot, Crew Medical Officer, Mission Specialist from a partner agency), played by the team members. Variables: heart rate, HRV, blood pressure, SpO2, temperature, sleep, glucose, mood, hydration, exercise, symptoms and daily radiation dose. Each member has their own storyline: early infection then fever (days 139–146), a sleep-loss and low-mood dip (days 95–120), low hydration with kidney-stone risk (days 126–131), and vestibular/orthostatic issues on arrival at Mars. All share a solar storm on day 151.

**How the parts connect.** Simulation feeds an alert engine. The engine compares every metric with the member's personal baseline, detects combined patterns, derives a status per organ and computes the readiness score. The UI (vitals, organ detail, timeline, crew view, mini-map) renders that result, and the 3D hologram colours organs by status.

**Step by step.** (1) Open the Crew view and see all four members. (2) Open one member and scrub the mission timeline. (3) At day 139 the early-infection pattern appears before fever. (4) At day 142 fever, readiness drops to "Not fit" and the crew gets a contagion alert. (5) At day 151 the solar-storm overlay shows a countdown and a 4-step shelter checklist; sheltering reduces the event dose from about 42 to 12 mSv. (6) On the Mars surface a gravity-transition protocol appears. (7) Send a medical packet to Earth and see the delay (up to 20 min). Tap any organ for what it does, today vs. baseline, a 30-day trend, what to do now and when to escalate.

**Outputs.** Status for each system (circle = normal, triangle = review, diamond = alert, always with text), alerts with recommended actions, trend charts against the baseline band, readiness score, cumulative radiation with projection, crew go/no-go board, and a demo mode that plays the 2-minute story. Works offline after first load; English with Spanish toggle.

## 5. Use of Artificial Intelligence (AI)
No generative AI makes medical decisions: the alert engine is deterministic, rule-based and auditable. AI was used as a development and creative tool: Claude Code (Anthropic) helped write the application code (crew model, crew view, contagion and privacy logic, demo mode, mini-map, offline support, 3D body, visual design) under the team's direction and review; AI assisted research notes and the concept, checked against the NASA and CSA sources. Crew portraits are the team members' own photos edited with Higgsfield (AI image generation) into spacesuit portraits, each marked "AI-generated" in the app.

## 6. NASA Data
- NASA Human Research Program (HRP): Five Hazards of Human Spaceflight
- NASA HRP: Risks of Human Spaceflight
- ARCHeR (Artemis Research for Crew Health & Readiness)
- Immune Biomarkers (Artemis II)
- Artemis II Standard Measures
- Curiosity RAD radiation dose rates (1.8 mSv/day in transit, 0.67 mSv/day on Mars surface)
- NASA career radiation limit (600 mSv) and the 250 mSv short-term figure

## 7. Space Agency Partner & Other Data
- Canadian Space Agency (CSA): CANS (Canadian Active Neutron Spectrometer), model for the on-board dosimeter
- BodyParts3D, © DBCLS, CC BY-SA 2.1 Japan (3D anatomy meshes, merged and compressed by us)
- Three.js, Vite (open-source libraries)
- Fonts via Fontsource (SIL OFL): Barlow Condensed, JetBrains Mono, Inter
- Full source list: docs/brain/Cerebro-SpaceApps-2026/Fuentes.md
