/* App state, personal baseline (days 1–14) and data accessors. */
import { DATA, PRIOR_DOSE, STORM_DAY } from './sim.js';

/* Late-bound UI callbacks so renderers do not import each other. */
export const actions = {};

export const S = { day:142, env:'transit', sheltered:false, stormShownFor:-1, overrides:{}, streak:11, selected:null, hazard:null };
export const val = (d,k) => { const o=S.overrides[d]; return (o && o[k]!==undefined)? o[k] : DATA[d][k]; };
export const cumDose = d => { let s=PRIOR_DOSE; for(let i=1;i<=d;i++){ s+=DATA[i].dayDose; if(i===STORM_DAY) s += S.sheltered?12:42; } return s; };
S.EVAL = null;

/* ---------- baseline (days 1–14) ---------- */
export const BASE={};
['hr','hrv','sbp','dbp','spo2','temp','sleep','glucose','mood','water','ex'].forEach(k=>{
  const xs=[]; for(let d=1;d<=14;d++) xs.push(DATA[d][k]);
  const m=xs.reduce((a,b)=>a+b,0)/xs.length; const sd=Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0)/xs.length);
  BASE[k]={m,sd:Math.max(sd,0.01)};
});
export const avg=(d,k,n)=>{let s=0,c=0;for(let i=Math.max(1,d-n+1);i<=d;i++){s+=val(i,k);c++}return s/c};
