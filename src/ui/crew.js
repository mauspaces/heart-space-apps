/* Lane A — crew switcher (#crewSwitch), Crew view (#crewRoot), contagion banner, privacy toggles.
   All crew are fictional; all health data is simulated. */
import { $, stColor } from '../core/util.js';
import { LANG, t } from '../core/i18n.js';
import { CREW } from '../core/crew.js';
import { S, PRIV, setMember, actions } from '../core/state.js';
import { evaluate, feverMembers } from '../core/engine.js';
import { DAYS } from '../core/sim.js';

const TONE = { cdr: '#E8B23A', plt: '#4EA8DE', ms1: '#5BD6FF', ms2: '#D9653B' };
const shape = s => `<i class="shape s${s}"></i>`;
const pill = s => `<span class="pill s${s}">${shape(s)}${t(['st0', 'st1', 'st2'][s])}</span>`;
const L = o => o[LANG] || o.en;
let open = false;

export const badge = (m, size = '') => `<span class="avatar ${size}" style="--tone:${TONE[m.id]}" aria-hidden="true">${m.initials}</span>`;

function memberInfo(m) {
  const E = evaluate(S.day, m.id);
  const worst = Math.max(0, ...Object.values(E.O));
  const lvl = E.score >= 75 ? 0 : E.score >= 50 ? 1 : 2;
  return { m, E, worst, lvl, top: E.P[0] };
}

/* ---------- switcher in the top bar ---------- */
function renderSwitch() {
  $('crewSwitch').innerHTML = `<div class="seg crew-seg" role="group" aria-label="${t('crew_view')}">
    <button data-crew="__view" aria-pressed="${open}">${t('crew_view')}</button>
    ${CREW.map(m => `<button data-crew="${m.id}" class="crew-pick" aria-pressed="${!open && S.member === m.id}" aria-label="${m.name} · ${t('role_' + m.role)}" title="${m.name} · ${t('role_' + m.role)}">${badge(m, 'xs')}<span class="cp-role">${m.role}</span></button>`).join('')}
  </div>`;
  $('crewSwitch').querySelectorAll('button').forEach(b => b.onclick = () => {
    if (b.dataset.crew === '__view') toggleCrewView(!open);
    else openMember(b.dataset.crew);
  });
}

/* ---------- Crew view ---------- */
function renderView() {
  const root = $('crewRoot');
  root.classList.toggle('on', open);
  root.setAttribute('aria-hidden', String(!open));
  if (!open) { root.innerHTML = ''; return; }
  const infos = CREW.map(memberInfo);
  const sick = feverMembers(S.day);
  const banner = sick.length
    ? `<div class="contagion" role="alert"><span class="shape s2"></span><div><b>${t('contagion_title')}</b><p>${t('contagion_body').replace('{n}', sick.map(m => m.name).join(', '))}</p></div></div>`
    : '';
  root.innerHTML = `<div class="crew-view fade-in">
    <div class="crew-head"><div><span class="label">${t('crew_view')} · ${t('day')} ${S.day} / ${DAYS}</span><h2>${t('crew_title')}</h2><p>${t('crew_sub')}</p></div>
      <button class="btn small" id="crewClose">${t('back')}</button></div>
    ${banner}
    <div class="crew-grid">${infos.map(cardHtml).join('')}</div>
    <p class="crew-note">${t('priv_note')} · ${t('disclaimer')}</p>
  </div>`;
  $('crewClose').onclick = () => toggleCrewView(false);
  root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openMember(b.dataset.open));
  root.querySelectorAll('[data-priv]').forEach(b => b.onclick = () => {
    const key = b.dataset.priv;
    const [id, k] = key.split(':');
    PRIV[id][k] = !PRIV[id][k];
    renderView();
    const el = root.querySelector(`[data-priv="${key}"]`);
    if (el) el.focus();
  });
}

function cardHtml({ m, E, worst, lvl, top }) {
  const priv = PRIV[m.id];
  const c = stColor(worst);
  const body = priv.crew
    ? `<div class="crew-status">${pill(worst)}</div>
      <div class="crew-score"><b class="mono" style="color:${stColor(lvl)}">${E.score}</b><span>/100 · ${t('readiness_short')} · <span style="color:${stColor(lvl)}">${[t('ready'), t('review'), t('notfit')][lvl]}</span></span></div>
      <div class="crew-alert"><span class="label">${t('top_alert')}</span>${top
        ? `<p style="color:${stColor(top.s)}">${shape(top.s)} <span>${top.title}</span></p>`
        : `<p class="ok">${shape(0)} <span>${t('no_top_alert')}</span></p>`}</div>`
    : `<div class="crew-private"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span>${t('priv_private')}</span></div>`;
  const sw = (key, label) => `<button class="switch" role="switch" aria-checked="${priv[key]}" data-priv="${m.id}:${key}"><span class="knob2"></span><span class="sw-l">${label}</span><span class="sw-s">${priv[key] ? t('priv_on') : t('priv_off')}</span></button>`;
  return `<article class="crew-card${S.member === m.id ? ' current' : ''}" style="--ring:${priv.crew ? c : 'var(--line-2)'}" aria-label="${m.name}">
    <header>${badge(m, 'lg')}<div><span class="label">${t('role_' + m.role)}</span><h3>${m.name}</h3><small>“${m.callsign}” · ${L(m.agency)}</small></div></header>
    ${body}
    <p class="crew-bio">${L(m.bio)}</p>
    <div class="crew-priv"><span class="label">${t('priv_title')}</span>${sw('crew', t('priv_crew'))}${sw('earth', t('priv_earth'))}</div>
    <button class="btn" data-open="${m.id}">${t('crew_open')}</button>
  </article>`;
}

/* ---------- actions ---------- */
function toggleCrewView(on) {
  open = on;
  renderSwitch();
  renderView();
  if (on) { const b = $('crewClose'); if (b) b.focus(); }
}
function openMember(id) {
  open = false;
  setMember(id);
  S.selected = null;
  if (actions.refresh) actions.refresh();
  renderSwitch();
  renderView();
}

actions.renderCrew = () => { renderSwitch(); renderView(); };
actions.showCrewView = toggleCrewView;
actions.selectMember = openMember;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) toggleCrewView(false); });
renderSwitch();
renderView();
