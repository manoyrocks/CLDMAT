import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Emits sw.js that precaches every built asset, so the whole app works offline (REQ-NFR-03, REQ-SAF-09). */
function serviceWorker(): Plugin {
  return {
    name: 'harmony-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = ['./', './index.html', './icon.svg', './manifest.webmanifest', ...Object.keys(bundle).filter((f) => f !== 'index.html').map((f) => `./${f}`)];
      const version = Date.now().toString(36);
      const source = `const CACHE = 'harmony-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => caches.match('./'))));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  root: r('.'),
  base: './',
  plugins: [react(), serviceWorker()],
  resolve: {
    alias: {
      '@harmony/core': r('../../packages/core/src/index.ts'),
      '@harmony/content': r('../../packages/content/src/index.ts'),
      '@harmony/ai': r('../../packages/ai/src/index.ts'),
    },
  },
  server: { fs: { allow: [r('../..')] } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2020' },
});
