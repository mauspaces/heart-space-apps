/* Hologram renderer — Canvas 2D point cloud, no external models.
   Kept as the fallback when WebGL is unavailable. */
import { REDUCED, mulberry32, clamp, COL, stColor, hexA } from '../core/util.js';
import { LANG, t } from '../core/i18n.js';
import { HAZ, ORG } from '../core/catalog.js';
import { S, actions } from '../core/state.js';
import { drawECG } from '../ui/ecg.js';

const BODY=[]; // x,y,z,kind (0 skin, 1 skeleton)
function prof(P,y){ if(y<=P[0][0]) return P[0][1]; for(let i=1;i<P.length;i++){ if(y<=P[i][0]){const [y0,v0]=P[i-1],[y1,v1]=P[i]; return v0+(v1-v0)*(y-y0)/(y1-y0);} } return P[P.length-1][1]; }
function ring(cx,y,cz,rx,rz,n,kind=0){ const off=(y*53.7)%1; for(let i=0;i<n;i++){const a=(i+off)/n*Math.PI*2; BODY.push(cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz,kind);} }
function ellipsoidSlices(cx,cy,cz,rx,ry,rz,step,dens){ for(let y=cy-ry+step/2;y<=cy+ry;y+=step){const k=1-((y-cy)/ry)**2; if(k<=0)continue; const s=Math.sqrt(k); ring(cx,y,cz,rx*s,rz*s,Math.max(8,Math.round(dens*s)));} }
function limb(A,B,ra,rb){ const dx=B[0]-A[0],dy=B[1]-A[1],dz=B[2]-A[2],L=Math.hypot(dx,dy,dz),n=Math.max(2,Math.round(L/0.016)); for(let i=0;i<=n;i++){const u=i/n,r=ra+(rb-ra)*u; ring(A[0]+dx*u,A[1]+dy*u,A[2]+dz*u,r,r*0.92,Math.max(10,Math.round(r*300)));} }
function bone(A,B,step=0.006){ const dx=B[0]-A[0],dy=B[1]-A[1],dz=B[2]-A[2],L=Math.hypot(dx,dy,dz),n=Math.round(L/step); for(let i=0;i<=n;i++){const u=i/n; BODY.push(A[0]+dx*u,A[1]+dy*u,A[2]+dz*u,1);} }
(function buildBody(){
  const RX=[[0.9,.17],[0.97,.185],[1.04,.165],[1.1,.148],[1.2,.16],[1.3,.188],[1.38,.2],[1.43,.19],[1.46,.15],[1.485,.08]];
  const RZ=[[0.9,.11],[1.0,.118],[1.1,.1],[1.22,.112],[1.32,.125],[1.42,.11],[1.46,.09],[1.485,.06]];
  for(let y=0.9;y<=1.485;y+=0.013){const rx=prof(RX,y),rz=prof(RZ,y); ring(0,y,0,rx,rz,Math.round(58*rx/0.19)+14);}
  for(let y=1.49;y<=1.54;y+=0.013) ring(0,y,0.005,.05,.048,22);
  ellipsoidSlices(0,1.635,0.012,.09,.125,.105,0.012,46);
  for(const sx of [1,-1]){
    ellipsoidSlices(sx*0.2,1.41,0,.065,.065,.06,0.014,26);
    limb([sx*0.215,1.4,0],[sx*0.255,1.13,0],.047,.04);
    limb([sx*0.255,1.13,0],[sx*0.285,0.88,0.05],.038,.03);
    ellipsoidSlices(sx*0.29,0.8,0.06,.03,.065,.022,0.014,16);
    limb([sx*0.09,0.92,0],[sx*0.1,0.5,0.01],.08,.057);
    limb([sx*0.1,0.5,0.01],[sx*0.1,0.1,0],.055,.037);
    ellipsoidSlices(sx*0.1,0.04,0.05,.045,.04,.11,0.012,26);
    bone([sx*0.09,0.9,0],[sx*0.1,0.52,0.01]); bone([sx*0.1,0.48,0.01],[sx*0.1,0.12,0]);
    bone([sx*0.215,1.39,0],[sx*0.25,1.14,0]); bone([sx*0.25,1.12,0],[sx*0.28,0.9,0.045]);
    bone([0,1.44,0.03],[sx*0.19,1.43,0.0]); // clavicles
  }
  bone([0,0.95,-0.07],[0,1.5,-0.03],0.005); // spine
  for(let y=1.18;y<=1.4;y+=0.04){ for(const sx of [1,-1]){ for(let a=0;a<=1;a+=0.08){ const ang=-Math.PI/2+a*Math.PI; BODY.push(sx*Math.cos(ang)*0.15*(1-(1.4-y)*0.8), y-a*0.03, Math.sin(ang)*0.1+0.0,1); } } } // ribs
})();

