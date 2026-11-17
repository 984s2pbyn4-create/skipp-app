/* СКиП 4.9.2 Safety + Offline: scope-isolated, version-coherent shell.
 * MP4 HTTP Range requests are left to Safari; app offline video uses Cache Storage Blob URLs.
 */
const SCOPE_TAG=encodeURIComponent(new URL(self.registration.scope).pathname);
const PREFIX='skipp-scope-'+SCOPE_TAG+'-';
const CACHE=PREFIX+'v492-safety-1';
const SHELL=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','styles.css','app.js'];
const MEDIA_REQUIRED=[
  'assets/skip-landscape-poster.jpg','assets/skip-portrait-poster.jpg',
  'assets/skip-hud-landscape.jpg','assets/skip-hud-portrait.jpg',
  'assets/skip-theme-emerald.webp','assets/skip-theme-muted.webp',
  'assets/skip-intro-soundtrack.mp3',
  'assets/skip-intro-landscape-720.mp4','assets/skip-intro-portrait-720.mp4'
];
const MEDIA_OPTIONAL=[
  'assets/voice/01_dobroe_utro.mp3','assets/voice/02_dobryy_den.mp3',
  'assets/voice/03_dobryy_vecher.mp3','assets/voice/04_dobroy_nochi.mp3',
  'assets/voice/SOURCES.txt',
  'assets/skip-intro-landscape-1080.mp4','assets/skip-intro-portrait-1080.mp4'
];
const REQUIRED=SHELL.concat(MEDIA_REQUIRED);
const ALL=REQUIRED.concat(MEDIA_OPTIONAL);
const PATHS=new Set(ALL.map(p=>new URL(p,self.registration.scope).pathname));
const VIDEO_PATHS=new Set(ALL.filter(x=>x.endsWith('.mp4')).map(p=>new URL(p,self.registration.scope).pathname));
const urlOf=path=>new URL(path,self.registration.scope).href;
let warming=null;
async function broadcast(message){
  try{for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage(message);}catch(_){}
}
async function timedFetch(req,ms=12000){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),ms);
  try{return await fetch(req,{signal:ctl.signal,cache:'reload'});}finally{clearTimeout(timer);}
}
async function countCached(cache){
  const found=await Promise.all(ALL.map(p=>cache.match(urlOf(p)).then(Boolean).catch(()=>false)));
  const requiredReady=found.slice(0,REQUIRED.length).every(Boolean);
  const hdReady=found.slice(-2).every(Boolean);
  const voicesReady=found.slice(REQUIRED.length,REQUIRED.length+4).every(Boolean);
  return {requiredReady,hdReady,voicesReady,completed:found.filter(Boolean).length,total:ALL.length};
}
async function report(cache){const state=await countCached(cache);await broadcast({type:'SKIPP_OFFLINE_READY',...state});return state;}
async function cacheSet(cache,paths,{required=false}={}){
  let failed=0;
  for(const path of paths){
    const target=urlOf(path);
    if(await cache.match(target))continue;
    try{
      const response=await timedFetch(new Request(target,{credentials:'same-origin'}));
      if(!response||!response.ok||response.status!==200)throw new Error('HTTP '+response?.status);
      await cache.put(target,response);
    }catch(err){
      failed++;
      if(required)throw new Error(path+': '+(err?.message||err));
    }
    const status=await countCached(cache);
    await broadcast({type:'SKIPP_OFFLINE_PROGRESS',completed:status.completed,total:status.total,failed});
  }
  return failed;
}
async function warmMedia(){
  const cache=await caches.open(CACHE);
  try{
    // Media failures never invalidate an already installed functional app shell.
    await cacheSet(cache,MEDIA_REQUIRED);
    await cacheSet(cache,MEDIA_OPTIONAL);
    const state=await report(cache);
    if(!state.requiredReady)await broadcast({type:'SKIPP_OFFLINE_ERROR',message:'Оболочка готова, но звук или видео ещё не сохранены. Нажмите «Проверить и скачать».'});
  }catch(err){await broadcast({type:'SKIPP_OFFLINE_ERROR',message:'Не все медиафайлы сохранены; повторите загрузку при наличии сети.'});}
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    // A complete HTML/JS/CSS shell must install as one revision or not at all.
    const cache=await caches.open(CACHE);
    try{await cacheSet(cache,SHELL,{required:true});}
    catch(err){await caches.delete(CACHE);throw err;}
    // No unconditional skipWaiting: open editors must finish on the old release.
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Delete only caches owned by this precise scope, never other Pages apps.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    await report(await caches.open(CACHE));
    warming=warmMedia().finally(()=>{warming=null;});
    await warming;
  })());
});
self.addEventListener('message',event=>{
  const m=event.data||{};
  if(m.type==='SKIPP_OFFLINE_CHECK')event.waitUntil((async()=>{
    const s=await countCached(await caches.open(CACHE));
    const reply={type:'SKIPP_OFFLINE_READY',...s};
    if(event.ports?.[0])event.ports[0].postMessage(reply);
    else event.source?.postMessage(reply);
  })());
  else if(m.type==='SKIPP_OFFLINE_RETRY')event.waitUntil((async()=>{
    if(!warming)warming=warmMedia().finally(()=>{warming=null;});
    await warming;
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  // Safari must handle real video Range requests. Offline playback uses Blob URL.
  if(VIDEO_PATHS.has(url.pathname)&&req.headers.has('range'))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const stored=await cache.match(urlOf('index.html'));
      if(stored)return stored; // no hung network dependency
      try{return await timedFetch(req,8000);}catch(_){return new Response('Офлайн-оболочка недоступна. Подключитесь к интернету.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
    })());return;
  }
  if(!PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const saved=await cache.match(req,{ignoreSearch:true});
    if(saved)return saved;
    try{
      const response=await timedFetch(req,8000);
      if(response?.ok && response.status===200 && !SHELL.some(x=>new URL(x,self.registration.scope).pathname===url.pathname)){
        event.waitUntil(cache.put(urlOf(url.pathname.replace(new URL(self.registration.scope).pathname,'')),response.clone()).catch(()=>{}));
      }
      return response;
    }catch(_){return Response.error();}
  })());
});
