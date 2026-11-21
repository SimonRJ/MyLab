/* A release becomes active only after its entire offline catalogue is available. */
importScripts('./offline-files.js');
const scopeURL = new URL(self.registration.scope);
const prefix = 'children-of-time-atlas:' + scopeURL.pathname + ':';
const cacheName = prefix + self.ATLAS_PACK.version;
const assets = new Map(self.ATLAS_PACK.files.map(([path, digest]) => [new URL(path, scopeURL).href, digest]));
const total = assets.size;
let work;
let completed = 0;
let reported = 0;

async function announce(kind, count, reason) {
  const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  for (const client of clients) {
    if (client.url.startsWith(scopeURL.href)) client.postMessage({atlasOffline: kind, count, total, reason});
  }
}

async function download(url, digest, cache) {
  const source = new URL(url);
  source.searchParams.set('atlas-rev', digest.slice(0, 16));
  const response = await fetch(source, {cache: 'reload', credentials: 'same-origin'});
  if (!response.ok || response.type === 'opaque') throw new Error('File unavailable: '+source.pathname+' ('+response.status+')');
  const bytes = await response.clone().arrayBuffer();
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
  if (hex !== digest) throw new Error('Release file changed: '+source.pathname);
  // Store the canonical response URL so navigating to cached HTML preserves its normal URL.
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  await cache.put(url, new Response(bytes, {headers, status: 200}));
}

async function prepare() {
  const cache = await caches.open(cacheName);
  const saved = new Set((await cache.keys()).map(request => request.url));
  const missing = Array.from(assets).filter(([url]) => !saved.has(url));
  completed = total - missing.length;
  reported = completed;
  if (!missing.length) return;
  await announce('saving', completed);
  let cursor = 0, failed = false;
  async function next() {
    while (!failed && cursor < missing.length) {
      const [url, digest] = missing[cursor++];
      try {
        await download(url, digest, cache);
        completed++;
        if (completed - reported >= 8 || completed === total) {
          reported = completed;
          await announce('saving', completed);
        }
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }
  const results = await Promise.allSettled(Array.from({length: Math.min(4, missing.length)}, next));
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
}

function ensurePack() {
  if (!work) work = prepare().finally(() => { work = null; });
  return work;
}

self.addEventListener('install', event => {
  event.waitUntil(ensurePack().catch(async error => {
    await announce('failed', completed, error.message);
    throw error;
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
    await announce('ready', total);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.atlasOffline !== 'check' || !event.source?.url?.startsWith(scopeURL.href)) return;
  event.waitUntil(ensurePack().then(
    () => event.source.postMessage({atlasOffline:'ready',count:total,total}),
    error => event.source.postMessage({atlasOffline:'failed',count:completed,total,reason:error.message})
  ));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scopeURL.origin || !url.pathname.startsWith(scopeURL.pathname)) return;
  url.search = ''; url.hash = '';
  if (url.pathname.endsWith('/')) url.pathname += 'index.html';
  if (!assets.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(url.href);
    if (saved) return saved;
    await download(url.href, assets.get(url.href), cache);
    return cache.match(url.href);
  })());
});