const CLOUD={};
const R2=mulberry32(7);
function blob(id,cx,cy,cz,rx,ry,rz,n){ const a=CLOUD[id]||(CLOUD[id]=[]); for(let i=0;i<n;i++){ let x,y,z; do{x=R2()*2-1;y=R2()*2-1;z=R2()*2-1}while(x*x+y*y+z*z>1); a.push(cx+x*rx,cy+y*ry,cz+z*rz);} }
blob('brain',0,1.665,0.008,.074,.064,.086,320);
blob('eyes',0.032,1.64,0.09,.015,.012,.012,40); blob('eyes',-0.032,1.64,0.09,.015,.012,.012,40);
blob('ear',0.086,1.625,0,.013,.016,.013,40);
blob('heart',0.035,1.3,0.05,.045,.055,.04,260);
blob('lungs',0.09,1.335,0,.066,.11,.065,240); blob('lungs',-0.09,1.335,0,.066,.11,.065,240);
blob('immune',0,1.4,0.06,.025,.03,.015,60); blob('immune',0.09,1.15,-0.02,.03,.035,.025,70); blob('immune',0.05,1.5,0.03,.012,.012,.012,20); blob('immune',-0.05,1.5,0.03,.012,.012,.012,20);
blob('metabolic',-0.07,1.17,0.03,.085,.045,.06,260);
blob('kidneys',0.07,1.07,-0.06,.022,.04,.018,90); blob('kidneys',-0.07,1.07,-0.06,.022,.04,.018,90);
(function(){ const a=CLOUD.musculo=[]; for(const sx of [1,-1]){ for(let i=0;i<=120;i++){const u=i/120; a.push(sx*(0.09+0.01*u)+ (R2()-.5)*0.012, 0.9-0.38*u, 0.01*u+(R2()-.5)*0.012);} for(let i=0;i<=110;i++){const u=i/110; a.push(sx*0.1+(R2()-.5)*0.01, 0.48-0.36*u, 0.01-0.01*u+(R2()-.5)*0.01);} } })();
(function(){ const a=CLOUD.dosimeter=[]; for(let i=0;i<14;i++)for(let j=0;j<18;j++) a.push(-0.125+i*0.002,1.405+j*0.002,0.125); })();

const cv=document.getElementById('holo'), ctx=cv.getContext('2d');
let W=0,H=0;
export function resize(){ const r=cv.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1); W=r.width; H=r.height; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
window.addEventListener('resize',resize);

const V={yaw:0.5,pitch:-0.06,zoom:1,cx:0,cy:0.9}, T={...V};
let autoRot=!REDUCED, dragging=false, dragMoved=false, lastInteract=0, hovered=null, scan=0, lastTs=0;
let cyw=1,syw=0,cp=1,sp=0,SC=1;
function prep(){ cyw=Math.cos(V.yaw); syw=Math.sin(V.yaw); cp=Math.cos(V.pitch); sp=Math.sin(V.pitch); SC=H*0.43*V.zoom; }
function P3(x,y,z){ const X=x*cyw+z*syw, Z=-x*syw+z*cyw, Yc=y-V.cy; const Y2=Yc*cp-Z*sp, Z2=Yc*sp+Z*cp; const f=1/(1-Z2*0.22); return [W/2+(X-V.cx)*SC*f, H*0.47-Y2*SC*f, Z2, f]; }

function organState(id){ return S.EVAL? S.EVAL.O[id]:0; }
function hzAffected(id){ return !S.hazard || HAZ[S.hazard].organs.includes(id); }

function drawFloor(){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const [r,a,dash] of [[0.42,.35,false],[0.6,.18,true]]){
    ctx.beginPath();
    for(let i=0;i<=96;i++){const ang=i/96*Math.PI*2; const p=P3(Math.cos(ang)*r,0,Math.sin(ang)*r); i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}
    ctx.strokeStyle=`rgba(${COL.holo},${a})`; ctx.lineWidth=1.2; ctx.setLineDash(dash?[3,6]:[]); ctx.stroke();
  }
  ctx.setLineDash([]);
  for(let i=0;i<48;i++){ const ang=i/48*Math.PI*2+performance.now()/9000; const a=P3(Math.cos(ang)*0.42,0,Math.sin(ang)*0.42), b=P3(Math.cos(ang)*0.46,0,Math.sin(ang)*0.46); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.strokeStyle=`rgba(${COL.holo},${i%4?0.18:0.5})`; ctx.stroke(); }
  ctx.restore();
}

