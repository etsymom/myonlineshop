// InkwellMedia Service Worker v1
const STATIC  = 'ink-static-v1';
const IMAGES  = 'ink-images-v1';
const DYNAMIC = 'ink-dynamic-v1';
const PRECACHE = ['/inkwell-layout.js','/style.css','/inkwell-config.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];

self.addEventListener('install', e => e.waitUntil(caches.open(STATIC).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![STATIC,IMAGES,DYNAMIC].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.protocol === 'chrome-extension:') return;
  if (url.hostname.includes('supabase.co')) return;
  if (/\.(webp|png|jpg|jpeg|gif|svg|ico)(\?.*)?$/i.test(url.pathname)) { e.respondWith(cacheFirst(e.request, IMAGES)); return; }
  if (/\.(js|css|woff2?)(\?.*)?$/i.test(url.pathname)) { e.respondWith(swr(e.request, STATIC)); return; }
  e.respondWith(netFirst(e.request, DYNAMIC));
});
async function cacheFirst(req, name) { const c = await caches.match(req); if (c) return c; const r = await fetch(req); if (r.ok) (await caches.open(name)).put(req, r.clone()); return r; }
async function swr(req, name) { const cache = await caches.open(name); const c = await cache.match(req); const p = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => c); return c || p; }
async function netFirst(req, name) { try { const r = await fetch(req); if (r.ok) (await caches.open(name)).put(req, r.clone()); return r; } catch { return caches.match(req); } }
