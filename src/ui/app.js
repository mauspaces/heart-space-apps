/* UI rendering, timeline, solar-storm overlay, daily check-in, boot. */
import { REDUCED, clamp, $, stColor, hexA } from '../core/util.js';
import { LANG, setLang, t } from '../core/i18n.js';
import { ENV, METRICS, mName, HAZ, ORG } from '../core/catalog.js';
import { DAYS, STORM_DAY, DOSE_LIMIT } from '../core/sim.js';
import { S, val, actions, PRIV } from '../core/state.js';
import { CREW_BY_ID } from '../core/crew.js';
import { evaluate } from '../core/engine.js';
import { selectOrgan, frame, resize } from '../holo/holo2d.js';
import { attachECG } from './ecg.js';
import { portrait } from './portrait.js';

const fmt=(v,dec)=>typeof v==='number'? v.toFixed(dec) : v;
const shape=s=>`<i class="shape s${s}"></i>`;
const pill=s=>`<span class="pill s${s}">${shape(s)}${t(['st0','st1','st2'][s])}</span>`;
function spark(key,d,s,w=120,h=26){
  const xs=[]; for(let i=Math.max(1,d-29);i<=d;i++){ xs.push(key==='bp'?val(i,'sbp'):key==='exercise'?val(i,'ex'):val(i,key)); }
  if(xs.some(v=>typeof v!=='number')) return '';
  const mn=Math.min(...xs), mx=Math.max(...xs), rg=(mx-mn)||1;
  const pts=xs.map((v,i)=>[(i/(Math.max(1,xs.length-1)))*w, h-3-((v-mn)/rg)*(h-6)]);
  const dpath=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const last=pts[pts.length-1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${dpath}" fill="none" stroke="${s?stColor(s):'#E6EDF5'}" stroke-opacity="${s?1:.55}" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="2" fill="${s?stColor(s):'#E6EDF5'}"/></svg>`;
}
function tween(el,to,dec){
  const from=parseFloat(el.dataset.v); el.dataset.v=to;
  if(isNaN(from)||REDUCED||from===to){ el.firstChild.nodeValue=to.toFixed(dec); return; }
  const t0=performance.now(), dur=450;
  (function step(now){ const u=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-u,3); el.firstChild.nodeValue=(from+(to-from)*e).toFixed(dec); if(u<1) requestAnimationFrame(step); })(t0);
}

const VITALS=[['hr','heart',true],['hrv','heart'],['bp','heart'],['spo2','lungs'],['temp','immune'],['sleep','brain'],['glucose','metabolic'],['mood','brain'],['water','kidneys'],['exercise','musculo']];
function buildVitals(){
  $('vitals').innerHTML = VITALS.map(([k,o,wide])=>`<button class="vrow" id="v-${k}" data-organ="${o}">
    <span class="vrow-spark">${wide?'<canvas id="ecg" aria-hidden="true"></canvas>':`<span id="vsp-${k}"></span>`}</span>
    <span class="vrow-main"><span class="vrow-label"><span id="vs-${k}"></span><span id="vn-${k}">${mName(k)}</span></span>
    <span class="vrow-val"><span id="vv-${k}" data-v="">–</span><small>${METRICS[k].unit}</small></span><span class="vrow-src" id="vsrc-${k}"></span></span></button>`).join('');
  $('vitals').querySelectorAll('.vrow').forEach(b=>b.onclick=()=>selectOrgan(b.dataset.organ));
  attachECG($('ecg'));
}
function renderVitals(){
  const d=S.day, M=S.EVAL.M;
  $('vitalsDay').textContent=`${t('day')} ${d}`;
  VITALS.forEach(([k])=>{
    const m=M[k]; const card=$('v-'+k); card.className='vrow'+(m.s?' st-'+m.s:'');
    $('vn-'+k).textContent=mName(k); $('vsrc-'+k).textContent=t('src_'+k);
    const stw=t(['st0','st1','st2'][m.s]);
    $('vs-'+k).innerHTML=`<span class="st c${m.s}" style="display:inline-flex;align-items:center;gap:6px">${shape(m.s)}${m.s?stw:`<span class="vh">${stw}</span>`}</span>`;
    const el=$('vv-'+k);
    if(k==='bp'){ el.dataset.v=''; el.firstChild.nodeValue=m.v; }
    else tween(el, typeof m.v==='number'?m.v:0, METRICS[k].dec);
    if(k!=='hr') $('vsp-'+k).innerHTML=spark(k,d,m.s,84,28);
  });
}

