/* One-off asset build: BodyParts3D STL meshes -> public/models/anatomy.glb (dev only, run by hand).

   Usage:  node scripts/build-anatomy.mjs <folder with the BodyParts3D .stl files>
   Source: BodyParts3D, © The Database Center for Life Science (DBCLS), CC BY-SA 2.1 Japan,
           STL copies from github.com/Kevin-Mattheus-Moerman/BodyParts3D (assets/BodyParts3D_data/stl).

   What it does: parse each STL, merge the parts of every organ group (ids match ORG in src/core/catalog.js),
   weld + simplify with meshoptimizer, convert BodyParts3D millimetres to metres with y up, feet at y=0,
   front = +z and the subject's left = +x (the frame catalog.js uses), compute smooth normals,
   then quantize + meshopt-compress into a single GLB with one node per group. */
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const SRC = process.argv[2];
const OUT = 'public/models/anatomy.glb';
const HEIGHT = 1.75; // metres, top of the head (matches the procedural body and ORG positions)
if (!SRC) { console.error('usage: node scripts/build-anatomy.mjs <stl folder>'); process.exit(1); }

/* group -> BodyParts3D FMA ids, target triangle count */
const GROUPS = {
  skin: { ids: ['FMA7163'], tris: 60000 },
  brain: { ids: ['FMA61822', 'FMA67944', 'FMA67943', 'FMA62004'], tris: 9000 },
  eyes: { ids: ['FMA12513'], tris: 1600 },
  ear: { ids: ['FMA52780'], tris: 2400 },
  heart: { ids: ['FMA7274'], tris: 7000 },
  lungs: { ids: ['FMA7333', 'FMA7337', 'FMA7383', 'FMA7370', 'FMA7371'], tris: 9000 },
  immune: { ids: ['FMA71194', 'FMA71195', 'FMA7196'], tris: 3500 },
  metabolic: { ids: ['FMA7197', 'FMA7148'], tris: 6000 },
  kidneys: { ids: ['FMA7204', 'FMA7205'], tris: 3000 },
  musculo: { ids: ['FMA24474', 'FMA24475', 'FMA38928', 'FMA38929'], tris: 6000 },
};

function readSTL(file) {
  const b = fs.readFileSync(file);
  const n = b.readUInt32LE(80);
  if (84 + n * 50 !== b.length) throw new Error(`${file}: not a binary STL`);
  const pos = new Float32Array(n * 9);
  for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) pos[i * 9 + k] = b.readFloatLE(84 + i * 50 + 12 + k * 4);
  return pos;
}
/* triangle soup -> indexed mesh, welding vertices closer than 1e-3 mm */
function weldSoup(soup) {
  const map = new Map(), verts = [], idx = new Uint32Array(soup.length / 3);
  for (let i = 0; i < soup.length; i += 3) {
    const key = `${Math.round(soup[i] * 1000)},${Math.round(soup[i + 1] * 1000)},${Math.round(soup[i + 2] * 1000)}`;
    let v = map.get(key);
    if (v === undefined) { v = verts.length / 3; map.set(key, v); verts.push(soup[i], soup[i + 1], soup[i + 2]); }
    idx[i / 3] = v;
  }
  return { pos: new Float32Array(verts), idx };
}
function compact(pos, idx) {
  const remap = new Int32Array(pos.length / 3).fill(-1), out = [];
  const ni = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    const v = idx[i];
    if (remap[v] < 0) { remap[v] = out.length / 3; out.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    ni[i] = remap[v];
  }
  return { pos: new Float32Array(out), idx: ni };
}
function vertexNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const p of [a, b, c]) { n[p] += nx; n[p + 1] += ny; n[p + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}
const centroid = pos => { const c = [0, 0, 0]; for (let i = 0; i < pos.length; i += 3) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; } return c.map(v => v / (pos.length / 3)); };

await MeshoptSimplifier.ready; await MeshoptEncoder.ready;

