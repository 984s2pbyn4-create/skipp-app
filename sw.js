// СКиПП: офлайн-кэш. При изменении файлов увеличьте номер версии.
const CACHE = 'skipp-v9';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Тихо скачивает свежую версию в фоне (с ограничением по времени)
function refresh(req, key){
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  return fetch(req, {signal:ctl.signal, cache:'no-cache'}).then(r => {
    clearTimeout(t);
    if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(key || req, c)); }
    return r;
  }).catch(() => { clearTimeout(t); return null; });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Страница: сразу из памяти телефона, обновление — в фоне
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(hit => {
      const upd = refresh(req, 'index.html');
      if (hit) { e.waitUntil(upd); return hit; }
      return upd.then(r => r || caches.match('./')).then(r => r || new Response('Нет сети и сохранённой копии', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}}));
    }));
    return;
  }
  // Свои файлы: из памяти, обновление в фоне
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => { const upd = refresh(req); if (hit) { e.waitUntil(upd); return hit; } return upd.then(r => r || Response.error()); }));
    return;
  }
  // Шрифты: из памяти, иначе из сети с сохранением; без сети — сразу отказ
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    }).catch(() => Response.error())));
  }
});
