/* WebGL body (Three.js) on the dark mission-control stage:
   real anatomy (BodyParts3D, CC BY-SA, built by scripts/build-anatomy.mjs into public/models/anatomy.glb),
   glass skin with a cyan fresnel rim and fine contour lines, pearl organs that light up amber/red on alert,
   soft bloom, a sparse starfield, "+" pins, camera fly-to, orbit/zoom.
   While the model loads (or if it fails) a procedural body is shown. Coordinates match ORG[id].pos in
   catalog.js (y up, front = +z, subject's left = +x). Falls back to the Canvas 2D hologram without WebGL. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { REDUCED, $, mulberry32 } from '../core/util.js';
import { LANG, t } from '../core/i18n.js';
import { HAZ, ORG } from '../core/catalog.js';
import { S } from '../core/state.js';
import { selectOrgan } from './holo2d.js';

const INK = new THREE.Color('#5BD6FF');
const NEUTRAL = new THREE.Color('#C9D6E3');
const STATUS = [NEUTRAL, new THREE.Color('#F5B841'), new THREE.Color('#FF4D5E')];
const DIM = new THREE.Color('#3A4452');
const SHAPE = ['●', '▲', '◆'];

const VERT = `varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`;
/* contour lines every 1/uFreq m along y, 1px wide on screen thanks to fwidth; a slow scan darkens them */
const FRAG = `uniform vec3 uColor; uniform float uScanY,uBase,uRim,uLine,uFreq,uAlpha,uScan,uBack,uReveal;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  if(vW.y>uReveal) discard;
  float edge=exp(-abs(vW.y-uReveal)*45.);
  float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);
  float y=vW.y*uFreq;
  float d=abs(fract(y-.5)-.5)/max(fwidth(y),1e-4);
  float line=1.-min(d,1.);
  float scan=exp(-abs(vW.y-uScanY)*35.)*uScan;
  float a=uBase+f*uRim+line*(uLine+scan*.45);
  a=a+edge*.9;
  a*=gl_FrontFacing?1.:uBack;
  gl_FragColor=vec4(uColor,clamp(a*uAlpha,0.,1.));
}`;
function mat(color, o) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: color.clone() }, uScanY: { value: -9 }, uBase: { value: o.base }, uRim: { value: o.rim },
      uLine: { value: o.line }, uFreq: { value: o.freq ?? 55 }, uAlpha: { value: 1 }, uScan: { value: o.scan ?? 1 }, uBack: { value: o.back ?? .35 }, uReveal: { value: 9 },
    },
  });
}
/* organs: solid-looking volumes lit by a fixed key light, with a rim; uGlow pushes alert organs over the bloom threshold */
const ORG_FRAG = `uniform vec3 uColor; uniform float uAlpha,uReveal,uGlow;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  if(vW.y>uReveal) discard;
  vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n;
  float d=max(dot(n,normalize(vec3(.35,.75,.6))),0.)*.6+.22;
  float f=pow(1.-abs(dot(n,normalize(vV))),2.2);
  float edge=exp(-abs(vW.y-uReveal)*45.);
  vec3 c=uColor*(d*.55+f*.35+uGlow)+vec3(.36,.84,1.)*edge;
  gl_FragColor=vec4(c,uAlpha);
}`;
function orgMat(color) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: ORG_FRAG, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    uniforms: { uColor: { value: color.clone() }, uAlpha: { value: 1 }, uReveal: { value: 9 }, uGlow: { value: 0 } },
  });
}

/* ---------- procedural anatomy ---------- */
const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
function limb(A, B, r0, r1, m, seg = 28) {
  const a = v3(A), b = v3(B), len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg, 1, true), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}
