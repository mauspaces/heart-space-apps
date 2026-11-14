/* WebGL hologram (Three.js): translucent procedural body with Fresnel rim, slice contours and a scan line;
   organs as glowing volumes coloured by status; BioDigital-style "+" pins; camera fly-to; orbit/zoom; bloom.
   Falls back silently to the Canvas 2D hologram (holo2d.js) when WebGL is unavailable.
   Body is procedural (no external model). Coordinates match ORG[id].pos in catalog.js (y up, front = +z). */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { REDUCED, $ } from '../core/util.js';
import { LANG, t } from '../core/i18n.js';
import { HAZ, ORG } from '../core/catalog.js';
import { S } from '../core/state.js';
import { selectOrgan } from './holo2d.js';

const STATUS = [new THREE.Color('#3CF0A8'), new THREE.Color('#F5B841'), new THREE.Color('#FF4D5E')];
const HOLO = new THREE.Color('#5BD6FF');
const SHAPE = ['●', '▲', '◆'];

const VERT = `varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`;
const FRAG = `uniform vec3 uColor; uniform float uTime,uScanY,uBase,uRim,uLine,uAlpha,uScan;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.3);
  float line=smoothstep(.93,1.,abs(sin(vW.y*70.)));
  float scan=exp(-abs(vW.y-uScanY)*60.)*uScan;
  float n=h(floor(vW.xy*110.)+floor(uTime*7.))*.05;
  float a=(uBase+f*uRim+line*uLine+scan*.7+n)*uAlpha;
  gl_FragColor=vec4(uColor*(1.+scan*1.6),a);
}`;
function holoMat(color, o) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color.clone() }, uTime: { value: 0 }, uScanY: { value: 0 }, uBase: { value: o.base }, uRim: { value: o.rim }, uLine: { value: o.line }, uAlpha: { value: o.alpha ?? 1 }, uScan: { value: o.scan ?? 1 } },
  });
}

/* ---------- geometry helpers ---------- */
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function limb(A, B, r0, r1, mat) {
  const a = v3(A), b = v3(B), len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, 14, 1, false);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
