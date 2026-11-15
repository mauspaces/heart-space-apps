/* Trend history: a full mission-day chart for one indicator, against the astronaut's own baseline
   (days 1–14, mean ± 1 SD). Points carry the status shape (● ▲ ◆), never colour alone. */
import { $, stColor } from '../core/util.js';
import { t } from '../core/i18n.js';
import { METRICS, mName } from '../core/catalog.js';
import { STORM_DAY } from '../core/sim.js';
import { S, val, baseOf } from '../core/state.js';
import { evaluate } from '../core/engine.js';

const SRC = { bp: 'sbp', exercise: 'ex' }; // metric id -> series key in the simulation
const W = 640, H = 240, PAD = { l: 44, r: 14, t: 16, b: 28 };
let lastFocus = null;

function shapePath(s, x, y) {
  const r = s ? 4.2 : 2.2;
  if (s === 1) return `<path d="M${x} ${y - r}L${x + r} ${y + r * .8}L${x - r} ${y + r * .8}Z" fill="${stColor(1)}"/>`;
  if (s === 2) return `<path d="M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z" fill="${stColor(2)}"/>`;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#E6EDF5" fill-opacity=".55"/>`;
}

function chart(key) {
  const sk = SRC[key] || key, d1 = S.day, B = baseOf(S.member)[sk];
  const xs = [], st = [];
  for (let d = 1; d <= d1; d++) { xs.push(val(d, sk)); st.push(evaluate(d).M[key].s); }
  const lo = Math.min(...xs, B.m - B.sd), hi = Math.max(...xs, B.m + B.sd), pad = (hi - lo) * .12 || 1;
  const y0 = lo - pad, y1 = hi + pad;
  const X = d => PAD.l + (d1 === 1 ? 0 : (d - 1) / (d1 - 1)) * (W - PAD.l - PAD.r);
  const Y = v => PAD.t + (1 - (v - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const dec = METRICS[key].dec;
  const line = xs.map((v, i) => (i ? 'L' : 'M') + X(i + 1).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
  const ticks = [y0 + pad, (y0 + y1) / 2, y1 - pad].map(v => `<text x="${PAD.l - 8}" y="${Y(v) + 3}" text-anchor="end" class="tr-ax">${v.toFixed(dec)}</text><line x1="${PAD.l}" x2="${W - PAD.r}" y1="${Y(v)}" y2="${Y(v)}" class="tr-grid"/>`).join('');
  const marks = [[139, 'warn'], [STORM_DAY, 'bad']].filter(([d]) => d <= d1).map(([d, c]) => `<line x1="${X(d)}" x2="${X(d)}" y1="${PAD.t}" y2="${H - PAD.b}" class="tr-evt ${c}"/>`).join('');
  const xl = [1, Math.round(d1 / 2), d1].filter((v, i, a) => a.indexOf(v) === i).map(d => `<text x="${X(d)}" y="${H - 8}" text-anchor="middle" class="tr-ax">${t('day')} ${d}</text>`).join('');
  return `<svg class="tr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${mName(key)}: ${t('day')} 1–${d1}">
    ${ticks}
    <rect x="${X(1)}" width="${Math.max(0, X(Math.min(14, d1)) - X(1))}" y="${PAD.t}" height="${H - PAD.t - PAD.b}" class="tr-basewin"/>
    <rect x="${PAD.l}" width="${W - PAD.l - PAD.r}" y="${Y(B.m + B.sd)}" height="${Math.max(1, Y(B.m - B.sd) - Y(B.m + B.sd))}" class="tr-band"/>
    <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${Y(B.m)}" y2="${Y(B.m)}" class="tr-mean"/>
    ${marks}
    <path d="${line}" class="tr-line"/>
    ${xs.map((v, i) => shapePath(st[i], +X(i + 1).toFixed(1), +Y(v).toFixed(1))).join('')}
    ${xl}
  </svg>`;
}

export function openTrend(key) {
  let el = $('trend');
  if (!el) {
    el = document.createElement('div'); el.id = 'trend'; el.className = 'overlay modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'trTitle'); document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) closeTrend(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); closeTrend(); }
      if (e.key === 'Tab') { e.preventDefault(); el.querySelector('.tr-close').focus(); } // single control: keep focus inside
    });
  }
  const sk = SRC[key] || key, B = baseOf(S.member)[sk], dec = METRICS[key].dec, u = METRICS[key].unit;
  el.innerHTML = `<div class="modal-box tr-box">
    <div class="tr-head"><h2 id="trTitle">${mName(key)}</h2><button class="btn small tr-close">${t('tr_close')}</button></div>
    <p class="modal-sub">${t('tr_sub').replace('{d}', S.day)}</p>
    ${chart(key)}
    <div class="legend tr-legend"><span class="c0"><i class="shape s0"></i><em>${t('st0')}</em></span><span class="c1"><i class="shape s1"></i><em>${t('st1')}</em></span><span class="c2"><i class="shape s2"></i><em>${t('st2')}</em></span>
      <span><i class="tr-key band"></i><em>${t('tr_base')} ${B.m.toFixed(dec)} ± ${B.sd.toFixed(dec)} ${u}</em></span></div>
    ${key === 'bp' ? `<p class="poll-rule">${t('tr_bp')}</p>` : ''}
  </div>`;
  el.querySelector('.tr-close').onclick = closeTrend;
  lastFocus = document.activeElement; el.classList.add('on'); el.querySelector('.tr-close').focus();
}
function closeTrend() { const el = $('trend'); if (el) el.classList.remove('on'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
