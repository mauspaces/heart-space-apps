# DESIGN.md — H.E.A.R.T (Health Evaluation & Astronaut Readiness Tool)

> Strictly follow this file when generating any UI for H.E.A.R.T.

## 1. Product & tone
Personal health console for astronauts on long-duration missions. It must feel like **mission control meets a premium health app**: calm, precise, trustworthy. Never alarming without a reason; every alert explains *what*, *why* and *what to do*.

## 2. Color tokens
| Token | Hex | Use |
|---|---|---|
| `bg` | `#151622` | App background (same as the Space Apps team page) |
| `bg-deep` | `#0E0F18` | Wells, canvas background, modals scrim base |
| `panel` | `rgba(255,255,255,0.035)` | Cards |
| `line` | `rgba(255,255,255,0.08)` | Borders, dividers, grids |
| `text` | `#E9EDF6` | Primary text |
| `muted` | `#8E97AD` | Secondary text, labels |
| `holo` | `#5BD6FF` | Hologram, info, data lines |
| `ok` | `#3CF0A8` | Normal status, vital signs |
| `warn` | `#F5B841` | Review / crew-level |
| `bad` | `#FF4D5E` | Alert / flight-surgeon level. Only for real alerts |
| `gold` | `#E8B23A` | Brand, primary actions |
| `earth` | `#4EA8DE` / `mars` `#D9653B` | Planet references only |

Status is **never color-only**: ok = circle ●, warn = triangle ▲, bad = diamond ◆, always with a text label.

## 3. Typography
- Display / headings: **Space Grotesk** 600–700, tight tracking.
- UI / body: **Inter** 400–600, 14–15 px base.
- Telemetry, numbers, timestamps: **JetBrains Mono** 400–500, tabular.
- Labels: 11–12 px, uppercase, letter-spacing 0.12em, `muted`.

## 4. Layout
- Desktop: top bar 64 px · three columns (vitals 320 px · hologram flexible · detail 380 px) · mission timeline 84 px.
- Below 1180 px: hologram first, then vitals, then detail; page scrolls.
- Spacing scale 4 / 8 / 12 / 16 / 24 / 32. Card radius 14 px, controls 10 px, pills 999 px.

## 5. Components
- **Card**: `panel` fill, 1 px `line` border, 16 px padding, header label in uppercase muted.
- **Vital card**: label · big mono value + unit · status shape · 30-day sparkline. Click focuses its organ.
- **Status pill**: shape + word, tinted background at 14 % of the status color.
- **Hotspot**: ring in status color with pulsing halo; label callout on hover/selection.
- **Segmented control**: environment selector and language toggle.
- **Primary button**: `gold` fill, dark text. Secondary: transparent, `line` border.
- **Timeline**: draggable mission-day scrubber with event markers.
- **Alert overlay** (solar storm): full-screen red vignette, countdown, step checklist.

## 6. Motion
- Purposeful only: reveals state changes, focuses attention, shows time.
- Durations: 150 ms (hover), 300 ms (panels), 600–900 ms (camera moves, gauges). Easing: cubic-out.
- Signature motions: boot sequence (≤3 s, skippable), hologram slow auto-rotation + scan line, ECG sweep at the real heart rate, number tweening, gauge fill.
- Respect `prefers-reduced-motion`: no auto-rotation, no boot, instant transitions.

## 7. Content rules
- Bilingual ES / EN (submission must be English).
- Thresholds are illustrative; show the disclaimer "Prototype · simulated data · not for clinical use".
- No NASA insignia or mission logos anywhere.