function ellipsoid(c, r, mat, seg = 20) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), mat);
  m.position.set(c[0], c[1], c[2]); m.scale.set(r[0], r[1], r[2]);
  return m;
}
function buildBody(mat) {
  const g = new THREE.Group();
  // torso + neck: lathe through the same radius profile as the 2D hologram, flattened front-to-back
  const RX = [[0.9, .17], [0.97, .185], [1.04, .165], [1.1, .148], [1.2, .16], [1.3, .188], [1.38, .2], [1.43, .19], [1.46, .15], [1.485, .08], [1.5, .05], [1.55, .048]];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(RX.map(([y, r]) => new THREE.Vector2(r, y)), 40), mat);
  torso.scale.z = 0.62; g.add(torso);
  g.add(ellipsoid([0, 1.635, 0.012], [.09, .125, .105], mat, 28)); // head
  for (const s of [1, -1]) {
    g.add(ellipsoid([s * 0.2, 1.41, 0], [.065, .065, .06], mat)); // shoulder
    g.add(limb([s * 0.215, 1.4, 0], [s * 0.255, 1.13, 0], .047, .04, mat));
    g.add(limb([s * 0.255, 1.13, 0], [s * 0.285, 0.88, 0.05], .038, .03, mat));
    g.add(ellipsoid([s * 0.29, 0.8, 0.06], [.03, .065, .022], mat, 14)); // hand
    g.add(limb([s * 0.09, 0.92, 0], [s * 0.1, 0.5, 0.01], .08, .057, mat));
    g.add(limb([s * 0.1, 0.5, 0.01], [s * 0.1, 0.1, 0], .055, .037, mat));
    g.add(ellipsoid([s * 0.1, 0.04, 0.05], [.045, .04, .11], mat, 14)); // foot
  }
  return g;
}
function buildSkeleton() {
  const pts = [];
  const seg = (A, B) => pts.push(...A, ...B);
  seg([0, 0.95, -0.07], [0, 1.5, -0.03]); // spine
  for (const s of [1, -1]) {
    seg([s * 0.09, 0.9, 0], [s * 0.1, 0.52, 0.01]); seg([s * 0.1, 0.48, 0.01], [s * 0.1, 0.12, 0]);
    seg([s * 0.215, 1.39, 0], [s * 0.25, 1.14, 0]); seg([s * 0.25, 1.12, 0], [s * 0.28, 0.9, 0.045]);
    seg([0, 1.44, 0.03], [s * 0.19, 1.43, 0]); // clavicle
    for (let y = 1.18; y <= 1.4; y += 0.04) { // ribs
      let prev = null;
      for (let a = 0; a <= 1.001; a += 0.1) {
        const ang = -Math.PI / 2 + a * Math.PI, k = 0.15 * (1 - (1.4 - y) * 0.8);
        const p = [s * Math.cos(ang) * k, y - a * 0.03, Math.sin(ang) * 0.1];
        if (prev) seg(prev, p); prev = p;
      }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xc8e6ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
}

/* organ volumes: id → list of meshes sharing one material */
function buildOrgans() {
  const root = new THREE.Group(), M = {};
  const add = (id, mesh) => { (M[id] ||= { meshes: [], mat: holoMat(HOLO, { base: .3, rim: 1.1, line: 0, alpha: .9 }) }); mesh.material = M[id].mat; mesh.userData.organ = id; M[id].meshes.push(mesh); root.add(mesh); };
  const dummy = new THREE.MeshBasicMaterial();
  add('brain', ellipsoid([0, 1.665, 0.008], [.074, .064, .086], dummy, 28));
  for (const s of [1, -1]) add('eyes', ellipsoid([s * 0.032, 1.64, 0.09], [.015, .012, .012], dummy, 12));
  for (const s of [1, -1]) add('ear', ellipsoid([s * 0.088, 1.625, 0], [.013, .017, .013], dummy, 12));
  add('heart', ellipsoid([0.035, 1.3, 0.05], [.045, .055, .04], dummy, 24));
  for (const s of [1, -1]) add('lungs', ellipsoid([s * 0.09, 1.335, 0], [.066, .11, .065], dummy, 24));
  add('immune', ellipsoid([0, 1.4, 0.06], [.025, .03, .015], dummy, 12));
  add('immune', ellipsoid([0.09, 1.15, -0.02], [.03, .035, .025], dummy, 14));
  for (const s of [1, -1]) add('immune', ellipsoid([s * 0.05, 1.5, 0.03], [.012, .012, .012], dummy, 8));
  add('metabolic', ellipsoid([-0.07, 1.17, 0.03], [.085, .045, .06], dummy, 20));
  for (const s of [1, -1]) add('kidneys', ellipsoid([s * 0.07, 1.07, -0.06], [.022, .04, .018], dummy, 14));
  for (const s of [1, -1]) { add('musculo', limb([s * 0.09, 0.9, 0], [s * 0.1, 0.52, 0.01], .014, .012, dummy)); add('musculo', limb([s * 0.1, 0.48, 0.01], [s * 0.1, 0.12, 0], .012, .01, dummy)); }
  const box = new THREE.Mesh(new THREE.BoxGeometry(.03, .04, .01), dummy); box.position.set(-0.125, 1.405, 0.125); add('dosimeter', box);
  return { root, M };
}

/* where to put the camera for each organ (angle around the body, radians; 0 = front) */
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
  cv.setAttribute('aria-label', 'Interactive 3D hologram of the astronaut\'s body. Use the organ pins to inspect each system.');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab';
  host.insertBefore(cv, old); old.style.display = 'none'; S.use3d = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x03050a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 30);
  const HOME = { pos: new THREE.Vector3(1.55, 1.2, 3.15), target: new THREE.Vector3(0, 0.88, 0) };
  camera.position.copy(HOME.pos);
  const controls = new OrbitControls(camera, cv);
  controls.target.copy(HOME.target); controls.enableDamping = !REDUCED; controls.dampingFactor = 0.08;
  controls.minDistance = 0.35; controls.maxDistance = 5; controls.enablePan = false; controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotateSpeed = 0.7;

  const bodyMat = holoMat(HOLO, { base: .012, rim: .5, line: .1, alpha: 1 }); bodyMat.side = THREE.FrontSide;
  const body = buildBody(bodyMat); scene.add(body);
  scene.add(buildSkeleton());
  const { root: organRoot, M: ORGANS } = buildOrgans(); scene.add(organRoot);

  // platform
  const ringMat = new THREE.MeshBasicMaterial({ color: HOLO, transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = (r0, r1, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), ringMat.clone()); m.material.opacity = op; m.rotation.x = -Math.PI / 2; m.position.y = 0.002; scene.add(m); return m; };
  ring(0.415, 0.425, 0.5); ring(0.595, 0.6, 0.22);
  const ticks = new THREE.Group(); for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r = 0.46; const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.004, i % 4 ? 0.025 : 0.05), ringMat.clone()); tk.material.opacity = i % 4 ? 0.2 : 0.55; tk.position.set(Math.cos(a) * r, 0.002, Math.sin(a) * r); tk.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2); ticks.add(tk); } scene.add(ticks);

  // post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.32); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // pins (accessible buttons projected over the canvas)
  const pinsEl = document.createElement('div'); pinsEl.id = 'pins'; host.insertBefore(pinsEl, $('tip'));
  const PINS = {};
  for (const id in ORG) {
    const b = document.createElement('button'); b.className = 'pin'; b.type = 'button'; b.dataset.organ = id;
    b.innerHTML = '<span class="pin-dot" aria-hidden="true">+</span><span class="pin-lab"></span>';
    b.onclick = () => selectOrgan(S.selected === id ? null : id);
    pinsEl.appendChild(b); PINS[id] = { el: b, lab: b.querySelector('.pin-lab'), dot: b.querySelector('.pin-dot'), key: '' };
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  // interaction: click an organ in the volume, ignore drags
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, lastInteract = 0;
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

  // camera fly-to
  let fly = null, lastSel = undefined;
  function flyTo(pos, target, ms = 900) {
    if (REDUCED) { camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
    fly = { t0: performance.now(), ms, p0: camera.position.clone(), p1: pos, g0: controls.target.clone(), g1: target };
  }
  function onSelect(id) {
    if (!id) { flyTo(HOME.pos, HOME.target); return; }
    const o = ORG[id], c = v3(o.pos), a = viewAngle(id), d = id === 'dosimeter' ? 1.05 : 0.95;
    flyTo(new THREE.Vector3(c.x + Math.sin(a) * d, c.y + 0.03, c.z + Math.cos(a) * d), c);
  }

  const col = new THREE.Color();
  const hudScan = $('hudScan'), hudYaw = $('hudYaw'), rot = $('btnRotate');
  const tmp = new THREE.Vector3();
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

    const scanN = REDUCED ? -1 : (time / 4.2) % 1, scanY = scanN < 0 ? -9 : 0.02 + (0.5 - 0.5 * Math.cos(scanN * Math.PI * 2)) * 1.7;
    const dim = S.hazard ? 0.5 : 1;
    bodyMat.uniforms.uTime.value = time; bodyMat.uniforms.uScanY.value = scanY; const camDist = camera.position.distanceTo(controls.target); // skin fades out when the camera is close to an organ
    bodyMat.uniforms.uAlpha.value = dim * (0.3 + 0.7 * Math.min(1, Math.max(0, (camDist - 0.6) / 1.4))); bodyMat.uniforms.uScan.value = REDUCED ? 0 : 1;
    ticks.rotation.y = time * 0.15;

    for (const id in ORGANS) {
      const st = E ? E.O[id] : 0, aff = !S.hazard || HAZ[S.hazard].organs.includes(id), sel = S.selected === id;
      const u = ORGANS[id].mat.uniforms;
      if (aff) col.copy(STATUS[st]); else col.set('#59607a');
      u.uColor.value.copy(col); u.uTime.value = time; u.uScanY.value = scanY; u.uScan.value = REDUCED ? 0 : 0.5;
      const pulse = st > 0 && !REDUCED ? 0.75 + 0.25 * Math.sin(time * 4) : 1;
      u.uAlpha.value = (aff ? (sel ? 1.5 : 1) : 0.22) * pulse;
    }

    // pins: project, hide when on the far side of the body
    const w = host.clientWidth, h = host.clientHeight;
    for (const id in PINS) {
      const P = PINS[id], o = ORG[id], st = E ? E.O[id] : 0, aff = !S.hazard || HAZ[S.hazard].organs.includes(id);
      tmp.set(o.pos[0], o.pos[1], o.pos[2]);
                  // rough occlusion: hide pins of the far side of the body (back organs from the front and vice versa)
      const behind = o.pos[2] < -0.02 ? camera.position.z > 0.3 : o.pos[2] > 0.02 ? camera.position.z < -0.3 : false;
      tmp.project(camera);
      const vis = tmp.z < 1 && !behind;
      P.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
      P.el.style.opacity = vis ? (aff ? 1 : 0.3) : 0; P.el.style.pointerEvents = vis ? 'auto' : 'none'; P.el.tabIndex = vis ? 0 : -1;
      const key = `${LANG}|${st}|${S.selected === id}`;
      if (key !== P.key) {
        P.key = key; const name = o[LANG].name, stw = t(['st0', 'st1', 'st2'][st]);
        P.lab.innerHTML = `<b>${name}</b><span class="s${st}">${SHAPE[st]} ${stw}</span>`;
        P.el.className = `pin st${st}${S.selected === id ? ' sel' : ''}`; P.el.setAttribute('aria-label', `${name}: ${stw}`);
        P.el.setAttribute('aria-pressed', String(S.selected === id));
      }
    }
    if (hudScan) hudScan.textContent = 'SCAN ' + String(Math.round((scanY < 0 ? 1 : scanY / 1.72) * 100)).padStart(2, '0') + '%';
    if (hudYaw) hudYaw.textContent = Math.round(((Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z) * 180 / Math.PI) + 360) % 360) + '°';
    composer.render();
  }
  requestAnimationFrame(frame);
  return true;
}