function ellipsoid(c, r, m, seg = 32) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), m);
  mesh.position.set(c[0], c[1], c[2]); mesh.scale.set(r[0], r[1], r[2]);
  return mesh;
}
function buildBody(m) {
  const g = new THREE.Group();
  const RX = [[0.88, .05], [0.9, .165], [0.97, .182], [1.04, .163], [1.1, .147], [1.2, .158], [1.3, .186], [1.38, .198], [1.43, .188], [1.46, .15], [1.485, .085], [1.5, .052], [1.56, .05], [1.57, .03]];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(RX.map(([y, r]) => new THREE.Vector2(r, y)), 64), m);
  torso.scale.z = 0.62; g.add(torso);
  g.add(ellipsoid([0, 1.64, 0.012], [.088, .118, .103], m, 48));
  for (const s of [1, -1]) {
    g.add(ellipsoid([s * 0.198, 1.415, 0], [.062, .06, .058], m));
    g.add(limb([s * 0.212, 1.405, 0], [s * 0.252, 1.13, 0], .046, .039, m));
    g.add(ellipsoid([s * 0.252, 1.13, 0], [.039, .039, .039], m, 20));
    g.add(limb([s * 0.252, 1.13, 0], [s * 0.283, 0.88, 0.05], .037, .029, m));
    g.add(ellipsoid([s * 0.288, 0.81, 0.058], [.029, .064, .02], m, 20));
    g.add(limb([s * 0.09, 0.93, 0], [s * 0.1, 0.5, 0.01], .082, .056, m));
    g.add(ellipsoid([s * 0.1, 0.5, 0.01], [.056, .05, .054], m, 20));
    g.add(limb([s * 0.1, 0.5, 0.01], [s * 0.1, 0.09, 0], .054, .036, m));
    g.add(ellipsoid([s * 0.1, 0.04, 0.05], [.044, .038, .108], m, 20));
  }
  return g;
}
function buildSkeleton() {
  const pts = [], seg = (A, B) => pts.push(...A, ...B);
  seg([0, 0.95, -0.07], [0, 1.5, -0.03]);
  for (const s of [1, -1]) {
    seg([s * 0.09, 0.9, 0], [s * 0.1, 0.52, 0.01]); seg([s * 0.1, 0.48, 0.01], [s * 0.1, 0.12, 0]);
    seg([s * 0.215, 1.39, 0], [s * 0.25, 1.14, 0]); seg([s * 0.25, 1.12, 0], [s * 0.28, 0.9, 0.045]);
    seg([0, 1.44, 0.03], [s * 0.19, 1.43, 0]);
    for (let y = 1.18; y <= 1.4; y += 0.04) {
      let prev = null;
      for (let a = 0; a <= 1.001; a += 0.1) {
        const ang = -Math.PI / 2 + a * Math.PI, k = 0.15 * (1 - (1.4 - y) * 0.8);
        const p = [s * Math.cos(ang) * k, y - a * 0.03, Math.sin(ang) * 0.1];
        if (prev) seg(prev, p); prev = p;
      }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.22, depthWrite: false }));
}
function buildOrgans() {
  const root = new THREE.Group(), M = {};
  const add = (id, mesh) => {
    if (!M[id]) M[id] = { meshes: [], mat: orgMat(NEUTRAL) };
    mesh.material = M[id].mat; mesh.userData.organ = id; mesh.renderOrder = 0; M[id].meshes.push(mesh); root.add(mesh);
  };
  const tmp = new THREE.MeshBasicMaterial();
  add('brain', ellipsoid([0, 1.665, 0.008], [.074, .064, .086], tmp, 40));
  for (const s of [1, -1]) add('eyes', ellipsoid([s * 0.032, 1.64, 0.09], [.015, .012, .012], tmp, 16));
  for (const s of [1, -1]) add('ear', ellipsoid([s * 0.088, 1.625, 0], [.013, .017, .013], tmp, 16));
  add('heart', ellipsoid([0.035, 1.3, 0.05], [.045, .055, .04], tmp, 32));
  for (const s of [1, -1]) add('lungs', ellipsoid([s * 0.09, 1.335, 0], [.062, .105, .06], tmp, 32));
  add('immune', ellipsoid([0, 1.4, 0.06], [.025, .03, .015], tmp, 16));
  add('immune', ellipsoid([0.09, 1.15, -0.02], [.03, .035, .025], tmp, 16));
  for (const s of [1, -1]) add('immune', ellipsoid([s * 0.05, 1.5, 0.03], [.012, .012, .012], tmp, 12));
  add('metabolic', ellipsoid([-0.07, 1.17, 0.03], [.082, .043, .058], tmp, 28));
  for (const s of [1, -1]) add('kidneys', ellipsoid([s * 0.07, 1.07, -0.06], [.022, .04, .018], tmp, 20));
  for (const s of [1, -1]) { add('musculo', limb([s * 0.09, 0.9, 0], [s * 0.1, 0.52, 0.01], .013, .011, tmp, 12)); add('musculo', limb([s * 0.1, 0.48, 0.01], [s * 0.1, 0.12, 0], .011, .009, tmp, 12)); }
  const box = new THREE.Mesh(new THREE.BoxGeometry(.03, .04, .01), tmp); box.position.set(-0.125, 1.405, 0.125); add('dosimeter', box);
  return { root, M };
}

