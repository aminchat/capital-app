/* Service Worker — app shell + knowledge base (KB) files.
 *
 * Strategies:
 *  - Shell files : precached at install, cache-first. The shell is static;
 *                  bump SHELL_VER when any of these files changes.
 *  - /kb/* files : network-first with cache fallback, and every successful
 *                  network response is stored, so the last good copy is
 *                  always available offline. The app layer (kb.js) does the
 *                  real diffing via manifest + SHA-256 and IndexedDB.
 *
 * We intentionally do NOT skipWaiting by default: a mid-session SW update
 * must never interrupt an ongoing first-aid flow.
 */
const SHELL_VER = 'fa-shell-v1';
const KB_VER = 'fa-kb-v1';

const SHELL_FILES = [
  '/',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/kb.js',
  'js/engine.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_VER)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting()) // shell changes are safe (code, not protocol data)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== SHELL_VER && k !== KB_VER)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Knowledge base: network-first, cache fallback (last good copy wins).
  if (url.pathname.endsWith('/kb/manifest.json') || url.pathname.endsWith('/kb/symptoms.json') ||
      url.pathname.endsWith('/kb/categories.json') || url.pathname.includes('/kb/cases/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(KB_VER).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else: cache-first for shell, fallback to index for navigations.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(SHELL_VER).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('/');
          throw new Error('offline');
        });
    })
  );
});
