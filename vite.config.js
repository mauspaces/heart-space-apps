import { defineConfig } from 'vite';

// Relative base so the build works from any sub-path (GitHub Pages, Netlify, file server).
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: false },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});