const VIEW = { kidneys: Math.PI, ear: Math.PI / 2 };
const viewAngle = id => VIEW[id] ?? 0.22 * Math.sign(ORG[id].pos[0] || 1);
const easeOut = u => 1 - Math.pow(1 - u, 3);

export function init3D() {
  const host = document.querySelector('.center'), old = $('holo');
  if (!host || !old) return false;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no webgl');
  } catch (e) { return false; }

  const cv = renderer.domElement; cv.id = 'holo3d'; cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', 'Interactive 3D model of the astronaut\'s body. Use the organ pins to inspect each system.');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab';
  host.insertBefore(cv, old); old.style.display = 'none'; S.use3d = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x05070a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
  const HOME = { pos: new THREE.Vector3(1.55, 1.18, 4.9), target: new THREE.Vector3(0, 0.86, 0) };
  camera.position.copy(HOME.pos);
  const controls = new OrbitControls(camera, cv);
  controls.target.copy(HOME.target); controls.enableDamping = !REDUCED; controls.dampingFactor = 0.08;
  controls.minDistance = 0.4; controls.maxDistance = 6; controls.enablePan = false; controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotateSpeed = 0.55;

  const skin = mat(INK, { base: 0, rim: .16, line: .3, freq: 60, back: .22 });
  const body = buildBody(skin); body.traverse(o => { o.renderOrder = 2; }); scene.add(body);
  const skeleton = buildSkeleton(); skeleton.renderOrder = 1; scene.add(skeleton);
  const { root: organRoot, M: ORGANS } = buildOrgans(); scene.add(organRoot);

  /* real anatomy: swap the procedural body for the BodyParts3D model once it has loaded (the procedural one stays on failure) */
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(`${import.meta.env.BASE_URL}models/anatomy.glb`, gltf => {
    gltf.scene.updateMatrixWorld(true);
    const nodes = {}; gltf.scene.traverse(o => { if (o.isMesh) nodes[o.name || o.parent?.name] = o; });
    const byName = n => nodes[n] || Object.values(nodes).find(m => m.parent && m.parent.name === n);
    const skinMesh = byName('skin');
    if (!skinMesh) return;
    /* glass skin: very low fill, strong cyan fresnel rim, faint contour lines */
    skin.uniforms.uBase.value = 0.012; skin.uniforms.uRim.value = 0.62; skin.uniforms.uLine.value = 0.11;
    skin.uniforms.uFreq.value = 80; skin.uniforms.uBack.value = 0.12;
    body.clear(); body.attach(skinMesh); skinMesh.material = skin; skinMesh.renderOrder = 2;
    scene.remove(skeleton);
    for (const id in ORGANS) {
      const m = byName(id); if (!m) continue;
      for (const old of ORGANS[id].meshes) organRoot.remove(old);
      organRoot.attach(m); m.material = ORGANS[id].mat; m.userData.organ = id; m.renderOrder = 0; ORGANS[id].meshes = [m];
    }
    S.anatomy = 'bodyparts3d';
    const cr = document.createElement('p'); cr.className = 'holo-credit'; cr.dataset.i18n = 'credit_3d'; cr.textContent = t('credit_3d');
    host.appendChild(cr);
  }, undefined, () => {});

  /* a sparse, static starfield far behind the body (seeded, so it never changes between visits) */
  {
    const rnd = mulberry32(1969), N = 700, P = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 14 + rnd() * 10, q = Math.sqrt(1 - u * u);
      P.set([Math.cos(a) * q * r, u * r + 1, Math.sin(a) * q * r], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false })));
  }

  /* soft bloom: only the fresnel rim, the scan line and alert organs cross the threshold */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  /* phones / touch-first devices: no bloom (its blur passes are the heaviest part of the frame); the OutputPass stays so colours match */
  const LITE = window.matchMedia('(max-width: 1100px), (pointer: coarse)').matches;
  if (!LITE) composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.32)); // strength, radius, threshold
  composer.addPass(new OutputPass());

  // floor: calibration rings and ticks
  const ringMat = op => new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
  const ring = (r0, r1, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 128), ringMat(op)); m.rotation.x = -Math.PI / 2; m.position.y = 0.001; scene.add(m); };
  ring(0.42, 0.423, 0.55); ring(0.6, 0.602, 0.22);
  const ticks = new THREE.Group();
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2, long = i % 6 === 0;
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.0025, long ? 0.04 : 0.018), ringMat(long ? 0.5 : 0.25));
    const r = 0.445 + (long ? 0.01 : 0.001);
    tk.position.set(Math.cos(a) * r, 0.001, Math.sin(a) * r); tk.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2); ticks.add(tk);
  }
  scene.add(ticks);

  // pins: real buttons projected over the canvas (keyboard and screen-reader accessible)
  const pinsEl = document.createElement('div'); pinsEl.id = 'pins'; host.insertBefore(pinsEl, $('tip'));
  const PINS = {};
  for (const id in ORG) {
    const b = document.createElement('button'); b.className = 'pin'; b.type = 'button'; b.dataset.organ = id;
    b.innerHTML = '<span class="pin-dot" aria-hidden="true"></span><span class="pin-lab"></span>';
    b.onclick = () => selectOrgan(S.selected === id ? null : id);
    pinsEl.appendChild(b); PINS[id] = { el: b, lab: b.querySelector('.pin-lab'), key: '' };
  }

  /* centre the body in the free area between the dossier and the rail (desktop) */
  function viewOffset(w, h) {
    const L = document.querySelector('.dossier-col'), R = document.querySelector('.rail-col');
    const top = document.querySelector('.top'), tl = document.querySelector('.timeline');
    if (window.innerWidth <= 1100 || !L || !R || !top || !tl) { camera.clearViewOffset(); return; }
    const hb = host.getBoundingClientRect();
    const lx = L.getBoundingClientRect().right - hb.left, rx = R.getBoundingClientRect().left - hb.left;
    const ty = top.getBoundingClientRect().bottom - hb.top, by = tl.getBoundingClientRect().top - hb.top;
    camera.setViewOffset(w, h, -((lx + rx) / 2 - w / 2), -((ty + by) / 2 - h / 2), w, h);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
    camera.aspect = w / h; viewOffset(w, h); camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); window.addEventListener('resize', resize); resize();

  // click an organ volume; ignore drags
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, lastInteract = 0, fly = null;
  controls.addEventListener('start', () => { lastInteract = performance.now(); fly = null; });
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointerup', e => {
    cv.style.cursor = 'grab';
    if (!down || Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 5) { down = null; return; }
    down = null;
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(organRoot.children, false)[0];
    if (hit) selectOrgan(hit.object.userData.organ); else if (S.selected) selectOrgan(null);
  });

  function flyTo(pos, target, ms = 1000) {
    if (REDUCED) { camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
    fly = { t0: performance.now(), ms, p0: camera.position.clone(), p1: pos, g0: controls.target.clone(), g1: target };
  }
  function onSelect(id) {
    if (!id) { flyTo(HOME.pos, HOME.target); return; }
    const c = v3(ORG[id].pos), a = viewAngle(id), d = id === 'dosimeter' ? 1.15 : 1.0;
    flyTo(new THREE.Vector3(c.x + Math.sin(a) * d, c.y + 0.05, c.z + Math.cos(a) * d), c);
  }

  const col = new THREE.Color(), tmp = new THREE.Vector3();
  const rot = $('btnRotate'), hudYaw = $('hudYaw');
  let lastSel;
  function frame(ts) {
    requestAnimationFrame(frame);
    const time = ts / 1000, E = S.EVAL;
    if (S.selected !== lastSel) { lastSel = S.selected; onSelect(S.selected); }
    if (fly) {
      const u = Math.min(1, (performance.now() - fly.t0) / fly.ms), e = easeOut(u);
      camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.g0, fly.g1, e);
      if (u >= 1) fly = null;
    }
    controls.autoRotate = !REDUCED && rot && rot.getAttribute('aria-pressed') === 'true' && !S.selected && performance.now() - lastInteract > 2500;
    controls.update();

    /* intro: the body builds bottom-up after the boot (S.bootEnd unset = boot still running) */
    const rv = S.bootEnd === undefined ? -1 : !S.bootEnd || REDUCED ? 9 : (() => { const u = Math.min(1, (performance.now() - S.bootEnd) / 1600); return u >= 1 ? 9 : -0.05 + easeOut(u) * 1.85; })();
    skin.uniforms.uReveal.value = rv; for (const id in ORGANS) ORGANS[id].mat.uniforms.uReveal.value = rv;
    pinsEl.style.visibility = rv < 1.8 ? 'hidden' : '';
    const scanY = REDUCED ? -9 : 0.02 + (0.5 - 0.5 * Math.cos(((time / 6) % 1) * Math.PI * 2)) * 1.7;
    const camDist = camera.position.distanceTo(controls.target);
    skin.uniforms.uScanY.value = scanY;
    skin.uniforms.uAlpha.value = (S.hazard ? 0.55 : 1) * (0.35 + 0.65 * Math.min(1, Math.max(0, (camDist - 0.7) / 1.6)));
    ticks.rotation.y = REDUCED ? 0 : time * 0.04;

    for (const id in ORGANS) {
      const st = E ? E.O[id] : 0, aff = !S.hazard || HAZ[S.hazard].organs.includes(id), sel = S.selected === id;
      const u = ORGANS[id].mat.uniforms;
      col.copy(aff ? STATUS[st] : DIM); u.uColor.value.copy(col);
      const pulse = st > 0 && !REDUCED ? 0.82 + 0.18 * Math.sin(time * 3.2) : 1;
      /* bloom threshold is luminance-based, so red needs a bigger push than amber to glow as much */
      u.uGlow.value = ((aff ? [0, 0.9, 2.2][st] : 0) + (sel ? 0.25 : 0)) * pulse;
      u.uAlpha.value = aff ? 1 : 0.3;
    }

    const w = host.clientWidth, h = host.clientHeight;
    for (const id in PINS) {
      const P = PINS[id], o = ORG[id], st = E ? E.O[id] : 0, aff = !S.hazard || HAZ[S.hazard].organs.includes(id);
      tmp.set(o.pos[0], o.pos[1], o.pos[2]);
      // rough occlusion: hide pins of the far side (back organs from the front and vice versa)
      const behind = o.pos[2] < -0.02 ? camera.position.z > 0.3 : o.pos[2] > 0.02 ? camera.position.z < -0.3 : false;
      tmp.project(camera);
      const vis = tmp.z < 1 && !behind;
      P.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
      P.el.style.opacity = vis ? (aff ? 1 : 0.35) : 0; P.el.style.pointerEvents = vis ? 'auto' : 'none'; P.el.tabIndex = vis ? 0 : -1;
      const key = `${LANG}|${st}|${S.selected === id}`;
      if (key !== P.key) {
        P.key = key; const name = o[LANG].name, stw = t(['st0', 'st1', 'st2'][st]);
        P.lab.innerHTML = `<b>${name}</b><span class="c${st}">${SHAPE[st]} ${stw}</span>`;
        P.el.className = `pin st${st}${S.selected === id ? ' sel' : ''}`;
        P.el.setAttribute('aria-label', `${name}: ${stw}`); P.el.setAttribute('aria-pressed', String(S.selected === id));
      }
    }
    if (hudYaw) hudYaw.textContent = Math.round(((Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z) * 180 / Math.PI) + 360) % 360) + '°';
    composer.render();
  }
  requestAnimationFrame(frame);
  return true;
}
