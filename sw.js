/* СКиП 4.9.2 Safety + Offline: premium themes without changing the old media cache.
 * Existing 4.9.2 app.js expects ...v492-safety-1; we preserve that cache for video & offline diagnostics.
 * New UI shell is staged atomically in a separate cache before activation, never via skipWaiting.
 */
const SCOPE_TAG=encodeURIComponent(new URL(self.registration.scope).pathname);
const PREFIX='skipp-scope-'+SCOPE_TAG+'-';
const CACHE=PREFIX+'v492-safety-1';
const SHELL_CACHE=PREFIX+'v492-premium-ui2';
const SHELL=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png','styles.css','app.js','premium-ui.css','premium-ui.js'];
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
const SHELL_PATHS=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
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
async function countCached(){
  const media=await caches.open(CACHE),shell=await caches.open(SHELL_CACHE);
  const found=await Promise.all(ALL.map(p=>(SHELL.includes(p)?shell:media).match(urlOf(p)).then(Boolean).catch(()=>false)));
  const requiredReady=found.slice(0,REQUIRED.length).every(Boolean);
  const hdReady=found.slice(-2).every(Boolean);
  const voicesReady=found.slice(REQUIRED.length,REQUIRED.length+4).every(Boolean);
  return {requiredReady,hdReady,voicesReady,completed:found.filter(Boolean).length,total:ALL.length};
}
async function report(){const state=await countCached();await broadcast({type:'SKIPP_OFFLINE_READY',...state});return state;}
async function cacheSet(cache,paths,{required=false}={}){
  let failed=0;
  for(const path of paths){
    const target=urlOf(path);
    if(await cache.match(target))continue;
    try{
      const response=await timedFetch(new Request(target,{credentials:'same-origin'}));
      if(!response||!response.ok||response.status!==200)throw new Error('HTTP '+(response?.status||'—'));
      await cache.put(target,response);
    }catch(err){failed++;if(required)throw new Error(path+': '+(err?.message||err));}
    const status=await countCached();
    await broadcast({type:'SKIPP_OFFLINE_PROGRESS',completed:status.completed,total:status.total,failed});
  }
  return failed;
}
async function warmMedia(){
  const media=await caches.open(CACHE);
  try{
    await cacheSet(media,MEDIA_REQUIRED);
    await cacheSet(media,MEDIA_OPTIONAL);
    const state=await report();
    if(!state.requiredReady)await broadcast({type:'SKIPP_OFFLINE_ERROR',message:'Оболочка готова, но звук или видео ещё не сохранены. Нажмите «Проверить и скачать».'});
  }catch(_){await broadcast({type:'SKIPP_OFFLINE_ERROR',message:'Не все медиафайлы сохранены; повторите загрузку при наличии сети.'});}
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    // Installing these 10 resources in a distinct cache prevents mixing old HTML with new CSS/JS.
    const shell=await caches.open(SHELL_CACHE);
    try{await cacheSet(shell,SHELL,{required:true});}
    catch(err){await caches.delete(SHELL_CACHE);throw err;}
    // Never force skipWaiting: an open editor must continue on the former worker.
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const shell=await caches.open(SHELL_CACHE), media=await caches.open(CACHE);
    // Keep the old cache name expected by app.js, but refresh its shell from the verified new cache.
    for(const path of SHELL){
      const response=await shell.match(urlOf(path));
      if(!response)throw Error('Не найден обязательный ресурс: '+path);
      await media.put(urlOf(path),response.clone());
    }
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE&&k!==SHELL_CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    await report();
    warming=warmMedia().finally(()=>{warming=null;});
    await warming;
  })());
});
self.addEventListener('message',event=>{
  const m=event.data||{};
  if(m.type==='SKIPP_OFFLINE_CHECK')event.waitUntil((async()=>{
    const s=await countCached();const reply={type:'SKIPP_OFFLINE_READY',...s};
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
  if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(VIDEO_PATHS.has(url.pathname)&&req.headers.has('range'))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(SHELL_CACHE);
      const stored=await cache.match(urlOf('index.html'));
      if(stored)return stored;
      try{return await timedFetch(req,8000);}catch(_){return new Response('Офлайн-оболочка недоступна. Подключитесь к интернету.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
    })());return;
  }
  if(!PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(SHELL_PATHS.has(url.pathname)?SHELL_CACHE:CACHE);
    const saved=await cache.match(req,{ignoreSearch:true});
    if(saved)return saved;
    try{
      const response=await timedFetch(req,8000);
      if(response?.ok&&response.status===200&&!SHELL_PATHS.has(url.pathname)){
        event.waitUntil(cache.put(urlOf(url.pathname.replace(new URL(self.registration.scope).pathname,'')),response.clone()).catch(()=>{}));
      }
      return response;
    }catch(_){return Response.error();}
  })());
});
