/* App state, personal baseline (days 1–14) and data accessors — all work for any crew member. */
import { SIM, PRIOR_DOSE, STORM_DAY } from './sim.js';
import { CREW, CREW_BY_ID } from './crew.js';

/* Late-bound UI callbacks so renderers do not import each other. */
export const actions = {};

const OVR = Object.fromEntries(CREW.map(m=>[m.id,{}]));
export const S = { day:142, member:'cdr', env:'transit', sheltered:false, stormShownFor:-1, overrides:OVR.cdr, streak:11, selected:null, hazard:null };
S.EVAL = null;
/* Switch the active astronaut (caller re-renders, e.g. via setDay). */
export function setMember(id){ if(!CREW_BY_ID[id]) return; S.member=id; S.overrides=OVR[id]; }

export const val = (d,k,id=S.member) => { const o=OVR[id][d]; return (o && o[k]!==undefined)? o[k] : SIM[id][d][k]; };
export const cumDose = (d,id=S.member) => { let s=PRIOR_DOSE; for(let i=1;i<=d;i++){ s+=SIM[id][i].dayDose; if(i===STORM_DAY) s += S.sheltered?12:42; } return s; };

/* ---------- baseline (days 1–14) ---------- */
const KEYS=['hr','hrv','sbp','dbp','spo2','temp','sleep','glucose','mood','water','ex'];
const BASES={};
export function baseOf(id){
  if(BASES[id]) return BASES[id];
  const B={};
  KEYS.forEach(k=>{
    const xs=[]; for(let d=1;d<=14;d++) xs.push(SIM[id][d][k]);
    const m=xs.reduce((a,b)=>a+b,0)/xs.length; const sd=Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0)/xs.length);
    B[k]={m,sd:Math.max(sd,0.01)};
  });
  return (BASES[id]=B);
}
/* BASE = active member's baseline (live view). */
export const BASE = new Proxy({}, { get:(_,k)=>baseOf(S.member)[k], ownKeys:()=>KEYS, getOwnPropertyDescriptor:(_,k)=>({enumerable:true,configurable:true,value:baseOf(S.member)[k]}) });
export const avg=(d,k,n,id=S.member)=>{let s=0,c=0;for(let i=Math.max(1,d-n+1);i<=d;i++){s+=val(i,k,id);c++}return s/c};
