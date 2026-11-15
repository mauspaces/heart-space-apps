/* On-board self-tests from the team's medical matrix:
   - Amsler grid (neuro-ocular / SANS): straight lines vs wavy lines or missing areas.
   - Reaction micro-test (neurobehavioural): 5 trials, mean reaction time; the first result is the personal reference.
   Results are stored as per-day overrides (like the check-in), so the engine re-evaluates the systems.
   Illustrative only — not for clinical use. */
import { $ } from '../core/util.js';
import { t } from '../core/i18n.js';
import { S, actions } from '../core/state.js';

let lastFocus = null, timer = null;

function modal() {
  let el = $('testModal');
  if (!el) {
    el = document.createElement('div'); el.id = 'testModal'; el.className = 'overlay modal';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'testTitle');
    document.body.appendChild(el);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  }
  return el;
}
function open(html) {
  const el = modal(); el.innerHTML = `<div class="modal-box test-box">${html}</div>`;
  lastFocus = document.activeElement; el.classList.add('on');
  el.querySelector('.t-cancel').onclick = close;
  return el;
}
function close() { clearTimeout(timer); const el = $('testModal'); if (el) el.classList.remove('on'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function save(patch, doneKey, msg, kind) {
  S.overrides[S.day] = { ...(S.overrides[S.day] || {}), ...patch };
  close(); if (actions.markDone) actions.markDone(doneKey);
  if (actions.refresh) actions.refresh(); if (actions.toast) actions.toast(msg, kind);
}

/* ---------- Amsler grid ---------- */
function amsler() {
  const n = 20, step = 14, sz = n * step;
  let g = '';
  for (let i = 0; i <= n; i++) g += `<line x1="${i * step}" y1="0" x2="${i * step}" y2="${sz}"/><line x1="0" y1="${i * step}" x2="${sz}" y2="${i * step}"/>`;
  const el = open(`<span class="eyebrow">SANS · ${t('chk_amsler')}</span>
    <h2 id="testTitle">${t('am_title')}</h2>
    <p class="modal-sub">${t('am_how')}</p>
    <svg class="amsler" viewBox="-2 -2 ${sz + 4} ${sz + 4}" role="img" aria-label="${t('am_title')}"><g>${g}</g><circle cx="${sz / 2}" cy="${sz / 2}" r="4"/></svg>
    <div class="modal-actions test-actions">
      <button class="btn t-cancel">${t('cancel')}</button>
      <button class="btn t-wavy">${t('am_wavy')}</button>
      <button class="btn primary t-ok">${t('am_ok')}</button>
    </div>`);
  el.querySelector('.t-ok').onclick = () => save({ amsler: 'ok' }, 'amsler', t('am_saved_ok'), 'ok');
  el.querySelector('.t-wavy').onclick = () => save({ amsler: 'wavy' }, 'amsler', t('am_saved_wavy'), 'warn');
  el.querySelector('.t-ok').focus();
}

/* ---------- reaction micro-test ---------- */
const TRIALS = 5;
function reaction() {
  const el = open(`<span class="eyebrow">Neuro · ${t('chk_react')}</span>
    <h2 id="testTitle">${t('rt_title')}</h2>
    <p class="modal-sub">${t('rt_how')}</p>
    <button class="rt-pad" type="button" aria-live="assertive"><span class="rt-msg">${t('rt_start')}</span></button>
    <p class="rt-meta mono"></p>
    <p class="poll-rule">${t('rt_rule')}</p>
    <div class="modal-actions"><button class="btn t-cancel">${t('cancel')}</button></div>`);
  const pad = el.querySelector('.rt-pad'), msg = el.querySelector('.rt-msg'), meta = el.querySelector('.rt-meta');
  let state = 'idle', t0 = 0; const res = [];
  const arm = () => {
    state = 'wait'; pad.className = 'rt-pad wait'; msg.textContent = t('rt_wait');
    timer = setTimeout(() => { state = 'go'; pad.className = 'rt-pad go'; msg.textContent = t('rt_go'); t0 = performance.now(); }, 1200 + Math.random() * 2000);
  };
  const hit = () => {
    if (state === 'idle') { arm(); return; }
    if (state === 'wait') { clearTimeout(timer); msg.textContent = t('rt_soon'); state = 'idle'; pad.className = 'rt-pad'; return; }
    if (state === 'go') {
      res.push(performance.now() - t0); meta.textContent = res.map(x => Math.round(x) + ' ms').join(' · ');
      if (res.length < TRIALS) { arm(); return; }
      state = 'done'; pad.className = 'rt-pad'; const mean = res.reduce((a, b) => a + b, 0) / res.length;
      msg.textContent = `${Math.round(mean)} ms`;
      setTimeout(() => save({ rt: Math.round(mean) }, 'react', `${t('rt_saved')} ${Math.round(mean)} ms`, 'ok'), 900);
    }
  };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); hit(); });
  pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(); } });
  pad.focus();
}

actions.openTest = kind => (kind === 'amsler' ? amsler() : reaction());
