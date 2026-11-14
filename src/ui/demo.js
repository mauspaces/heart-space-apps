/* Demo mode — auto-plays the ~2-minute pitch with captions. Pausable, next / previous.
   It only drives the real app (same buttons, same state): nothing is faked. */
import { $ } from '../core/util.js';
import { LANG, t, STR } from '../core/i18n.js';
import { S, actions } from '../core/state.js';

Object.assign(STR.en, { demo_start: 'Demo mode', demo_exit: 'Exit demo', demo_prev: 'Previous', demo_next: 'Next', demo_pause: 'Pause', demo_play: 'Play', demo_step: 'Step' });
Object.assign(STR.es, { demo_start: 'Modo demo', demo_exit: 'Salir de la demo', demo_prev: 'Anterior', demo_next: 'Siguiente', demo_pause: 'Pausar', demo_play: 'Reanudar', demo_step: 'Paso' });

const click = sel => { const el = document.querySelector(sel); if (el) el.click(); };
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
let timers = [];

/* Reset everything a step may have touched, so any step can be entered from any other. */
function reset(env, member, day) {
  timers.forEach(clearTimeout); timers = [];
  actions.closeStorm();
  S.sheltered = false; S.stormShownFor = -1;
  if (S.env !== env) click(`[data-env="${env}"]`);
  actions.selectMember(member);
  S.selected = null;
  actions.setDay(day === 151 ? 150 : day);
}
const crewView = (on = true) => actions.showCrewView(on);

const STEPS = [
  { ms: 14000,
    es: 'Día 130 · Cuatro astronautas, cuatro líneas base personales. El Oficial Médico corre la votación GO / NO GO de la EVA: los cuatro en GO.',
    en: 'Day 130 · Four astronauts, four personal baselines. The Crew Medical Officer runs the EVA go / no-go poll: all four are GO.',
    run() { reset('transit', 'cdr', 130); crewView(true); } },
  { ms: 12000,
    es: 'Vista individual del comandante: figura humana, signos vitales y su tendencia contra su propia línea base. Sin alertas.',
    en: "The commander's individual view: human figure, vital signs and trends against their own baseline. No alerts.",
    run() { reset('transit', 'cdr', 130); crewView(false); } },
  { ms: 15000,
    es: 'Día 139 · HRV baja, duerme menos y la temperatura sube. El motor detecta una posible infección ANTES de que haya fiebre.',
    en: 'Day 139 · HRV is down, sleep is shorter, temperature is creeping up. The engine flags a possible infection BEFORE any fever.',
    run() { reset('transit', 'cdr', 139); crewView(false); later(() => actions.selectOrgan('immune'), 2500); } },
  { ms: 17000,
    es: 'Día 142 · Fiebre. La preparación para una tarea crítica cae a "NO GO" y la tripulación recibe una alerta de contagio.',
    en: 'Day 142 · Fever. Readiness for a critical task drops to "NO-GO" and the rest of the crew gets a contagion alert.',
    run() { reset('transit', 'cdr', 142); crewView(false); later(() => crewView(true), 5500); } },
  { ms: 20000,
    es: 'Día 151 · Tormenta solar. Alerta roja, cuenta regresiva y lista de refugio para toda la tripulación. Refugiarse baja la dosis del evento de ~42 a ~12 mSv.',
    en: 'Day 151 · Solar storm. Red alert, countdown and a shelter checklist for the whole crew. Sheltering cuts the event dose from ~42 to ~12 mSv.',
    run() {
      reset('transit', 'cdr', 150); crewView(false); actions.setDay(151);
      ['s1', 's2', 's3', 's4'].forEach((k, i) => later(() => click(`#stormSteps [data-k="${k}"]`), 5000 + i * 2200));
    } },
  { ms: 17000,
    es: 'Llegada a la superficie de Marte (0.38 g). Para MS2, el protocolo de transición de gravedad: equilibrio y presión de pie/acostado antes de cualquier tarea.',
    en: 'Arrival on the Mars surface (0.38 g). For MS2, the gravity-transition protocol: balance and lying/standing blood pressure before any task.',
    run() { reset('mars', 'ms2', 180); crewView(false); later(() => actions.selectOrgan('ear'), 2500); } },
  { ms: 20000,
    es: 'Se envía el paquete médico a la Tierra con el retraso real del entorno: hasta 20 minutos por sentido. Mientras tanto, la tripulación ya sabe qué hacer.',
    en: 'The medical packet goes to Earth with the real delay of this environment: up to 20 minutes one way. Meanwhile the crew already knows what to do.',
    run() { reset('mars', 'ms2', 180); crewView(false); actions.selectOrgan(null); later(() => click('#sendPacket'), 2500); } },
  { ms: 9000,
    es: 'En Marte, el médico está a 20 minutos. H.E.A.R.T convierte a cada astronauta en su propio primer respondiente.',
    en: 'On Mars, the doctor is up to 20 minutes away. H.E.A.R.T turns every astronaut into their own first responder.',
    run() { reset('transit', 'cdr', 142); crewView(true); } },
];

