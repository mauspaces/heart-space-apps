/* Deterministic simulated mission data (days 1–180), one series per crew member.
   Nothing here is real astronaut data. */
import { mulberry32, bump, clamp, r1 } from './util.js';
import { CREW } from './crew.js';

export const DAYS = 180, STORM_DAY = 151, PRIOR_DOSE = 40, DOSE_LIMIT = 600;

function generate(m){
  const RND = mulberry32(m.seed);
  const gn = ()=>{let u=0,v=0;while(!u)u=RND();while(!v)v=RND();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  const g=m.gen, o=k=>g.off[k]||0, q=g.q3;
  const data=[null];
  for(let d=1;d<=DAYS;d++){
    const inf = (g.inf && d>=g.inf.from && d<=g.inf.to)? bump(d,g.inf.c,g.inf.w)*g.inf.amp:0;
    const q3 = q? bump(d,q.c,q.w):0, qs=q?q.sleep:0, qm=q?q.mood:0;
    const exDrop = (g.exDrop && d>=g.exDrop[0] && d<=g.exDrop[1])?1:0;
    const dry = (g.dry && d>=g.dry[0] && d<=g.dry[1])?1:0;
    const syms=[]; if(inf>0.45){syms.push('fatigue','throat')} if(inf>0.8) syms.push('chills');
    data.push({
      hr: Math.round(61+o('hr')+0.01*d+q3*2+inf*10+gn()*1.5),
      hrv: Math.round(58+o('hrv')-0.02*d-q3*4-inf*19+gn()*2.5),
      sbp: Math.round(117+o('sbp')+0.01*d+q3*3+inf*4+gn()*2.5),
      dbp: Math.round(75+o('dbp')+q3*2+inf*2+gn()*1.8),
      spo2: Math.round(clamp(98-inf*2+gn()*0.45,92,100)),
      temp: r1(36.55+o('temp')+0.0012*d+inf*1.4+gn()*0.07),
      sleep: r1(clamp(7.1+o('sleep')-0.003*d-q3*qs-inf*1.7+gn()*0.3,3,10)),
      glucose: Math.round(87+o('glucose')+exDrop*13+q3*3+inf*6+gn()*2.5),
      mood: r1(clamp(4.2+o('mood')-q3*qm-inf*1.6+gn()*0.25,1,5)),
      water: r1(clamp(2.55+o('water')-inf*0.5-dry*0.8+gn()*0.12,0.5,4)),
      ex: Math.round(clamp(93+o('ex')-exDrop*25+gn()*4-inf*35,0,100)),
      symptoms: syms,
      dayDose: 1.8*(1+gn()*0.04),
    });
  }
  return data;
}

/* SIM[id] = array indexed by day (index 0 unused). */
export const SIM = Object.fromEntries(CREW.map(m=>[m.id, generate(m)]));
