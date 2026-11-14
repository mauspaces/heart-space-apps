/* ECG sweep at the current heart rate. */
import { stColor } from '../core/util.js';
import { S } from '../core/state.js';

let ecgCv=null, ecgCtx=null, ecgBuf=[], ecgX=0, ecgPhase=0, ecgLast=0;
const g=(x,m,s)=>Math.exp(-((x-m)**2)/(2*s*s));
function ecgWave(p){ return 0.12*g(p,0.18,0.025)-0.14*g(p,0.30,0.008)+1.0*g(p,0.33,0.011)-0.28*g(p,0.36,0.01)+0.32*g(p,0.6,0.04); }
export function drawECG(ts){
  if(!ecgCv) return; const w=ecgCv.clientWidth, h=ecgCv.clientHeight; if(!w) return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  if(ecgCv.width!==Math.round(w*dpr)){ ecgCv.width=Math.round(w*dpr); ecgCv.height=Math.round(h*dpr); ecgBuf=new Array(Math.round(w)).fill(null); ecgX=0; }
  ecgCtx.setTransform(dpr,0,0,dpr,0,0);
  const dt=Math.min(60,ts-(ecgLast||ts)); ecgLast=ts;
  const hr=S.EVAL?S.EVAL.M.hr.v:62; const px=dt*0.11;
  for(let i=0;i<px;i++){ ecgPhase=(ecgPhase+(hr/60)/(0.11*1000))%1; ecgBuf[Math.floor(ecgX)%ecgBuf.length]=ecgWave(ecgPhase); ecgX=(ecgX+1)%ecgBuf.length; for(let j=1;j<10;j++) ecgBuf[(Math.floor(ecgX)+j)%ecgBuf.length]=null; }
  ecgCtx.clearRect(0,0,w,h);
  const _s=(S.EVAL?S.EVAL.M.hr.s:0), c=_s?stColor(_s):'#0c0c0c';
  ecgCtx.strokeStyle=c; ecgCtx.lineWidth=1.2; ecgCtx.shadowColor=c; ecgCtx.shadowBlur=0; ecgCtx.beginPath(); let pen=false;
  for(let x=0;x<ecgBuf.length;x++){ const v=ecgBuf[x]; if(v===null){pen=false;continue;} const y=h*0.68-v*h*0.55; if(!pen){ecgCtx.moveTo(x,y);pen=true;} else ecgCtx.lineTo(x,y); }
  ecgCtx.stroke(); ecgCtx.shadowBlur=0;
  const hx=Math.floor(ecgX-1+ecgBuf.length)%ecgBuf.length; const hv=ecgBuf[hx]; if(hv!==null&&hv!==undefined){ ecgCtx.fillStyle=c; ecgCtx.beginPath(); ecgCtx.arc(hx,h*0.68-hv*h*0.55,2.2,0,Math.PI*2); ecgCtx.fill(); }
}
export function attachECG(canvas){ ecgCv=canvas; ecgCtx=canvas.getContext('2d'); canvas.width=0; }
