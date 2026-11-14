/* Shared helpers. */
export const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const bump=(d,c,w)=>Math.exp(-((d-c)**2)/(2*w*w));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const r1=v=>Math.round(v*10)/10;
export const $ = id => document.getElementById(id);

/* Status colours (0 normal · 1 review · 2 alert). Status is never colour-only: see shapes in the UI. */
export const COL={ok:'#3CF0A8',warn:'#F5B841',bad:'#FF4D5E',holo:'91,214,255'};
export const stColor=s=>s===2?COL.bad:s===1?COL.warn:COL.ok;
export function hexA(h,a){ const n=parseInt(h.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a.toFixed(3)})`; }
