# H.E.A.R.T — Health Evaluation & Astronaut Readiness Tool

> **On Mars, the doctor is up to 20 minutes away. H.E.A.R.T turns every astronaut into their own first responder.**

Entry for the **NASA Space Apps Challenge 2026** — *Create Health Monitoring Software for Astronauts on Space Missions*.

> **Prototype · simulated data · illustrative thresholds · not for clinical use.** The mission crew is portrayed by the four H.E.A.R.T team members. No real astronaut, photo or likeness is used, and every health value shown is simulated.

## What it is

A personal health console that runs entirely on board (offline-first) and helps an astronaut assess their own health, understand why, and decide what to do and when to involve the crew or flight surgeons on Earth.

- **Personal baselines, not population averages.** Every astronaut is compared with their own days 1–14.
- **Combined-pattern alerts.** NASA notes that spaceflight hazards feed each other, so the engine looks at patterns (e.g. lower HRV + shorter sleep + rising temperature → possible early infection, *before* fever), not isolated numbers.
- **Interactive 3D body hologram.** Tap an organ or its "+" pin to see what it does, today vs. baseline, a 30-day trend, what to do now, when to escalate and how to measure it. The five NASA hazards filter which organs light up.
- **Readiness for a critical task** (EVA readiness score: Ready / Review / Not fit).
- **Crew view** for the Crew Medical Officer: an EVA go / no-go poll board for the four crew members, portraits, top alert, contagion alert, and a per-astronaut privacy switch (share with crew / share with Earth).
- **Environments:** ISS (≈0.5 s delay, 0.5 mSv/day) · Mars transit (≤20 min, 1.8 mSv/day) · Mars surface (≤20 min, 0.67 mSv/day, 0.38 g) · Lunar base (≈1.3 s, 0.17 g).
- **Send a medical packet to Earth** with the real delay of the selected environment.
- **Solar particle event** overlay with countdown and shelter checklist (sheltering reduces the event dose from ~42 to ~12 mSv).
- **Cumulative radiation** against the 600 mSv career limit, with a projection.
- **Daily check-in** (mood, sleep, water, symptoms, crew relations, journal) with a streak. Gamification rewards *completing* measurements, never "good" values, so nobody has a reason to hide symptoms.
- **Mission timeline** scrubber (day 1–180) with event markers and play mode; **Earth–Moon–Mars mini-map**.
- **Demo mode**: auto-plays the 2-minute pitch with captions (pause / next / previous).
- English by default, Spanish via the ES/EN toggle. Status is never colour-only (● normal, ▲ review, ◆ alert, always with text). Keyboard accessible; honours `prefers-reduced-motion`.

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the production build (http://localhost:4173)
```

The build is a static site with a relative base, so it works from any path. After the first load it runs offline (a service worker pre-caches every asset). No backend, no accounts, no external requests: fonts are bundled.

## Deploy

**GitHub Pages** — push to `main`; the workflow in `.github/workflows/pages.yml` builds and publishes. In the repository go to *Settings → Pages → Source: GitHub Actions* once.

**Netlify** — import the repository; build command `npm run build`, publish directory `dist`. Or drag the `dist/` folder onto Netlify Drop.

## Demo script (≈2 minutes)

Press **Demo mode** in the top bar. It drives the real app:

1. Crew view, day 130 — four personal baselines, everyone normal.
2. Commander's individual view, day 130 — no alerts.
3. Day 139 — early-infection pattern detected **before** fever.
4. Day 142 — fever, readiness drops to **Not fit**, contagion alert for the crew.
5. Day 151 — solar storm: countdown and shelter checklist for the whole crew.
6. Mars surface — gravity-transition protocol for MS2.
7. Medical packet to Earth showing the up-to-20-minute delay.
8. Close: *"On Mars, the doctor is up to 20 minutes away."*

## Tech

Vite · vanilla ES modules · **Three.js WebGL body** drawn like a technical plate (procedural body with anti-aliased contour lines, faint skeleton, organs as grey volumes that take a status colour only when they need attention, accessible "+" pins, camera fly-to, orbit/zoom) · Canvas 2D point-cloud hologram as the no-WebGL fallback · SVG mini-map · deterministic simulated data (seeded generator, one series per crew member) · hand-written service worker emitted at build time. Fonts bundled via Fontsource (SIL OFL): Space Grotesk and Inter. Visual language: white lab-dossier canvas with black full-bleed chapters for the boot and the solar-storm alert; colour is reserved for medical status.

Code map: see [`CLAUDE.md`](CLAUDE.md). Design tokens: [`docs/design/`](docs/design). Team research notes (Spanish): [`docs/brain/`](docs/brain).

## NASA Data & Resources

What we used and how. Thresholds built on them are **illustrative**.

| Resource | How we used it |
|---|---|
| **NASA HRP — Five Hazards of Human Spaceflight** (radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments) | Backbone of the app: hazard filters on the hologram, and the reason alerts combine indicators (hazards "feed each other"). |
| **NASA HRP — Risks of Human Spaceflight** | Maps organs/indicators to HRP risks (immune, cardiovascular, sensorimotor/vestibular, bone, nutrition, behavioural health, sleep, SANS, radiation…). |
| **ARCHeR** (Artemis Research for Crew Health & Readiness) | Precedent for wrist actigraphy (movement, sleep, light), crew-interaction questions and measuring against a personal baseline. "ARCHeR measures; we close the loop." |
| **Immune Biomarkers** (Artemis II) | Stress → immunity link; skin lesions / localised pain in the symptom checklist; saliva-sample reminder. |
| **Artemis II Standard Measures** | Balance / motion-sickness test, strength measure and the functional "readiness for a critical task" idea. |
| **Curiosity RAD dose rates** | 1.8 mSv/day in transit and 0.67 mSv/day on the Mars surface for the radiation module. |
| **NASA career radiation limit (600 mSv)** and short-term 250 mSv figure | Cumulative-dose gauge, projection and solar-event alert. |
| **Partner agency: CSA — CANS** (Canadian Active Neutron Spectrometer) | Model for the on-board autonomous dosimeter feeding the radiation module. |

Sources are listed in [`docs/brain/Cerebro-SpaceApps-2026/Fuentes.md`](docs/brain/Cerebro-SpaceApps-2026/Fuentes.md). NASA does not endorse this project; no NASA insignia, logotype, seal or mission patch is used.

## Use of AI

The application code was written with AI assistance: **Claude Code** (Anthropic; Claude Fable 5.2, Claude Sonnet 5.5 and Claude Opus 5.5) ported the single-file prototype to modules and implemented the crew model, Crew view, GO / NO-GO poll, contagion and privacy logic, demo mode, mini-map, offline support, the 3D body and the visual design, under the team's direction and review. Research notes and the product concept were prepared by the team with AI assistance and checked against the NASA and CSA pages cited above. **Crew portraits** are the team members' own photos edited with **Higgsfield** (AI image generation) to dress them in a plain white spacesuit; they were cropped so no logo or patch appears, and each one shows a visible "AI-generated" mark in the app. Any other AI-generated logo or banner artwork used in the team page or slides carries a visible "AI-generated" watermark.

## Roadmap

Analog missions (CHAPEA-like) → Artemis lunar missions → lunar base → Mars.

## Credits and licences

Code: MIT-style, for the competition entry. Fonts: SIL Open Font License via Fontsource. Crew portraits are the team members themselves; any AI-generated portrait carries a visible "AI-generated" mark.
