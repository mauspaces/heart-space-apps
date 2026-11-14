/* Alert engine: status vs personal baseline + combined patterns + EVA readiness.
   Illustrative thresholds — not for clinical use. */
import { clamp } from './util.js';
import { LANG, t } from './i18n.js';
import { ORG } from './catalog.js';
import { STORM_DAY } from './sim.js';
import { S, val, BASE, avg, cumDose } from './state.js';

export function evaluate(d){
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
  M.vestibular={v:S.env==='mars'?(LANG==='es'?'Inestable':'Unsteady'):(LANG==='es'?'Estable':'Steady'),s:S.env==='mars'?1:0,b:null};
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
  if(S.env==='mars') P.push({id:'grav',s:1,title:t('pat_grav'),desc:t('pat_grav_d'),act:t('pat_grav_a'),organ:'ear'});
  P.sort((a,b)=>b.s-a.s);

  const O={};
  for(const id in ORG){ O[id]=Math.max(0,...ORG[id].metrics.map(k=>M[k].s)); }
  P.forEach(p=>{ O[p.organ]=Math.max(O[p.organ],p.s); });

  // readiness for EVA
  const keys=[['sleep','f_sleep'],['hrv','f_hrv'],['temp','f_temp'],['mood','f_mood'],['vestibular','f_bal'],['symptoms','f_sym'],['spo2','f_spo2'],['hr','f_hr']];
  let score=100; const factors=[];
  keys.forEach(([k,lab])=>{ const s=M[k].s; if(s){ score-= s===2?30:12; factors.push({k,lab:t(lab),s}); } });
  if(storm && !S.sheltered){score-=40;}
  score=clamp(score,0,100);
  return {M,P,O,score,factors,dose};
}