let idx = -1, playing = false, tick = null, stepStart = 0, elapsed = 0;

function mount() {
  const btn = document.createElement('button');
  btn.className = 'btn demo-launch'; btn.id = 'demoLaunch'; btn.dataset.i18n = 'demo_start'; btn.textContent = t('demo_start');
  const ci = $('openCheckin'); ci.parentNode.insertBefore(btn, ci);
  btn.onclick = () => start();
  $('demoRoot').innerHTML = `<div class="demo-bar" id="demoBar" role="region" aria-live="polite" hidden>
    <div class="demo-top"><span class="label mono" id="demoStep"></span>
      <div class="demo-ctl">
        <button class="btn small" id="demoPrev" aria-label="">‹</button>
        <button class="btn small" id="demoPlay" aria-label=""></button>
        <button class="btn small" id="demoNext" aria-label="">›</button>
        <button class="btn small" id="demoExit"></button>
      </div></div>
    <p id="demoCap"></p>
    <div class="demo-prog"><i id="demoProg"></i></div>
  </div>`;
  $('demoPrev').onclick = () => go(idx - 1);
  $('demoNext').onclick = () => go(idx + 1);
  $('demoPlay').onclick = () => (playing ? pause() : resume());
  $('demoExit').onclick = stop;
}

function labels() {
  const b = $('demoBar'); if (!b) return;
  $('demoPrev').setAttribute('aria-label', t('demo_prev')); $('demoNext').setAttribute('aria-label', t('demo_next'));
  $('demoPlay').textContent = playing ? '❚❚ ' + t('demo_pause') : '▶ ' + t('demo_play');
  $('demoExit').textContent = t('demo_exit');
  if (idx >= 0) { $('demoStep').textContent = `${t('demo_step')} ${idx + 1} / ${STEPS.length}`; $('demoCap').textContent = STEPS[idx][LANG] || STEPS[idx].en; }
}

function go(i) {
  if (i < 0) i = 0;
  if (i >= STEPS.length) { stop(); return; }
  idx = i; elapsed = 0; stepStart = performance.now();
  STEPS[i].run(); labels();
  $('demoProg').style.width = '0%';
}
function loop() {
  clearInterval(tick);
  tick = setInterval(() => {
    if (!playing) return;
    const now = performance.now(); elapsed += now - stepStart; stepStart = now;
    const d = STEPS[idx].ms;
    $('demoProg').style.width = Math.min(100, elapsed / d * 100) + '%';
    if (elapsed >= d) go(idx + 1);
  }, 120);
}
function start() {
  $('demoBar').hidden = false; document.body.classList.add('demo-on');
  playing = true; go(0); loop(); labels();
}
function pause() { playing = false; timers.forEach(clearTimeout); timers = []; labels(); }
function resume() { playing = true; stepStart = performance.now(); labels(); }
function stop() {
  playing = false; clearInterval(tick); timers.forEach(clearTimeout); timers = [];
  $('demoBar').hidden = true; document.body.classList.remove('demo-on'); idx = -1;
}

/* keep captions in the active language */
const prevRender = actions.renderCrew;
actions.renderCrew = () => { if (prevRender) prevRender(); labels(); const l = $('demoLaunch'); if (l) l.textContent = t('demo_start'); };

mount();