/* 1. load and weld every group in source (BodyParts3D) coordinates */
const raw = {};
for (const [g, { ids }] of Object.entries(GROUPS)) {
  const soups = ids.map(id => readSTL(path.join(SRC, `${id}.stl`)));
  const all = new Float32Array(soups.reduce((s, a) => s + a.length, 0));
  let o = 0; for (const s of soups) { all.set(s, o); o += s.length; }
  raw[g] = weldSoup(all);
  console.log(`${g}: ${raw[g].idx.length / 3} tris`);
}

/* 2. work out the frame from the skin: up = longest axis, front = towards the eyes, left = left kidney side */
const skin = raw.skin.pos, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < skin.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], skin[i + k]); mx[k] = Math.max(mx[k], skin[i + k]); }
const ext = mx.map((v, k) => v - mn[k]), up = ext.indexOf(Math.max(...ext));
const mid = mn.map((v, k) => (v + mx[k]) / 2), eye = centroid(raw.eyes.pos);
const horiz = [0, 1, 2].filter(k => k !== up);
const fwd = Math.abs(eye[horiz[0]] - mid[horiz[0]]) > Math.abs(eye[horiz[1]] - mid[horiz[1]]) ? horiz[0] : horiz[1];
const lat = horiz.find(k => k !== fwd);
const fSign = Math.sign(eye[fwd] - mid[fwd]);
const leftKidney = centroid(readSTL(path.join(SRC, 'FMA7205.stl')));
const lSign = Math.sign(leftKidney[lat] - mid[lat]);
const s = HEIGHT / ext[up];
const upSign = 1; // BodyParts3D is z-up with the head at +z
console.log('frame', { up, fwd, lat, fSign, lSign, scale: s, heightMM: ext[up].toFixed(0) });
const map = (p, i) => [(p[i + lat] - mid[lat]) * lSign * s, (p[i + up] - mn[up]) * upSign * s, (p[i + fwd] - mid[fwd]) * fSign * s];
/* handedness: mirroring flips the triangle winding, so swap it back if the basis is left-handed */
const basis = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
basis[0][lat] = lSign; basis[1][up] = upSign; basis[2][fwd] = fSign;
const det = basis[0][0] * (basis[1][1] * basis[2][2] - basis[1][2] * basis[2][1]) - basis[0][1] * (basis[1][0] * basis[2][2] - basis[1][2] * basis[2][0]) + basis[0][2] * (basis[1][0] * basis[2][1] - basis[1][1] * basis[2][0]);

/* 3. simplify, transform, build the document */
const doc = new Document(), buffer = doc.createBuffer(), scene = doc.createScene('anatomy');
const stats = {};
for (const [g, { tris }] of Object.entries(GROUPS)) {
  const { pos, idx } = raw[g];
  const target = Math.min(idx.length, tris * 3);
  const [simp] = MeshoptSimplifier.simplify(idx, pos, 3, target, 0.02, []);
  const c = compact(pos, simp);
  const P = new Float32Array(c.pos.length);
  for (let i = 0; i < c.pos.length; i += 3) P.set(map(c.pos, i), i);
  if (det < 0) for (let i = 0; i < c.idx.length; i += 3) { const t = c.idx[i + 1]; c.idx[i + 1] = c.idx[i + 2]; c.idx[i + 2] = t; }
  const N = vertexNormals(P, c.idx);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(P).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(P.length / 3 > 65535 ? c.idx : new Uint16Array(c.idx)).setBuffer(buffer));
  scene.addChild(doc.createNode(g).setMesh(doc.createMesh(g).addPrimitive(prim)));
  const b0 = [Infinity, Infinity, Infinity], b1 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { b0[k] = Math.min(b0[k], P[i + k]); b1[k] = Math.max(b1[k], P[i + k]); }
  stats[g] = { tris: c.idx.length / 3, centre: centroid(P).map(v => +v.toFixed(3)), min: b0.map(v => +v.toFixed(3)), max: b1.map(v => +v.toFixed(3)) };
}
console.table(Object.fromEntries(Object.entries(stats).map(([g, v]) => [g, { tris: v.tris, centre: v.centre.join(' '), min: v.min.join(' '), max: v.max.join(' ') }])));

doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await io.write(OUT, doc);
console.log(`${OUT}: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
