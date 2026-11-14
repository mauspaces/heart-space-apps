import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles/app.css';
import './ui/app.js';
import './styles/crew.css';
import './styles/minimap.css';
import './styles/demo.css';
import './styles/holo3d.css';
import './ui/crew.js';
import './ui/minimap.js';
import './ui/demo.js';

/* Offline after first load (production build only). */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

/* WebGL hologram, loaded as its own chunk; the Canvas 2D hologram stays as the fallback. */
import('./holo/holo3d.js').then(mod => mod.init3D()).catch(() => {});