function renderTop(){
  $('missionDay').textContent=`${t('day')} ${S.day} / ${DAYS}`;
  $('delayChip').textContent=ENV[S.env].delayTxt; $('streak').textContent=S.streak;
  const _m=CREW_BY_ID[S.member]; document.querySelector('.mission .label').textContent=`${_m.role} · ${_m.name} · “${_m.callsign}”`;
  $('hudEnv').textContent=t('env_'+S.env).toUpperCase();
  $('hudGrav').textContent=`${t('gravity').toUpperCase()} ${ENV[S.env].g} · ${ENV[S.env].rate?ENV[S.env].rate+' mSv/d':'—'}`;
}

let packetTimer=null, packetLeft=0, packetTotal=0;
function renderRight(){
  const R=$('right'); const E=S.EVAL;
  if(S.selected){ R.innerHTML=organDetail(S.selected); R.querySelector('.back').onclick=()=>selectOrgan(null); return; }
  const lvl=E.score>=75?0:E.score>=50?1:2; const lab=[t('ready'),t('review'),t('notfit')][lvl];
  const rate=ENV[S.env].rate; const left=DOSE_LIMIT-E.dose; const proj=rate? Math.round(left/rate):null;
  const m=CREW_BY_ID[S.member], pct=Math.round(E.dose/DOSE_LIMIT*100);
  const V=E.verdict, goWord=t(['ready','review','notfit'][V]), notGo=E.poll.filter(p=>p.s).length;
  R.innerHTML=`<section class="dossier">
  <header class="who fade-in">${portrait(m,'sm')}
    <span class="eyebrow">${t('role_'+m.role)} · “${m.callsign}”</span>
    <h1 class="who-name">${m.name}</h1>
    <p class="who-meta">${t('day')} ${S.day} / ${DAYS} · ${t('env_'+S.env)}</p>
  </header>
  <div class="verdict fade-in">
    <span class="eyebrow">${t('poll_title')}</span>
    <div class="go-word c${V}${goWord.length>6?' long':''}">${goWord}</div>
    <p class="go-sub">${notGo? t('poll_of').replace('{n}',notGo).replace('{m}',E.poll.length) : t('poll_all').replace('{m}',E.poll.length)}</p>
    <ol class="poll">${E.poll.map((p,i)=>`<li class="c${p.s}" style="animation-delay:${i*40}ms">${shape(p.s)}<span class="poll-lab">${p.lab}</span><span class="poll-v">${t(['ready','review','notfit'][p.s])}</span></li>`).join('')}</ol>
    <p class="poll-rule">${t('poll_rule')}</p>
  </div>
  <div class="block fade-in">
    <div class="block-head"><span class="eyebrow">${t('alerts')}</span><span class="eyebrow mono">${String(E.P.length).padStart(2,'0')}</span></div>
    ${E.P.length? E.P.map(p=>`<div class="alert s${p.s}" role="button" tabindex="0" data-organ="${p.organ}"><span class="eyebrow c${p.s}">${shape(p.s)}${t(['st0','st1','st2'][p.s])} · ${ORG[p.organ][LANG].name}</span><b>${p.title}</b>${p.ev&&p.ev.length?`<ul class="ev">${p.ev.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<p>${p.desc}</p><p class="act">→ ${p.act}</p><p class="esc">${t('escalate_to')} <span>${p.esc==='earth'?t('esc_earth'):t('esc_crew')}</span></p></div>`).join('') : `<div class="empty"><span class="c0">${shape(0)}</span>${t('no_alerts')}</div>`}
  </div>
  <div class="block fade-in">
    <div class="block-head"><span class="eyebrow">${t('radiation')}</span>${pill(E.M.dose.s)}</div>
    <div class="stat-row"><b class="stat">${Math.round(E.dose)}</b><span class="stat-unit">mSv · ${pct}% ${t('career')}</span></div>
    <div class="bar"><i id="doseBar"></i><span class="limit"></span></div>
    <dl class="kv-list">
      <div><dt>${t('rate_now')}</dt><dd>${rate?rate+' mSv/'+(LANG==='es'?'día':'day'):'—'}</dd></div>
      <div><dt>${t('projection')}</dt><dd>${proj!==null? proj+' '+t('days') : '—'}</dd></div>
    </dl>
  </div>
  <div class="block fade-in">
    <div class="block-head"><span class="eyebrow">${t('lt_title')}</span><span class="eyebrow">${ENV[S.env].delayTxt}</span></div>
    <div class="packet" id="packet"></div>
    <button class="btn block" id="sendPacket">${t('send')}</button>
    <p class="poll-rule">${t('lt_note')}</p>
  </div></section>`;
  requestAnimationFrame(()=>{ const b=$('doseBar'); if(b) b.style.width=Math.min(100,pct)+'%'; });
  R.querySelectorAll('.alert').forEach(a=>{ a.onclick=()=>selectOrgan(a.dataset.organ); a.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectOrgan(a.dataset.organ); } }; });
  $('sendPacket').onclick=sendPacket; renderPacket();
}
function organDetail(id){
  const o=ORG[id], L=o[LANG], E=S.EVAL, st=E.O[id];
  const rows=o.metrics.map(k=>{ const m=E.M[k]; const b=m.b===null||m.b===undefined?'—': typeof m.b==='number'? m.b.toFixed(METRICS[k].dec) : m.b;
    return `<tr><td>${mName(k)}</td><td class="v"><span class="c${m.s}">${shape(m.s)}</span>${fmt(m.v,METRICS[k].dec)} <span class="stat-unit">${METRICS[k].unit}</span></td><td class="b">${b}</td><td>${['vestibular','vision','symptoms','dose'].includes(k)?'':spark(k,S.day,m.s,72,20)}</td></tr>`; }).join('');
  const pats=E.P.filter(p=>p.organ===id).map(p=>`<div class="alert s${p.s}"><span class="eyebrow c${p.s}">${shape(p.s)}${t(['st0','st1','st2'][p.s])}</span><b>${p.title}</b><p>${p.desc}</p></div>`).join('');
  return `<div class="fade-in">
    <button class="back"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>${t('back')}</button>
    <div class="detail-title">${pill(st)}<h2>${L.name}</h2></div>
    <p class="what">${L.what}</p>
    ${pats}
    <div class="card now"><span class="label">${t('what_now')}</span><p class="todo">${L.act[st]}</p></div>
    <div class="card"><table class="mtable"><tr><td class="label">${t('metric')}</td><td class="label">${t('value')}</td><td class="label">${t('base')}</td><td class="label">${t('trend')}</td></tr>${rows}</table></div>
    <div class="card"><span class="label">${t('escalate')}</span><p class="todo">${L.esc}</p>
      <dl class="kv-list"><div><dt>${t('oneway')}</dt><dd>${ENV[S.env].delayTxt}</dd></div></dl></div>
    <div class="card"><span class="label">${t('hazards_lbl')}</span><div class="chips">${o.hz.map(h=>`<span>${HAZ[h][LANG]}</span>`).join('')}</div></div>
    <div class="card"><details open><summary>${t('how')}</summary><ol class="steps">${L.how.map(s=>`<li>${s}</li>`).join('')}</ol></details></div>
  </div>`;
}

function sendPacket(){
  if(!PRIV[S.member].earth){ toast(t('priv_blocked'),'warn'); return; }
  const mins=ENV[S.env].delayMin; packetTotal=Math.max(1,Math.round(mins*60)); packetLeft=2*packetTotal;
  clearInterval(packetTimer);
  toast(`${t('queued')} · ${ENV[S.env].delayTxt}`,'');
  const speed = mins>=1 ? 60 : 1; // 1 real second = 1 simulated minute
  let half=false;
  packetTimer=setInterval(()=>{
    packetLeft=Math.max(0,packetLeft-speed);
    if(!half && packetLeft<=packetTotal){ half=true; toast(`${t('delivered')} ${ENV[S.env].delayTxt}`,'ok'); }
    if(packetLeft<=0) clearInterval(packetTimer);
    renderPacket();
  },1000);
  renderPacket();
}
/* Light-time diagram: the packet travels to Earth, the reply travels back. */
function renderPacket(){
  const el=$('packet'); if(!el) return;
  const env=ENV[S.env], one=Math.max(1,Math.round(env.delayMin*60)), long=env.delayMin>=1;
  const ft=x=>{x=Math.max(0,Math.round(x)); return Math.floor(x/60)+':'+String(x%60).padStart(2,'0');};
  if(!el.querySelector('.lt')){
    el.innerHTML=`<div class="lt"><div class="lt-ends"><span>${t('lt_ship')}</span><span>${t('lt_earth')}</span></div>
      <div class="lt-line"><i class="lt-dot"></i></div></div>
      <dl class="kv-list"><div><dt>${t('lt_recv')}</dt><dd class="lt-recv"></dd></div><div><dt>${t('lt_reply')}</dt><dd class="lt-reply"></dd></div></dl>`;
  }
  const live=packetTotal>0, el2=live? 2*packetTotal-packetLeft : 0;
  const x= !live? 0 : el2<=packetTotal? el2/packetTotal : Math.max(0,1-(el2-packetTotal)/packetTotal);
  el.querySelector('.lt-line').classList.toggle('live', live && packetLeft>0);
  el.querySelector('.lt-dot').style.left=(x*100).toFixed(2)+'%';
  const cell=(left,tot)=> !live? (long? '+'+ft(tot) : (tot>one? '2 × ':'')+env.delayTxt) : left>0? `${t('lt_in')} ${long?ft(left):Math.ceil(left)+' s'}` : `✓ ${t('lt_done')}`;
  el.querySelector('.lt-recv').textContent=cell(packetTotal-el2, one);
  el.querySelector('.lt-reply').textContent=cell(2*packetTotal-el2, 2*one);
}

function renderHazards(){
  $('hazards').innerHTML = Object.keys(HAZ).map(h=>`<button class="hz" data-hz="${h}" aria-pressed="${S.hazard===h}">${HAZ[h][LANG]}</button>`).join('');
  $('hazards').querySelectorAll('.hz').forEach(b=>b.onclick=()=>{ S.hazard = S.hazard===b.dataset.hz? null : b.dataset.hz; renderHazards(); });
  $('hzNote').textContent = S.hazard? HAZ[S.hazard].note[LANG] : t('hz_note_default');
}

/* timeline */
const EVENTS=[[95,'w',{es:'Ejercicio ↓',en:'Exercise ↓'}],[139,'w',{es:'Infección',en:'Infection'}],[STORM_DAY,'b',{es:'Tormenta solar',en:'Solar storm'}]];
function renderTimelineMarks(){
  const tr=$('track'); tr.querySelectorAll('.evt').forEach(e=>e.remove());
  EVENTS.forEach(([d,c,l])=>{ const e=document.createElement('div'); e.className='evt '+c; e.style.left=((d-1)/(DAYS-1)*100)+'%'; e.textContent=l[LANG]; tr.appendChild(e); });
}
function renderTimeline(){ const pct=(S.day-1)/(DAYS-1)*100; $('knob').style.left=pct+'%'; $('railFill').style.width=pct+'%'; $('dayNum').textContent=S.day; $('day').value=S.day; }

function setDay(d,fromPlay){
  S.day=clamp(d,1,DAYS); S.EVAL=evaluate(S.day);
  renderTop(); renderVitals(); renderRight(); renderTimeline();
  if(actions.renderCrew) actions.renderCrew();
  if(S.day===STORM_DAY && S.stormShownFor!==STORM_DAY){ S.stormShownFor=STORM_DAY; if(fromPlay) stopPlay(); openStorm(); }
}
$('day').addEventListener('input',e=>setDay(+e.target.value,false));

let playTimer=null;
function stopPlay(){ clearInterval(playTimer); playTimer=null; $('playIco').innerHTML='<path d="M7 4l13 8-13 8z"/>'; }
$('play').onclick=()=>{ if(playTimer){ stopPlay(); return; } if(S.day>=DAYS) setDay(1); $('playIco').innerHTML='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'; playTimer=setInterval(()=>{ if(S.day>=DAYS){stopPlay();return;} setDay(S.day+1,true); },650); };

/* solar storm */
let stormTimer=null, stormLeft=600, stormDone=new Set();
function openStorm(){
  stormDone=new Set(); stormLeft=600; $('stormMsg').textContent=`${t('storm_earth')} ${ENV[S.env].delayTxt}.`;
  renderStormSteps(); $('storm').classList.add('on');
  clearInterval(stormTimer); stormTimer=setInterval(()=>{ stormLeft=Math.max(0,stormLeft-6); $('stormCount').textContent=`${Math.floor(stormLeft/60)}:${String(stormLeft%60).padStart(2,'0')}`; },100);
}
function renderStormSteps(){
  $('stormSteps').innerHTML=['s1','s2','s3','s4'].map(k=>`<button class="check" data-k="${k}" aria-pressed="${stormDone.has(k)}"><span class="box">${stormDone.has(k)?'✓':''}</span>${t(k)}</button>`).join('');
  $('stormSteps').querySelectorAll('.check').forEach(b=>b.onclick=()=>{ stormDone.add(b.dataset.k); renderStormSteps(); if(stormDone.size===4){ S.sheltered=true; $('stormMsg').innerHTML=`<span style="color:var(--ok)">✓ ${t('storm_ok')}</span>`; clearInterval(stormTimer); setTimeout(()=>{ $('storm').classList.remove('on'); toast(t('storm_ok'),'ok'); setDay(S.day); },1400); } });
}

/* check-in */
const FACES=[ 'M8 16c1.2-1.6 2.6-2.4 4-2.4s2.8.8 4 2.4','M8.5 15.5c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2','M8.5 15h7','M8.5 14.5c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3','M8 14c1.2 1.8 2.6 2.6 4 2.6s2.8-.8 4-2.6' ];
let ci={mood:4,water:5,symptoms:new Set()};
function openCheckin(){
  const d=S.day; ci={mood:Math.round(val(d,'mood')),water:Math.round(val(d,'water')/0.5),symptoms:new Set(val(d,'symptoms')||[])};
  $('ciSleep').value=val(d,'sleep'); $('sleepOut').textContent=(+$('ciSleep').value).toFixed(1)+' h';
  renderCheckin(); $('checkin').classList.add('on'); setTimeout(()=>$('moods').querySelector('button')?.focus(),50);
}
function renderCheckin(){
  $('moods').innerHTML=FACES.map((p,i)=>`<button type="button" aria-label="${i+1}/5" aria-pressed="${ci.mood===i+1}" data-m="${i+1}"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="${p}"/></svg></button>`).join('');
  $('moods').querySelectorAll('button').forEach(b=>b.onclick=()=>{ci.mood=+b.dataset.m;renderCheckin();});
  $('wOut').textContent=`${ci.water} · ${(ci.water*0.5).toFixed(1)} L`;
  const SY=['fatigue','throat','chills','headache','nausea','skin','vision'];
  $('symp').innerHTML=SY.map(s=>`<button type="button" data-s="${s}" aria-pressed="${ci.symptoms.has(s)}">${t('sym_'+s)}</button>`).join('');
  $('symp').querySelectorAll('button').forEach(b=>b.onclick=()=>{ const s=b.dataset.s; ci.symptoms.has(s)?ci.symptoms.delete(s):ci.symptoms.add(s); renderCheckin(); });
}
$('openCheckin').onclick=openCheckin;
$('ciCancel').onclick=()=>$('checkin').classList.remove('on');
$('ciSleep').oninput=e=>$('sleepOut').textContent=(+e.target.value).toFixed(1)+' h';
$('wMinus').onclick=()=>{ci.water=Math.max(0,ci.water-1);renderCheckin();};
$('wPlus').onclick=()=>{ci.water=Math.min(10,ci.water+1);renderCheckin();};
$('ciForm').onsubmit=e=>{ e.preventDefault();
  S.overrides[S.day]={mood:ci.mood, sleep:+$('ciSleep').value, water:+(ci.water*0.5).toFixed(1), symptoms:[...ci.symptoms]};
  S.streak++; $('checkin').classList.remove('on'); toast(`${t('ci_done')} ${S.streak}`,'ok'); setDay(S.day);
};
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ $('checkin').classList.remove('on'); if(S.selected) selectOrgan(null); } });

/* toasts */
function toast(msg,kind){ const el=document.createElement('div'); el.className='toast '+(kind||''); el.textContent=msg; $('toasts').appendChild(el); setTimeout(()=>{el.style.transition='opacity .4s';el.style.opacity='0';setTimeout(()=>el.remove(),400);},4600); }

/* environment + language */
document.querySelectorAll('[data-env]').forEach(b=>b.onclick=()=>{
  S.env=b.dataset.env; document.querySelectorAll('[data-env]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  if(S.env==='mars') toast(t('gravity_protocol'),'warn');
  packetTotal=0; clearInterval(packetTimer); setDay(S.day);
});
function applyLang(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el=>el.innerHTML=t(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>el.placeholder=t(el.dataset.i18nPh));
  renderHazards(); renderTimelineMarks(); if(S.EVAL){ S.EVAL=evaluate(S.day); renderTop(); renderVitals(); renderRight(); }
  if(actions.renderCrew) actions.renderCrew();
}
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{ setLang(b.dataset.lang); document.querySelectorAll('[data-lang]').forEach(x=>x.setAttribute('aria-pressed',x===b)); applyLang(); });

/* boot */
/* Cinematic intro (~3.5 s): title letter by letter, the hook, a systems check, a scan line, then the console
   assembles (panels stagger in, the 3D body builds bottom-up via S.bootEnd). Skippable; once per session; off with reduced motion. */
function boot(){
  const el=$('boot'), body=document.body, timers=[];
  let seen=false; try{ seen=sessionStorage.getItem('heart-boot')==='1'; }catch(e){}
  let done=false;
  const finish=()=>{
    if(done) return; done=true; timers.forEach(clearTimeout);
    el.classList.add('done'); S.bootEnd=performance.now();
    body.classList.remove('intro'); body.classList.add('booted');
    try{ sessionStorage.setItem('heart-boot','1'); }catch(e){}
    document.removeEventListener('keydown',finish);
  };
  if(REDUCED||seen){ el.classList.add('done'); S.bootEnd=0; return; }
  body.classList.add('intro');
  $('skipBoot').onclick=finish; el.addEventListener('click',finish); document.addEventListener('keydown',finish);
  const sys=t('boot_sys'), list=$('bootSys');
  list.innerHTML=sys.map(s=>`<li><span>${s}</span><b></b></li>`).join('');
  sys.forEach((_,i)=>timers.push(setTimeout(()=>{ const li=list.children[i]; li.classList.add('on'); li.querySelector('b').textContent=t('boot_ok'); },1500+i*280)));
  requestAnimationFrame(()=>requestAnimationFrame(()=>$('bootBar').style.width='100%'));
  timers.push(setTimeout(finish,3600));
}

/* init */
actions.renderRight=renderRight; actions.renderHazards=renderHazards; actions.refresh=()=>setDay(S.day); actions.setDay=d=>setDay(d,false); actions.selectOrgan=selectOrgan; actions.closeStorm=()=>{ clearInterval(stormTimer); $('storm').classList.remove('on'); }; actions.toast=toast; actions.sendPacket=()=>{ const b=$('sendPacket'); if(b) b.click(); };
applyLang(); buildVitals(); resize(); setDay(S.day); boot(); requestAnimationFrame(frame);
