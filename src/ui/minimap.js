/* Lane B — Earth–Moon–Mars mini-map (#minimap).
   Schematic, not to scale. The Moon orbits Earth (≈27.3-day period) and is never drawn on the Earth–Mars line.
   Ship position = mission day along a transfer arc: launch (day 1) at Earth, arrival (day 180) at Mars. */
import { $ } from '../core/util.js';
import { LANG, t, STR } from '../core/i18n.js';
import { S, actions } from '../core/state.js';
import { DAYS } from '../core/sim.js';

Object.assign(STR.en, { map_title: 'Mission map', map_earth: 'Earth', map_moon: 'Moon', map_mars: 'Mars', map_ship: 'Ship', map_note: 'Schematic · not to scale' });
Object.assign(STR.es, { map_title: 'Mapa de misión', map_earth: 'Tierra', map_moon: 'Luna', map_mars: 'Marte', map_ship: 'Nave', map_note: 'Esquemático · sin escala' });

const E = { x: 34, y: 86 }, M = { x: 246, y: 62 }, C = { x: 140, y: 14 }; // Earth, Mars, Bezier control point
const bez = u => ({
  x: (1 - u) ** 2 * E.x + 2 * (1 - u) * u * C.x + u ** 2 * M.x,
  y: (1 - u) ** 2 * E.y + 2 * (1 - u) * u * C.y + u ** 2 * M.y,
});

function render() {
  const el = $('minimap'); if (!el) return;
  const u = (S.day - 1) / (DAYS - 1), p = bez(u), pct = Math.round(u * 100);
  // Moon: small orbit around Earth, opposite side of the arc at launch so it never sits on the Earth–Mars line.
  const ang = S.day / 27.3 * Math.PI * 2 + Math.PI * 0.9, mr = 15;
  const mx = E.x + Math.cos(ang) * mr, my = E.y + Math.sin(ang) * mr;
  const steps = 28, path = Array.from({ length: steps + 1 }, (_, i) => bez(i / steps));
  const d = pts => pts.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join(' ');
  const done = path.filter((_, i) => i / steps <= u).concat([p]);
  el.innerHTML = `<div class="mm" role="img" aria-label="${t('map_title')}: ${t('day')} ${S.day} / ${DAYS}, ${pct}%">
    <div class="mm-head"><span class="label">${t('map_title')}</span><span class="mono">${t('day')} ${S.day}</span></div>
    <svg viewBox="0 0 280 110" aria-hidden="true">
      <path d="${d(path)}" fill="none" stroke="rgba(150,200,255,.28)" stroke-width="1" stroke-dasharray="2 4"/>
      <path d="${d(done)}" fill="none" stroke="#5BD6FF" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="${E.x}" cy="${E.y}" r="${mr}" fill="none" stroke="rgba(150,200,255,.28)" stroke-dasharray="1.5 3"/>
      <circle cx="${E.x}" cy="${E.y}" r="7" fill="#4EA8DE"/>
      <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="2.4" fill="#C9D6E3"/>
      <circle cx="${M.x}" cy="${M.y}" r="6" fill="#D9653B"/>
      <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><path d="M0 -5 L3.4 4 L0 2.2 L-3.4 4 Z" fill="#E6EDF5" transform="rotate(${(Math.atan2(bez(Math.min(1, u + .02)).y - p.y, bez(Math.min(1, u + .02)).x - p.x) * 180 / Math.PI + 90).toFixed(0)})"/></g>
      <text x="${E.x}" y="${E.y + 22}" text-anchor="middle" class="mm-t">${t('map_earth')}</text>
      <text x="${mx.toFixed(1)}" y="${(my - 5).toFixed(1)}" text-anchor="middle" class="mm-t mm-s">${t('map_moon')}</text>
      <text x="${M.x}" y="${M.y + 18}" text-anchor="middle" class="mm-t">${t('map_mars')}</text>
    </svg>
    <div class="mm-foot"><span>${t('map_ship')} · ${pct}%</span><span>${t('map_note')}</span></div></div>`;
}

const prev = actions.renderCrew;
actions.renderCrew = () => { if (prev) prev(); render(); };
render();
