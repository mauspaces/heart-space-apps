# H.E.A.R.T — guide for Claude sessions

Health Evaluation & Astronaut Readiness Tool. NASA Space Apps Challenge 2026, challenge "Create Health Monitoring Software for Astronauts on Space Missions". Deadline: Sunday 15 Nov 2026, then a live local pitch.

**Talk to the team in Spanish. Build the product in English (Spanish via the ES/EN toggle).**

One line: "On Mars, the doctor is up to 20 minutes away. H.E.A.R.T turns every astronaut into their own first responder."

## Working rules (token budget is tight)

- Do **one task** from the list below per session, only in the files your lane owns. Do not refactor outside them.
- Read only what the task needs. Do **not** read `docs/prototype/index.html` or all of `docs/brain/` — this file summarises them. Open a single brain note only when you need a specific fact.
- Do not take screenshots unless asked. Verify with `npm run build` and text checks; the team tests in their own browser.
- `git pull` before starting, commit + `git push` when the task works. Small commits.
- Ask before anything hard to undo, any download, or anything that adds a backend.

## Hard rules

- No NASA insignia, worm logo, seal or mission patches. Citing NASA programs and sources as facts is fine.
- The crew is portrayed by the team members (Mauro, Alan, Jorge, David) in scenario roles; bios describe the role only. Never use real astronauts' names, photos or likeness. Health data is simulated.
- Crew portraits go in `public/crew/` (`*-suit.jpg` = AI-edited spacesuit portraits in use, `*.webp` = original photos); set `photoAI: true` in `src/core/crew.js` for AI-generated ones (draws the AI-generated mark). Missing files fall back to initials.
- Medical thresholds are illustrative and labelled so. Do **not** invent statistics: use only figures already in the code or in `docs/brain/`.
- Keep the disclaimer: "Prototype · simulated data · illustrative thresholds · not for clinical use".
- Static site only, no backend, no accounts, no CDN requests: must run offline once loaded and deploy to GitHub Pages or Netlify.
- Status is never colour-only: circle = normal, triangle = review, diamond = alert, always with text. Keyboard access, aria labels, WCAG AA contrast, `prefers-reduced-motion`.
- AI-generated images need a small visible "AI-generated" watermark.
- The Moon orbits Earth; never draw it between Earth and Mars.

## Run

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Code map (Vite + vanilla ES modules, Three.js WebGL hologram in `src/holo/holo3d.js`)

| File | What it holds |
|---|---|
| `index.html` | Markup. Empty hooks ready: `#crewSwitch` (top bar), `#crewRoot`, `#demoRoot`, `#minimap` (inside the hologram panel) |
| `src/main.js` | Imports fonts, styles and modules. Stubs for crew / minimap / demo are already imported |
| `src/core/i18n.js` | `STR.es` / `STR.en`, `LANG`, `setLang`, `t(key)`. Every user-facing string needs both languages |
| `src/core/catalog.js` | `ENV` (4 environments), `METRICS`, `HAZ` (five hazards), `ORG` (10 organs: text, guidance, 3D position) |
| `src/core/sim.js` | Deterministic 180-day data for ONE astronaut (seed 142), constants `DAYS`, `STORM_DAY=151`, `DOSE_LIMIT=600` |
| `src/core/state.js` | `S` (day, env, selected organ, `S.EVAL`…), `val`, `BASE` (days 1–14), `avg`, `cumDose`, `actions` (late-bound UI callbacks) |
| `src/core/engine.js` | `evaluate(day)` → `{M, P, O, score, factors, dose}`: metric status vs baseline, combined patterns, organ status, EVA readiness |
| `src/core/util.js` | `clamp`, `mulberry32`, `stColor`, `hexA`, `$`, `REDUCED` |
| `src/holo/holo2d.js` | Canvas 2D point-cloud hologram, `selectOrgan(id)`. Stays as the no-WebGL fallback |
| `src/ui/app.js` | Everything else: vitals, right panel, organ detail, timeline, storm overlay, check-in, toasts, boot, `setDay` |
| `src/ui/ecg.js` | ECG sweep |
| `src/styles/app.css` | All current styles and colour tokens (`:root`) |
| `docs/design/` | `DESIGN.md` (H.E.A.R.T tokens) and `DESIGN-spacex.md` (structure reference) |
| `docs/brain/` | Team research vault (Spanish). Start at `00 Inicio.md` |

Verified behaviour that must not regress (Mars transit): day 139 → "Possible early infection" (score ≈52); day 142 → "Fever with infectious pattern" (score ≈22, Not fit); day 151 → solar-storm overlay with countdown and 4-step shelter checklist (event dose ~42 → ~12 mSv when sheltered).

