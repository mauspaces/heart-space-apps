/* Alert engine: status vs personal baseline + combined patterns + EVA readiness.
   Illustrative thresholds — not for clinical use. */
import { clamp } from './util.js';
import { LANG, t } from './i18n.js';
import { ORG, SYS, mName } from './catalog.js';
import { STORM_DAY } from './sim.js';
import { S, val as valOf, baseOf, avg as avgOf, cumDose as cumDoseOf } from './state.js';
import { CREW, CREW_BY_ID } from './crew.js';

/* Fever-with-infectious-pattern test (same rule as the 'fever' pattern below), usable for any member. */
export function feverNow(d,id){
  const val=(dd,k)=>valOf(dd,k,id), avg=(dd,k,n)=>avgOf(dd,k,n,id), B=baseOf(id);
  const hrv3=avg(d,'hrv',3), hrvS=hrv3<B.hrv.m*0.7?2:hrv3<B.hrv.m*0.85?1:0;
  const tp=val(d,'temp');
  return hrvS>=1 && avg(d,'sleep',3)<B.sleep.m-0.9 && tp>=B.temp.m+0.45 && tp>=38.0;
}
export const feverMembers=d=>CREW.filter(m=>feverNow(d,m.id));

export function evaluate(d,id=S.member){
  const val=(dd,k)=>valOf(dd,k,id), avg=(dd,k,n)=>avgOf(dd,k,n,id), cumDose=dd=>cumDoseOf(dd,id), BASE=baseOf(id);
  const mars=S.env==='mars', vest2=mars&&CREW_BY_ID[id].gen.marsVest;
  const M={};
  const hr=val(d,'hr'); M.hr={v:hr,s: hr>120?2: hr>BASE.hr.m*1.15?1:0, b:BASE.hr.m};
  const hrv3=avg(d,'hrv',3); M.hrv={v:val(d,'hrv'),s: hrv3<BASE.hrv.m*0.7?2: hrv3<BASE.hrv.m*0.85?1:0, b:BASE.hrv.m};
  const sbp=val(d,'sbp'), dbp=val(d,'dbp'); M.bp={v:`${sbp}/${dbp}`,raw:sbp,s:(sbp>=160||dbp>=100)?2:(sbp>=130||dbp>=80||sbp<90)?1:0,b:`${Math.round(BASE.sbp.m)}/${Math.round(BASE.dbp.m)}`};
  const sp=val(d,'spo2'); M.spo2={v:sp,s:sp<90?2:sp<95?1:0,b:BASE.spo2.m};
  const tp=val(d,'temp'); M.temp={v:tp,s:tp>=38.5?2: tp>=BASE.temp.m+0.8?1:0,b:BASE.temp.m};
  const sl=[val(d,'sleep'),val(Math.max(1,d-1),'sleep'),val(Math.max(1,d-2),'sleep')];
  M.sleep={v:sl[0],s:(sl.every(x=>x<5))?2:(sl[0]<6&&sl[1]<6)?1:0,b:BASE.sleep.m};
  const gl=val(d,'glucose'); M.glucose={v:gl,s:(gl<70||gl>250)?2:gl>=100?1:0,b:BASE.glucose.m};
  const md5=avg(d,'mood',5); M.mood={v:val(d,'mood'),s:md5<=1.6?2:md5<=2.9?1:0,b:BASE.mood.m};
  const w2=[val(d,'water'),val(Math.max(1,d-1),'water')]; M.water={v:w2[0],s:(w2[0]<2&&w2[1]<2)?1:0,b:BASE.water.m};
  const ex7=avg(d,'ex',7); M.exercise={v:Math.round(ex7),s:ex7<60?2:ex7<80?1:0,b:BASE.ex.m};
  const dose=cumDose(d); const storm=(d===STORM_DAY);
  M.dose={v:Math.round(dose),s: storm&&!S.sheltered?2: storm?1: 0, b:null};
  M.vestibular={v:S.env==='mars'?(LANG==='es'?'Inestable':'Unsteady'):(LANG==='es'?'Estable':'Steady'),s:vest2?2:mars?1:0,b:null};
  M.vision={v:"20/20",s:0,b:"20/20"};
  const sy=val(d,'symptoms')||[]; M.symptoms={v:sy.length?sy.map(x=>t('sym_'+x)).join(', '):t('none'),s:sy.includes('chills')?1:sy.length?1:0,b:null,list:sy};

  // combined patterns
  const P=[];
  const sleep3=avg(d,'sleep',3);
  if(M.hrv.s>=1 && sleep3<BASE.sleep.m-0.9 && tp>=BASE.temp.m+0.45){
    if(tp>=38.0) P.push({id:'fever',s:2,title:t('pat_fever'),desc:t('pat_inf_d'),act:t('pat_fever_a'),organ:'immune'});
    else P.push({id:'inf',s:1,title:t('pat_inf'),desc:t('pat_inf_d'),act:t('pat_inf_a'),organ:'immune'});
  }
  if(sleep3<6 && md5<3.3) P.push({id:'ops',s:1,title:t('pat_ops'),desc:t('pat_ops_d'),act:t('pat_ops_a'),organ:'brain'});
  if(ex7<80 && M.glucose.s>=1) P.push({id:'met',s:1,title:t('pat_met'),desc:t('pat_met_d'),act:t('pat_met_a'),organ:'metabolic'});
  if(M.water.s>=1) P.push({id:'hyd',s:1,title:t('pat_hyd'),desc:t('pat_hyd_d'),act:t('pat_hyd_a'),organ:'kidneys'});
  if(storm) P.push({id:'spe',s:S.sheltered?1:2,title:t('pat_spe'),desc:t('pat_spe_d'),act:t('pat_spe_a'),organ:'dosimeter'});
  const sick=feverMembers(d).filter(m=>m.id!==id);
  if(sick.length) P.push({id:'contagion',s:1,title:t('pat_cont'),desc:t('pat_cont_d').replace('{n}',sick.map(m=>m.name).join(', ')),act:t('pat_cont_a'),organ:'immune'});
  if(S.env==='mars') P.push({id:'grav',s:1,title:t('pat_grav'),desc:t('pat_grav_d'),act:t('pat_grav_a'),organ:'ear'});
  // evidence: every alert shows the numbers behind it, against the astronaut's own baseline
  const sg=x=>(x>0?'+':x<0?'−':'')+String(Math.abs(x));
  const pc=(v,b)=>sg(Math.round((v/b-1)*100))+'%';
  const df=(v,b,d,u)=>sg(+(v-b).toFixed(d))+' '+u;
  const vb=' '+t('vs_base');
  const EV={
    inf:[`${mName('hrv')} ${hrv3.toFixed(0)} ms · ${pc(hrv3,BASE.hrv.m)}${vb}`,`${mName('sleep')} ${sleep3.toFixed(1)} h · ${df(sleep3,BASE.sleep.m,1,'h')}${vb}`,`${mName('temp')} ${tp.toFixed(1)} °C · ${df(tp,BASE.temp.m,1,'°C')}${vb}`],
    ops:[`${mName('sleep')} ${sleep3.toFixed(1)} h · ${t('ev_3n')}`,`${mName('mood')} ${md5.toFixed(1)} / 5 · ${t('ev_5d')}`],
    met:[`${mName('exercise')} ${Math.round(ex7)}%`,`${mName('glucose')} ${gl} mg/dL · ${df(gl,BASE.glucose.m,0,'mg/dL')}${vb}`],
    hyd:[`${mName('water')} ${w2[0].toFixed(1)} L · ${w2[1].toFixed(1)} L · ${t('ev_2d')}`],
    spe:[t('ev_spe')], grav:[t('ev_grav')],
  };
  EV.fever=EV.inf;
  P.forEach(p=>{ p.ev=p.ev||EV[p.id]||[]; p.esc=p.s===2?'earth':'crew'; });
  P.sort((a,b)=>b.s-a.s);

  const O={};
  for(const id in ORG){ O[id]=Math.max(0,...ORG[id].metrics.map(k=>M[k].s)); }
  P.forEach(p=>{ O[p.organ]=Math.max(O[p.organ],p.s); });
  // the five physiological systems: worst organ wins
  const Y={}; for(const k in SYS){ Y[k]=Math.max(0,...SYS[k].organs.map(o=>O[o])); }

  // readiness for EVA
  const keys=[['sleep','f_sleep'],['hrv','f_hrv'],['temp','f_temp'],['mood','f_mood'],['vestibular','f_bal'],['symptoms','f_sym'],['spo2','f_spo2'],['hr','f_hr']];
  let score=100; const factors=[];
  keys.forEach(([k,lab])=>{ const s=M[k].s; if(s){ score-= s===2?30:12; factors.push({k,lab:t(lab),s}); } });
  if(storm && !S.sheltered){score-=40;}
  score=clamp(score,0,100);
  // EVA GO / NO-GO poll: each criterion reports GO (0), HOLD (1, needs the Crew Medical Officer) or NO-GO (2)
  const POLL=[['hr','f_hr'],['hrv','f_hrv'],['temp','f_temp'],['spo2','f_spo2'],['sleep','f_sleep'],['mood','f_mood'],['vestibular','f_bal'],['symptoms','f_sym'],['dose','f_rad']];
  const poll=POLL.map(([k,lab])=>({k,lab:t(lab),s:M[k].s}));
  const verdict=Math.max(0,...poll.map(p=>p.s));
  return {M,P,O,Y,score,factors,dose,poll,verdict};
}
