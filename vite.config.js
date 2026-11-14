import { defineConfig } from 'vite';

/* Offline support without extra dependencies: after the build, emit a service worker that
   pre-caches every built asset (JS, CSS, latin fonts, HTML) so the site runs offline after the first load. */
function offlineServiceWorker() {
  return {
    name: 'heart-offline-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !/\.woff$/.test(f) && !(/\.woff2$/.test(f) && !/-latin(-ext)?-/.test(f)));
      const version = Date.now().toString(36);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE='heart-${version}';
const FILES=${JSON.stringify(['./', ...files])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return res;
  }).catch(()=>caches.match('./'))));
});
`,
      });
    },
  };
}

// Relative base so the build works from any sub-path (GitHub Pages, Netlify, file server).
export default defineConfig({
  base: './',
  plugins: [offlineServiceWorker()],
  server: { port: 5173, strictPort: false },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});