## Decisions already taken

- **Design = hybrid.** Structure from `DESIGN-spacex.md`: near-black canvas, 1px hairlines, uppercase condensed display type with positive tracking, ghost pill buttons, no drop shadows or decorative gradients in the chrome. Colour only for data, from `DESIGN.md`: `holo #5BD6FF`, `ok #3CF0A8`, `warn #F5B841`, `bad #FF4D5E`, `earth #4EA8DE`, `mars #D9653B`. Mono font for telemetry. For the display face use an OFL condensed font bundled via `@fontsource` (e.g. Barlow Condensed); do not load fonts from a CDN.
- **3D** comes last and only if budget remains (task D1).

## Status (updated)

Done and pushed: A1 crew data, A2 Crew view + switcher, A3 contagion + privacy, B1 hybrid visual pass, B2 mini-map, B3 offline service worker, B4 README + GitHub Pages workflow, C1 demo mode, D1 WebGL hologram (`src/holo/holo3d.js`, loaded as its own chunk; `src/holo/holo2d.js` is the fallback and still drives the ECG). Remaining work is polish and the submission material (screenshots, 7 slides). The original task list below is kept for reference.

## Tasks

Lanes own different files so two people can work in parallel without merge conflicts.

### Lane A — crew (owns `src/core/*`, `src/ui/app.js`, `src/ui/crew.js`, `src/styles/crew.css`)

- **A1 Crew data.** Fictional, diverse crew of four, Artemis-style: Commander (CDR), Pilot (PLT), Mission Specialist 1 = Crew Medical Officer (MS1), Mission Specialist 2 from an international partner agency (MS2). Invent names, call signs, short bios (ES + EN) in a new `src/core/crew.js`. Turn `sim.js` into a per-member generator: own seed, own baseline, own storyline. CDR: early infection → fever, days 139–146 (keep today's numbers; CDR day 130 must be fully normal). PLT: sleep loss + low mood "third-quarter" dip with operational-risk alert, days 95–120. MS1: low hydration → kidney-stone risk, days 126–131. MS2: vestibular / orthostatic issues on Mars-surface arrival. Everyone shares the solar storm on day 151. `evaluate` must work for any member, not only the active one.
- **A2 Crew view.** Crew Medical Officer dashboard in `#crewRoot`: four cards with initials-badge avatar (no photos), role, status shape + colour, readiness score, top alert; clicking a card opens that person's individual view. Crew switcher in `#crewSwitch`.
- **A3 Contagion + privacy.** Contagion alert for the others when one member has fever. Per-astronaut toggles "share with crew / share with Earth".

### Lane B — look and delivery (owns `index.html`, `src/styles/app.css`, `src/styles/minimap.css`, `src/ui/minimap.js`, `vite.config.js`, `package.json`, `README.md`)

- **B1 Hybrid visual pass**, CSS and `index.html` only (see Decisions). Keep every element id and `data-i18n` attribute; `src/ui/app.js` depends on them. Must stay usable on a phone.
- **B2 Mini-map** in `#minimap`: Earth, Moon orbiting Earth, Mars, and the ship's position for the current mission day (`S.day` of `DAYS`); arrives at Mars on day 180. SVG is enough.
- **B3 Offline + deploy.** Service worker (e.g. `vite-plugin-pwa`) so the site works offline after first load; GitHub Pages workflow.
- **B4 README** in English: what it is, run/deploy, demo script, tech, "NASA Data & Resources" (HRP Five Hazards, HRP Risks, ARCHeR, Immune Biomarkers, Artemis II Standard Measures, Curiosity RAD 1.8 and 0.67 mSv/day, NASA 600 mSv career limit; partner agency: CSA CANS) and a "Use of AI" paragraph. Sources are in `docs/brain/Fuentes.md` and `docs/brain/Reto/Recursos del reto.md`.

### After lane A is merged

- **C1 Demo mode** (`src/ui/demo.js`, `src/styles/demo.css`, `#demoRoot`): auto-plays the 2-minute pitch with captions, pause, next/previous. Script: Crew view → CDR day 130 normal → day 139 early-infection alert before fever → day 142 fever, readiness "Not fit", contagion alert → day 151 solar storm with shelter checklist (whole crew) → switch to Mars surface: gravity-transition protocol for MS2 → send medical packet to Earth showing the 20-minute delay.

### Only if budget remains

- **D1 3D hologram** (`src/holo/` only): Three.js version with the same `selectOrgan` behaviour, procedural body, organs coloured by status, camera fly-to; keep `holo2d.js` as fallback.
