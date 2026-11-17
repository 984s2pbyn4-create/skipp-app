// СКиП v4.9: offline shell + native video range streaming for iOS Safari.
const CACHE = 'skipp-v49-media-native';
const PREFIX = 'skipp-v';
const CORE = ['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','styles.css','app.js',
  'assets/skip-landscape-poster.jpg','assets/skip-portrait-poster.jpg',
  'assets/skip-hud-landscape.jpg','assets/skip-hud-portrait.jpg',
  'assets/skip-theme-emerald.webp','assets/skip-theme-muted.webp',
  'assets/skip-intro-soundtrack.mp3',
  'assets/voice/01_dobroe_utro.mp3','assets/voice/02_dobryy_den.mp3',
  'assets/voice/03_dobryy_vecher.mp3','assets/voice/04_dobroy_nochi.mp3'];
const MEDIA=['assets/skip-intro-landscape-720.mp4','assets/skip-intro-portrait-720.mp4','assets/skip-intro-landscape-1080.mp4','assets/skip-intro-portrait-1080.mp4'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
async function cacheFirstForOffline(req){
  const cache=await caches.open(CACHE);
  try{
    const r=await fetch(req,{cache:'no-cache'});
    if(r&&r.ok){cache.put(req.url,r.clone()).catch(()=>{});return r;}
  }catch(e){}
  return await cache.match(req,{ignoreSearch:true}) || Response.error();
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  // Do NOT intercept media Range requests. Safari's native loader must receive
  // the origin's genuine 206 response; synthetic 206 responses caused blank video.
  if(MEDIA.some(p=>new URL(p,self.registration.scope).pathname===url.pathname))return;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{const r=await fetch(req,{cache:'no-cache'});if(r.ok){cache.put('index.html',r.clone()).catch(()=>{});return r;}}
      catch(err){}
      return await cache.match('index.html') || new Response('Нет сети: откройте сохранённую версию СКиП',{status:503});
    })());return;
  }
  if(CORE.some(p=>new URL(p,self.registration.scope).pathname===url.pathname)){
    e.respondWith(cacheFirstForOffline(req));return;
  }
});
