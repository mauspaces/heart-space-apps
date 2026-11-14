/* Deterministic simulated mission data (days 1–180). Nothing here is real astronaut data. */
import { mulberry32, bump, clamp, r1 } from './util.js';

export const DAYS = 180, STORM_DAY = 151, PRIOR_DOSE = 40, DOSE_LIMIT = 600;

const RND = mulberry32(142);
function gn(){let u=0,v=0;while(!u)u=RND();while(!v)v=RND();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}

export const DATA=[null];
for(let d=1;d<=DAYS;d++){
  const inf = (d>=134&&d<=150)? bump(d,142,3.2):0;
  const q3 = bump(d,105,14);
  const exDrop = (d>=92&&d<=118)?1:0;
  const dry = (d>=126&&d<=131)?1:0;
  const syms=[]; if(inf>0.45){syms.push('fatigue','throat')} if(inf>0.8) syms.push('chills');
  DATA.push({
    hr: Math.round(61+0.01*d+q3*2+inf*10+gn()*1.5),
    hrv: Math.round(58-0.02*d-q3*4-inf*19+gn()*2.5),
    sbp: Math.round(117+0.01*d+q3*3+inf*4+gn()*2.5),
    dbp: Math.round(75+q3*2+inf*2+gn()*1.8),
    spo2: Math.round(clamp(98-inf*2+gn()*0.45,92,100)),
    temp: r1(36.55+0.0012*d+inf*1.4+gn()*0.07),
    sleep: r1(clamp(7.1-0.003*d-q3*0.6-inf*1.7+gn()*0.3,3,10)),
    glucose: Math.round(87+exDrop*13+q3*3+inf*6+gn()*2.5),
    mood: r1(clamp(4.2-q3*1.2-inf*1.6+gn()*0.25,1,5)),
    water: r1(clamp(2.55-inf*0.5-dry*0.8+gn()*0.12,0.5,4)),
    ex: Math.round(clamp(93-exDrop*25+gn()*4-inf*35,0,100)),
    symptoms: syms,
    dayDose: 1.8*(1+gn()*0.04),
  });
}
