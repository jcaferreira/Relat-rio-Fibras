const CACHE_NAME = 'rfb-cache-v2';
const ASSETS = ['./', './index.html', './icon.svg', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  // Deixa passar direto pedidos para fora da própria origem (fontes, Firebase, etc.)
  if(new URL(event.request.url).origin !== self.location.origin) return;
  // Rede primeiro: sempre tenta buscar a versão mais nova. Só usa o que está
  // guardado no aparelho se estiver offline ou a rede falhar — assim nunca
  // fica "preso" numa versão antiga esperando alguém limpar o histórico.
  event.respondWith(
    fetch(event.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return resp;
    }).catch(() => caches.match(event.request))
  );
});
