// СКиП v4.6: offline shell, versioned media cache and iOS byte-range playback.
const CACHE = 'skipp-v48-cinematic';
const PREFIX = 'skipp-v';
const CORE = ['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','styles.css','app.js','assets/skip-landscape-poster.jpg','assets/skip-portrait-poster.jpg','assets/skip-hud-landscape.jpg','assets/skip-hud-portrait.jpg','assets/skip-theme-emerald.webp'];
const VOICES = ['assets/voice/01_dobroe_utro.mp3','assets/voice/02_dobryy_den.mp3','assets/voice/03_dobryy_vecher.mp3','assets/voice/04_dobroy_nochi.mp3'];
CORE.push(...VOICES);
const MEDIA = ['assets/skip-intro-landscape-720.mp4','assets/skip-intro-portrait-720.mp4','assets/skip-intro-landscape-1080.mp4','assets/skip-intro-portrait-1080.mp4'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    // Download the mobile-size videos offline without delaying activation or breaking install.
    const cache = await caches.open(CACHE);
    await Promise.allSettled(MEDIA.slice(0,2).map(async path => {
      if (await cache.match(path)) return;
      const response=await fetch(path);
      if(response.ok && response.status === 200) await cache.put(path,response);
    }));
  })());
});
async function refresh(req, key) {
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);
  try { const response=await fetch(req,{signal:ctl.signal,cache:'no-cache'}); if(response && response.ok){const c=await caches.open(CACHE);await c.put(key||req,response.clone());}return response; }
  catch(e){return null;}finally{clearTimeout(timer);}
}
async function mediaResponse(req) {
  const cache=await caches.open(CACHE);
  const url=new URL(req.url);
  // A canonical non-range request must be cached; caching 206 breaks later playback.
  const key=url.href;
  let response=await cache.match(key);
  if(!response){
    try { const net=await fetch(key); if(net && net.ok && net.status===200) { await cache.put(key,net.clone());response=net; } }
    catch(e) {}
  }
  if(!response){try{return await fetch(req);}catch(e){return Response.error();}}
  const range=req.headers.get('range');
  if(!range) return response;
  const m=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if(!m) return new Response(null,{status:416});
  const blob=await response.blob(),len=blob.size;
  let start=m[1] ? Number(m[1]):null, end=m[2] ? Number(m[2]):null;
  if(start===null && end!==null){start=Math.max(0,len-end);end=len-1;}
  else{ if(start===null)start=0; if(end===null)end=len-1; }
  if(start>=len || start<0 || !Number.isInteger(start) || !Number.isInteger(end) || end<start){return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+len}});}
  end=Math.min(end,len-1);
  const chunk=blob.slice(start,end+1,'video/mp4');
  return new Response(chunk,{status:206,headers:{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${len}`,'Content-Length':String(chunk.size),'Cache-Control':'public, max-age=31536000'}});
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  if(MEDIA.some(path=>new URL(path,self.registration.scope).pathname===url.pathname)) {event.respondWith(mediaResponse(req));return;}
  if(req.mode==='navigate') {event.respondWith(caches.match('index.html').then(hit=>{const update=refresh(req,'index.html');if(hit){event.waitUntil(update);return hit;}return update.then(r=>r||caches.match('./')).then(r=>r||new Response('Нет сети и сохранённой копии',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}));}));return;}
  if(CORE.some(path=>new URL(path,self.registration.scope).pathname===url.pathname)) {const cacheKey=new URL(url.pathname,self.location.origin).href;event.respondWith(caches.match(cacheKey).then(hit=>{const update=refresh(req,cacheKey);if(hit){event.waitUntil(update);return hit;}return update.then(r=>r||Response.error());}));return;}
});