const BUCK=7;
function drawBody(scanY,dim){
  const paths=[]; for(let i=0;i<BUCK;i++) paths.push(new Path2D()); const bright=new Path2D(); const bones=new Path2D();
  for(let i=0;i<BODY.length;i+=4){
    const x=BODY[i],y=BODY[i+1],z=BODY[i+2],k=BODY[i+3];
    const p=P3(x,y,z); const sz=1.25*p[3]*Math.min(1.6,0.8+V.zoom*0.25);
    if(k===1){ bones.rect(p[0],p[1],sz,sz); continue; }
    if(Math.abs(y-scanY)<0.011){ bright.rect(p[0]-0.3,p[1]-0.3,sz+0.6,sz+0.6); continue; }
    let b=Math.floor((p[2]+0.28)/0.56*BUCK); b=b<0?0:b>=BUCK?BUCK-1:b; paths[b].rect(p[0],p[1],sz,sz);
  }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let b=0;b<BUCK;b++){ ctx.fillStyle=`rgba(${COL.holo},${((0.1+0.5*b/(BUCK-1))*dim).toFixed(3)})`; ctx.fill(paths[b]); }
  ctx.fillStyle=`rgba(200,230,255,${0.16*dim})`; ctx.fill(bones);
  ctx.fillStyle=`rgba(235,250,255,${0.9*dim})`; ctx.fill(bright);
  ctx.restore();
}
function drawOrgans(ts){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const id in CLOUD){
    const st=organState(id), aff=hzAffected(id), sel=S.selected===id, hov=hovered===id;
    const pts=CLOUD[id]; const path=new Path2D();
    for(let i=0;i<pts.length;i+=3){ const p=P3(pts[i],pts[i+1],pts[i+2]); const s=1.6*p[3]*Math.min(1.8,0.8+V.zoom*0.3); path.rect(p[0],p[1],s,s); }
    let a = aff ? (sel||hov?0.95:0.55) : 0.12;
    if(st>0 && aff) a = Math.min(1,a+0.25*(0.5+0.5*Math.sin(ts/260)));
    ctx.fillStyle = aff? hexA(stColor(st),a) : `rgba(140,150,170,${a})`;
    ctx.fill(path);
  }
  ctx.restore();
}

const HS={}; // projected hotspots
function drawHotspots(ts){
  const autoLabel = (S.EVAL && S.EVAL.P[0] && S.EVAL.P[0].s===2) ? S.EVAL.P[0].organ : null;
  for(const id in ORG){
    const o=ORG[id], p=P3(...o.pos); HS[id]=p;
    const st=organState(id), aff=hzAffected(id), sel=S.selected===id, hov=hovered===id;
    const c= aff? stColor(st) : '#59607a';
    const front = p[2] > -0.04 || sel || hov;
    const alpha = front?1:0.35;
    const pulse = 10 + 5*(0.5+0.5*Math.sin(ts/320 + o.pos[1]*9));
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.arc(p[0],p[1],pulse+(sel?6:0),0,Math.PI*2); ctx.strokeStyle=hexA(c,0.35); ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle=c; ctx.strokeStyle='rgba(14,15,24,.9)'; ctx.lineWidth=2;
    const r= sel||hov?7:5.5;
    ctx.beginPath();
    if(st===0||!aff){ ctx.arc(p[0],p[1],r,0,Math.PI*2); }
    else if(st===1){ ctx.moveTo(p[0],p[1]-r*1.2); ctx.lineTo(p[0]+r*1.15,p[1]+r*0.9); ctx.lineTo(p[0]-r*1.15,p[1]+r*0.9); ctx.closePath(); }
    else { ctx.moveTo(p[0],p[1]-r*1.3); ctx.lineTo(p[0]+r*1.3,p[1]); ctx.lineTo(p[0],p[1]+r*1.3); ctx.lineTo(p[0]-r*1.3,p[1]); ctx.closePath(); }
    ctx.stroke(); ctx.fill();
    if(sel||hov||(id===autoLabel&&!S.selected&&!hovered)){
      ctx.font='600 12px Inter, system-ui, sans-serif'; const _w=Math.max(ctx.measureText(ORG[id][LANG].name).width, ctx.measureText(t(['st0','st1','st2'][st])).width)+18;
      const side = (p[0]+66+_w < W-60) ? 1 : -1; const lx=p[0]+side*46, ly=p[1]-22;
      ctx.beginPath(); ctx.moveTo(p[0]+side*9,p[1]-4); ctx.lineTo(lx,ly); ctx.lineTo(lx+side*10,ly); ctx.strokeStyle=hexA(c,0.8); ctx.lineWidth=1; ctx.stroke();
      ctx.font='600 12px Inter, system-ui, sans-serif'; const name=ORG[id][LANG].name; const sub=t(['st0','st1','st2'][st]);
      const w=Math.max(ctx.measureText(name).width, ctx.measureText(sub).width)+18;
      const bx= side>0? lx+10 : lx-10-w;
      ctx.fillStyle='rgba(14,15,24,.88)'; roundRect(bx,ly-18,w,38,8); ctx.fill(); ctx.strokeStyle=hexA(c,0.6); ctx.stroke();
      ctx.fillStyle='#E9EDF6'; ctx.fillText(name,bx+9,ly-2); ctx.fillStyle=c; ctx.font='600 11px Inter, system-ui, sans-serif'; ctx.fillText(sub,bx+9,ly+13);
    }
    ctx.restore();
  }
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

const angDiff=(a,b)=>{let d=(b-a)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2; return d;};
export function frame(ts){
  const dt=Math.min(50,ts-(lastTs||ts)); lastTs=ts;
  if(autoRot && !dragging && !S.selected && ts-lastInteract>2500) T.yaw += dt*0.00022;
  const k=REDUCED?1:0.085;
  V.yaw += angDiff(V.yaw,T.yaw)*k; V.pitch += (T.pitch-V.pitch)*k; V.zoom += (T.zoom-V.zoom)*k; V.cx += (T.cx-V.cx)*k; V.cy += (T.cy-V.cy)*k;
  scan = REDUCED? -1 : (ts/4200)%1;
  const scanY = scan<0? -1 : 0.02 + (0.5-0.5*Math.cos(scan*Math.PI*2))*1.74;
  if(W>0&&H>0){
    ctx.clearRect(0,0,W,H); prep();
    drawFloor();
    const dim = S.hazard?0.45:1;
    drawBody(scanY,dim);
    drawOrgans(ts);
    drawHotspots(ts);
    document.getElementById('hudScan').textContent='SCAN '+String(Math.round((scanY<0?1:scanY/1.76)*100)).padStart(2,'0')+'%';
    let deg=Math.round(((V.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2)*180/Math.PI); document.getElementById('hudYaw').textContent=deg+'°';
  }
  drawECG(ts);
  requestAnimationFrame(frame);
}

/* pointer interaction */
let pd=null;
cv.addEventListener('pointerdown',e=>{ pd={x:e.clientX,y:e.clientY,yaw:T.yaw,pitch:T.pitch}; dragging=true; dragMoved=false; cv.setPointerCapture(e.pointerId); cv.classList.add('grabbing'); });
cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
  if(dragging&&pd){ const dx=e.clientX-pd.x, dy=e.clientY-pd.y; if(Math.abs(dx)+Math.abs(dy)>4) dragMoved=true; if(dragMoved){ T.yaw=pd.yaw+dx*0.008; V.yaw=T.yaw; T.pitch=clamp(pd.pitch+dy*0.004,-0.5,0.5); lastInteract=performance.now(); } return; }
  const hit=hitTest(mx,my); if(hit!==hovered){ hovered=hit; cv.classList.toggle('pointer',!!hit); }
  const tip=document.getElementById('tip');
  if(hit){ tip.innerHTML=`<b>${ORG[hit][LANG].name}</b><br><span style="color:${stColor(organState(hit))}">${t(['st0','st1','st2'][organState(hit)])}</span>`; tip.style.left=mx+'px'; tip.style.top=my+'px'; tip.classList.add('on'); } else tip.classList.remove('on');
});
cv.addEventListener('pointerup',e=>{
  dragging=false; cv.classList.remove('grabbing');
  if(!dragMoved){ document.getElementById('tip').classList.remove('on'); const r=cv.getBoundingClientRect(); const hit=hitTest(e.clientX-r.left,e.clientY-r.top); if(hit) selectOrgan(hit); else if(S.selected) selectOrgan(null); }
  pd=null; lastInteract=performance.now();
});
cv.addEventListener('pointerleave',()=>{ hovered=null; document.getElementById('tip').classList.remove('on'); });
cv.addEventListener('wheel',e=>{ e.preventDefault(); T.zoom=clamp(T.zoom*(1-e.deltaY*0.0012),0.75,3.2); lastInteract=performance.now(); },{passive:false});
function hitTest(x,y){ let best=null,bd=22*22; for(const id in HS){ const p=HS[id]; const d=(p[0]-x)**2+(p[1]-y)**2; if(d<bd){bd=d;best=id;} } return best; }

export function selectOrgan(id){
  S.selected=id;
  if(id){ const o=ORG[id]; T.yaw = V.yaw + angDiff(V.yaw,o.yaw); const c=Math.cos(o.yaw), s=Math.sin(o.yaw); T.cx=o.pos[0]*c+o.pos[2]*s; T.cy=o.pos[1]; T.zoom=2.5; T.pitch=-0.04; }
  else { T.zoom=1; T.cx=0; T.cy=0.9; T.pitch=-0.06; }
  actions.renderRight();
}
document.getElementById('btnRotate').onclick=e=>{ autoRot=!autoRot; e.currentTarget.setAttribute('aria-pressed',autoRot); };
document.getElementById('btnReset').onclick=()=>{ S.hazard=null; actions.renderHazards(); selectOrgan(null); T.yaw=0.5; };
