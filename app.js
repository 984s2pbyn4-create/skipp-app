/* СКиП v4.8 — вход по PIN перед заставкой, радиозвук, адаптивность и управление задачами. */
(function(){
'use strict';

/* ================= утилиты ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseD = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const addMonths = (s, n) => { const d = parseD(s), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return ymd(d); };
const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / 864e5);
const fmtShort = s => s ? parseD(s).toLocaleDateString('ru-RU', {day:'numeric', month:'short'}).replace('.', '') : '';
const fmtFull = s => s ? s.split('-').reverse().join('.') : '';
const fmtDT = s => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? s : d.toLocaleString('ru-RU', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}); };
const WD = ['вс','пн','вт','ср','чт','пт','сб'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
const plural = (n, one, few, many) => { const m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? few : many; };

const IC = {
  plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M18 6L6 18M6 6l12 12"/>',
  chevL:'<path d="M15 18l-6-6 6-6"/>', chevR:'<path d="M9 18l6-6-6-6"/>', chevD:'<path d="M6 9l6 6 6-6"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  hq:'<path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/>',
  me:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  send:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  boards:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v10"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 7h7M9 11h5"/>',
  archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  check:'<path d="M5 12l5 5 9-10"/>', copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>', download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', upload:'<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/>', redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', medal:'<circle cx="12" cy="15" r="5"/><path d="M8.5 11L6 3h4l2 4 2-4h4l-2.5 8"/>',
  up:'<path d="M12 19V5M5 12l7-7 7 7"/>', down:'<path d="M12 5v14M19 12l-7 7-7-7"/>', list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/>',
  clip:'<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 13h6M9 17h4"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  flag:'<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5"/>', restore:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
};
const ic = (n, s=20) => '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';

/* ================= справочники ================= */
const COLORS = ['#56688A','#2F7482','#7457A0','#B8730B','#8A6D3B','#2E7D52','#5A7F2E','#B3372B','#6B6F75'];
const DEF_TASK_ST = [
  {id:'control', name:'На контроле', color:'#56688A'},
  {id:'today',   name:'Сегодня',     color:'#B8730B'},
  {id:'collect', name:'Сбор данных', color:'#7457A0'},
  {id:'summary', name:'Обобщение',   color:'#8A6D3B'},
  {id:'done',    name:'Выполнено',   color:'#2E7D52', done:true},
  {id:'sent',    name:'Отправлено',  color:'#2F7482', done:true}
];
const DEF_ASG_ST = [
  {id:'given',    name:'Поставлено', color:'#56688A'},
  {id:'accepted', name:'Принято',    color:'#2F7482'},
  {id:'work',     name:'В работе',   color:'#B8730B'},
  {id:'reported', name:'Доложено',   color:'#2E7D52', done:true}
];
const OLD_ASG_MAP = {control:'given', today:'work', collect:'work', done:'reported', sent:'reported'};
const PRIORITIES = [{id:'low', name:'Низкий'}, {id:'mid', name:'Обычный'}, {id:'high', name:'Высокий'}];
const REPEATS = [['none','Не повторять'],['daily','Каждый день'],['weekly','Каждую неделю'],['monthly','Каждый месяц'],['yearly','Каждый год'],['custom','Через N дней']];
const REMIND_FIXED = ['','0','1','2','3','7'];
const REMINDS = [['','Не напоминать'],['0','В день срока'],['1','За 1 день'],['2','За 2 дня'],['3','За 3 дня'],['7','За неделю'],['custom','За N дней']];
const FIXED_MCOLS = [
  {id:'c_fail',  title:'Не прошли',     kind:'fixed'},
  {id:'c_pass',  title:'Прошли',        kind:'fixed'},
  {id:'c_staff', title:'Личный состав', kind:'fixed'}
];
const SECTIONS = [
  {id:'dash',    title:'Штаб',        icon:'hq'},
  {id:'mine',    title:'Мои задачи',  icon:'me'},
  {id:'orders',  title:'Указания',    icon:'send'},
  {id:'cal',     title:'Календарь',   icon:'cal'},
  {id:'boards',  title:'Доски',       icon:'boards'},
  {id:'subs',    title:'Абоненты',    icon:'phone'},
  {id:'journal', title:'ЖУПиОР',      icon:'book'},
  {id:'archive', title:'Архив',       icon:'archive'},
  {id:'trash',   title:'Корзина',     icon:'trash'},
  {id:'ext_search', title:'Поиск', icon:'search'},
  {id:'ext_analytics', title:'Аналитика', icon:'grid'},
  {id:'ext_planner', title:'Планирование', icon:'cal'},
  {id:'ext_backup', title:'Резервирование', icon:'download'}
];
const TABBAR = ['dash','mine','orders','boards'];
const secOf = id => SECTIONS.find(s => s.id === id) || SECTIONS[0];
const tSt = () => D.settings.taskStatuses;
const aSt = () => D.settings.asgStatuses;
const tStatus = id => tSt().find(s => s.id === id) || tSt()[0];
const aStatus = id => aSt().find(s => s.id === id) || aSt()[0];
const tDone = id => !!(tSt().find(s => s.id === id) || {}).done;
const aDone = id => !!(aSt().find(s => s.id === id) || {}).done;
const firstT = () => (tSt().find(s => !s.done) || tSt()[0]).id;
const firstA = () => (aSt().find(s => !s.done) || aSt()[0]).id;
const isSentStatus = id => /отправ|доведен/i.test(tStatus(id).name);
const prName = id => (PRIORITIES.find(p => p.id === id) || PRIORITIES[1]).name;

/* ================= хранилище на устройстве ================= */
const KEY = 'skipp_offline_v2';
const DASH_DEFAULT = ['tiles','od','bn','im','rm','statuses','load'];
let STORAGE_OK = true;
let STORAGE_READONLY = false;
let LAST_RAW = null;
let BASELINE_READY = false;
let PENDING_WRITES = 0;
let LAST_SAVE_ERROR = null;
// The banner reports durability, not merely an optimistic UI change.
let SAVE_NOTICE_TIMER = null;
function saveNotice(message, state='pending') {
  let el = document.getElementById('skipp-save-notice');
  if (!el) {
    el = document.createElement('div'); el.id = 'skipp-save-notice';
    el.setAttribute('role','status'); el.setAttribute('aria-live','polite');
    el.style.cssText = 'position:fixed;bottom:76px;right:12px;z-index:99999;padding:8px 12px;border-radius:10px;font:12px system-ui,sans-serif;box-shadow:0 2px 14px #0003;background:#263648;color:#fff;pointer-events:none;max-width:260px';
    document.body.appendChild(el);
  }
  clearTimeout(SAVE_NOTICE_TIMER);
  el.textContent = message;
  el.style.background = state === 'error' ? '#9b2535' : state === 'done' ? '#25654a' : '#263648';
  el.hidden = false;
  if (state === 'done') SAVE_NOTICE_TIMER = setTimeout(() => { el.hidden = true; }, 1800);
}
function saveStatus(promise) {
  if (!promise || typeof promise.then !== 'function') return;
  saveNotice('Сохранение…');
  promise.then(() => { if (!PENDING_WRITES && !STORAGE_READONLY) saveNotice('Сохранено', 'done'); },
    () => saveNotice('Не сохранено — работа заблокирована', 'error'));
}
let SKIPP_CHANNEL = null;
try { if ('BroadcastChannel' in window) SKIPP_CHANNEL = new BroadcastChannel('skipp-storage-v17'); } catch (_) {}
function notifyOtherTabs(raw) {
  if (SKIPP_CHANNEL) try { SKIPP_CHANNEL.postMessage({type:'saved', raw, at:Date.now()}); } catch (_) {}
}
if (SKIPP_CHANNEL) SKIPP_CHANNEL.onmessage = event => {
  const msg = event.data;
  if (!msg || msg.type !== 'saved' || msg.raw === LAST_RAW) return;
  setReadOnly(new Error('База обновлена другой вкладкой. Перезагрузите страницу для получения актуальных данных.'));
  saveNotice('Изменения в другой вкладке — обновите страницу', 'error');
};
function checkExternalChange(){
  if (PRIMARY_IDB_ENABLED) return; // IndexedDB compare-and-swap is authoritative.
  const current = localStorage.getItem(KEY);
  if (BASELINE_READY && current !== LAST_RAW) {
    setReadOnly(new Error('База изменена другой вкладкой или процессом'));
    throw new Error('Конфликт изменений между вкладками');
  }
}
// Writes are serialized. IndexedDB commits first; localStorage is a legacy mirror.
// A failed mirror does not invalidate an already committed IndexedDB transaction.
async function writeMain(value, pinMetadata, force=false){
  if (!force) checkExternalChange();
  const previous = LAST_RAW;
  if (PRIMARY_IDB_ENABLED) {
    const db = await recoveryDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('primary','readwrite');
      const store = tx.objectStore('primary');
      const req = store.get('current');
      let conflict = null;
      req.onsuccess = () => {
        const existing = req.result;
        if (!force && existing && existing.raw !== previous) { conflict = new Error('Данные IndexedDB изменены другой вкладкой'); tx.abort(); return; }
        const pin = pinMetadata === undefined ? (existing ? existing.pin : localStorage.getItem(PIN_KEY)) : pinMetadata;
        store.put({id:'current',raw:value,pin:pin == null ? null : pin,at:Date.now()});
      };
      req.onerror = () => { conflict = req.error; tx.abort(); };
      tx.oncomplete = resolve;
      tx.onabort = () => reject(conflict || tx.error || new Error('Не удалось записать IndexedDB'));
      tx.onerror = () => {};
    });
  }
  // On a crash between IDB commit and this mirror, startup repairs the mirror.
  LAST_RAW = value; BASELINE_READY = true;
  try { storageWrite(KEY,value); }
  catch (err) {
    if (!PRIMARY_IDB_ENABLED) throw err;
    // Main transaction is already committed; a legacy mirror failure is not data loss.
    console.warn('IndexedDB сохранена; зеркало localStorage недоступно',err);
    saveNotice('Сохранено в IndexedDB; зеркало недоступно', 'done');
  }
  notifyOtherTabs(value);
  if (!force && previous && previous !== value) {
    let transition = false;
    try { transition = JSON.parse(value).enc === 1 && JSON.parse(previous).enc !== 1; } catch(err) {}
    if (!transition) recoveryQueue(previous);
  }
}
function primaryGet(){
  return recoveryDb().then(db => new Promise((resolve,reject) => {
    const tx=db.transaction('primary','readonly');
    const req=tx.objectStore('primary').get('current');
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('Ошибка чтения IndexedDB'));
  }));
}
function primaryPutInitial(raw,pin){
  return recoveryDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction('primary','readwrite');
    const store=tx.objectStore('primary');
    const req=store.get('current');
    req.onsuccess=()=>{ if (!req.result) store.put({id:'current',raw,pin,at:Date.now()}); };
    tx.oncomplete=()=>resolve();
    tx.onabort=()=>reject(tx.error||new Error('Миграция IndexedDB прервана'));
  }));
}
async function initializePrimary(){
  // No legacy data is deleted. IDB unavailability leaves the old storage usable.
  let current;
  try { current = await primaryGet(); PRIMARY_IDB_ENABLED = true; }
  catch(err) { console.warn('IndexedDB недоступна, сохранение через localStorage',err); PRIMARY_IDB_READY=true; return; }
  try {
    const legacy = localStorage.getItem(KEY);
    if (!current) {
      if (legacy) await primaryPutInitial(legacy,localStorage.getItem(PIN_KEY));
    } else if (legacy !== current.raw) {
      // IDB is authoritative after migration. Keep the conflicting legacy bytes
      // separately before repairing the mirror; never silently discard them.
      if (legacy && legacy !== current.raw) {
        const existingConflict = localStorage.getItem('skipp_legacy_conflict_v14');
        if (!existingConflict) storageWrite('skipp_legacy_conflict_v14',legacy);
      }
      storageWrite(KEY,current.raw);
    }
    if (current) {
      const pin = localStorage.getItem(PIN_KEY);
      if (current.pin && current.pin !== pin) storageWrite(PIN_KEY,current.pin);
      else if (current.pin === null && pin) localStorage.removeItem(PIN_KEY);
    }
  } catch(err) { setReadOnly(err); }
  PRIMARY_IDB_READY = true;
}
/* IndexedDB: independent recovery snapshots. The legacy localStorage key remains
   the authoritative format for backward compatibility; never delete it on migration. */
const RECOVERY_DB = 'skipp_recovery_v1';
let PRIMARY_IDB_READY = false;
let PRIMARY_IDB_ENABLED = false;
let IDB_WRITE_QUEUE = Promise.resolve();
let RECOVERY_DB_PROMISE = null;
function recoveryDb(){
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB недоступна'));
  if (!RECOVERY_DB_PROMISE) RECOVERY_DB_PROMISE = new Promise((resolve,reject) => {
    const req = indexedDB.open(RECOVERY_DB, 2);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('snapshots')) req.result.createObjectStore('snapshots', {keyPath:'id'}); if (!req.result.objectStoreNames.contains('primary')) req.result.createObjectStore('primary', {keyPath:'id'}); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Ошибка IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB заблокирована другой вкладкой'));
  }).catch(err => { RECOVERY_DB_PROMISE = null; throw err; });
  return RECOVERY_DB_PROMISE;
}
async function eraseAllLocalData(){
  // Never reload if an IndexedDB transaction fails: otherwise startup could restore the old PIN.
  await IDB_WRITE_QUEUE;
  await RECOVERY_SNAPSHOT_QUEUE;
  if (PENDING_WRITES) throw new Error('Дождитесь завершения сохранения');
  const db = await recoveryDb();
  await new Promise((resolve,reject) => {
    const tx = db.transaction(['primary','snapshots'],'readwrite');
    tx.objectStore('primary').clear();
    tx.objectStore('snapshots').clear();
    tx.oncomplete=resolve;
    tx.onabort=()=>reject(tx.error || new Error('Не удалось очистить IndexedDB'));
    tx.onerror=()=>{};
  });
  // No legacy data may survive and be migrated back to an empty IndexedDB.
  for (const key of [KEY,PIN_KEY,'skipp_pin_fail','skipp_aux','skipp_dx','skipp_legacy_conflict_v14',UKEY]) localStorage.removeItem(key);
  LAST_RAW=null; BASELINE_READY=false;
  notifyOtherTabs('');
}
async function recoveryPut(raw){
  if (!raw) return false;
  const db = await recoveryDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('snapshots','readwrite'), store = tx.objectStore('snapshots');
    store.put({id:'previous',raw:raw,at:Date.now()});
    tx.oncomplete = () => resolve(true);
    tx.onabort = () => reject(tx.error || new Error('Транзакция снимка отменена'));
    tx.onerror = () => reject(tx.error || new Error('Ошибка снимка'));
  });
}
async function recoveryGet(){
  const db = await recoveryDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('snapshots','readonly');
    const req = tx.objectStore('snapshots').get('previous');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Ошибка чтения снимка'));
  });
}
async function recoveryClear(){
  // Wait for previously queued snapshots: otherwise a delayed plaintext write
  // can recreate a snapshot after PIN activation clears the store.
  await RECOVERY_SNAPSHOT_QUEUE;
  const db = await recoveryDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('snapshots','readwrite');
    tx.objectStore('snapshots').clear();
    tx.oncomplete = () => resolve(true);
    tx.onabort = () => reject(tx.error || new Error('Не удалось очистить снимки'));
  });
}
let RECOVERY_SNAPSHOT_QUEUE = Promise.resolve();
function recoveryQueue(raw){
  if (!raw || SEC.decoy) return RECOVERY_SNAPSHOT_QUEUE;
  // Serialize snapshots. PIN transitions await this queue before clearing
  // plaintext backups. Snapshot failures must not block the primary database.
  RECOVERY_SNAPSHOT_QUEUE = RECOVERY_SNAPSHOT_QUEUE.then(() => recoveryPut(raw)).catch(err => {
    console.warn('Резервный снимок IndexedDB недоступен',err);
  });
  return RECOVERY_SNAPSHOT_QUEUE;
}
async function offerRecovery(){
  if (SEC.decoy || SEC.locked) return;
  let snap;
  try { snap = await recoveryGet(); } catch (err) { return; }
  if (!snap || !snap.raw) return;
  let primary = null;
  try { primary = localStorage.getItem(KEY); } catch (err) { return; }
  let broken = STORAGE_READONLY;
  if (!broken && primary) { try { const obj=JSON.parse(primary); if (!obj || (obj.enc !== 1 && !Array.isArray(obj.tasks))) broken=true; } catch(err){broken=true;} }
  if (!broken) return;
  if (!(await confirmDlg('Обнаружена повреждённая база. Найдена резервная копия в IndexedDB. Восстановить её? Текущие данные будут заменены.', 'Восстановить'))) return;
  try {
    const parsed = JSON.parse(snap.raw);
    if (parsed.enc !== 1) {
      if (pinRec()) throw new Error('Нельзя восстановить открытую копию поверх PIN-защищённой базы');
      validateData(parsed);
    } else if (!pinRec()) throw new Error('Нет PIN для зашифрованной копии');
    if (PRIMARY_IDB_ENABLED) { const live = await primaryGet(); if (live && live.raw && live.raw !== primary) throw new Error('Основная база изменилась; восстановление отменено'); }
    await writeMain(snap.raw, undefined, true);
    location.reload();
  } catch(err){ toast('Не удалось восстановить резервный снимок'); console.error(err); }
}
const VALID_COLLECTIONS = ['tasks','boards','bcards','people','mcols','subs','journal','trash'];
const IMPORT_LIMITS = {tasks:30000,boards:300,bcards:30000,people:20000,mcols:1000,subs:30000,journal:30000,trash:30000};
function validateImportBounds(d){
  let visited=0;
  const walk=(value,depth)=>{
    if (++visited>900000 || depth>22) throw new Error('Превышена сложность файла');
    if (typeof value==='string' && value.length>200000) throw new Error('Слишком длинное текстовое поле');
    if (typeof value==='number' && !Number.isFinite(value)) throw new Error('Недопустимое число');
    if (Array.isArray(value)) {
      if (value.length>40000) throw new Error('Слишком длинный массив');
      for(const x of value) walk(x,depth+1);
    } else if (value && typeof value==='object') {
      const keys=Object.keys(value);
      if (keys.length>350) throw new Error('Слишком много полей');
      for(const k of keys) { if (k==='__proto__' || k==='constructor' || k==='prototype') throw new Error('Недопустимое поле'); walk(value[k],depth+1); }
    }
  };
  for (const [name,limit] of Object.entries(IMPORT_LIMITS)) {
    if (Array.isArray(d[name]) && d[name].length>limit) throw new Error('Слишком много записей: '+name);
  }
  walk(d,0);
  for(const t of d.tasks){
    if (typeof t.id!=='string' || !t.id || t.id.length>200) throw new Error('Некорректный идентификатор задачи');
    if (t.assignees && t.assignees.length>500) throw new Error('Слишком много исполнителей');
    if (t.checklist && t.checklist.length>1000) throw new Error('Слишком длинный чек-лист');
  }
  return d;
}
function validateData(d){
  if (!d || typeof d !== 'object' || Array.isArray(d) || !Array.isArray(d.tasks)) throw new Error('Некорректная база задач');
  for (const k of VALID_COLLECTIONS) if (Object.prototype.hasOwnProperty.call(d,k) && !Array.isArray(d[k])) throw new Error('Неверный формат: ' + k);
  if (d.settings != null && (typeof d.settings !== 'object' || Array.isArray(d.settings))) throw new Error('Неверные настройки');
  for (const k of VALID_COLLECTIONS) if (Array.isArray(d[k]) && d[k].some(x => !x || typeof x !== 'object' || Array.isArray(x))) throw new Error('Некорректные записи: ' + k);
  for (const t of d.tasks) {
    if (t.assignees != null && (!Array.isArray(t.assignees) || t.assignees.some(a => !a || typeof a !== 'object' || Array.isArray(a)))) throw new Error('Некорректные исполнители задачи');
    if (t.checklist != null && (!Array.isArray(t.checklist) || t.checklist.some(i => !i || typeof i !== 'object' || Array.isArray(i)))) throw new Error('Некорректный список проверки');
  }
  for (const b of d.boards || []) if (b.cols != null && (!Array.isArray(b.cols) || b.cols.some(c => !c || typeof c !== 'object' || Array.isArray(c)))) throw new Error('Некорректные столбцы доски');
  for (const t of d.trash || []) if (t.cards != null && !Array.isArray(t.cards)) throw new Error('Некорректная корзина');
  if (d.settings && d.settings.dash != null && (typeof d.settings.dash !== 'object' || Array.isArray(d.settings.dash))) throw new Error('Некорректная панель');
  if (d.settings && ['taskStatuses','asgStatuses'].some(k => d.settings[k] != null && !Array.isArray(d.settings[k]))) throw new Error('Некорректные статусы');
  return validateImportBounds(d);
}
function setReadOnly(reason){ STORAGE_READONLY = true; console.error(reason); setTimeout(() => toast('Данные не загружены или не сохранены. Работа только для чтения; восстановите резервную копию.'), 100); }
function storageWrite(key, value){ localStorage.setItem(key, value); if (localStorage.getItem(key) !== value) throw new Error('Не удалось проверить запись'); }
function safeIterations(n){ const v = Number(n == null ? ITER : n); if (!Number.isInteger(v) || v < 10000 || v > 2000000) throw new Error('Недопустимые параметры шифрования'); return v; }
function blank(){
  return {v:2, tasks:[], boards:[], bcards:[], people:[], mcols:[], subs:[], journal:[], trash:[],
    settings:{theme:'emerald', splashQuality:'1080', splashSound:true, splashRadio:true, splashMode:'always', splash:true, sign:'', dash:{order:DASH_DEFAULT.slice(), hidden:{}, custom:{}},
      taskStatuses:clone(DEF_TASK_ST), asgStatuses:clone(DEF_ASG_ST), views:{mine:'list', orders:'list'},
      tpl:{order:'emoji', remind:'emoji', customOrder:'', customRemind:''}}};
}
let D = blank();
function applyLoaded(d){
  const b = blank();
  validateData(d);
  D = Object.assign(b, d);
  for (const k of VALID_COLLECTIONS) if (!Array.isArray(D[k])) D[k] = [];
  D.settings = Object.assign(b.settings, d.settings || {});
  D.settings.dash = Object.assign(blank().settings.dash, (d.settings || {}).dash || {});
  D.settings.tpl = Object.assign(blank().settings.tpl, (d.settings || {}).tpl || {});
  migrate();
}
/* ---- шифрование (AES-GCM, ключ из кода-пароля через PBKDF2) ---- */
const CRYPTO_OK = !!(window.crypto && crypto.subtle && window.isSecureContext !== false);
const ITER = 310000;
const SEC = {key:null, locked:false, decoy:false, q:Promise.resolve(), hiddenAt:0};
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(secret, salt, iter){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt:salt, iterations:safeIterations(iter), hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
}
async function encStr(key, str){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, key, new TextEncoder().encode(str)));
  return {iv:b64e(iv), ct:b64e(ct)};
}
async function decStr(key, env){ return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:b64d(env.iv)}, key, b64d(env.ct))); }
function pinRec(){ try { return JSON.parse(localStorage.getItem('skipp_pin') || 'null'); } catch (e) { return null; } }
function pinRecV2(){ const r = pinRec(); return r && r.v === 2 ? r : null; }
function load(){
  try { const t = '__t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { STORAGE_OK = false; }
  let raw = null;
  try { raw = localStorage.getItem(KEY); LAST_RAW = raw; BASELINE_READY = true; } catch (e) { setReadOnly(new Error('Не удалось прочитать локальное хранилище')); return; }
  if (raw) {
    let obj = null; try { obj = JSON.parse(raw); } catch (e) { console.error(e); }
    if (obj && obj.enc === 1) { D = blank(); D.savedAt = 0; SEC.locked = true; if (!pinRec()) setReadOnly(new Error('Зашифрованная база без записи PIN. Требуется восстановление доступа.')); return; }
    if (obj) { try { applyLoaded(obj); return; } catch (e) { setReadOnly(e); } }
    else setReadOnly(new Error('Повреждённый JSON')); 
  }
  D = blank();
  D.savedAt = 0;
}
function migrate(){
  if ((D.boards || []).some(b => b.kind === 'medals')) {
    if (!Array.isArray(D.trash)) D.trash = [];
    D.boards.filter(b => b.kind === 'medals').forEach((b, i) => {
      D.trash.unshift({id:uid(), kind:'board', item:{title:b.title}, deletedAt:Date.now(), board:clone(b), cards:[], people:i === 0 ? clone(D.people || []) : [], mcols:i === 0 ? clone(D.mcols || []) : []});
    });
    D.boards = D.boards.filter(b => b.kind !== 'medals'); D.people = []; D.mcols = [];
  }
  if (!Array.isArray(D.trash)) D.trash = [];
  // Корзина не очищается автоматически при чтении или миграции данных.
  const b = blank().settings;
  ['taskStatuses','asgStatuses'].forEach(k => { if (!Array.isArray(D.settings[k]) || !D.settings[k].length) D.settings[k] = b[k]; });
  D.settings.views = Object.assign(b.views, D.settings.views || {});
  D.settings.tpl = Object.assign(b.tpl, D.settings.tpl || {});
  if ((D.v || 2) < 3) {
    D.tasks.forEach(t => (t.assignees || []).forEach(a => { a.status = OLD_ASG_MAP[a.status] || a.status || 'given'; }));
    D.v = 3;
  }
  const ta = new Set(aSt().map(s => s.id)), tt = new Set(tSt().map(s => s.id));
  D.tasks.forEach(t => { if (!tt.has(t.status)) t.status = firstT(); (t.assignees || []).forEach(a => { if (!ta.has(a.status)) a.status = firstA(); }); });
}
function saveLocal(){
  if (!STORAGE_OK || STORAGE_READONLY || SEC.locked) { toast('Сохранение недоступно'); return false; }
  const str=JSON.stringify(D);
  if (pinRecV2() && !SEC.key) return false;
  const key=SEC.key, dest=SEC.decoy?'skipp_dx':KEY;
  const operation=IDB_WRITE_QUEUE.then(async()=>{
    // A previous failed write must not be followed by queued stale writes.
    if (!STORAGE_OK || STORAGE_READONLY || SEC.locked) throw new Error('Запись отменена: хранилище заблокировано');
    if (key) {
      const env=await encStr(key,str);
      const encoded=JSON.stringify({enc:1,iv:env.iv,ct:env.ct});
      if (dest===KEY) await writeMain(encoded, SEC.duressWipe ? localStorage.getItem(PIN_KEY) : undefined, !!SEC.duressWipe);
      else storageWrite(dest,encoded);
    } else await writeMain(str);
  });
  PENDING_WRITES++;
  const tracked=operation.then(()=>{PENDING_WRITES--;return true;},err=>{
    PENDING_WRITES--; LAST_SAVE_ERROR=err; STORAGE_OK=false;
    setReadOnly(err); toast('Ошибка записи. Изменения заблокированы до восстановления.'); throw err;
  });
  IDB_WRITE_QUEUE=tracked.catch(()=>{});
  SEC.q=IDB_WRITE_QUEUE;
  saveStatus(tracked);
  return tracked;
}
function save(){
  if (PENDING_WRITES || STORAGE_READONLY || !STORAGE_OK || SEC.locked || !PRIMARY_IDB_READY) {
    toast('Подождите завершения сохранения'); return false;
  }
  const old = D.savedAt; D.savedAt = Date.now();
  const result = saveLocal();
  if (result === false) D.savedAt = old;
  return result;
}
// v1.8: delayed settings input, with no speculative mutation of durable state.
const SETTING_INPUTS = new Map();
function scheduleTemplateSetting(key, value) { scheduleSetting('tpl.' + key, value); }
let SETTING_TIMER = null;
function scheduleSetting(key, value) {
  SETTING_INPUTS.set(key, value);
  clearTimeout(SETTING_TIMER);
  SETTING_TIMER = setTimeout(flushSettings, 450);
}
function flushSettings() {
  if (!SETTING_INPUTS.size) return;
  if (PENDING_WRITES) { SETTING_TIMER = setTimeout(flushSettings, 180); return; }
  if (STORAGE_READONLY || !STORAGE_OK || SEC.locked || !PRIMARY_IDB_READY) { SETTING_INPUTS.clear(); toast('Настройки не сохранены'); return; }
  const changes = Array.from(SETTING_INPUTS);
  if (commit(() => { for (const [key, value] of changes) { if (key.startsWith('tpl.')) D.settings.tpl[key.slice(4)] = value; else D.settings[key] = value; } })) {
    for (const [key, value] of changes) if (SETTING_INPUTS.get(key) === value) SETTING_INPUTS.delete(key);
  }
  if (SETTING_INPUTS.size) SETTING_TIMER = setTimeout(flushSettings, 500);
}
const HIST = {undo:[], redo:[]};
function commit(fn){
  SEARCH_TEXT_CACHE = new WeakMap();
  URGENCY_KEY_CACHE = new WeakMap();
  // A second edit must not race an unfinished durable transaction.
  if (!PRIMARY_IDB_READY || STORAGE_READONLY || !STORAGE_OK || SEC.locked || PENDING_WRITES) {
    toast(PENDING_WRITES ? 'Подождите завершения сохранения' : 'Изменения заблокированы: сохранение недоступно'); return false;
  }
  const before = JSON.stringify(D);
  try { fn(); autoArchive(true); } catch(e) { D = JSON.parse(before); toast('Не удалось выполнить действие'); console.error(e); render(); return false; }
  const result = save();
  if (result === false) { D = JSON.parse(before); render(); return false; }
  HIST.undo.push(before); if (HIST.undo.length > 40) HIST.undo.shift();
  HIST.redo.length = 0;
  if (result && typeof result.then === 'function') result.catch(() => {
    // The failed edit is not durable; restore the last known in-memory state.
    // Storage remains read-only until the user recovers/reloads.
    D = JSON.parse(before);
    HIST.undo.pop(); HIST.redo.length = 0;
    render(); saveNotice('Изменение отменено: ошибка сохранения', 'error');
  });
  render(); return true; // true means accepted for persistence, NOT persisted yet
}
function undo(){
  if (!HIST.undo.length || STORAGE_READONLY || PENDING_WRITES) { if (PENDING_WRITES) toast('Дождитесь завершения сохранения'); return; }
  const prev = JSON.stringify(D), target = HIST.undo[HIST.undo.length-1];
  D = JSON.parse(target); const r = save();
  if (r === false) { D = JSON.parse(prev); return; }
  HIST.undo.pop(); HIST.redo.push(prev);
  if (r && typeof r.then === 'function') r.catch(() => { D=JSON.parse(prev); HIST.redo.pop(); HIST.undo.push(target); render(); });
  render();
}
function redo(){
  if (!HIST.redo.length || STORAGE_READONLY || PENDING_WRITES) { if (PENDING_WRITES) toast('Дождитесь завершения сохранения'); return; }
  const prev = JSON.stringify(D), target = HIST.redo[HIST.redo.length-1];
  D = JSON.parse(target); const r = save();
  if (r === false) { D = JSON.parse(prev); return; }
  HIST.redo.pop(); HIST.undo.push(prev);
  if (r && typeof r.then === 'function') r.catch(() => { D=JSON.parse(prev); HIST.undo.pop(); HIST.redo.push(target); render(); });
  render();
}

/* ================= модель задач ================= */
const hasAsg = t => (t.assignees || []).length > 0;
const isDone = t => tDone(t.status);
const isOverdue = t => !!t.due && !isDone(t) && (t.due < today() || (t.due === today() && t.dueTime && t.dueTime < pad(new Date().getHours())+':'+pad(new Date().getMinutes())));
const isSoon = t => !!t.due && !isDone(t) && t.due >= today() && diffDays(t.due, today()) <= 1;
const isBurning = t => !isDone(t) && !isOverdue(t) && (isSoon(t) || t.status === 'today');
const isImportant = t => !isDone(t) && t.priority === 'high';
const remindActive = t => {
  if(isDone(t))return false;
  if(t.remindAt){const at=new Date(t.remindAt).getTime();return Number.isFinite(at)&&Date.now()>=at;}
  if(!t.due || t.remind == null || t.remind === '')return false;
  const td=today();return td>=addDays(t.due,-Number(t.remind))&&td<=t.due;
};
const activeTasks = () => D.tasks.filter(t => !t.archived);
const mineTasks = () => activeTasks().filter(t => !hasAsg(t));
const orderTasks = () => activeTasks().filter(hasAsg);
const asgOverdue = (t, a) => !!t.due && !aDone(a.status) && t.due < today();
const allReported = t => hasAsg(t) && t.assignees.every(a => aDone(a.status));

function dueLabel(t){
  if (!t.due) return 'Без срока';
  const d = diffDays(t.due, today());
  if (d < 0 && !isDone(t)) return 'Просрочено на ' + (-d) + ' дн.';
  if (d === 0) return 'Сегодня'+(t.dueTime?' в '+t.dueTime:'');
  if (d === 1) return 'Завтра'+(t.dueTime?' в '+t.dueTime:'');
  if (d === -1) return 'Вчера'+(t.dueTime?' в '+t.dueTime:'');
  return fmtShort(t.due)+(t.dueTime?' в '+t.dueTime:'')+(parseD(t.due).getFullYear()!==new Date().getFullYear()?' '+parseD(t.due).getFullYear():'');
}
// v4.0: cache urgency keys per render to avoid recalculating overdue status
// O(n log n) times while sorting large lists. Keys are invalidated on edits.
let URGENCY_KEY_CACHE = new WeakMap();
function urgencyKey(t){
  let key=URGENCY_KEY_CACHE.get(t);
  if(!key){
    const weights={high:0,mid:1,low:2};
    key=[isOverdue(t)?0:1,t.due||'9999',weights[t.priority]??1,t.createdAt||0];
    URGENCY_KEY_CACHE.set(t,key);
  }
  return key;
}
function urgencySortFast(a,b){
  const x=urgencyKey(a),y=urgencyKey(b);
  if(x[0]!==y[0])return x[0]-y[0];
  if(x[1]!==y[1])return x[1]<y[1]?-1:1;
  return (x[2]-y[2])||(x[3]-y[3]);
}
function urgencySort(a, b){
  const oa = isOverdue(a) ? 0 : 1, ob = isOverdue(b) ? 0 : 1;
  if (oa !== ob) return oa - ob;
  const da = a.due || '9999', db = b.due || '9999';
  if (da !== db) return da < db ? -1 : 1;
  const w = {high:0, mid:1, low:2};
  return ((w[a.priority] ?? 1) - (w[b.priority] ?? 1)) || ((a.createdAt || 0) - (b.createdAt || 0));
}
function nextDue(t){
  const step = s => {
    if (t.repeat === 'daily') return addDays(s, 1);
    if (t.repeat === 'weekly') return addDays(s, 7);
    if (t.repeat === 'monthly') return addMonths(s, 1);
    if (t.repeat === 'yearly') return addMonths(s, 12);
    if (t.repeat === 'custom') return addDays(s, Math.max(1, Number(t.repeatDays) || 1));
    return addDays(s, 1);
  };
  let d = step(t.due || today()), n = 0;
  while (d < today() && n < 200000) { d = step(d); n++; }
  return d;
}
function spawnNext(t){
  if (!t.repeat || t.repeat === 'none' || t.spawned) return;
  // v2.6: repeat creation is idempotent even for older records without spawned flag.
  if (D.tasks.some(x => x.repeatParentId === t.id)) { t.spawned = true; return; }
  t.spawned = true;
  const n = clone(t);
  Object.assign(n, {id:uid(), repeatParentId:t.id, due:nextDue(t), status:firstT(), completedAt:null, archived:false, archivedAt:null, spawned:false, sentMeta:null, createdAt:Date.now(), updatedAt:Date.now(), order:Date.now()});
  n.assignees = (n.assignees || []).map(a => ({name:a.name, status:firstA()}));
  n.checklist = (n.checklist || []).map(i => ({id:uid(), text:i.text, done:false}));
  D.tasks.push(n);
  setTimeout(() => toast('Создана следующая задача на ' + fmtShort(n.due)), 50);
}
function setOverall(t, s){
  const was = tDone(t.status);
  t.status = s; t.updatedAt = Date.now();
  if (tDone(s)) { if (!t.completedAt) t.completedAt = Date.now(); if (!was) spawnNext(t); }
  else t.completedAt = null;
}
/* ---- корзина ---- */
const TRASH_KIND = {task:'Задача', bcard:'Карточка доски', person:'Наградная доска', sub:'Абонент', j:'Запись ЖУПиОР', board:'Доска'};
function toTrash(kind, item, extra){
  D.trash.unshift(Object.assign({id:uid(), kind:kind, item:clone(item), deletedAt:Date.now()}, extra || {}));
  const arr = {task:'tasks', bcard:'bcards', person:'people', sub:'subs', j:'journal'}[kind];
  if (arr) D[arr] = D[arr].filter(x => x.id !== item.id);
}
function trashLabel(x){ const it = x.item || {}; return it.title || it.fio || it.name || it.brief || (x.board && x.board.title) || 'Без названия'; }
function restoreTrash(x){
  const it = x.item;
  if (x.kind === 'task') { if (D.tasks.some(y => y.id === it.id)) return 'Задача уже существует'; it.archived = false; D.tasks.push(it); }
  else if (x.kind === 'bcard') { if (D.bcards.some(y => y.id === it.id)) return 'Карточка уже существует'; if (!D.boards.some(b => b.id === it.board)) return 'Доска этой карточки удалена — сначала восстановите доску'; D.bcards.push(it); }
  else if (x.kind === 'person') { if (D.people.some(y => y.id === it.id)) return 'Запись уже существует'; D.people.push(it); }
  else if (x.kind === 'sub') { if (D.subs.some(y => y.id === it.id)) return 'Абонент уже существует'; D.subs.push(it); }
  else if (x.kind === 'j') { if (D.journal.some(y => y.id === it.id)) return 'Запись уже существует'; D.journal.push(it); }
  else if (x.kind === 'board') { if (D.boards.some(y => y.id === x.board.id)) return 'Доска уже существует'; D.boards.push(x.board); (x.cards || []).forEach(c => { if (!D.bcards.some(y => y.id === c.id)) D.bcards.push(c); }); if (x.people) { x.people.forEach(p => { if (!D.people.some(y => y.id === p.id)) D.people.push(p); }); (x.mcols || []).forEach(c => { if (!D.mcols.some(y => y.id === c.id)) D.mcols.push(c); }); } }
  D.trash = D.trash.filter(y => y.id !== x.id);
  return null;
}
function autoArchive(skipSave){
  const td = today(); let n = 0;
  const hasToday = tSt().some(s => s.id === 'today' && !s.done), f = firstT();
  D.tasks.forEach(t => {
    if (!t.archived && isDone(t) && t.completedAt && ymd(new Date(t.completedAt)) < td) { t.archived = true; t.archivedAt = Date.now(); n++; }
    else if (hasToday && f !== 'today' && !t.archived && !isDone(t) && t.due && t.due <= td && t.status === f) { t.status = 'today'; t.updatedAt = Date.now(); n++; }
  });
  if (n && !skipSave && !STORAGE_READONLY && !SEC.locked) save();
}
function knownNames(){
  const set = new Map();
  D.subs.forEach(s => { if (s.name) set.set(s.name.toLowerCase(), {name:s.name, src:'абонент'}); });
  D.tasks.forEach(t => (t.assignees || []).forEach(a => { if (a.name && !set.has(a.name.toLowerCase())) set.set(a.name.toLowerCase(), {name:a.name, src:'ранее'}); }));
  return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

/* ================= тексты для мессенджера ================= */
function dueText(t){
  if (!t.due) return 'без срока';
  const d = parseD(t.due);
  return 'до ' + fmtFull(t.due) + (t.dueTime ? ' '+t.dueTime : '') + ' (' + WD[d.getDay()] + ')';
}
const TPL = {
  order:{
    official:{name:'Официальный', text:'ЗАДАЧА\nКому: {кому}\n\n{задача}\n{подробности}\n\n{пункты}\n\nСрок: {срок}\n{приоритет}\n\nПрошу подтвердить получение.\n\n{подпись}'},
    short:{name:'Краткий', text:'{кому}, {задача}. Срок — {срок}. Подтвердите получение.\n{подпись}'},
    emoji:{name:'С эмодзи', text:'📌 {задача}\n👤 {кому}\n⏰ Срок: {срок}\n❗ {приоритет}\n\n{подробности}\n{пункты}\n\n{подпись}'},
    custom:{name:'Свой шаблон', text:''}
  },
  remind:{
    official:{name:'Официальный', text:'НАПОМИНАНИЕ\nКому: {кому}\n\nПо задаче: {задача}\nСрок: {срок} — {осталось}\n\nПрошу доложить о ходе выполнения.\n\n{подпись}'},
    short:{name:'Краткий', text:'{кому}, напоминаю: {задача}. Срок {срок} ({осталось}). Доложите о выполнении.\n{подпись}'},
    emoji:{name:'С эмодзи', text:'⏰ Напоминание\n📌 {задача}\n👤 {кому}\n📅 {срок} — {осталось}\n\n{подпись}'},
    custom:{name:'Свой шаблон', text:''}
  }
};
const TPL_KEYS = [['{кому}','исполнители'],['{задача}','суть'],['{подробности}','подробности'],['{пункты}','чек-лист'],['{срок}','срок'],['{осталось}','сколько осталось'],['{приоритет}','высокий приоритет'],['{подпись}','подпись'],['{дата}','сегодняшняя дата']];
function tplText(kind){
  const s = D.settings.tpl, k = s[kind] || 'official';
  if (k === 'custom') { const c = (kind === 'order' ? s.customOrder : s.customRemind) || ''; if (c.trim()) return c; return TPL[kind].official.text; }
  return (TPL[kind][k] || TPL[kind].official).text;
}
function leftText(t){
  if (!t.due) return '';
  const d = diffDays(t.due, today());
  if (d < 0) return 'просрочено на ' + (-d) + ' ' + plural(-d, 'день', 'дня', 'дней');
  if (d === 0) return 'истекает сегодня';
  if (d === 1) return 'истекает завтра';
  return 'осталось ' + d + ' ' + plural(d, 'день', 'дня', 'дней');
}
function fillTpl(tpl, v){
  const lines = tpl.split('\n').map(line => {
    const keys = line.match(/\{[а-яё]+\}/gi) || [];
    if (!keys.length) return line;
    let allEmpty = true;
    const out = line.replace(/\{[а-яё]+\}/gi, m => { const val = v[m.toLowerCase()]; if (val) allEmpty = false; return val == null ? m : val; });
    return allEmpty ? null : out;
  }).filter(l => l !== null);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function tplVars(t, names){
  const cl = (t.checklist || []).filter(i => (i.text || '').trim());
  return {'{кому}':names.join(', '), '{задача}':t.title.trim(), '{подробности}':(t.note || '').trim(),
    '{пункты}':cl.map(i => '— ' + i.text.trim()).join('\n'), '{срок}':dueText(t), '{осталось}':leftText(t),
    '{приоритет}':t.priority === 'high' ? 'Приоритет: высокий' : '', '{подпись}':(D.settings.sign || '').trim(), '{дата}':fmtFull(today())};
}
function withCode(s, t){ return D.settings.embedCode && typeof taskCode === 'function' ? s + '\n\n' + taskCode(t) : s; }
function orderText(t){ return withCode(fillTpl(tplText('order'), tplVars(t, (t.assignees || []).map(a => a.name))), t); }
function remindText(t, only){
  const pending = only ? [only] : (t.assignees || []).filter(a => !aDone(a.status)).map(a => a.name);
  return withCode(fillTpl(tplText('remind'), tplVars(t, pending)), t);
}
function execCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
  document.body.appendChild(ta);
  const range = document.createRange(); range.selectNodeContents(ta);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  sel.removeAllRanges(); ta.remove();
  return ok;
}
function copyText(text, okMsg){
  if (execCopy(text)) { toast(okMsg); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast(okMsg), () => copyFallback(text));
  } else copyFallback(text);
}
function copyFallback(text){
  const sh = openSheet(head('Скопируйте текст') + '<div class="sh-b"><p class="hint" style="margin:0">Автоматическое копирование недоступно. Нажмите и удерживайте текст, выберите «Выбрать все» и «Скопировать».</p><textarea id="cp-t" rows="12" readonly>'+esc(text)+'</textarea></div>', {small:true});
  const ta = $('#cp-t', sh); setTimeout(() => { ta.focus(); ta.select(); }, 80);
}

/* ================= состояние интерфейса ================= */
const UKEY = 'skipp_offline_ui';
const U = {tab:'dash', search:'', asg:'', showDone:{}, exp:{}, cal:{y:new Date().getFullYear(), m:new Date().getMonth()}, sel:today(), calMode:'month', board:null, jFilter:'all', jSort:'date', subQ:'', clOpen:{}};
try { const u = JSON.parse(localStorage.getItem(UKEY) || '{}'); if (u.tab && SECTIONS.some(s => s.id === u.tab)) U.tab = u.tab; if (u.board) U.board = u.board; } catch (e) {}
function saveUI(){ try { localStorage.setItem(UKEY, JSON.stringify({tab:U.tab, board:U.board})); } catch (e) {} }
let toastTimer = null;
function toast(msg){
  const old = $('.toast'); if (old) old.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2600);
}
function applyTheme(){ const t = D.settings.theme; if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
const optsHtml = (list, cur) => list.map(x => '<option value="'+esc(x[0])+'"'+(String(cur) === String(x[0]) ? ' selected' : '')+'>'+esc(x[1])+'</option>').join('');

/* ================= листы (модальные окна) ================= */
const SHEETS = [];
const head = t => '<div class="sh-h"><h2>'+esc(t)+'</h2><button type="button" class="icon-btn" data-close aria-label="Закрыть">'+ic('x')+'</button></div>';
function openSheet(html, o){
  o = o || {};
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = '<div class="sheet'+(o.small ? ' small' : '')+'" role="dialog" aria-modal="true">'+html+'</div>';
  document.body.appendChild(ov); document.body.classList.add('lock');
  const sh = ov.firstChild;
  SHEETS.push({ov:ov, o:o});
  ov.addEventListener('click', e => { if (e.target === ov) closeSheet(); });
  sh.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  return sh;
}
function closeSheet(){
  const s = SHEETS.pop(); if (!s) return;
  s.ov.remove();
  if (!SHEETS.length) document.body.classList.remove('lock');
  if (s.o.onClose) s.o.onClose();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && SHEETS.length) closeSheet(); });
function confirmDlg(text, okLabel){
  return new Promise(res => {
    let done = false;
    const sh = openSheet(head('Подтвердите') + '<div class="sh-b"><p style="margin:0">'+esc(text)+'</p></div><div class="sh-f"><span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn danger" data-ok>'+esc(okLabel || 'Удалить')+'</button></div>', {small:true, onClose:() => { if (!done) { done = true; res(false); } }});
    $('[data-ok]', sh).addEventListener('click', () => { done = true; closeSheet(); res(true); });
  });
}
function menu(title, items, cb, sub){
  const sh = openSheet(head(title) + (sub ? '<p class="hint" style="margin:-6px 18px 6px">'+esc(sub)+'</p>' : '') + '<div class="menu">'
    + items.map((it, i) => '<button type="button" data-i="'+i+'" class="'+(it.on ? 'on ' : '')+(it.danger ? 'danger' : '')+'">'
      + (it.color ? '<span class="dot" style="--c:'+it.color+'"></span>' : '') + (it.icon ? ic(it.icon, 20) : '')
      + '<span>'+esc(it.label)+'</span>' + (it.on ? '<span class="ck">'+ic('check', 18)+'</span>' : '') + '</button>').join('')
    + '</div>', {small:true});
  sh.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; closeSheet(); cb(items[Number(b.dataset.i)].v); });
}
function foot(o){
  return '<div class="sh-f">' + (o.del ? '<button type="button" class="btn danger-o" data-f="del" aria-label="Удалить">'+ic('trash', 18)+'</button>' : '')
    + '<span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn primary" data-f="save">'+esc(o.save || 'Сохранить')+'</button></div>';
}
function bindFoot(sh, o){
  sh.addEventListener('click', async e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    if (b.dataset.f === 'save') { if (o.onSave() !== false) closeSheet(); }
    else if (b.dataset.f === 'del') { if (o.soft || await confirmDlg(o.delText || 'Удалить безвозвратно?')) { o.onDelete(); closeSheet(); if (o.soft) toast('Перемещено в корзину'); } }
  });
}

/* ================= каркас ================= */
function countBadge(id){
  if (id === 'mine') { const l = mineTasks().filter(t => !isDone(t)); return {n:l.length, bad:l.some(isOverdue)}; }
  if (id === 'orders') { const l = orderTasks().filter(t => !isDone(t)); return {n:l.length, bad:l.some(isOverdue)}; }
  if (id === 'trash') return {n:(D.trash || []).length, bad:false};
  return null;
}
function sideHtml(){
  const btn = s => { const c = countBadge(s.id); return '<button type="button" data-a="tab" data-tab="'+s.id+'" class="'+(U.tab === s.id ? 'on' : '')+'"'+(U.tab === s.id ? ' aria-current="page"' : '')+'>'+ic(s.icon, 20)+'<span>'+s.title+'</span>'+(c && c.n ? '<span class="cnt'+(c.bad ? ' bad' : '')+'">'+c.n+'</span>' : '')+'</button>'; };
  return '<div class="brand"><img class="mark-img" src="icon-192.png" alt="" width="36" height="36"><div><b>СКиП</b><small>система контроля и планирования</small></div></div>'
    + '<nav class="nav" aria-label="Разделы">' + SECTIONS.slice(0, 4).map(btn).join('') + '<div class="nav-sep"></div>' + SECTIONS.slice(4).map(btn).join('') + '</nav>'
    + '<div class="grow"></div><nav class="nav"><button type="button" data-a="settings">'+ic('gear', 20)+'<span>Настройки</span></button></nav>';
}
function tabbarHtml(){
  const inMore = !TABBAR.includes(U.tab);
  return TABBAR.map(id => { const s = secOf(id); return '<button type="button" data-a="tab" data-tab="'+id+'" class="'+(U.tab === id ? 'on' : '')+'"'+(U.tab === id ? ' aria-current="page"' : '')+'>'+ic(s.icon, 24)+'<span>'+s.title+'</span></button>'; }).join('')
    + '<button type="button" data-a="more" class="'+(inMore ? 'on' : '')+'">'+ic('grid', 24)+'<span>'+(inMore ? secOf(U.tab).title : 'Ещё')+'</span></button>';
}
function topHtml(){
  return '<h1>'+esc(secOf(U.tab).title)+'</h1><div class="acts">'
    + '<button type="button" class="icon-btn" data-a="undo"'+(HIST.undo.length ? '' : ' disabled')+' aria-label="Отменить действие" title="Отменить">'+ic('undo')+'</button>'
    + '<button type="button" class="icon-btn" data-a="redo"'+(HIST.redo.length ? '' : ' disabled')+' aria-label="Вернуть действие" title="Вернуть">'+ic('redo')+'</button></div>';
}
function openMore(){
  const sh = openSheet(head('Разделы') + '<div class="more-grid">'
    + SECTIONS.filter(s => !TABBAR.includes(s.id)).map(s => '<button type="button" data-t="'+s.id+'" class="'+(U.tab === s.id ? 'on' : '')+'">'+ic(s.icon, 24)+s.title+'</button>').join('')
    + '<button type="button" data-t="settings">'+ic('gear', 24)+'Настройки</button></div>', {small:true});
  sh.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    closeSheet();
    if (b.dataset.t === 'settings') openSettings(); else go(b.dataset.t);
  });
}
function go(tab){ U.tab = tab; U.search = ''; saveUI(); render(); window.scrollTo(0, 0); }
// v3.0: аппаратная клавиатура — Alt+1…5, без перехвата ввода и диалогов.
document.addEventListener('keydown', e => {
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat || !/^[1-5]$/.test(e.key)) return;
  if (SHEETS.length || document.querySelector('.lock-screen:not([hidden]), .splash:not([hidden]), .tour:not([hidden])')) return;
  const target = e.target;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
  const id = TABBAR[Number(e.key) - 1];
  if (!id) return;
  e.preventDefault(); go(id);
});

/* ================= карточки ================= */
function statusPill(id, ai, s, isStatic){
  const st = ai != null ? aStatus(s) : tStatus(s);
  const lbl = ai != null ? 'Статус исполнителя' : 'Мой статус';
  if (isStatic) return '<span class="pill" style="--c:'+st.color+'" title="'+lbl+'"><span class="dot"></span>'+esc(st.name)+'</span>';
  return '<button type="button" class="pill" style="--c:'+st.color+'" data-a="st-menu" data-id="'+id+'"'+(ai != null ? ' data-ai="'+ai+'"' : '')+' title="'+lbl+'" aria-label="'+lbl+': '+esc(st.name)+'. Сменить"><span class="dot"></span>'+esc(st.name)+'<span class="chev">'+ic('chevD', 12)+'</span></button>';
}
function taskCard(t, o){
  o = o || {};
  const cl = t.checklist || [], cd = cl.filter(i => i.done).length;
  const od = isOverdue(t), soon = isSoon(t), st = !!(o.archive), clOpen = !!U.clOpen[t.id];
  let h = '<article class="card'+(t.priority === 'high' ? ' pr-high' : '')+(isDone(t) ? ' done' : '')+'" data-open="task" data-id="'+t.id+'"'+(!st ? ' data-drag="task"' : '')+'>'
    + '<div class="t-head"><div class="t-title">'+esc(t.title)+'</div></div>'
    + (t.note ? '<div class="t-note">'+esc(t.note)+'</div>' : '')
    + '<div class="meta-row">'
    + '<span class="meta'+(od ? ' bad' : soon ? ' soon' : '')+'">'+ic('cal', 14)+esc(dueLabel(t))+'</span>'
    + (t.priority === 'high' ? '<span class="meta pr">'+ic('flag', 14)+'Высокий</span>' : '')
    + (t.repeat && t.repeat !== 'none' ? '<span class="meta" title="Повторяется">'+ic('repeat', 14)+'</span>' : '')
    + (remindActive(t) ? '<span class="meta" title="Сработало напоминание">'+ic('bell', 14)+'</span>' : '')
    + (cl.length ? '<button type="button" class="cl-tg'+(clOpen ? ' on' : '')+'" data-a="cl-toggle" data-id="'+t.id+'" aria-expanded="'+clOpen+'" aria-label="Чек-лист: выполнено '+cd+' из '+cl.length+'">'+ic('check', 14)+cd+'/'+cl.length+'<span class="chev">'+ic('chevD', 14)+'</span></button>' : '')
    + '<span class="sp"></span>' + (o.hideMine ? '' : statusPill(t.id, null, t.status, st))
    + '</div>';
  if (cl.length && clOpen) h += '<div class="cl-card">' + cl.map((i, ix) => '<button type="button" class="cl-it'+(i.done ? ' on' : '')+'" data-a="cl-item" data-id="'+t.id+'" data-ix="'+ix+'"'+(st ? ' disabled' : '')+' aria-pressed="'+!!i.done+'"><span class="box">'+(i.done ? ic('check', 14) : '')+'</span><span>'+esc(i.text)+'</span></button>').join('') + '</div>';
  if (hasAsg(t)) {
    const n = t.assignees.length, rep = t.assignees.filter(a => aDone(a.status)).length, odA = t.assignees.some(a => asgOverdue(t, a));
    const ao = (U.asgOpen || {})[t.id], open = n === 1 || (ao != null ? ao : odA);
    const rows = t.assignees.map((a, i) => '<div class="asg-row'+(asgOverdue(t, a) ? ' bad' : '')+'"><span class="nm">'+esc(a.name)+'</span>'+statusPill(t.id, i, a.status, st)+'</div>').join('');
    const sumTxt = rep === n ? (isDone(t) ? 'Все доложили' : 'Все доложили — можно обобщать') : 'Доложили ' + rep + ' из ' + n;
    h += '<div class="asg">' + (n > 1
      ? '<button type="button" class="asg-sum'+(rep === n ? ' ok' : '')+(open ? ' on' : '')+'" data-a="asg-toggle" data-id="'+t.id+'" aria-expanded="'+open+'">'+ic(rep === n ? 'check' : 'me', 14)+'<span>'+sumTxt+'</span>'+(odA ? '<span class="meta bad">просрочка</span>' : '')+'<span class="chev">'+ic('chevD', 14)+'</span></button>'
      : (rep === n && !isDone(t) ? '<div class="all-rep">'+ic('check', 14)+'Исполнитель доложил — можно обобщать</div>' : ''))
      + (open ? rows : '') + '</div>';
  }
  if (hasAsg(t) && !st && !o.compact) h += '<div class="card-acts"><button type="button" class="btn sm" data-a="copy-order" data-lp data-id="'+t.id+'" title="Долгое нажатие — Поделиться">'+ic('send', 16)+'Поставить задачу</button>'
    + '<button type="button" class="btn sm" data-a="copy-remind" data-lp data-id="'+t.id+'" title="Долгое нажатие — Поделиться"'+(isDone(t) || allReported(t) ? ' disabled' : '')+'>'+ic('bell', 16)+'Напомнить</button></div>';
  if (!st && !o.compact && !isDone(t)) h += '<div class="card-acts"><button type="button" class="btn sm" data-a="tomorrow-task" data-id="'+t.id+'">'+ic('cal',16)+'Перенести на завтра</button></div>';
  if (st) h += '<div class="card-acts"><button type="button" class="btn sm" data-a="restore" data-id="'+t.id+'">'+ic('restore', 16)+'Вернуть в работу</button><button type="button" class="btn sm danger-o" data-a="del-task" data-id="'+t.id+'" aria-label="Удалить">'+ic('trash', 16)+'</button></div>';
  return h + '</article>';
}
function toolsRow(key){ return '<div class="tools"><button type="button" class="btn sm ghost-b" data-a="paste-task">'+ic('clip', 18)+'Вставить задачу</button><span class="sp"></span>'+viewToggle(key)+'</div>'; }
function viewToggle(key){
  const v = D.settings.views[key] || 'list';
  return '<div class="seg vt" role="group" aria-label="Вид"><button type="button" data-a="set-view" data-key="'+key+'" data-v="list" class="'+(v === 'list' ? 'on' : '')+'" aria-label="Списком" title="Списком">'+ic('list', 16)+'</button><button type="button" data-a="set-view" data-key="'+key+'" data-v="kanban" class="'+(v === 'kanban' ? 'on' : '')+'" aria-label="Канбан" title="Канбан">'+ic('boards', 16)+'</button></div>';
}
function kanbanHtml(list, key){
  const cols = tSt();
  const ids = new Set(cols.map(s => s.id));
  // One pass to distribute tasks; avoid filtering the full list per column.
  const buckets = new Map(cols.map(s => [s.id, []]));
  for(const t of list){
    const status = ids.has(t.status) ? t.status : cols[0].id;
    buckets.get(status).push(t);
  }
  return '<div class="board-scroll" data-key="k-'+key+'"><div class="board">' + cols.map(s => {
    const items = buckets.get(s.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    return '<section class="col" data-drop="task" data-col="'+s.id+'" data-kind="'+key+'"><header class="col-h"><span class="dot" style="--c:'+s.color+'"></span><h3>'+esc(s.name)+'</h3><span class="n">'+items.length+'</span></header>'
      + '<div class="cards">' + (items.map(t => taskCard(t, {drag:true})).join('') || '<div class="empty-col">Пусто</div>') + '</div></section>';
  }).join('') + '</div></div><p class="hint">Чтобы сменить статус, нажмите плашку статуса на карточке или перетащите её в другой столбец (на телефоне — удерживайте; у края экрана столбцы прокручиваются сами).</p>';
}
function groupTasks(list){
  const g = {od:[], td:[], tm:[], later:[], nodue:[], done:[]}; const T = today(), TM = addDays(T, 1);
  list.forEach(t => {
    if (isDone(t)) g.done.push(t);
    else if (isOverdue(t)) g.od.push(t);
    else if (t.due === T || t.status === 'today') g.td.push(t);
    else if (t.due === TM) g.tm.push(t);
    else if (t.due) g.later.push(t);
    else g.nodue.push(t);
  });
  Object.keys(g).forEach(k => g[k].sort(urgencySortFast));
  return g;
}
const GROUPS = [['od','Просрочено','bad'],['td','Сегодня',''],['tm','Завтра',''],['later','Позже',''],['nodue','Без срока','']];
function groupsHtml(g, key){
  let h = '';
  GROUPS.forEach(x => {
    const l = g[x[0]]; if (!l.length) return;
    h += '<section class="sec"><div class="sec-h'+(x[2] ? ' '+x[2] : '')+'"><h2>'+x[1]+'</h2><span class="n">'+l.length+'</span></div><div class="list grid2">'+l.map(t => taskCard(t)).join('')+'</div></section>';
  });
  if (g.done.length) {
    const open = U.showDone[key];
    h += '<section class="sec"><div class="sec-h"><h2>Выполнено</h2><span class="n">'+g.done.length+'</span><span class="sp"></span><button type="button" class="more-btn" data-a="toggle-done" data-key="'+key+'">'+(open ? 'Скрыть' : 'Показать')+'</button></div>'
      + (open ? '<div class="list grid2">'+g.done.map(t => taskCard(t)).join('')+'</div>' : '<p class="hint">Выполненные задачи переходят в архив на следующий день.</p>') + '</section>';
  }
  return h;
}
// Search strings are cached for the duration of a render only. This avoids stale
// results when tasks or assignees are edited in place without a schema change.
let SEARCH_TEXT_CACHE = new WeakMap();
function taskSearchText(t){
  let text = SEARCH_TEXT_CACHE.get(t);
  if(text === undefined){
    text = [t.title || '',t.note || '',...(t.assignees || []).map(a=>a.name || '')].join(' ').toLocaleLowerCase('ru');
    SEARCH_TEXT_CACHE.set(t,text);
  }
  return text;
}
const matchQ = t => { const q=U.search.trim().toLocaleLowerCase('ru'); return !q || taskSearchText(t).includes(q); };
const searchHtml = ph => '<div class="search">'+ic('search', 18)+'<input type="search" id="q-tasks" value="'+esc(U.search)+'" placeholder="'+esc(ph)+'" aria-label="Поиск" autocomplete="off"></div>';

/* ================= Мои задачи ================= */
function viewMine(){
  const all = mineTasks();
  let h = '<div class="quick"><input type="text" id="quick" placeholder="Быстрая задача — введите и нажмите «Ввод»" aria-label="Быстрая задача" autocomplete="off" enterkeyhint="done"><button type="button" class="btn primary" data-a="quick-add" aria-label="Добавить">'+ic('plus', 20)+'</button></div>';
  h += toolsRow('mine');
  if (!all.length) return h + '<div class="empty"><b>Личных задач нет</b>Здесь собираются задачи без исполнителей — то, что делаете сами.</div>';
  if (all.length > 5) h += '<div class="bar">'+searchHtml('Поиск по моим задачам')+'</div>';
  const list = all.filter(matchQ);
  if (!list.length) return h + '<div class="empty">Ничего не найдено по запросу «'+esc(U.search)+'».</div>';
  if (D.settings.views.mine === 'kanban') return h + kanbanHtml(list, 'mine');
  return h + groupsHtml(groupTasks(list), 'mine');
}

/* ================= Указания ================= */
function viewOrders(){
  const all = orderTasks();
  if (!all.length) return '<div class="empty"><b>Указаний пока нет</b>Поставьте задачу и выберите исполнителей — она появится здесь. Статус каждого исполнителя вы отмечаете сами.<br><button type="button" class="btn primary" data-a="new-order">'+ic('plus', 18)+'Новое указание</button> <button type="button" class="btn" data-a="paste-task">'+ic('clip', 18)+'Вставить задачу</button></div>';
  const names = new Map();
  all.filter(t => !isDone(t)).forEach(t => t.assignees.forEach(a => { if (!aDone(a.status)) names.set(a.name, (names.get(a.name) || 0) + 1); }));
  if (U.asg && !names.has(U.asg) && !all.some(t => t.assignees.some(a => a.name === U.asg))) U.asg = '';
  let h = '<div class="bar">'+searchHtml('Поиск по указаниям и исполнителям')+'</div>' + toolsRow('orders');
  if (names.size > 1 || U.asg) {
    h += '<div class="fchips" role="group" aria-label="Фильтр по исполнителю"><button type="button" class="fchip'+(U.asg ? '' : ' on')+'" data-a="asg" data-name="">Все</button>'
      + Array.from(names.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru')).map(x => '<button type="button" class="fchip'+(U.asg === x[0] ? ' on' : '')+'" data-a="asg" data-name="'+esc(x[0])+'">'+esc(x[0])+'<span class="n">'+x[1]+'</span></button>').join('') + '</div>';
  }
  let list = all.filter(matchQ);
  if (U.asg) list = list.filter(t => t.assignees.some(a => a.name === U.asg));
  if (!list.length) return h + '<div class="empty">Ничего не найдено.</div>';
  if (D.settings.views.orders === 'kanban') return h + kanbanHtml(list, 'orders');
  return h + groupsHtml(groupTasks(list), 'orders');
}

/* ================= Штаб ================= */
function dashList(key, title, cls, list){
  if (!list.length) return '';
  const open = U.exp[key], shown = open ? list : list.slice(0, 4);
  return '<section class="sec"><div class="sec-h'+(cls ? ' '+cls : '')+'"><h2>'+title+'</h2><span class="n">'+list.length+'</span></div><div class="list grid2">'+shown.map(t => taskCard(t, {compact:true})).join('')+'</div>'
    + (list.length > 4 ? '<button type="button" class="more-btn" data-a="expand" data-key="'+key+'">'+(open ? 'Свернуть' : 'Показать все ('+list.length+')')+'</button>' : '') + '</section>';
}
function statusBucket(t){ return tStatus(t.status).id; }
const DASH_WIDGETS = {
  tiles:{title:'Счётчики', render:() => {
    const m = mineTasks().filter(t => !isDone(t)), o = orderTasks().filter(t => !isDone(t));
    const od = m.concat(o).filter(isOverdue).length;
    const people = new Set(); o.forEach(t => t.assignees.forEach(a => { if (!aDone(a.status)) people.add(a.name); }));
    return '<div class="tiles">'
      + '<button type="button" class="tile" data-a="tab" data-tab="mine"><b>'+m.length+'</b><span>Мои задачи</span></button>'
      + '<button type="button" class="tile" data-a="tab" data-tab="orders"><b>'+o.length+'</b><span>Указания в работе</span></button>'
      + '<div class="tile'+(od ? ' bad' : '')+'"><b>'+od+'</b><span>Просрочено</span></div>'
      + '<div class="tile"><b>'+people.size+'</b><span>Исполнителей на контроле</span></div></div>';
  }},
  od:{title:'Просроченные', render:() => dashList('od', 'Просроченные', 'bad', activeTasks().filter(isOverdue).sort(urgencySortFast))},
  bn:{title:'Горящие', render:() => dashList('bn', 'Горящие: сегодня и завтра', '', activeTasks().filter(isBurning).sort(urgencySortFast))},
  im:{title:'Важные', render:() => dashList('im', 'Высокий приоритет', '', activeTasks().filter(t => isImportant(t) && !isOverdue(t) && !isBurning(t)).sort(urgencySortFast))},
  rm:{title:'Напоминания', render:() => dashList('rm', 'Сработали напоминания', '', activeTasks().filter(t => remindActive(t) && !isBurning(t) && !isOverdue(t)).sort(urgencySortFast))},
  statuses:{title:'Задачи по статусам', render:() => {
    const all = activeTasks(); if (!all.length) return '';
    return '<section class="sec"><div class="sec-h"><h2>Мои статусы</h2></div><div class="panel"><div class="stack" role="img" aria-label="Распределение задач по статусам">'
      + tSt().map(s => { const n = all.filter(t => statusBucket(t) === s.id).length; return n ? '<i style="--c:'+s.color+';width:'+(n / all.length * 100)+'%"></i>' : ''; }).join('')
      + '</div><div class="legend">' + tSt().map(s => '<span><span class="dot" style="--c:'+s.color+'"></span>'+esc(s.name)+' — <b class="num">'+all.filter(t => statusBucket(t) === s.id).length+'</b></span>').join('') + '</div></div></section>';
  }},
  load:{title:'Нагрузка по исполнителям', render:() => {
    const map = new Map();
    orderTasks().forEach(t => t.assignees.forEach(a => {
      const r = map.get(a.name) || {name:a.name, act:0, od:0, done:0};
      if (aDone(a.status)) r.done++; else { r.act++; if (asgOverdue(t, a)) r.od++; }
      map.set(a.name, r);
    }));
    const rows = Array.from(map.values()).filter(r => r.act || r.done).sort((a, b) => (b.od - a.od) || (b.act - a.act));
    if (!rows.length) return '';
    const mx = Math.max.apply(null, rows.map(r => r.act + r.done)) || 1;
    return '<section class="sec"><div class="sec-h"><h2>Исполнители</h2><span class="sp"></span><span class="hint" style="margin:0">нажмите, чтобы открыть указания</span></div><div class="panel" style="padding:4px 14px">'
      + rows.map(r => '<button type="button" class="load" data-a="asg-go" data-name="'+esc(r.name)+'"><span class="nm">'+esc(r.name)+'</span>'
        + '<span class="lb"><i style="width:'+(r.od / mx * 100)+'%;background:var(--red)"></i><i style="width:'+((r.act - r.od) / mx * 100)+'%;background:var(--st-control)"></i><i style="width:'+(r.done / mx * 100)+'%;background:var(--st-done);opacity:.5"></i></span>'
        + '<small>'+r.act+' в работе'+(r.od ? ', <b>'+r.od+' просроч.</b>' : '')+'</small></button>').join('') + '</div></section>';
  }}
};
function customItems(d){
  const b = D.boards.find(x => x.id === d.boardId); if (!b) return null;
  if (b.kind === 'medals') { const ids = new Set(medalCols().map(c => c.id)); return D.people.filter(p => (ids.has(p.col) ? p.col : 'c_staff') === d.colId).map(p => p.fio); }
  return D.bcards.filter(c => c.board === b.id && c.col === d.colId).map(c => c.title);
}
function widgetTitle(k){ const c = D.settings.dash.custom[k]; return c ? c.label : ((DASH_WIDGETS[k] || {}).title || k); }
function widgetHtml(k){
  const c = D.settings.dash.custom[k];
  if (c) {
    const items = customItems(c); if (items == null) return '';
    if (c.kind === 'names') return '<section class="sec"><div class="sec-h"><h2>'+esc(c.label)+'</h2><span class="n">'+items.length+'</span></div>'+(items.length ? '<div class="rows">'+items.map(n => '<div class="row" style="cursor:default"><div class="main"><div class="ttl">'+esc(n)+'</div></div></div>').join('')+'</div>' : '<p class="hint">Пусто.</p>')+'</section>';
    return '<section class="sec"><div class="tiles" style="grid-template-columns:1fr;margin:0"><div class="tile"><b>'+items.length+'</b><span>'+esc(c.label)+'</span></div></div></section>';
  }
  const w = DASH_WIDGETS[k]; return w ? w.render() : '';
}
function dashOrder(){ const o = D.settings.dash.order.filter(k => DASH_WIDGETS[k] || D.settings.dash.custom[k]); DASH_DEFAULT.forEach(k => { if (!o.includes(k)) o.push(k); }); return o; }
function viewDash(){
  const act = activeTasks().filter(t => !isDone(t));
  const od = act.filter(isOverdue).length, td = act.filter(t => t.due === today()).length;
  const dstr = new Date().toLocaleDateString('ru-RU', {weekday:'long', day:'numeric', month:'long'});
  let line;
  if (!act.length) line = '<span class="ok">Задач в работе нет.</span> Новая задача — кнопка внизу.';
  else {
    line = act.length + ' ' + plural(act.length, 'задача', 'задачи', 'задач') + ' в работе';
    const p = [];
    if (od) p.push('<span class="bad">' + od + ' ' + plural(od, 'просрочена', 'просрочены', 'просрочено') + '</span>');
    if (td) p.push('<span class="warn">у ' + td + ' срок сегодня</span>');
    line += p.length ? ': ' + p.join(', ') + '.' : '. Просрочек нет.';
  }
  let h = '<div class="hero"><p class="date">'+esc(dstr.charAt(0).toUpperCase() + dstr.slice(1))+'</p><p>'+line+'</p></div>';
  if (!STORAGE_OK) h = '<div class="banner">Браузер запрещает хранить данные на устройстве (возможно, включён частный режим). Изменения пропадут после закрытия.</div>' + h;
  h += dashOrder().filter(k => !D.settings.dash.hidden[k]).map(widgetHtml).join('');
  h += '<button type="button" class="btn ghost" data-a="dash-settings">'+ic('gear', 18)+'Настроить штаб</button>';
  return h;
}

/* ================= Календарь ================= */
function viewCal(){
  const {y, m} = U.cal;
  const weekMode = U.calMode === 'week';
  const first = weekMode ? parseD(U.sel) : new Date(y, m, 1), offset = (first.getDay() + 6) % 7, start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - offset);
  const by = {};
  activeTasks().forEach(t => { if (t.due) (by[t.due] = by[t.due] || []).push(t); });
  let cells = '';
  for (let i = 0; i < (weekMode ? 7 : 42); i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), ds = ymd(d);
    const list = (by[ds] || []).sort(urgencySortFast);
    cells += '<button type="button" class="day'+(d.getMonth() !== m ? ' out' : '')+(ds === today() ? ' today' : '')+(ds === U.sel ? ' sel' : '')+'" data-a="pick-day" data-day="'+ds+'" aria-label="'+esc(d.toLocaleDateString('ru-RU', {day:'numeric', month:'long'}))+', задач: '+list.length+'">'
      + '<span class="n">'+d.getDate()+'</span>'
      + '<span class="dots">'+list.slice(0, 6).map(t => '<i class="'+(isOverdue(t) ? 'bad' : isDone(t) ? 'done' : '')+'"></i>').join('')+'</span>'
      + list.slice(0, 3).map(t => '<span class="lbl" style="'+(isOverdue(t) ? 'color:var(--red)' : isDone(t) ? 'color:var(--ink-3);text-decoration:line-through' : '')+'">'+esc(t.title)+'</span>').join('')
      + (list.length > 3 ? '<span class="lbl" style="background:none;color:var(--ink-3)">+'+(list.length - 3)+'</span>' : '')
      + '</button>';
  }
  const dayTasks = (by[U.sel] || []).sort(urgencySortFast);
  let h = '<div class="cal-head"><h2>'+(weekMode ? 'Неделя · '+esc(start.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})) : MONTHS[m]+' '+y)+'</h2>'
    + '<button type="button" class="btn sm" data-a="cal-mode" aria-label="Переключить вид календаря">'+(weekMode?'Месяц':'Неделя')+'</button>'
    + '<button type="button" class="icon-btn" data-a="cal-prev" aria-label="Предыдущий месяц">'+ic('chevL')+'</button>'
    + '<button type="button" class="btn sm" data-a="cal-today">Сегодня</button>'
    + '<button type="button" class="icon-btn" data-a="cal-next" aria-label="Следующий месяц">'+ic('chevR')+'</button></div>'
    + '<div class="cal-grid">' + ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => '<div class="dow">'+d+'</div>').join('') + cells + '</div>'
    + '<div class="agenda"><div class="sec-h"><h2>'+esc(parseD(U.sel).toLocaleDateString('ru-RU', {weekday:'long', day:'numeric', month:'long'}))+'</h2><span class="n">'+(dayTasks.length || '')+'</span><span class="sp"></span><button type="button" class="btn sm" data-a="add-task-day">'+ic('plus', 16)+'На этот день</button></div>'
    + (dayTasks.length ? '<div class="list grid2">' + dayTasks.map(t => '<div class="cal-task-row">'+taskCard(t, {compact:true})+'<label class="cal-reschedule">Перенести срок <input type="date" data-change="cal-due" data-id="'+esc(t.id)+'" value="'+esc(t.due || '')+'" aria-label="Новый срок: '+esc(t.title)+'"></label></div>').join('') + '</div>' : '<p class="hint">На этот день задач нет.</p>') + '</div>';
  return h;
}

/* Progressive rendering for large boards; UI-only counters, no database migration. */
const BOARD_BATCH=60;
const BOARD_VISIBLE=new Map();
function boardVisible(key,total){
  const shown=BOARD_VISIBLE.get(key)||BOARD_BATCH;
  return Math.min(total,shown);
}
function boardMore(key,total,shown){
  return shown<total?'<button type="button" class="btn sm board-more" data-a="board-more" data-board-key="'+esc(key)+'">Показать ещё '+Math.min(BOARD_BATCH,total-shown)+' · '+shown+' из '+total+'</button>':'';
}
function groupByColumn(items,cols,field){
  const grouped=new Map(cols.map(c=>[c.id,[]]));
  const fallback=cols[0]&&cols[0].id;
  for(const item of items){const id=grouped.has(item[field])?item[field]:fallback;if(id)grouped.get(id).push(item);}
  for(const arr of grouped.values())arr.sort(byOrder);
  return grouped;
}
/* v4.7: configurable board templates. No extra database collection is needed. */
const FIELD_TYPES = [['text','Строка'],['textarea','Многострочный текст'],['number','Число'],['date','Дата'],['select','Список'],['checkbox','Да / нет']];
const BOARD_KIND_LABELS = {simple:'Простая',person:'ФИО',custom:'Свой шаблон'};
const defaultTemplate = kind => ({kind:kind||'simple',subtitle:false,fields:[]});
function boardTemplate(board){
  const raw=board && board.template;
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) return defaultTemplate('simple');
  const k=['simple','person','custom'].includes(raw.kind)?raw.kind:'simple';
  return {kind:k,subtitle:!!raw.subtitle,fields:Array.isArray(raw.fields)?raw.fields.filter(f=>f&&typeof f==='object'&&typeof f.id==='string'&&typeof f.name==='string'&&FIELD_TYPES.some(t=>t[0]===f.type)).slice(0,24):[]};
}
function fieldDisplay(f,value){
  if(f.type==='checkbox')return value===true?'Да':value===false?'Нет':'';
  return value==null?'':String(value).slice(0,1600);
}
function boardCardDetail(card,board){
  const tmpl=boardTemplate(board),vals=(card.fields&&typeof card.fields==='object'&&!Array.isArray(card.fields))?card.fields:{};
  return (card.subtitle?'<div class="bc-subtitle">'+esc(card.subtitle)+'</div>':'')
    +tmpl.fields.map(f=>{const v=fieldDisplay(f,vals[f.id]);return v?'<div class="bc-field"><span>'+esc(f.name)+':</span> '+esc(v)+'</div>':'';}).join('')
    +(card.note?'<div class="t-note">'+esc(card.note)+'</div>':'')
    +(card.remark?'<div class="t-rem"><b>Примечание:</b> '+esc(card.remark)+'</div>':'');
}
function boardInputField(f,value){
  const id='bc-f-'+f.id, val=value==null?'':String(value), lab='<span class="lbl">'+esc(f.name)+(f.required?' *':'')+'</span>';
  if(f.type==='checkbox')return '<label class="switch bc-input"><input type="checkbox" data-field="'+esc(f.id)+'"'+(value===true?' checked':'')+'>'+esc(f.name)+'</label>';
  if(f.type==='textarea')return '<label class="fld bc-input">'+lab+'<textarea data-field="'+esc(f.id)+'" maxlength="3000" rows="3">'+esc(val)+'</textarea></label>';
  if(f.type==='select'){
    let choices=String(f.options||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).slice(0,40);
    return '<label class="fld bc-input">'+lab+'<select data-field="'+esc(f.id)+'"><option value="">Не выбрано</option>'+choices.map(x=>'<option value="'+esc(x)+'"'+(x===val?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>';
  }
  return '<label class="fld bc-input">'+lab+'<input data-field="'+esc(f.id)+'" type="'+(f.type==='number'?'number':f.type==='date'?'date':'text')+'"'+(f.type==='text'?' maxlength="300"':'')+' value="'+esc(val)+'"></label>';
}
function readBoardFields(sh,tmpl){
  const values={};
  for(const f of tmpl.fields){
    const el=$$('[data-field]',sh).find(x=>x.dataset.field===f.id);
    if(!el)continue;
    const v=f.type==='checkbox'?el.checked:el.value.trim();
    if(f.required && (v==='' || v==null || (f.type==='checkbox'&&v===false))){toast('Заполните поле «'+f.name+'»');el.focus();return null;}
    if(v!=='' && v!=null)values[f.id]=v;
  }
  return values;
}

/* ================= Доски ================= */
function medalCols(){ return FIXED_MCOLS.concat(D.mcols.slice().sort(byOrder).map(c => Object.assign({kind:'month'}, c))); }
function curBoard(){ const l = D.boards.slice().sort(byOrder); return l.find(b => b.id === U.board) || l[0] || null; }
function viewBoards(){
  const list = D.boards.slice().sort(byOrder);
  if (!list.length) return '<div class="empty"><b>Досок нет</b>Доска — столбцы с карточками: идеи, учёт, планы.<br><button type="button" class="btn primary" data-a="add-board">'+ic('plus', 18)+'Создать доску</button></div>';
  const b = curBoard(); U.board = b.id;
  let h = '<div class="bchips">' + list.map(x => '<button type="button" class="fchip'+(x.id === b.id ? ' on' : '')+'" data-a="pick-board" data-id="'+x.id+'">'+(x.kind === 'medals' ? ic('medal', 16) : '')+esc(x.title)+'</button>').join('')
    + '<button type="button" class="fchip" data-a="add-board">'+ic('plus', 16)+'Доска</button></div>';
  h += '<div class="bar"><button type="button" class="btn sm" data-a="board-settings">'+ic('gear', 16)+'Настроить</button><button type="button" class="btn sm" data-a="export-board">'+ic('download', 16)+'Excel</button><span class="sp"></span>';
  if (b.kind === 'medals') h += '<button type="button" class="btn sm" data-a="add-mcol">'+ic('cal', 16)+'Месяц</button><button type="button" class="btn sm" data-a="bulk-people">Списком</button><button type="button" class="btn sm primary" data-a="add-person">'+ic('plus', 16)+'Человек</button>';
  if(b.kind !== 'medals')h+='<button type="button" class="btn sm" data-a="board-bulk">'+ic('list',16)+'Добавить списком</button><button type="button" class="btn sm primary" data-a="board-rapid">'+ic('plus',16)+'Быстро</button>';
  h += '</div>';
  if (b.kind === 'medals') {
    const cols=medalCols();
    const grouped=groupByColumn(D.people,cols,'col');
    h+='<div class="board-scroll" data-key="medals"><div class="board">'+cols.map(c=>{
      const items=grouped.get(c.id)||[];
      const key='medals:'+c.id, shown=boardVisible(key,items.length);
      return '<section class="col" data-drop="person" data-col="'+c.id+'"><header class="col-h"><h3>'+esc(c.title)+'</h3><span class="n">'+items.length+'</span>'
        +(c.kind==='month'?'<button type="button" class="icon-btn" style="width:32px;height:32px" data-a="edit-mcol" data-id="'+c.id+'" aria-label="Настроить столбец">'+ic('more',18)+'</button>':'')+'</header>'
        +(c.note?'<div class="col-note">'+esc(c.note)+'</div>':'')
        +'<div class="cards">'+(items.slice(0,shown).map(p=>'<div class="card" data-open="person" data-id="'+p.id+'" data-drag="person"><div class="t-title">'+esc(p.fio)+'</div>'
          +(p.award?'<div class="award">'+ic('medal',16)+'<span>'+esc(p.award)+'</span></div>':'')
          +(p.existing?'<div class="t-note">Имеет: '+esc(p.existing)+'</div>':'')+'</div>').join('')||'<div class="empty-col">Пусто</div>')+'</div>'
        +boardMore(key,items.length,shown)+'</section>';
    }).join('')+'</div></div>';
    return h+'<p class="hint">Карточку можно перетащить в другой столбец — удерживайте её на телефоне.</p>';
  }
  const cols=b.cols||[];
  if(!cols.length)return h+'<div class="empty">В доске нет столбцов.<br><button type="button" class="btn primary" data-a="board-settings">Добавить столбцы</button></div>';
  const grouped=groupByColumn(D.bcards.filter(c=>c.board===b.id),cols,'col');
  h+='<div class="board-scroll" data-key="b-'+b.id+'"><div class="board">'+cols.map(c=>{
    const items=grouped.get(c.id)||[];
    const key='board:'+b.id+':'+c.id,shown=boardVisible(key,items.length);
    return '<section class="col" data-drop="bcard" data-col="'+c.id+'"><header class="col-h"><h3>'+esc(c.title)+'</h3><span class="n">'+items.length+'</span></header>'
      +'<div class="cards">'+(items.slice(0,shown).map(x=>'<div class="card" data-open="bcard" data-id="'+x.id+'" data-drag="bcard"><div class="t-title">'+esc(x.title)+'</div>'+boardCardDetail(x,b)+'</div>').join('')||'<div class="empty-col">Пусто</div>')+'</div>'
      +boardMore(key,items.length,shown)
      +'<button type="button" class="col-add" data-a="add-bcard" data-col="'+c.id+'">+ Карточка</button></section>';
  }).join('')+'</div></div>';
  return h+'<p class="hint">Карточку можно перетащить в другой столбец — удерживайте её на телефоне.</p>';

}

/* ================= Абоненты ================= */
const SUB_SEARCH_INDEX=new WeakMap();
function subSearchText(p){
  const stamp=String(p.name||'')+'\u0000'+String(p.phone||'')+'\u0000'+String(p.address||'');
  const cached=SUB_SEARCH_INDEX.get(p);
  if(cached && cached.stamp===stamp)return cached.text;
  const text=stamp.toLocaleLowerCase('ru');
  SUB_SEARCH_INDEX.set(p,{stamp,text});
  return text;
}
function viewSubs(){
  const all = D.subs.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));
  let h = '<div class="bar">' + (all.length > 5 ? '<div class="search">'+ic('search', 18)+'<input type="search" id="sub-q" value="'+esc(U.subQ)+'" placeholder="Поиск по имени, номеру, адресу" aria-label="Поиск абонента" autocomplete="off"></div>' : '<span class="sp"></span>')
    + '<button type="button" class="btn primary" data-a="add-sub">'+ic('plus', 18)+'Абонент</button></div>';
  if (!all.length) return h + '<div class="empty"><b>Справочник пуст</b>Добавьте абонентов — их имена будут подсказываться при выборе исполнителей.</div>';
  const q = U.subQ.trim().toLowerCase();
  const list = q ? all.filter(p => subSearchText(p).includes(q)) : all;
  if (!list.length) return h + '<div class="empty">Никого не найдено.</div>';
  const page = pageWindow(list,'subs',PAGE_SIZE_SUBS,U.subQ.trim().toLowerCase());
  let last = '', rows = '';
  page.items.forEach(p => {
    const L = (p.name || '?').charAt(0).toUpperCase();
    if (L !== last && !q) { if (rows) rows += '</div>'; rows += '<div class="letter">'+esc(L)+'</div><div class="rows">'; last = L; }
    else if (!rows) rows += '<div class="rows">';
    rows += '<div class="row" data-open="sub" data-id="'+p.id+'"><div class="main"><div class="ttl">'+esc(p.name)+'</div>'
      + (p.phone || p.address ? '<div class="sub">'+esc([p.phone, p.address].filter(Boolean).join(', '))+'</div>' : '') + '</div>'
      + (p.phone ? '<div class="side-r"><a class="icon-btn" href="tel:'+esc(p.phone.replace(/[^\d+]/g, ''))+'" target="_top" aria-label="Позвонить">'+ic('phone', 18)+'</a><button type="button" class="icon-btn" data-a="copy-phone" data-id="'+p.id+'" aria-label="Скопировать номер">'+ic('copy', 18)+'</button></div>' : '')
      + '</div>';
  });
  return h + rows + '</div>' + pageControls(page,'subs');
}

/* ================= ЖУПиОР ================= */
function viewJournal(){
  let list = D.journal.slice();
  if (U.jFilter !== 'all') list = list.filter(d => d.direction === U.jFilter);
  list.sort((a, b) => U.jSort === 'party' ? (a.party || '').localeCompare(b.party || '', 'ru') : ((b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0)));
  let h = '<p class="hint" style="margin:-4px 2px 14px">Журнал учёта полученных и отданных распоряжений</p>'
    + '<div class="bar"><div class="seg" role="group" aria-label="Направление">'
    + [['all','Все'],['out','Отданные'],['in','Полученные']].map(x => '<button type="button" data-a="j-filter" data-v="'+x[0]+'" class="'+(U.jFilter === x[0] ? 'on' : '')+'">'+x[1]+'</button>').join('') + '</div>'
    + '<span class="sp"></span><select data-change="j-sort" aria-label="Сортировка" style="width:auto;min-height:38px">'+optsHtml([['date','По дате'],['party','По адресату']], U.jSort)+'</select>'
    + '<button type="button" class="btn sm" data-a="export-journal">'+ic('download', 16)+'Excel</button>'
    + '<button type="button" class="btn primary" data-a="add-j">'+ic('plus', 18)+'Запись</button></div>';
  if (!list.length) return h + '<div class="empty"><b>Записей нет</b>Вносите сюда отданные и полученные распоряжения. Из карточки указания запись создаётся кнопкой «Внести в ЖУПиОР».</div>';
  const page=pageWindow(list,'journal',PAGE_SIZE_JOURNAL,JSON.stringify([U.jFilter,U.jSort]));
  return h + '<div class="rows">' + page.items.map(d => '<div class="row" data-open="j" data-id="'+d.id+'"><div class="jn"><b>№ '+esc(d.number || '—')+'</b><small>'+esc(fmtFull(d.date) || 'без даты')+'</small></div>'
    + '<div class="main"><div class="ttl">'+esc(d.brief || '')+'</div><div class="sub"><span class="dir '+(d.direction === 'in' ? 'in' : 'out')+'">'+(d.direction === 'in' ? 'Получено' : 'Отдано')+'</span> '+esc(d.party || '')+'</div></div></div>').join('') + '</div>'+pageControls(page,'journal');
}

/* ================= Архив ================= */
function viewArchive(){
  const list = D.tasks.filter(t => t.archived).sort((a,b) => {
    const da=a.completedAt||a.archivedAt||0, db=b.completedAt||b.archivedAt||0;
    return db-da;
  });
  if (!list.length) return '<div class="empty"><b>Архив пуст</b>Задачи со статусом «Выполнено» или «Отправлено» переходят сюда на следующий день.</div>';
  const page=pageWindow(list,'archive',PAGE_SIZE_ARCHIVE,'archive');
  const groups = {};
  page.items.forEach(t => { const d = t.completedAt ? ymd(new Date(t.completedAt)) : (t.archivedAt ? ymd(new Date(t.archivedAt)) : '—'); (groups[d] = groups[d] || []).push(t); });
  let h = '<div class="bar"><span class="hint" style="margin:0">Всего: '+list.length+'</span><span class="sp"></span><button type="button" class="btn sm danger-o" data-a="clear-archive">'+ic('trash', 16)+'Очистить архив</button></div>';
  return h + Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(d => '<section class="sec"><div class="sec-h"><h2>'+esc(d === '—' ? 'Без даты' : 'Выполнено '+fmtFull(d))+'</h2><span class="n">'+groups[d].length+'</span></div><div class="list grid2">'+groups[d].map(t => taskCard(t, {archive:true})).join('')+'</div></section>').join('') + pageControls(page,'archive');
}

/* ================= отрисовка ================= */
function viewTrash(){
  const list = D.trash || [];
  let h = '<div class="bar"><span class="hint" style="margin:0">Удалённое хранится 30 дней, затем стирается само. Карточку можно перетащить сюда из любого списка — появится зона «В корзину».</span><span class="sp"></span>'
    + (list.length ? '<button type="button" class="btn sm danger-o" data-a="trash-clear">'+ic('trash', 16)+'Очистить корзину</button>' : '') + '</div>';
  if (!list.length) return h + '<div class="empty"><b>Корзина пуста</b>Удалённые задачи, карточки, абоненты и записи журнала попадают сюда.</div>';
  const page=pageWindow(list,'trash',PAGE_SIZE_TRASH,'trash');
  return h + '<div class="rows">' + page.items.map(x => '<div class="row" style="cursor:default"><div class="main"><div class="ttl">'+esc(trashLabel(x))+'</div><div class="sub">'+esc(TRASH_KIND[x.kind] || '')+' · удалено '+esc(fmtDT(x.deletedAt))+'</div></div>'
    + '<div class="side-r"><button type="button" class="btn sm" data-a="trash-restore" data-id="'+x.id+'">'+ic('restore', 16)+'<span class="hide-s">Восстановить</span></button><button type="button" class="icon-btn" data-a="trash-del" data-id="'+x.id+'" aria-label="Удалить навсегда" title="Удалить навсегда">'+ic('x', 18)+'</button></div></div>').join('') + '</div>' + pageControls(page,'trash');
}

/* ===== СКиПП 2.x: дополнительные представления, без миграции базы ===== */
const EXT = {q:'', status:'all', priority:'all', scope:'all', period:'week'};
const EXT_FILTER_FIELDS = ['q','status','priority','scope'];
// v2.9: ephemeral selection, never added to persisted schema.
const EXT_BULK = new Set();
function extSavedFilters(){
  const items = D.settings && D.settings.savedSearches;
  if (!Array.isArray(items)) return [];
  return items.filter(x => x && typeof x==='object' && typeof x.id==='string' && typeof x.name==='string' && x.filter && typeof x.filter==='object').slice(0,20);
}
function extFilterSnapshot(){
  return Object.fromEntries(EXT_FILTER_FIELDS.map(k=>[k,String(EXT[k]||'').slice(0,300)]));
}
function extApplyFilter(f){
  const allowed = {status:['all','active','done','overdue'],priority:['all','high','mid','low'],scope:['all','mine','orders']};
  EXT.q=typeof f.q==='string'?f.q.slice(0,300):'';
  for(const k of ['status','priority','scope']) EXT[k]=allowed[k].includes(f[k])?f[k]:'all';
}
function extSaveFilter(){
  const name=window.prompt('Название фильтра (до 60 символов)');
  if(name===null) return;
  const clean=name.trim().slice(0,60);
  if(!clean){toast('Введите название фильтра');return;}
  if(extSavedFilters().length>=20){toast('Можно сохранить не более 20 фильтров');return;}
  const filter=extFilterSnapshot();
  if(commit(()=>{
    if(!Array.isArray(D.settings.savedSearches)) D.settings.savedSearches=[];
    D.settings.savedSearches.push({id:uid(),name:clean,filter});
  })) toast('Фильтр добавлен в очередь сохранения');
}
function extRemoveFilter(id){
  if(!window.confirm('Удалить сохранённый фильтр?')) return;
  commit(()=>{D.settings.savedSearches=extSavedFilters().filter(x=>x.id!==id);});
}

const extInput = (id, label, value) => '<label class="ext-label">'+esc(label)+'<input id="'+id+'" value="'+esc(value)+'" autocomplete="off"></label>';
function extTaskMatches(t){
  const q=EXT.q.trim().toLocaleLowerCase('ru');
  if(q && !taskSearchText(t).includes(q)) return false;
  if(EXT.status==='active' && (t.archived||isDone(t))) return false;
  if(EXT.status==='done' && !isDone(t)) return false;
  if(EXT.status==='overdue' && !isOverdue(t)) return false;
  if(EXT.priority!=='all' && t.priority!==EXT.priority) return false;
  if(EXT.scope==='mine' && hasAsg(t)) return false;
  if(EXT.scope==='orders' && !hasAsg(t)) return false;
  return true;
}
function extBulkSelection(){
  // Only currently visible, non-archived tasks can be modified.
  return D.tasks.filter(t=>EXT_BULK.has(t.id) && !t.archived && extTaskMatches(t));
}
function extBulkApply(){
  const chosen=extBulkSelection();
  if(!chosen.length){toast('Выберите задачи из текущего списка');return;}
  const action=document.getElementById('ext-bulk-action')?.value;
  const value=document.getElementById('ext-bulk-value')?.value || '';
  if(!['priority','due','status','delete','tomorrow'].includes(action))return;
  if(action==='priority' && !['high','mid','low'].includes(value)){toast('Выберите приоритет');return;}
  if(action==='status' && !tSt().some(x=>x.id===value)){toast('Выберите статус');return;}
  if(action==='due' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parseD(value).getTime()) || ymd(parseD(value))!==value)){toast('Некорректная дата');return;}
  const count=chosen.length;
  if(!window.confirm(action==='delete'?'Переместить в корзину '+count+' выбранных задач?':'Изменить '+count+' задач?'))return;
  const ids=new Set(chosen.map(t=>t.id));
  if(commit(()=>{
    // One atomic application through the existing durable save queue.
    for(const t of D.tasks){
      if(!ids.has(t.id))continue;
      if(action==='delete'){toTrash('task',t);continue;}
      if(action==='tomorrow'){t.due=addDays(today(),1);t.updatedAt=Date.now();continue;}
      if(action==='priority'){t.priority=value;t.updatedAt=Date.now();}
      else if(action==='due'){t.due=value;t.updatedAt=Date.now();}
      else setOverall(t,value);
    }
  })){
    EXT_BULK.clear();
    toast('Изменения '+count+' задач поставлены в очередь сохранения');
  }
}
/* v3.2: pagination is UI-only; no database schema or saved settings change. */
const PAGE_SIZE_SEARCH=60, PAGE_SIZE_JOURNAL=80, PAGE_SIZE_ARCHIVE=60, PAGE_SIZE_TRASH=80, PAGE_SIZE_SUBS=80;
const PAGE_STATE={search:0,journal:0,archive:0,trash:0,subs:0,searchSignature:'',journalSignature:'',archiveSignature:'',trashSignature:'',subsSignature:''};
function pageWindow(items, kind, size, signature){
  const sigKey=kind+'Signature';
  if(PAGE_STATE[sigKey]!==signature){PAGE_STATE[kind]=0;PAGE_STATE[sigKey]=signature;}
  const count=Math.max(1,Math.ceil(items.length/size));
  PAGE_STATE[kind]=Math.max(0,Math.min(PAGE_STATE[kind],count-1));
  const current=PAGE_STATE[kind];
  return {items:items.slice(current*size,(current+1)*size),current,count,total:items.length};
}
function pageControls(p,kind){
  if(p.count<=1)return '';
  return '<nav class="ext-pages" aria-label="Страницы результатов"><button type="button" class="btn sm" data-a="page-prev" data-kind="'+kind+'" '+(p.current===0?'disabled':'')+'>Назад</button><span class="hint">Страница '+(p.current+1)+' из '+p.count+' · всего '+p.total+'</span><button type="button" class="btn sm" data-a="page-next" data-kind="'+kind+'" '+(p.current===p.count-1?'disabled':'')+'>Далее</button></nav>';
}
function changePage(kind,delta){
  if(!['search','journal','archive','trash','subs'].includes(kind))return;
  PAGE_STATE[kind]=Math.max(0,PAGE_STATE[kind]+delta);
  render();
  const main=document.getElementById('main');
  if(main)main.scrollIntoView({block:'start'});
}
function viewSearch2(){
  const tasks=D.tasks.filter(extTaskMatches).sort(urgencySortFast);
  const page=pageWindow(tasks,'search',PAGE_SIZE_SEARCH,JSON.stringify([EXT.q,EXT.status,EXT.priority,EXT.scope]));
  const q=EXT.q.trim().toLocaleLowerCase('ru');
  const extra=q ? D.journal.filter(j=>JSON.stringify(j).toLocaleLowerCase('ru').includes(q)).slice(0,30) : [];
  return '<div class="ext-panel"><h2>Поиск по задачам и журналу</h2>'+extInput('ext-q','Запрос',EXT.q)
    +'<div class="ext-filters"><label>Состояние<select id="ext-status">'+[['all','Все'],['active','Активные'],['done','Выполненные'],['overdue','Просроченные']].map(x=>'<option value="'+x[0]+'"'+(EXT.status===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'
    +'<label>Приоритет<select id="ext-priority">'+[['all','Любой'],['high','Высокий'],['mid','Обычный'],['low','Низкий']].map(x=>'<option value="'+x[0]+'"'+(EXT.priority===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'
    +'<label>Тип<select id="ext-scope">'+[['all','Все'],['mine','Личные'],['orders','Указания']].map(x=>'<option value="'+x[0]+'"'+(EXT.scope===x[0]?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label></div><div class="btn-row" style="margin-top:12px"><button type="button" class="btn sm" data-a="ext-filter-save">'+ic('plus',16)+'Сохранить фильтр</button><button type="button" class="btn sm" data-a="ext-filter-reset">Сбросить</button></div>'
    +(extSavedFilters().length?'<div class="ext-saved"><p class="hint">Сохранённые фильтры</p>'+extSavedFilters().map(x=>'<div class="ext-saved-row"><button type="button" class="btn sm" data-a="ext-filter-load" data-id="'+esc(x.id)+'">'+esc(x.name)+'</button><button type="button" class="icon-btn" data-a="ext-filter-delete" data-id="'+esc(x.id)+'" aria-label="Удалить фильтр" title="Удалить фильтр">'+ic('x',16)+'</button></div>').join('')+'</div>':'')+'</div>'
    +'<section class="sec"><div class="sec-h"><h2>Задачи</h2><span class="n">'+tasks.length+'</span></div>'
    +(tasks.length?'<div class="ext-bulk-bar"><button type="button" class="btn sm" data-a="ext-bulk-all">Выбрать показанные</button><button type="button" class="btn sm" data-a="ext-bulk-clear">Снять выбор</button><span class="hint">Выбрано: '+page.items.filter(t=>EXT_BULK.has(t.id)&&!t.archived).length+'</span></div>'
      +'<div class="ext-bulk-controls"><label>Действие<select id="ext-bulk-action"><option value="priority">Приоритет</option><option value="due">Срок</option><option value="status">Статус</option><option value="tomorrow">Перенести на завтра</option><option value="delete">Удалить в корзину</option></select></label><label>Значение<span id="ext-bulk-value-host"><select id="ext-bulk-value"><option value="high">Высокий</option><option value="mid">Обычный</option><option value="low">Низкий</option></select></span></label><button type="button" class="btn sm primary" data-a="ext-bulk-apply">Применить</button></div>'
      +'<div class="list grid2">'+page.items.map(t=>'<div class="ext-bulk-item"><label class="ext-bulk-pick"><input type="checkbox" data-change="ext-bulk-check" data-id="'+esc(t.id)+'" '+(EXT_BULK.has(t.id)?'checked ':'')+(t.archived?'disabled ':'')+'aria-label="Выбрать задачу: '+esc(t.title)+'"> Выбрать</label>'+taskCard(t,{compact:true})+'</div>').join('')+'</div>':'<p class="hint">Совпадений нет.</p>')
    +pageControls(page,'search')+'</section>'
    +(extra.length?'<section class="sec"><div class="sec-h"><h2>Журнал</h2><span class="n">'+extra.length+'</span></div><div class="rows">'+extra.map(j=>'<div class="row" data-open="j" data-id="'+esc(j.id)+'"><div class="main"><div class="ttl">'+esc(j.brief||j.title||j.number||'Запись')+'</div><div class="sub">'+esc(j.date||'')+'</div></div></div>').join('')+'</div></section>':'');
}
// Analytics uses the existing task fields only; no schema migration or network requests.
function analyticsSnapshot(period, tasks, reference){
  const days=[7,30,90].includes(Number(period))?Number(period):30;
  const end=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate());
  const start=new Date(end); start.setDate(start.getDate()-days+1);
  const startMs=start.getTime(), endMs=end.getTime()+864e5;
  const completed=tasks.filter(t=>Number.isFinite(Number(t.completedAt)) && Number(t.completedAt)>=startMs && Number(t.completedAt)<endMs);
  // Aggregate completions once instead of scanning all completed tasks for each day.
  // Local calendar dates are used to remain correct across DST transitions.
  const completedByDay=new Map();
  for(const t of completed){
    const key=ymd(new Date(Number(t.completedAt)));
    completedByDay.set(key,(completedByDay.get(key)||0)+1);
  }
  const bins=[];
  for(let i=0;i<days;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=ymd(d);
    bins.push({day:key,count:completedByDay.get(key)||0});
  }
  const active=tasks.filter(t=>!t.archived&&!isDone(t));
  const overdue=active.filter(t=>!!t.due&&t.due<ymd(end));
  const byAssignee=new Map();
  active.forEach(t=>(t.assignees||[]).forEach(a=>{
    if(!a||!a.name||aDone(a.status)) return;
    const name=String(a.name).trim(); if(!name) return;
    const item=byAssignee.get(name)||{name,count:0,overdue:0};
    item.count++; if(t.due&&t.due<ymd(end)) item.overdue++;
    byAssignee.set(name,item);
  }));
  const statusCounts=new Map();
  for(const t of tasks){if(!t.archived) statusCounts.set(t.status,(statusCounts.get(t.status)||0)+1);}
  return {days,completed:completed.length,bins,active:active.length,overdue:overdue.length,
    assignees:[...byAssignee.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'ru')),
    groups:tSt().map(st=>({label:st.name,count:statusCounts.get(st.id)||0,color:st.color})),
    nearest:active.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,12)};
}
function viewAnalytics2(){
  const report=analyticsSnapshot(EXT.period,D.tasks,new Date());
  const max=Math.max(1,...report.groups.map(g=>g.count));
  const maxDaily=Math.max(1,...report.bins.map(b=>b.count));
  const loadMax=Math.max(1,...report.assignees.map(a=>a.count));
  return '<div class="ext-panel"><h2>Аналитика задач</h2><label class="ext-label" for="ext-period">Период выполнения</label><select id="ext-period" class="ext-period">'+[[7,'7 дней'],[30,'30 дней'],[90,'90 дней']].map(([n,label])=>'<option value="'+n+'"'+(report.days===n?' selected':'')+'>'+label+'</option>').join('')+'</select><p class="hint">Период применяется к завершениям; активные и просроченные задачи показаны на сегодня.</p></div>'
    +'<div class="ext-metrics">'+[['Всего задач',D.tasks.length],['Активные',report.active],['Просроченные',report.overdue],['Завершено за '+report.days+' дней',report.completed]].map(x=>'<div class="ext-metric"><strong>'+x[1]+'</strong><span>'+x[0]+'</span></div>').join('')+'</div>'
    +'<section class="sec"><div class="sec-h"><h2>Динамика завершений</h2></div><div class="ext-panel"><div class="ext-chart" role="img" aria-label="Завершено задач за период: '+report.completed+'">'+report.bins.map(b=>'<div class="ext-chart-col" title="'+b.day+': '+b.count+'"><i style="height:'+(b.count?Math.max(5,100*b.count/maxDaily):0)+'%"></i></div>').join('')+'</div><div class="ext-chart-axis"><span>'+esc(fmtDateShort(report.bins[0].day))+'</span><span>'+esc(fmtDateShort(report.bins[report.bins.length-1].day))+'</span></div></div></section>'
    +'<section class="sec"><div class="sec-h"><h2>Распределение по статусам</h2></div><div class="ext-panel">'+report.groups.map(g=>'<div class="ext-stat"><span>'+esc(g.label)+'</span><div class="ext-track"><i style="width:'+(100*g.count/max)+'%;background:'+esc(g.color||'#56688A')+'"></i></div><b>'+g.count+'</b></div>').join('')+'</div></section>'
    +'<section class="sec"><div class="sec-h"><h2>Нагрузка по исполнителям</h2></div><div class="ext-panel">'+(report.assignees.length?report.assignees.slice(0,30).map(a=>'<div class="ext-stat"><span title="'+esc(a.name)+'">'+esc(a.name)+'</span><div class="ext-track"><i style="width:'+(100*a.count/loadMax)+'%"></i></div><b title="Просрочено: '+a.overdue+'">'+a.count+(a.overdue?' / '+a.overdue+' !':'')+'</b></div>').join(''):'<p class="hint">Нет незавершённых поручений исполнителям.</p>')+(report.assignees.length>30?'<p class="hint">Показаны первые 30 исполнителей.</p>':'')+'<p class="hint">Число справа — открытые поручения; после косой черты — просроченные.</p></div></section>'
    +'<section class="sec"><div class="sec-h"><h2>Ближайшие сроки</h2></div>'+(report.nearest.length?'<div class="list grid2">'+report.nearest.map(t=>taskCard(t,{compact:true})).join('')+'</div>':'<p class="hint">Нет активных задач со сроком.</p>')+'</section>';
}
function fmtDateShort(s){return parseD(s).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}
function upcomingRepeats(limit=20){
  return activeTasks().filter(t=>t.repeat && t.repeat!=='none' && !isDone(t))
    .map(t=>({task:t, next:t.due || today(), cadence: (REPEATS.find(x=>x[0]===t.repeat)||[])[1] || t.repeat}))
    .filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.next))
    .sort((a,b)=>a.next.localeCompare(b.next)).slice(0,limit);
}
function viewPlanner2(){
  const start=parseD(today()), days=[];
  const tasks=activeTasks(), byDue=new Map(), missing=[];
  for(const t of tasks){
    if(!t.due){if(!isDone(t)) missing.push(t);continue;}
    if(!byDue.has(t.due)) byDue.set(t.due,[]);
    byDue.get(t.due).push(t);
  }
  for(let i=0;i<14;i++){
    const d=new Date(start);d.setDate(d.getDate()+i);
    const key=ymd(d);
    days.push({date:key,tasks:(byDue.get(key)||[]).sort(urgencySortFast)});
  }
  const repeats=upcomingRepeats();
  const repeatPanel='<section class="sec"><div class="sec-h"><h2>Повторяющиеся задачи</h2><span class="n">'+repeats.length+'</span></div>'
    +(repeats.length?'<div class="ext-panel">'+repeats.map(x=>'<div class="ext-stat repeat-editor-row"><span>'+esc(x.task.title)+'</span><b>'+esc(fmtFull(x.next))+' · '+esc(x.cadence)+'</b><div class="btn-row"><button type="button" class="btn sm" data-a="repeat-edit" data-id="'+esc(x.task.id)+'">Изменить</button><button type="button" class="btn sm danger-o" data-a="repeat-stop" data-id="'+esc(x.task.id)+'">Удалить повтор</button></div></div>').join('')+'</div>':'<p class="hint">Нет активных повторяющихся задач.</p>')
    +'<button type="button" class="btn sm primary" data-a="repeat-new">'+ic('plus',16)+'Новая повторяющаяся задача</button><p class="hint">Следующая задача создаётся при завершении текущей. Повторы заранее не создаются.</p></section>';
  return repeatPanel+'<div class="ext-panel"><h2>План на 14 дней</h2><p class="hint">Задачи сгруппированы по сроку. Для изменения даты откройте карточку.</p><button class="btn sm" data-a="tab" data-tab="cal">'+ic('cal',16)+'Открыть календарь</button></div>'
    +days.map(d=>'<section class="sec"><div class="sec-h"><h2>'+esc(parseD(d.date).toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'long'}))+'</h2><span class="n">'+d.tasks.length+'</span><span class="sp"></span><button class="btn sm" data-a="ext-new-day" data-day="'+d.date+'">'+ic('plus',16)+'</button></div>'+(d.tasks.length?'<div class="list grid2">'+d.tasks.map(t=>taskCard(t,{compact:true})).join('')+'</div>':'<p class="hint">Нет задач</p>')+'</section>').join('')
    +'<section class="sec"><div class="sec-h"><h2>Без срока</h2><span class="n">'+missing.length+'</span></div>'+(missing.length?'<div class="list grid2">'+missing.slice(0,30).map(t=>taskCard(t,{compact:true})).join('')+'</div>':'')+'</section>';
}
function viewBackup2(){
  return '<div class="ext-panel"><h2>Резервирование и перенос данных</h2><p class="hint">Выгрузка содержит всю базу. Для переноса на другое устройство сохраните JSON и импортируйте его там. Облачная синхронизация не используется.</p>'
  +'<div class="btn-row"><button class="btn primary" data-a="ext-backup">'+ic('download',18)+'Создать резервную копию</button><label class="btn" style="cursor:pointer">'+ic('upload',18)+'Восстановить из JSON<input id="ext-import" type="file" accept=".json,application/json" hidden></label></div>'
  +'<p class="hint">Последняя подтверждённая выгрузка: '+esc(D.settings.lastBackup?fmtDT(D.settings.lastBackup):'нет данных')+'. Перед восстановлением создайте копию текущей базы. Импорт полностью заменяет локальные данные после подтверждения.</p></div>'
  +'<section class="sec"><div class="sec-h"><h2>История выгрузок</h2></div><div class="ext-panel">'
  +((Array.isArray(D.settings.backupHistory)?D.settings.backupHistory:[]).length
    ?D.settings.backupHistory.map(x=>'<div class="ext-stat"><span>'+esc(fmtDT(x.at))+'</span><b>'+(x.encrypted?'С паролем':'Без пароля')+'</b></div>').join('')
    :'<p class="hint">История пока пуста.</p>')
  +'<p class="hint">Это журнал выполненных выгрузок, а не хранилище файлов. Для восстановления необходим ранее сохранённый JSON-файл. История хранится в базе и входит в экспорт.</p></div></section>';
}

const VIEWS = {ext_search:viewSearch2,ext_analytics:viewAnalytics2,ext_planner:viewPlanner2,ext_backup:viewBackup2,trash:viewTrash, dash:viewDash, mine:viewMine, orders:viewOrders, cal:viewCal, boards:viewBoards, subs:viewSubs, journal:viewJournal, archive:viewArchive};
let PREVIOUS_RENDER_TAB=null;
// Avoid replacing unchanged DOM subtrees: preserves focus, event handlers and scroll.
// The view HTML is still calculated on each call; this is a conservative DOM optimization.
function replaceIfChanged(node, html){
  if (!node || node.innerHTML === html) return false;
  node.innerHTML = html;
  return true;
}
// v3.7: reconcile board DOM in place. Keep stable card nodes by their data IDs.
// Restrict this to the boards view: forms and other views retain their existing renderer.
function boardNodeKey(node){
  if(node.nodeType!==1)return null;
  if(node.matches('.cards > [data-open][data-id]'))return 'card:'+node.dataset.open+':'+node.dataset.id;
  return null;
}
function reconcileBoardNode(oldNode,newNode){
  if(newNode.nodeType===11 && oldNode.nodeType===1){
    const fresh=Array.from(newNode.childNodes);
    for(let i=0;i<fresh.length;i++){
      if(oldNode.childNodes[i])reconcileBoardNode(oldNode.childNodes[i],fresh[i]);
      else oldNode.appendChild(fresh[i].cloneNode(true));
    }
    while(oldNode.childNodes.length>fresh.length)oldNode.lastChild.remove();
    return;
  }
  if(oldNode.nodeType!==newNode.nodeType || (oldNode.nodeType===1 && oldNode.tagName!==newNode.tagName)){
    oldNode.replaceWith(newNode.cloneNode(true));return;
  }
  if(oldNode.nodeType===3){if(oldNode.nodeValue!==newNode.nodeValue)oldNode.nodeValue=newNode.nodeValue;return;}
  if(oldNode.nodeType!==1)return;
  if(oldNode.isEqualNode(newNode))return;
  for(const a of Array.from(oldNode.attributes))if(!newNode.hasAttribute(a.name))oldNode.removeAttribute(a.name);
  for(const a of Array.from(newNode.attributes))if(oldNode.getAttribute(a.name)!==a.value)oldNode.setAttribute(a.name,a.value);
  // Card lists use stable keys, so reordering does not destroy unchanged cards.
  if(oldNode.classList.contains('cards') && newNode.classList.contains('cards')){
    const keyed=new Map();
    for(const child of oldNode.children){const key=boardNodeKey(child);if(key)keyed.set(key,child);}
    let cursor=oldNode.firstChild;
    for(const fresh of Array.from(newNode.childNodes)){
      const key=boardNodeKey(fresh);
      const existing=(key && keyed.get(key)) || (key ? null : (cursor && !boardNodeKey(cursor) ? cursor : null));
      if(existing){
        if(existing!==cursor)oldNode.insertBefore(existing,cursor);
        reconcileBoardNode(existing,fresh);
        cursor=existing.nextSibling;
        if(key)keyed.delete(key);
      }else{
        const created=fresh.cloneNode(true);oldNode.insertBefore(created,cursor);
      }
    }
    while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}
    return;
  }
  const freshChildren=Array.from(newNode.childNodes);
  for(let i=0;i<freshChildren.length;i++){
    const old=oldNode.childNodes[i];
    if(!old){oldNode.appendChild(freshChildren[i].cloneNode(true));continue;}
    reconcileBoardNode(old,freshChildren[i]);
  }
  while(oldNode.childNodes.length>freshChildren.length)oldNode.lastChild.remove();
}
function replaceBoardIfChanged(node,html){
  if(!node || node.innerHTML===html)return false;
  const template=document.createElement('template');template.innerHTML=html;
  // The DOM reconciliation is intentionally limited to the same selected board.
  const oldBoard=node.querySelector('.board-scroll[data-key]');
  const newBoard=template.content.querySelector('.board-scroll[data-key]');
  if(!oldBoard || !newBoard || oldBoard.dataset.key!==newBoard.dataset.key){node.innerHTML=html;return true;}
  reconcileBoardNode(node,template.content);
  return true;
}
// v3.8: keyed reconciliation for task lists and search results. The existing
// renderer remains the fallback when the layout changes between render passes.
function taskListNodeKey(node){
  if(node.nodeType!==1)return null;
  if(node.matches('.card[data-open="task"][data-id]'))return 'task:'+node.dataset.id;
  if(node.matches('.ext-bulk-item')){
    const card=node.querySelector('.card[data-open="task"][data-id]');
    return card?'bulk:'+card.dataset.id:null;
  }
  return null;
}
function reconcileTaskListNode(oldNode,newNode){
  if(newNode.nodeType===11 && oldNode.nodeType===1){
    const fresh=Array.from(newNode.childNodes);
    for(let i=0;i<fresh.length;i++){
      if(oldNode.childNodes[i])reconcileTaskListNode(oldNode.childNodes[i],fresh[i]);
      else oldNode.appendChild(fresh[i].cloneNode(true));
    }
    while(oldNode.childNodes.length>fresh.length)oldNode.lastChild.remove();
    return;
  }
  if(oldNode.nodeType!==newNode.nodeType || (oldNode.nodeType===1 && oldNode.tagName!==newNode.tagName)){
    oldNode.replaceWith(newNode.cloneNode(true));return;
  }
  if(oldNode.nodeType===3){if(oldNode.nodeValue!==newNode.nodeValue)oldNode.nodeValue=newNode.nodeValue;return;}
  if(oldNode.nodeType!==1 || oldNode.isEqualNode(newNode))return;
  for(const a of Array.from(oldNode.attributes))if(!newNode.hasAttribute(a.name))oldNode.removeAttribute(a.name);
  for(const a of Array.from(newNode.attributes))if(oldNode.getAttribute(a.name)!==a.value)oldNode.setAttribute(a.name,a.value);
  if(oldNode.matches('.list.grid2') && newNode.matches('.list.grid2')){
    const previous=new Map();
    for(const child of oldNode.children){const k=taskListNodeKey(child);if(k)previous.set(k,child);}
    const fragment=document.createDocumentFragment();
    for(const fresh of Array.from(newNode.children)){
      const key=taskListNodeKey(fresh), existing=key?previous.get(key):null;
      if(existing){reconcileTaskListNode(existing,fresh);fragment.appendChild(existing);previous.delete(key);}
      else fragment.appendChild(fresh.cloneNode(true));
    }
    oldNode.replaceChildren(fragment);
    return;
  }
  const freshChildren=Array.from(newNode.childNodes);
  for(let i=0;i<freshChildren.length;i++){
    const current=oldNode.childNodes[i];
    if(current)reconcileTaskListNode(current,freshChildren[i]);
    else oldNode.appendChild(freshChildren[i].cloneNode(true));
  }
  while(oldNode.childNodes.length>freshChildren.length)oldNode.lastChild.remove();
  // Keep native checkbox state in sync when a search result is selected.
  if(oldNode.matches('input[type="checkbox"]'))oldNode.checked=newNode.checked;
}
function replaceTaskListsIfChanged(node,html){
  if(!node || node.innerHTML===html)return false;
  const template=document.createElement('template');template.innerHTML=html;
  const oldLists=Array.from(node.querySelectorAll('.list.grid2'));
  const newLists=Array.from(template.content.querySelectorAll('.list.grid2'));
  const sameShape=oldLists.length===newLists.length && oldLists.length>0
    && oldLists.every((list,i)=>list.parentElement?.tagName===newLists[i].parentElement?.tagName);
  if(!sameShape){node.innerHTML=html;return true;}
  reconcileTaskListNode(node,template.content);
  return true;
}
// Локальная диагностика: только агрегированные счётчики, без содержимого задач и PIN.
const PERF_DIAG={renders:0,totalMs:0,maxMs:0,errors:0,lastErrorAt:0};
window.addEventListener('error',()=>{PERF_DIAG.errors++;PERF_DIAG.lastErrorAt=Date.now();});
window.addEventListener('unhandledrejection',()=>{PERF_DIAG.errors++;PERF_DIAG.lastErrorAt=Date.now();});
function showDiagnostics(){
  const avg=PERF_DIAG.renders ? (PERF_DIAG.totalMs/PERF_DIAG.renders).toFixed(1) : '—';
  const heap=performance.memory && Number.isFinite(performance.memory.usedJSHeapSize)
    ? Math.round(performance.memory.usedJSHeapSize/1048576)+' МБ (приблизительно)' : 'Не поддерживается браузером';
  const html=head('Диагностика')+'<div class="sh-b"><p class="hint">Показатели только текущего запуска, не передаются в сеть. Время включает формирование и обновление интерфейса.</p>'
    +'<div class="set-line"><span>Перерисовок</span><strong>'+PERF_DIAG.renders+'</strong></div>'
    +'<div class="set-line"><span>Среднее время</span><strong>'+avg+' мс</strong></div>'
    +'<div class="set-line"><span>Максимальное время</span><strong>'+PERF_DIAG.maxMs.toFixed(1)+' мс</strong></div>'
    +'<div class="set-line"><span>Ошибок JavaScript</span><strong>'+PERF_DIAG.errors+'</strong></div>'
    +'<div class="set-line"><span>Память JavaScript</span><strong>'+heap+'</strong></div>'
    +'</div><div class="sh-f"><button class="btn primary" type="button" data-close>Закрыть</button></div>';
  openSheet(html,{small:true});
}
function render(){
  const diagStart=performance.now();
  SEARCH_TEXT_CACHE = new WeakMap();
  URGENCY_KEY_CACHE = new WeakMap();
  applyTheme();
  const mainNode=$('#main');
  const previousScroll=mainNode ? mainNode.scrollTop : 0;
  const sameTab=PREVIOUS_RENDER_TAB===U.tab;
  PREVIOUS_RENDER_TAB=U.tab;
  const ae = document.activeElement;
  const fid = ae && ae.id && ae.closest && ae.closest('#main') ? ae.id : null;
  const caret = fid && typeof ae.selectionStart === 'number' ? ae.selectionStart : null;
  const keep = $$('.board-scroll').map(e => [e.dataset.key, e.scrollLeft]);
  replaceIfChanged($('#side'), sideHtml());
  replaceIfChanged($('#tabbar'), tabbarHtml());
  replaceIfChanged($('#top'), topHtml());
  const mainHtml=(VIEWS[U.tab] || viewDash)();
  const mainChanged = U.tab==='boards' && sameTab ? replaceBoardIfChanged(mainNode,mainHtml) : (sameTab && ['mine','orders','ext_search'].includes(U.tab) ? replaceTaskListsIfChanged(mainNode,mainHtml) : replaceIfChanged(mainNode,mainHtml));
  if(mainChanged){
    if(sameTab && mainNode && mainNode.scrollTop !== previousScroll) mainNode.scrollTop=previousScroll;
    keep.forEach(k => { const el = $('.board-scroll[data-key="'+k[0]+'"]'); if (el) el.scrollLeft = k[1]; });
    if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); if (caret != null) { try { el.setSelectionRange(caret, caret); } catch (e) {} } } }
  }
  const fab = $('#fab');
  const fabFor = {dash:'Задача', mine:'Задача', orders:'Указание', cal:'Задача'};
  if (fabFor[U.tab]) {
    fab.hidden = false;
    const fabHtml=ic('plus', 22) + fabFor[U.tab];
    replaceIfChanged(fab, fabHtml);
  } else fab.hidden = true;
  $('#fab-v').hidden = !fabFor[U.tab];
  const diagMs=performance.now()-diagStart;
  PERF_DIAG.renders++;PERF_DIAG.totalMs+=diagMs;PERF_DIAG.maxMs=Math.max(PERF_DIAG.maxMs,diagMs);
}

/* ================= форма задачи ================= */
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
function openTaskForm(t, defaults){
  defaults = defaults || {};
  const isNew = !t;
  const d = t ? clone(t) : Object.assign({title:'', note:'', assignees:[], due:'', priority:'mid', status:firstT(), repeat:'none', repeatDays:null, remind:null, checklist:[], sentMeta:null}, defaults.task || {});
  d.assignees = (d.assignees || []).map(a => ({name:a.name, status:a.status || firstA()}));
  d.checklist = (d.checklist || []).map(i => ({id:i.id || uid(), text:i.text || '', done:!!i.done}));
  d.priority = d.priority || 'mid'; d.repeat = d.repeat || 'none';
  if (!tSt().some(s => s.id === d.status)) d.status = firstT();
  let hasCl = d.checklist.length > 0;
  let sentKind = (d.sentMeta && d.sentMeta.kind) || 'address';
  const remindV = d.remind == null || d.remind === '' ? '' : (REMIND_FIXED.includes(String(d.remind)) ? String(d.remind) : 'custom');
  const title = isNew ? (defaults.forOrder ? 'Новое указание' : 'Новая задача') : (hasAsg(d) ? 'Указание' : 'Задача');
  const sh = openSheet(head(title) + '<div class="sh-b">'
    + '<label class="fld"><span class="lbl">Что нужно сделать</span><textarea id="f-title" rows="2" maxlength="300" placeholder="Суть задачи">'+esc(d.title)+'</textarea></label>'
    + '<label class="fld"><span class="lbl">Подробности</span><textarea id="f-note" rows="3" maxlength="3000" placeholder="Необязательно">'+esc(d.note)+'</textarea></label>'
    + '<div class="fld"><span class="lbl">Исполнители</span><div class="chips" id="f-asg"></div>'
    +   '<div class="picker"><input type="text" id="f-q" autocomplete="off" placeholder="Имя или должность" enterkeyhint="done"><div class="hits" id="f-hits" hidden></div></div>'
    +   '<p class="hint" id="f-asg-hint" style="margin:0"></p></div>'
    + '<div class="fld" id="f-st"></div>'
    + '<div class="two"><label class="fld"><span class="lbl">Срок</span><input type="date" id="f-due" value="'+esc(d.due || '')+'"></label>'
    +   '<label class="fld"><span class="lbl">Время исполнения (необязательно)</span><input type="time" id="f-due-time" value="'+esc(d.dueTime||'')+'"></label></div>'
    + '<div class="two"><label class="fld"><span class="lbl">Напомнить заранее</span><select id="f-remind">'+optsHtml(REMINDS, remindV)+'</select></label>'
    + '<label class="fld"><span class="lbl">Или точное время напоминания</span><input type="datetime-local" id="f-remind-at" value="'+esc(d.remindAt||'')+'"></label></div>'
    + '<p class="hint" style="margin:0">Время напоминания учитывается внутри открытого приложения. GitHub Pages не отправляет системные push-уведомления, когда приложение закрыто.</p>'
    + '<div class="fld"><span class="lbl">Приоритет</span><div class="seg" id="f-pr">'+PRIORITIES.map(p => '<button type="button" data-v="'+p.id+'" class="'+(d.priority === p.id ? 'on' : '')+'">'+p.name+'</button>').join('')+'</div></div>'
    + '<div class="two"><label class="fld"><span class="lbl">Повторять</span><select id="f-repeat">'+optsHtml(REPEATS, d.repeat)+'</select></label>'
    +   '<label class="fld" id="f-repeat-c-w"'+(d.repeat === 'custom' ? '' : ' hidden')+'><span class="lbl">Через сколько дней</span><input type="number" id="f-repeat-c" min="1" max="3650" value="'+esc(d.repeatDays || 1)+'"></label>'
    +   '<label class="fld" id="f-remind-c-w"'+(remindV === 'custom' ? '' : ' hidden')+'><span class="lbl">Напомнить за, дней</span><input type="number" id="f-remind-c" min="0" max="3650" value="'+esc(remindV === 'custom' ? d.remind : '')+'"></label></div>'
    + '<div class="fld" id="f-sent" hidden><span class="lbl">Куда или кому отправлено</span>'
    +   '<div class="seg" id="f-sent-k"><button type="button" data-v="address" class="'+(sentKind === 'address' ? 'on' : '')+'">Адрес</button><button type="button" data-v="person" class="'+(sentKind === 'person' ? 'on' : '')+'">Должностное лицо</button></div>'
    +   '<input type="text" id="f-sent-v" maxlength="300" value="'+esc(d.sentMeta ? d.sentMeta.value : '')+'" placeholder="Куда отправлено">'
    +   '<input type="datetime-local" id="f-sent-t" value="'+esc(d.sentMeta ? d.sentMeta.at : '')+'"></div>'
    + '<div class="fld"><label class="switch"><input type="checkbox" id="f-cl"'+(hasCl ? ' checked' : '')+'><span>Чек-лист (пункты попадут в текст задачи)</span></label><div id="f-clbox"></div></div>'
    + '<div class="share-row"><button type="button" class="btn" data-x="order" data-lp>'+ic('send', 18)+'Поставить задачу</button><button type="button" class="btn" data-x="remind" data-lp>'+ic('bell', 18)+'Напомнить</button>'
    +   '<button type="button" class="btn ghost wide" data-x="journal">'+ic('book', 18)+'Внести в ЖУПиОР</button></div>'
    + '<p class="hint" style="margin:-6px 0 0">Нажатие — задача сохраняется, текст копируется. Долгое нажатие — сразу открывается «Поделиться»: выберите мессенджер и получателя.</p>'
    + (t && t.createdAt ? '<p class="hint" style="margin:0">Создано '+esc(fmtDT(t.createdAt))+(t.completedAt ? ', выполнено '+esc(fmtDT(t.completedAt)) : '')+'</p>' : '')
    + '</div>' + foot({del:!isNew}));

  const chips = $('#f-asg', sh), q = $('#f-q', sh), hits = $('#f-hits', sh), stBox = $('#f-st', sh), sentW = $('#f-sent', sh), clbox = $('#f-clbox', sh), hint = $('#f-asg-hint', sh);
  const anySent = () => isSentStatus(d.status);
  const drawSt = () => {
    let h = '<span class="lbl">'+(d.assignees.length ? 'Мой статус (сбор, обобщение, отправка)' : 'Статус')+'</span><div class="seg" id="f-st1">'+tSt().map(s => '<button type="button" data-v="'+s.id+'" class="'+(d.status === s.id ? 'on' : '')+'"><span class="dot" style="--c:'+s.color+'"></span>'+esc(s.name)+'</button>').join('')+'</div>';
    if (d.assignees.length) {
      h += '<span class="lbl" style="margin-top:6px">Статусы исполнителей</span><div class="st-box">' + d.assignees.map((a, i) => { const s = aStatus(a.status);
        return '<div class="st-line"><span class="nm">'+esc(a.name)+'</span><select data-ai="'+i+'" style="color:'+s.color+';font-weight:600" aria-label="Статус: '+esc(a.name)+'">'+optsHtml(aSt().map(x => [x.id, x.name]), a.status)+'</select>'
          + '<button type="button" class="icon-btn" data-rem="'+i+'" aria-label="Скопировать напоминание для: '+esc(a.name)+'" title="Напомнить только ему">'+ic('bell', 18)+'</button></div>'; }).join('') + '</div>';
    }
    stBox.innerHTML = h;
    sentW.hidden = !anySent();
  };
  const drawAsg = () => {
    chips.innerHTML = d.assignees.map((a, i) => '<span class="chip">'+esc(a.name)+'<button type="button" data-rm="'+i+'" aria-label="Убрать: '+esc(a.name)+'">'+ic('x', 14)+'</button></span>').join('');
    chips.hidden = !d.assignees.length;
    hint.textContent = d.assignees.length ? 'Задача будет в разделе «Указания».' : 'Без исполнителей задача попадёт в «Мои задачи».';
    drawSt();
  };
  const drawHits = () => {
    const raw = q.value.trim(), v = raw.toLowerCase();
    const taken = new Set(d.assignees.map(a => a.name.toLowerCase()));
    const res = knownNames().filter(n => !taken.has(n.name.toLowerCase()) && (!v || n.name.toLowerCase().includes(v))).slice(0, 6);
    const exact = v && (taken.has(v) || res.some(n => n.name.toLowerCase() === v));
    hits.innerHTML = res.map(n => '<button type="button" class="hit" data-name="'+esc(n.name)+'">'+esc(n.name)+'<small>'+n.src+'</small></button>').join('')
      + (v && !exact ? '<button type="button" class="hit" data-name="'+esc(raw)+'">'+ic('plus', 16)+'Добавить «'+esc(raw)+'»</button>' : '');
    hits.hidden = !hits.innerHTML || document.activeElement !== q;
  };
  const addName = n => { n = (n || '').trim(); if (!n || d.assignees.some(a => a.name.toLowerCase() === n.toLowerCase())) return; d.assignees.push({name:n, status:firstA()}); q.value = ''; drawAsg(); drawHits(); };
  drawAsg();
  q.addEventListener('input', drawHits);
  q.addEventListener('focus', drawHits);
  q.addEventListener('blur', () => setTimeout(() => { hits.hidden = true; }, 120));
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const h = hits.querySelector('.hit'); if (h && !hits.hidden) addName(h.dataset.name); else addName(q.value); } });
  hits.addEventListener('pointerdown', e => e.preventDefault());
  hits.addEventListener('click', e => { const b = e.target.closest('.hit'); if (b) addName(b.dataset.name); });
  chips.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { d.assignees.splice(Number(b.dataset.rm), 1); drawAsg(); } });
  stBox.addEventListener('change', e => { const s = e.target.closest('select[data-ai]'); if (!s) return; d.assignees[Number(s.dataset.ai)].status = s.value; drawSt(); });
  stBox.addEventListener('click', e => {
    const b = e.target.closest('#f-st1 button'); if (b) { d.status = b.dataset.v; drawSt(); return; }
    const r = e.target.closest('[data-rem]');
    if (r) { const f = readForm(); if (f) copyText(remindText(f, d.assignees[Number(r.dataset.rem)].name), 'Напоминание скопировано'); }
  });
  $('#f-pr', sh).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; d.priority = b.dataset.v; $$('#f-pr button', sh).forEach(x => x.classList.toggle('on', x === b)); });
  $('#f-repeat', sh).addEventListener('change', e => { $('#f-repeat-c-w', sh).hidden = e.target.value !== 'custom'; });
  $('#f-remind', sh).addEventListener('change', e => { $('#f-remind-c-w', sh).hidden = e.target.value !== 'custom'; });
  $('#f-sent-k', sh).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sentKind = b.dataset.v; $$('#f-sent-k button', sh).forEach(x => x.classList.toggle('on', x === b)); $('#f-sent-v', sh).placeholder = sentKind === 'address' ? 'Куда отправлено' : 'Кому доведено'; });
  const drawCl = () => {
    clbox.innerHTML = hasCl ? '<div class="cl-edit" style="margin-top:8px">' + d.checklist.map((i, ix) => '<div class="cl-row"><input type="checkbox" data-ix="'+ix+'"'+(i.done ? ' checked' : '')+' aria-label="Выполнено"><input type="text" data-t="'+ix+'" maxlength="200" placeholder="Пункт" value="'+esc(i.text)+'"><button type="button" class="icon-btn" data-rm="'+ix+'" aria-label="Удалить пункт">'+ic('x', 16)+'</button></div>').join('')
      + '<button type="button" class="btn sm" data-add style="justify-self:start">'+ic('plus', 16)+'Пункт</button></div>' : '';
  };
  const addItem = () => { d.checklist.push({id:uid(), text:'', done:false}); drawCl(); const ins = $$('input[data-t]', clbox); if (ins.length) ins[ins.length - 1].focus(); };
  drawCl();
  $('#f-cl', sh).addEventListener('change', e => { hasCl = e.target.checked; if (hasCl && !d.checklist.length) d.checklist.push({id:uid(), text:'', done:false}); drawCl(); });
  clbox.addEventListener('change', e => { if (e.target.type === 'checkbox') d.checklist[Number(e.target.dataset.ix)].done = e.target.checked; });
  clbox.addEventListener('input', e => { if (e.target.dataset.t != null) d.checklist[Number(e.target.dataset.t)].text = e.target.value; });
  clbox.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.t != null) { e.preventDefault(); addItem(); } });
  clbox.addEventListener('click', e => { if (e.target.closest('[data-add]')) return addItem(); const b = e.target.closest('[data-rm]'); if (b) { d.checklist.splice(Number(b.dataset.rm), 1); drawCl(); } });

  function readForm(quiet){
    const title = $('#f-title', sh).value.trim();
    if (!title) { $('#f-title', sh).focus(); toast('Введите, что нужно сделать'); return null; }
    if (q.value.trim()) addName(q.value);
    const rv = $('#f-remind', sh).value, repV = $('#f-repeat', sh).value;
    return {
      title:title, note:$('#f-note', sh).value.trim(), assignees:clone(d.assignees), due:$('#f-due', sh).value || '', dueTime:$('#f-due-time',sh).value || '', remindAt:$('#f-remind-at',sh).value || '', priority:d.priority, status:d.status,
      repeat:repV, repeatDays:repV === 'custom' ? Math.max(1, Number($('#f-repeat-c', sh).value) || 1) : null,
      remind:rv === '' ? null : rv === 'custom' ? (Number($('#f-remind-c', sh).value) || 0) : Number(rv),
      checklist:hasCl ? d.checklist.filter(i => i.text.trim()).map(i => ({id:i.id, text:i.text.trim(), done:!!i.done})) : [],
      sentMeta:anySent() ? {kind:sentKind, value:$('#f-sent-v', sh).value.trim(), at:$('#f-sent-t', sh).value || nowLocal()} : null
    };
  }
  function persist(f){
    const want = f.status; delete f.status;
    let id = t ? t.id : uid();
    commit(() => {
      let x = t ? D.tasks.find(y => y.id === t.id) : null;
      if (!x) { x = {id:id, createdAt:Date.now(), order:Date.now(), status:'control', completedAt:null, archived:false, spawned:false}; D.tasks.push(x); }
      Object.assign(x, f, {updatedAt:Date.now()});
      setOverall(x, want);
      if (x.archived && !isDone(x)) { x.archived = false; x.archivedAt = null; }
    });
    return id;
  }
  sh.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    const f = readForm(); if (!f) return;
    const k = b.dataset.x;
    if (k === 'order') copyText(orderText(f), 'Задача скопирована — вставьте в мессенджер');
    else if (k === 'remind') copyText(remindText(f), 'Напоминание скопировано — вставьте в мессенджер');
    persist(f); closeSheet();
    if (k === 'journal') openJournalForm(null, {brief:f.title, party:f.assignees.map(a => a.name).join(', '), direction:'out', date:today()});
  });
  sh.addEventListener('longshare', e => {
    const b = e.target.closest('[data-x]'); if (!b || (b.dataset.x !== 'order' && b.dataset.x !== 'remind')) return;
    const f = readForm(); if (!f) return;
    shareText(b.dataset.x === 'order' ? orderText(f) : remindText(f));
    persist(f); closeSheet();
  });
  bindFoot(sh, {soft:true,
    onSave:() => { const f = readForm(); if (!f) return false; const was = !t; persist(f); toast(was ? (f.assignees.length ? 'Указание добавлено' : 'Задача добавлена') : 'Сохранено'); },
    onDelete:() => commit(() => { const x = D.tasks.find(y => y.id === t.id); if (x) toTrash('task', x); })});
  if (isNew && !defaults.noFocus) setTimeout(() => { if (defaults.forOrder) q.focus(); else $('#f-title', sh).focus(); }, 80);
}

/* ================= прочие формы ================= */
function openBCard(id,colId){
  const b=curBoard();if(!b)return;
  const c=id?D.bcards.find(x=>x.id===id):null, cols=b.cols||[];if(!cols.length)return;
  const tmpl=boardTemplate(b),cur=c&&cols.some(x=>x.id===c.col)?c.col:(colId&&cols.some(x=>x.id===colId)?colId:cols[0].id);
  const vals=c&&c.fields||{};
  const sh=openSheet(head(c?'Карточка':'Новая карточка')+'<div class="sh-b">'
    +'<label class="fld"><span class="lbl">'+(tmpl.kind==='person'?'ФИО':'Название')+' *</span><input id="k-t" type="text" maxlength="200" value="'+esc(c?c.title:'')+'" placeholder="'+(tmpl.kind==='person'?'Введите ФИО':'Название карточки')+'"></label>'
    +(tmpl.subtitle||c&&c.subtitle?'<label class="fld"><span class="lbl">Подзаголовок</span><input id="k-sub" type="text" maxlength="200" value="'+esc(c&&c.subtitle||'')+'"></label>':'')
    +tmpl.fields.map(f=>boardInputField(f,vals[f.id])).join('')
    +(!b.template||c&&(c.note||c.remark)?'<label class="fld"><span class="lbl">Заметка</span><textarea id="k-n" rows="3" maxlength="3000">'+esc(c&&c.note||'')+'</textarea></label><label class="fld"><span class="lbl">Примечание</span><textarea id="k-r" rows="2" maxlength="2000">'+esc(c&&c.remark||'')+'</textarea></label>':'')
    +'<label class="fld"><span class="lbl">Столбец</span><select id="k-c">'+optsHtml(cols.map(x=>[x.id,x.title]),cur)+'</select></label></div>'+foot({del:!!c}));
  bindFoot(sh,{soft:true,onDelete:()=>commit(()=>{const x=D.bcards.find(y=>y.id===c.id);if(x)toTrash('bcard',x);}),onSave:()=>{
    const title=$('#k-t',sh).value.trim();if(!title){toast('Введите название');$('#k-t',sh).focus();return false;}
    const fields=readBoardFields(sh,tmpl);if(fields===null)return false;
    const col=$('#k-c',sh).value,subtitle=$('#k-sub',sh)?.value.trim()||'';
    const note=$('#k-n',sh)?.value.trim()||(c&&c.note||''),remark=$('#k-r',sh)?.value.trim()||(c&&c.remark||'');
    commit(()=>{if(c){let x=D.bcards.find(y=>y.id===c.id);Object.assign(x,{title,subtitle,fields,note,remark,col});if(col!==cur)x.order=Date.now();}
      else D.bcards.push({id:uid(),board:b.id,title,subtitle,fields,note,remark,col,order:Date.now()});});
  }});
  if(!c)setTimeout(()=>$('#k-t',sh)?.focus(),80);
}
// Persisted board template enables rapid additions without reselecting a type or field set.
function openRapidBoard(){
  const b=curBoard();if(!b||b.kind==='medals')return;
  const cols=b.cols||[];if(!cols.length){toast('Сначала добавьте столбец');return;}
  const tmpl=boardTemplate(b);
  const sh=openSheet(head('Быстрое добавление')+'<div class="sh-b">'
    +'<p class="hint" style="margin:0">Введите название и нажмите Enter. Шаблон и столбец останутся выбранными для всех следующих карточек.</p>'
    +'<label class="fld"><span class="lbl">Столбец</span><select id="br-col">'+optsHtml(cols.map(x=>[x.id,x.title]),b.quickCol||cols[0].id)+'</select></label>'
    +'<label class="fld"><span class="lbl">'+(tmpl.kind==='person'?'ФИО':'Название')+'</span><input type="text" id="br-title" maxlength="200" enterkeyhint="done" autocomplete="off" placeholder="Новая карточка"></label>'
    +tmpl.fields.map(f=>boardInputField(f,'')).join('')
    +'<div class="btn-row"><button class="btn primary" type="button" id="br-add">'+ic('plus',16)+'Добавить и продолжить</button><button class="btn" type="button" id="br-bulk">Вставить списком</button></div>'
    +'<p class="hint" id="br-count">Можно добавить сколько угодно записей подряд.</p></div>'
    +'<div class="sh-f"><button class="btn" data-close>Готово</button></div>',{small:true});
  let added=0;
  const add=()=>{
    const title=$('#br-title',sh).value.trim();if(!title){$('#br-title',sh).focus();return;}
    const vals=readBoardFields(sh,tmpl);if(vals===null)return;
    const col=$('#br-col',sh).value;
    commit(()=>{D.bcards.push({id:uid(),board:b.id,col,title,fields:vals,subtitle:'',note:'',remark:'',order:Date.now()+added});b.quickCol=col;});
    added++;$('#br-title',sh).value='';$('#br-count',sh).textContent='Добавлено: '+added+' · Введите следующую карточку';$('#br-title',sh).focus();
  };
  $('#br-add',sh).addEventListener('click',add);
  $('#br-title',sh).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add();}});
  $('#br-bulk',sh).addEventListener('click',()=>{const col=$('#br-col',sh).value;closeSheet();openBulkBoard(col);});
  setTimeout(()=>$('#br-title',sh)?.focus(),100);
}
function openBulkBoard(preCol){
  const b=curBoard();if(!b||b.kind==='medals')return;
  const cols=b.cols||[];if(!cols.length)return;
  const tmpl=boardTemplate(b),sh=openSheet(head('Добавить карточки списком')+'<div class="sh-b">'
    +'<p class="hint">Одна карточка на строку. Можно вставить список из заметок или таблицы. Дополнительные поля отделяйте знаком <b>;</b> либо табуляцией. Порядок полей соответствует шаблону доски.</p>'
    +'<label class="fld"><span class="lbl">Столбец для всех карточек</span><select id="bb-col">'+optsHtml(cols.map(x=>[x.id,x.title]),preCol||b.quickCol||cols[0].id)+'</select></label>'
    +'<div class="bb-legend">'+['Название'].concat(tmpl.fields.map(f=>f.name)).map(n=>'<span>'+esc(n)+'</span>').join('')+'</div>'
    +'<label class="fld"><span class="lbl">Вставьте список</span><textarea id="bb-list" rows="12" placeholder="Первая запись\nВторая запись\nТретья запись"></textarea></label>'
    +'<p class="hint" id="bb-count">0 строк</p></div>'+foot({save:'Добавить все'}));
  const ta=$('#bb-list',sh),counter=$('#bb-count',sh);
  const lines=()=>ta.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,3000);
  ta.addEventListener('input',()=>{counter.textContent=lines().length+' строк';});
  bindFoot(sh,{onSave:()=>{
    const raw=lines();if(!raw.length){toast('Вставьте список');return false;}
    const col=$('#bb-col',sh).value,items=[],errs=[];
    for(const [ix,line] of raw.entries()){
      let parts=line.includes('\t')?line.split('\t'):line.split(';');parts=parts.map(x=>x.trim());
      const title=parts.shift()||'';if(!title){errs.push(ix+1);continue;}
      const fields={};
      for(let i=0;i<tmpl.fields.length;i++){
        const f=tmpl.fields[i],text=(parts[i]||'').slice(0,3000);
        if(f.required&&!text){errs.push(ix+1);break;}
        if(f.type==='checkbox')fields[f.id]=/^(да|yes|true|1|✓)$/i.test(text);
        else if(text)fields[f.id]=text;
      }
      if(errs[errs.length-1]===ix+1)continue;
      items.push({id:uid(),board:b.id,col,title:title.slice(0,200),fields,subtitle:'',note:'',remark:'',order:Date.now()+ix});
    }
    if(errs.length){toast('Проверьте обязательные поля в строках: '+errs.slice(0,8).join(', '));return false;}
    if(!items.length)return false;
    commit(()=>{D.bcards.push(...items);b.quickCol=col;});toast('Добавлено карточек: '+items.length);
  }});
  setTimeout(()=>ta.focus(),80);
}
function openPerson(id){
  const p = id ? D.people.find(x => x.id === id) : null, cols = medalCols();
  const cur = p && cols.some(c => c.id === p.col) ? p.col : 'c_staff';
  const sh = openSheet(head(p ? 'Карточка' : 'Новый человек') + '<div class="sh-b">'
    + '<label class="fld"><span class="lbl">ФИО</span><input type="text" id="p-f" maxlength="200" value="'+esc(p ? p.fio : '')+'"></label>'
    + '<label class="fld"><span class="lbl">К какой награде представляется</span><input type="text" id="p-a" maxlength="200" value="'+esc(p ? p.award : '')+'"></label>'
    + '<label class="fld"><span class="lbl">Имеющиеся награды</span><textarea id="p-e" rows="3" maxlength="1000">'+esc(p ? p.existing : '')+'</textarea></label>'
    + '<label class="fld"><span class="lbl">Столбец</span><select id="p-c">'+optsHtml(cols.map(c => [c.id, c.title]), cur)+'</select></label></div>' + foot({del:!!p}));
  bindFoot(sh, {soft:true, onDelete:() => commit(() => { const x = D.people.find(y => y.id === p.id); if (x) toTrash('person', x); }),
    onSave:() => {
      const fio = $('#p-f', sh).value.trim(); if (!fio) { $('#p-f', sh).focus(); toast('Введите ФИО'); return false; }
      const col = $('#p-c', sh).value, data = {fio:fio, award:$('#p-a', sh).value.trim(), existing:$('#p-e', sh).value.trim(), col:col};
      commit(() => { if (p) { const x = D.people.find(y => y.id === p.id); Object.assign(x, data); if (col !== cur) x.order = Date.now(); } else D.people.push(Object.assign({id:uid(), order:Date.now()}, data)); });
    }});
  if (!p) setTimeout(() => $('#p-f', sh).focus(), 80);
}
function openMcol(id){
  const c = id ? D.mcols.find(x => x.id === id) : null, now = new Date();
  const m = c ? c.month : now.getMonth(), y = c ? c.year : now.getFullYear();
  const sh = openSheet(head(c ? 'Столбец-месяц' : 'Новый месяц') + '<div class="sh-b"><div class="two">'
    + '<label class="fld"><span class="lbl">Месяц</span><select id="c-m">'+optsHtml(MONTHS.map((n, i) => [i, n]), m)+'</select></label>'
    + '<label class="fld"><span class="lbl">Год</span><input type="number" id="c-y" min="2000" max="2100" value="'+y+'"></label></div>'
    + '<label class="fld"><span class="lbl">Заметка к месяцу</span><textarea id="c-n" rows="3" maxlength="1000">'+esc(c ? c.note : '')+'</textarea></label></div>' + foot({del:!!c}), {small:true});
  bindFoot(sh, {delText:'Удалить столбец? Люди из него вернутся в «Личный состав».',
    onDelete:() => commit(() => { D.people.forEach(p => { if (p.col === c.id) p.col = 'c_staff'; }); D.mcols = D.mcols.filter(x => x.id !== c.id); }),
    onSave:() => {
      const mm = Number($('#c-m', sh).value), yy = Number($('#c-y', sh).value) || now.getFullYear();
      const data = {month:mm, year:yy, title:MONTHS[mm] + ' ' + yy, note:$('#c-n', sh).value.trim()};
      commit(() => { if (c) Object.assign(D.mcols.find(x => x.id === c.id), data); else D.mcols.push(Object.assign({id:uid(), order:yy * 100 + mm}, data)); });
    }});
}
function openBulkPeople(){
  const sh = openSheet(head('Добавить списком') + '<div class="sh-b"><p class="hint" style="margin:0">По одному человеку на строке. Награду можно указать через «;»: <br>Иванов Иван Иванович; медаль «За отличие»</p><textarea id="bp" rows="12"></textarea></div>' + foot({save:'Добавить'}));
  bindFoot(sh, {onSave:() => {
    const lines = $('#bp', sh).value.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast('Список пуст'); return false; }
    commit(() => lines.forEach((l, i) => { const p = l.split(';'); D.people.push({id:uid(), fio:p[0].trim(), award:(p.slice(1).join(';') || '').trim(), existing:'', col:'c_staff', order:Date.now() + i}); }));
    toast('Добавлено: ' + lines.length);
  }});
  setTimeout(() => $('#bp', sh).focus(), 80);
}
function openNewBoard(){
  let kind = 'generic';
  const sh = openSheet(head('Новая доска') + '<div class="sh-b">'
    + '<label class="fld"><span class="lbl">Название</span><input type="text" id="b-t" maxlength="100" placeholder="Например, Учёт техники"></label>'
    + '<label class="fld"><span class="lbl">Вид карточек</span><select id="b-template"><option value="simple">Простая карточка</option><option value="person">ФИО</option><option value="custom">Свой шаблон (настроить после создания)</option></select></label>'
    + '<p class="hint" style="margin:0">Шаблон и столбцы можно изменить позже в настройках доски. Заполненные записи не пропадут.</p></div>' + foot({save:'Создать'}), {small:true});
  const bk = $('#b-k', sh); if (bk) bk.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.v; $$('#b-k button', sh).forEach(x => x.classList.toggle('on', x === b)); });
  bindFoot(sh, {onSave:() => {
    const title = $('#b-t', sh).value.trim(); if (!title) { $('#b-t', sh).focus(); toast('Введите название'); return false; }
    const id = uid();
    commit(() => { D.boards.push(kind === 'medals' ? {id:id, title:title, kind:'medals', order:Date.now()} : {id:id, title:title, kind:'generic', template:defaultTemplate($('#b-template',sh).value), order:Date.now(), cols:[{id:uid(), title:'Новые'}, {id:uid(), title:'В работе'}, {id:uid(), title:'Готово'}]}); U.board = id; saveUI(); });
  }});
  setTimeout(() => $('#b-t', sh).focus(), 80);
}
function openBoardSettings(){
  const b = curBoard(); if (!b) return;
  const cols = clone(b.cols || []);
  let tmpl=clone(boardTemplate(b));
  const sh = openSheet(head('Настройка доски') + '<div class="sh-b">'
    + '<label class="fld"><span class="lbl">Название</span><input type="text" id="s-t" maxlength="100" value="'+esc(b.title)+'"></label>'
    + (b.kind === 'medals' ? '<p class="hint" style="margin:0">Столбцы-месяцы добавляются кнопкой «Месяц».</p>' : '<div class="fld"><span class="lbl">Столбцы</span><div id="s-cols" class="cl-edit"></div></div>'
      +'<div class="set-sec"><h3>Шаблон карточки</h3><label class="fld"><span class="lbl">Вид</span><select id="st-kind"><option value="simple">Простая</option><option value="person">ФИО</option><option value="custom">Свой шаблон</option></select></label>'
      +'<label class="switch"><input type="checkbox" id="st-subtitle"'+(tmpl.subtitle?' checked':'')+'>Показывать подзаголовок</label>'
      +'<p class="hint">Составьте форму один раз. Поля появятся во всех новых карточках этой доски; старые значения не удаляются.</p><div id="st-fields" class="template-fields"></div>'
      +'<button type="button" class="btn sm" id="st-add-field">'+ic('plus',16)+'Добавить поле</button></div>')
    + '</div>' + foot({del:true}));
  const box = $('#s-cols', sh);
  const draw = () => {
    if (!box) return;
    box.innerHTML = cols.map((c, i) => '<div class="cl-row"><input type="text" data-t="'+i+'" maxlength="60" value="'+esc(c.title)+'" aria-label="Название столбца">'
      + '<button type="button" class="icon-btn" data-mv="'+i+'" data-d="-1"'+(i ? '' : ' disabled')+' aria-label="Выше">'+ic('up', 16)+'</button>'
      + '<button type="button" class="icon-btn" data-rm="'+i+'" aria-label="Удалить столбец">'+ic('x', 16)+'</button></div>').join('')
      + '<button type="button" class="btn sm" data-add style="justify-self:start">'+ic('plus', 16)+'Столбец</button>';
  };
  draw();
  const fieldBox=$('#st-fields',sh),kindSel=$('#st-kind',sh); if(kindSel)kindSel.value=tmpl.kind;
  const drawFields=()=>{if(!fieldBox)return;
    fieldBox.innerHTML=tmpl.fields.map((f,i)=>'<div class="template-field"><div class="template-field-main"><input type="text" data-fname="'+i+'" maxlength="80" value="'+esc(f.name)+'" aria-label="Название поля"><select data-ftype="'+i+'">'+optsHtml(FIELD_TYPES,f.type)+'</select></div>'
      +(f.type==='select'?'<input type="text" data-foptions="'+i+'" placeholder="Варианты через запятую" maxlength="700" value="'+esc(f.options||'')+'">':'')
      +'<div class="template-field-actions"><label><input type="checkbox" data-frequired="'+i+'"'+(f.required?' checked':'')+'> Обязательное</label><button type="button" class="icon-btn" data-fup="'+i+'"'+(i?'':' disabled')+' title="Выше">'+ic('up',16)+'</button><button type="button" class="icon-btn" data-fremove="'+i+'" title="Удалить поле">'+ic('x',16)+'</button></div></div>').join('')
      +(tmpl.fields.length?'':'<p class="hint">Нет дополнительных полей. Форма содержит только название.</p>');
  };
  drawFields();
  if(kindSel)kindSel.addEventListener('change',e=>{tmpl.kind=e.target.value;drawFields();});
  $('#st-add-field',sh)?.addEventListener('click',()=>{if(tmpl.fields.length>=24){toast('Не более 24 полей');return;}tmpl.fields.push({id:uid(),name:'Новое поле',type:'text',required:false,options:''});drawFields();fieldBox.querySelector('[data-fname]:last-child')?.focus();});
  fieldBox?.addEventListener('input',e=>{const t=e.target;if(t.dataset.fname!==undefined)tmpl.fields[Number(t.dataset.fname)].name=t.value;if(t.dataset.foptions!==undefined)tmpl.fields[Number(t.dataset.foptions)].options=t.value;});
  fieldBox?.addEventListener('change',e=>{const t=e.target;if(t.dataset.ftype!==undefined){tmpl.fields[Number(t.dataset.ftype)].type=t.value;drawFields();}if(t.dataset.frequired!==undefined)tmpl.fields[Number(t.dataset.frequired)].required=t.checked;});
  fieldBox?.addEventListener('click',e=>{const rm=e.target.closest('[data-fremove]'),up=e.target.closest('[data-fup]');if(rm){tmpl.fields.splice(Number(rm.dataset.fremove),1);drawFields();}else if(up){const i=Number(up.dataset.fup);if(i>0){const x=tmpl.fields.splice(i,1)[0];tmpl.fields.splice(i-1,0,x);drawFields();}}});
  if (box) {
    box.addEventListener('input', e => { if (e.target.dataset.t != null) cols[Number(e.target.dataset.t)].title = e.target.value; });
    box.addEventListener('click', e => {
      if (e.target.closest('[data-add]')) { cols.push({id:uid(), title:''}); draw(); const ins = $$('input[data-t]', box); ins[ins.length - 1].focus(); return; }
      const mv = e.target.closest('[data-mv]'); if (mv) { const i = Number(mv.dataset.mv); const x = cols.splice(i, 1)[0]; cols.splice(i - 1, 0, x); draw(); return; }
      const r = e.target.closest('[data-rm]'); if (r) { cols.splice(Number(r.dataset.rm), 1); draw(); }
    });
  }
  bindFoot(sh, {delText:'Переместить доску «'+b.title+'» со всеми карточками в корзину?',
    onDelete:() => commit(() => {
      const ex = {board:clone(b), cards:D.bcards.filter(x => x.board === b.id).map(clone)};
      D.boards = D.boards.filter(x => x.id !== b.id);
      if (b.kind === 'medals') { if (!D.boards.some(x => x.kind === 'medals')) { ex.people = clone(D.people); ex.mcols = clone(D.mcols); D.people = []; D.mcols = []; } }
      else D.bcards = D.bcards.filter(x => x.board !== b.id);
      D.trash.unshift(Object.assign({id:uid(), kind:'board', item:{title:b.title}, deletedAt:Date.now()}, ex));
      U.board = null; }),
    onSave:() => {
      const title = $('#s-t', sh).value.trim(); if (!title) { toast('Введите название'); return false; }
      commit(() => {
        const x = D.boards.find(y => y.id === b.id); x.title = title; if(b.kind!=='medals'){tmpl.subtitle=$('#st-subtitle',sh).checked; tmpl.fields=tmpl.fields.filter(f=>f.name.trim()).map(f=>({...f,name:f.name.trim().slice(0,80)})); x.template=clone(tmpl);}
        if (b.kind !== 'medals') {
          const clean = cols.filter(c => c.title.trim()).map(c => ({id:c.id, title:c.title.trim()}));
          const keep = new Set(clean.map(c => c.id));
          x.cols = clean;
          if (clean.length) D.bcards = D.bcards.filter(c => c.board !== b.id || keep.has(c.col));
        }
      });
    }});
}
function openSub(id){
  const p = id ? D.subs.find(x => x.id === id) : null;
  const sh = openSheet(head(p ? 'Абонент' : 'Новый абонент') + '<div class="sh-b">'
    + '<label class="fld"><span class="lbl">Наименование или ФИО</span><input type="text" id="s-n" maxlength="200" value="'+esc(p ? p.name : '')+'"></label>'
    + '<label class="fld"><span class="lbl">Телефон</span><input type="tel" id="s-p" maxlength="60" value="'+esc(p ? p.phone : '')+'"></label>'
    + '<label class="fld"><span class="lbl">Адрес (ЗССПД)</span><input type="text" id="s-a" maxlength="200" value="'+esc(p ? p.address : '')+'"></label></div>' + foot({del:!!p}), {small:true});
  bindFoot(sh, {soft:true, onDelete:() => commit(() => { const x = D.subs.find(y => y.id === p.id); if (x) toTrash('sub', x); }),
    onSave:() => {
      const name = $('#s-n', sh).value.trim(); if (!name) { $('#s-n', sh).focus(); toast('Введите наименование'); return false; }
      const data = {name:name, phone:$('#s-p', sh).value.trim(), address:$('#s-a', sh).value.trim()};
      commit(() => { if (p) Object.assign(D.subs.find(x => x.id === p.id), data); else D.subs.push(Object.assign({id:uid()}, data)); });
    }});
  if (!p) setTimeout(() => $('#s-n', sh).focus(), 80);
}
function openJournalForm(id, pre){
  const j = id ? D.journal.find(x => x.id === id) : null;
  const v = j || Object.assign({brief:'', number:'', date:today(), party:'', direction:'out', mark:''}, pre || {});
  let dir = v.direction === 'in' ? 'in' : 'out';
  const sh = openSheet(head(j ? 'Запись ЖУПиОР' : 'Новая запись ЖУПиОР') + '<div class="sh-b">'
    + '<div class="fld"><span class="lbl">Распоряжение</span><div class="seg" id="j-d"><button type="button" data-v="out" class="'+(dir === 'out' ? 'on' : '')+'">Отдано</button><button type="button" data-v="in" class="'+(dir === 'in' ? 'on' : '')+'">Получено</button></div></div>'
    + '<div class="two"><label class="fld"><span class="lbl">Номер</span><input type="text" id="j-n" maxlength="60" value="'+esc(v.number)+'"></label>'
    + '<label class="fld"><span class="lbl">Дата</span><input type="date" id="j-dt" value="'+esc(v.date)+'"></label></div>'
    + '<label class="fld"><span class="lbl">Краткое содержание</span><textarea id="j-b" rows="3" maxlength="2000">'+esc(v.brief)+'</textarea></label>'
    + '<label class="fld"><span class="lbl" id="j-pl">'+(dir === 'in' ? 'От кого' : 'Кому')+'</span><input type="text" id="j-p" maxlength="300" value="'+esc(v.party)+'" list="j-names"></label>'
    + '<datalist id="j-names">'+knownNames().map(n => '<option value="'+esc(n.name)+'">').join('')+'</datalist>'
    + '<label class="fld"><span class="lbl">Отметка об исполнении</span><input type="text" id="j-m" maxlength="300" value="'+esc(v.mark || '')+'" placeholder="Необязательно"></label>'
    + '</div>' + foot({del:!!j}));
  $('#j-d', sh).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; dir = b.dataset.v; $$('#j-d button', sh).forEach(x => x.classList.toggle('on', x === b)); $('#j-pl', sh).textContent = dir === 'in' ? 'От кого' : 'Кому'; });
  bindFoot(sh, {soft:true, onDelete:() => commit(() => { const x = D.journal.find(y => y.id === j.id); if (x) toTrash('j', x); }),
    onSave:() => {
      const brief = $('#j-b', sh).value.trim(); if (!brief) { $('#j-b', sh).focus(); toast('Введите краткое содержание'); return false; }
      const data = {brief:brief, number:$('#j-n', sh).value.trim(), date:$('#j-dt', sh).value || today(), party:$('#j-p', sh).value.trim(), direction:dir, mark:$('#j-m', sh).value.trim()};
      commit(() => { if (j) Object.assign(D.journal.find(x => x.id === j.id), data); else D.journal.push(Object.assign({id:uid(), createdAt:Date.now()}, data)); });
      toast(j ? 'Сохранено' : 'Запись внесена в ЖУПиОР');
    }});
  if (!j) setTimeout(() => (pre ? $('#j-n', sh) : $('#j-b', sh)).focus(), 80);
}

/* ================= перетаскивание карточек досок ================= */
function calcOrder(list, beforeId){
  let idx = beforeId ? list.findIndex(x => x.id === beforeId) : -1;
  if (idx < 0) idx = list.length;
  const p = list[idx - 1], n = list[idx];
  if (p && n) return ((p.order || 0) + (n.order || 0)) / 2;
  if (p) return (p.order || 0) + 1000;
  if (n) return (n.order || 0) - 1000;
  return Date.now();
}
const DND = {st:null, just:false};
function dndTarget(st){
  st.ghost.style.display = 'none';
  const el = document.elementFromPoint(st.x, st.y);
  st.ghost.style.display = '';
  const tz = $('#trash-zone'); st.trash = !!(el && el.closest('#trash-zone')); if (tz) tz.classList.toggle('over', st.trash);
  const col = st.trash ? null : el && el.closest('[data-drop]');
  $$('.drop-on').forEach(x => x.classList.remove('drop-on'));
  $$('.drop-before').forEach(x => x.classList.remove('drop-before'));
  if (!col || col.dataset.drop !== st.kind) { st.col = null; return; }
  col.classList.add('drop-on');
  const cards = $$('[data-drag]', col).filter(c => c !== st.el);
  const before = cards.find(c => { const r = c.getBoundingClientRect(); return st.y < r.top + r.height / 2; });
  if (before) before.classList.add('drop-before');
  st.col = col.dataset.col; st.before = before ? before.dataset.id : null;
}
function dndBegin(st){
  st.active = true;
  const r = st.el.getBoundingClientRect();
  st.dx = st.x0 - r.left; st.dy = st.y0 - r.top;
  const g = st.el.cloneNode(true); g.classList.add('drag-ghost'); g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
  document.body.appendChild(g); st.ghost = g; st.el.classList.add('dragging');
  let tz = $('#trash-zone'); if (!tz) { tz = document.createElement('div'); tz.id = 'trash-zone'; tz.innerHTML = ic('trash', 22) + '<span>В корзину</span>'; document.body.appendChild(tz); } tz.classList.remove('over'); requestAnimationFrame(() => tz.classList.add('show'));
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  st.sc = st.el.closest('.board-scroll'); if (st.sc) { st.snap = st.sc.style.scrollSnapType; st.sc.style.scrollSnapType = 'none'; }
  const loop = () => {
    if (!st.active) return;
    const sc = st.sc;
    if (sc) { const r2 = sc.getBoundingClientRect(), E = Math.min(90, r2.width * 0.22);
      const dl = st.x - r2.left, dr = r2.right - st.x;
      if (dl < E) sc.scrollLeft -= 4 + 22 * (1 - Math.max(0, dl) / E);
      else if (dr < E) sc.scrollLeft += 4 + 22 * (1 - Math.max(0, dr) / E);
      dndTarget(st); }
    const EY = 90; if (st.y < EY) window.scrollBy(0, -(3 + 16 * (1 - st.y / EY))); else if (st.y > window.innerHeight - EY) window.scrollBy(0, 3 + 16 * (1 - (window.innerHeight - st.y) / EY));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function dndEnd(drop){
  const st = DND.st; DND.st = null; if (!st) return;
  clearTimeout(st.timer);
  if (!st.active) return;
  st.active = false;
  if (st.ghost) st.ghost.remove();
  st.el.classList.remove('dragging');
  if (st.sc) st.sc.style.scrollSnapType = st.snap || '';
  $$('.drop-on').forEach(x => x.classList.remove('drop-on'));
  $$('.drop-before').forEach(x => x.classList.remove('drop-before'));
  DND.just = true; setTimeout(() => { DND.just = false; }, 350);
  const tz = $('#trash-zone'); if (tz) { tz.classList.remove('show', 'over'); setTimeout(() => { if (!DND.st && tz.parentNode) tz.remove(); }, 260); }
  if (drop && st.trash) {
    const arr = {task:'tasks', bcard:'bcards', person:'people'}[st.kind];
    commit(() => { const x = D[arr].find(y => y.id === st.id); if (x) toTrash(st.kind, x); });
    toast('Перемещено в корзину'); return;
  }
  if (!drop || !st.col) return;
  if (st.kind === 'bcard') {
    const b = curBoard(); const list = D.bcards.filter(c => c.board === b.id && c.col === st.col && c.id !== st.id).sort(byOrder);
    commit(() => { const x = D.bcards.find(c => c.id === st.id); x.col = st.col; x.order = calcOrder(list, st.before); });
  } else if (st.kind === 'task') {
    const t0 = D.tasks.find(x => x.id === st.id); if (!t0) return;
    const ids = new Set(tSt().map(s => s.id));
    const list = D.tasks.filter(x => !x.archived && x.id !== st.id && hasAsg(x) === hasAsg(t0) && (ids.has(x.status) ? x.status : tSt()[0].id) === st.col).sort(byOrder);
    commit(() => { const x = D.tasks.find(y => y.id === st.id); if (x.status !== st.col) setOverall(x, st.col); x.order = calcOrder(list, st.before); });
  } else if (st.kind === 'person') {
    const ids = new Set(medalCols().map(c => c.id));
    const list = D.people.filter(p => (ids.has(p.col) ? p.col : 'c_staff') === st.col && p.id !== st.id).sort(byOrder);
    commit(() => { const x = D.people.find(p => p.id === st.id); x.col = st.col; x.order = calcOrder(list, st.before); });
  }
}
document.addEventListener('pointerdown', e => {
  if (e.button > 0 || SHEETS.length) return;
  const el = e.target.closest('[data-drag]'); if (!el || e.target.closest('button,a,input,select')) return;
  const st = {el:el, id:el.dataset.id, kind:el.dataset.drag, x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY, touch:e.pointerType !== 'mouse', active:false};
  DND.st = st;
  if (st.touch) st.timer = setTimeout(() => { if (DND.st === st) dndBegin(st); }, 380);
});
document.addEventListener('pointermove', e => {
  const st = DND.st; if (!st) return;
  st.x = e.clientX; st.y = e.clientY;
  if (!st.active) {
    if (Math.abs(st.x - st.x0) + Math.abs(st.y - st.y0) > 8) { if (st.touch) { clearTimeout(st.timer); DND.st = null; } else dndBegin(st); }
    return;
  }
  st.ghost.style.left = (st.x - st.dx) + 'px'; st.ghost.style.top = (st.y - st.dy) + 'px';
  dndTarget(st);
});
document.addEventListener('pointerup', () => dndEnd(true));
document.addEventListener('pointercancel', () => dndEnd(false));
document.addEventListener('touchmove', e => { if (DND.st && DND.st.active) e.preventDefault(); }, {passive:false});
document.addEventListener('contextmenu', e => { if (DND.st) e.preventDefault(); });

/* ================= экспорт и резервная копия ================= */
/* ---- Android (Capacitor): встроенные модули ---- */
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const NP = name => (NATIVE && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(b); });
async function saveFile(name, data){
  const FS = NP('Filesystem'), SH = NP('Share');
  if (FS && SH) {
    try {
      const w = await FS.writeFile({path:name, data:await blobToB64(data), directory:'CACHE'});
      await SH.share({title:name, url:w.uri, dialogTitle:'Сохранить или отправить файл'});
      return true;
    } catch (e) { if (/cancel/i.test(String(e && (e.message || e)))) return false; toast('Не удалось сохранить файл'); return false; }
  }
  try {
    const file = new File([data], name, {type:data.type || 'application/octet-stream'});
    if (navigator.canShare && navigator.canShare({files:[file]})) { await navigator.share({files:[file], title:name}); return true; }
  } catch (e) { if (e && e.name === 'AbortError') return false; }
  try {
    const u = URL.createObjectURL(data), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000); toast('Загрузка файла запрошена. Проверьте, что он появился на устройстве.'); return 'requested';
  } catch (e) { toast('Не удалось сохранить файл'); return false; }
}
const loaded = {};
function loadScript(src){
  return loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error('load')); }; document.head.appendChild(s); }));
}
async function exportXlsx(name, sheet, headRow, rows, widths){
  let blob;
  try { blob = buildXlsx(sheet, [headRow].concat(rows), widths); } catch (e) { toast('Не удалось собрать файл Excel'); return; }
  await saveFile(name + '_' + today() + '.xlsx', blob);
}
function exportTasks(){
  const rows = activeTasks().slice().sort(urgencySortFast).map(t => [
    hasAsg(t) ? 'Указание' : 'Моя', t.title, t.note || '', (t.assignees || []).map(a => a.name + ' — ' + aStatus(a.status).name).join('; '),
    fmtFull(t.due || ''), prName(t.priority), tStatus(t.status).name,
    (t.checklist || []).length ? t.checklist.filter(i => i.done).length + '/' + t.checklist.length : '',
    t.sentMeta ? (t.sentMeta.kind === 'person' ? 'Доведено: ' : 'Адрес: ') + t.sentMeta.value : '']);
  exportXlsx('skipp_zadachi', 'Задачи', ['Вид','Задача','Подробности','Исполнители и статусы','Срок','Приоритет','Мой статус','Чек-лист','Отправка'], rows, [10,36,30,36,11,10,14,9,24]);
}
function exportJournal(){
  const rows = D.journal.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(d => [d.number || '', fmtFull(d.date), d.direction === 'in' ? 'Получено' : 'Отдано', d.brief || '', d.party || '', d.mark || '']);
  exportXlsx('zhupior', 'ЖУПиОР', ['№','Дата','Распоряжение','Краткое содержание','Кому / от кого','Отметка об исполнении'], rows, [8,11,11,50,28,28]);
}
function exportBoard(){
  const b = curBoard(); if (!b) return;
  if (b.kind === 'medals') {
    const cols = medalCols(), ids = new Set(cols.map(c => c.id));
    exportXlsx('doska', b.title.slice(0, 30), ['ФИО','Столбец','Награда','Имеющиеся награды'], D.people.slice().sort(byOrder).map(p => [p.fio, (cols.find(c => c.id === (ids.has(p.col) ? p.col : 'c_staff')) || {}).title || '', p.award || '', p.existing || '']), [34,18,30,34]);
  } else {
    const fields=boardTemplate(b).fields;
    exportXlsx('doska',b.title.slice(0,30),['Заголовок','Столбец','Подзаголовок',...fields.map(f=>f.name),'Заметка','Примечание'],
      D.bcards.filter(c=>c.board===b.id).sort(byOrder).map(c=>[c.title,((b.cols||[]).find(x=>x.id===c.col)||{}).title||'',c.subtitle||'',...fields.map(f=>fieldDisplay(f,(c.fields||{})[f.id])),c.note||'',c.remark||'']),
      [36,20,30,...fields.map(_=>24),40,32]);
  }
}
// v2.7: export audit trail; records file creation, not the file contents.
function noteBackupExport(encrypted){
  return commit(()=>{
    const entries=Array.isArray(D.settings.backupHistory)?D.settings.backupHistory:[];
    D.settings.backupHistory=[{id:uid(),at:Date.now(),encrypted:!!encrypted},...entries].slice(0,30);
    D.settings.lastBackup=Date.now();
  });
}
function backup(){
  if (SEC.decoy) return;
  if (PENDING_WRITES || STORAGE_READONLY || !STORAGE_OK || SEC.locked) { toast('Дождитесь завершения сохранения перед выгрузкой'); return; }
  const sh = openSheet(head('Выгрузить данные') + '<div class="sh-b">'
    + '<p class="hint" style="margin:0">Задайте пароль на файл — без него данные из файла не прочитать. Пароль понадобится при загрузке на другом устройстве, восстановить его нельзя.</p>'
    + '<label class="fld"><span class="lbl">Пароль на файл</span><input type="password" id="bk-p1" autocomplete="new-password" placeholder="Не короче 12 символов"></label>'
    + '<label class="fld"><span class="lbl">Повторите пароль</span><input type="password" id="bk-p2" autocomplete="new-password"></label>'
    + '<div id="bk-ready" hidden class="banner" style="margin:0">Файл зашифрован и готов. Нажмите «Сохранить / отправить».</div>'
    + '</div><div class="sh-f"><button type="button" class="btn ghost" id="bk-plain">Без пароля</button><span class="sp"></span><button type="button" class="btn primary" id="bk-go">Зашифровать</button></div>', {small:true});
  let blob = null;
  const name = 'skipp_dannye_' + today() + '.json';
  $('#bk-plain', sh).addEventListener('click', async () => {
    if (!(await confirmDlg('НЕЗАЩИЩЁННАЯ КОПИЯ: любой получивший файл сможет прочитать все данные. Вы уверены, что хотите выгрузить без пароля?', 'Выгрузить'))) return;
    const data = new Blob([JSON.stringify(D, null, 1)], {type:'application/json'});
    const ok = await saveFile(name, data); if (ok) { if (ok === true) { noteBackupExport(false); } closeSheet(); }
  });
  $('#bk-go', sh).addEventListener('click', async e => {
    if (blob) { const ok = await saveFile(name, blob); if (ok) { if (ok === true) { noteBackupExport(true); } closeSheet(); } return; }
    const p1 = $('#bk-p1', sh).value, p2 = $('#bk-p2', sh).value;
    if (p1.length < 12) { toast('Пароль — не короче 12 символов'); $('#bk-p1', sh).focus(); return; }
    if (p1 !== p2) { toast('Пароли не совпадают'); $('#bk-p2', sh).focus(); return; }
    if (!CRYPTO_OK) { toast('Шифрование недоступно в этом браузере'); return; }
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Шифрую…';
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(p1, salt, ITER);
      const env = await encStr(key, JSON.stringify(D));
      blob = new Blob([JSON.stringify({skipp:'enc1', salt:b64e(salt), iter:ITER, iv:env.iv, ct:env.ct})], {type:'application/json'});
      $('#bk-ready', sh).hidden = false; btn.disabled = false; btn.textContent = 'Сохранить / отправить';
      $('#bk-p1', sh).value = ''; $('#bk-p2', sh).value = '';
    } catch (err) { btn.disabled = false; btn.textContent = 'Зашифровать'; toast('Не удалось зашифровать файл'); }
  });
  setTimeout(() => $('#bk-p1', sh).focus(), 80);
}
function askFilePassword(env, done){
  const sh = openSheet(head('Пароль файла') + '<div class="sh-b"><p class="hint" style="margin:0">Файл защищён паролем. Введите пароль, заданный при выгрузке.</p>'
    + '<label class="fld"><span class="lbl">Пароль</span><input type="password" id="fp-p" autocomplete="current-password"></label></div>'
    + '<div class="sh-f"><span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn primary" id="fp-go">Открыть</button></div>', {small:true});
  const go = async () => {
    const btn = $('#fp-go', sh); btn.disabled = true; btn.textContent = 'Проверяю…';
    try {
      const key = await deriveKey($('#fp-p', sh).value, b64d(env.salt), safeIterations(env.iter));
      const d = JSON.parse(await decStr(key, env));
      closeSheet(); done(d);
    } catch (e) { btn.disabled = false; btn.textContent = 'Открыть'; toast('Неверный пароль'); $('#fp-p', sh).select(); }
  };
  $('#fp-go', sh).addEventListener('click', go);
  $('#fp-p', sh).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTimeout(() => $('#fp-p', sh).focus(), 80);
}
function restoreFrom(file){
  if (!file || file.size > 20 * 1024 * 1024) { toast('Файл слишком большой (максимум 20 МБ)'); return; }
  const r = new FileReader();
  r.onerror = () => toast('Не удалось прочитать файл резервной копии');
  r.onload = () => {
    let d; try { d = JSON.parse(r.result); } catch (e) { toast('Файл не читается: это не файл данных СКиП'); return; }
    const apply = async d => {
      try { validateData(d); } catch(e) { toast('Файл повреждён или содержит неверную структуру'); return; }
      if (!(await confirmDlg('Заменить все данные на этом устройстве данными из файла? Задач в файле: ' + d.tasks.length + '.', 'Загрузить'))) return;
      if (commit(() => { applyLoaded(d); })) { await SEC.q; if (!STORAGE_READONLY && STORAGE_OK) toast('Данные загружены'); else toast('Не удалось сохранить восстановленные данные'); }
    };
    if (d && d.skipp === 'enc1') { if (!CRYPTO_OK) { toast('Шифрование недоступно в этом браузере'); return; } askFilePassword(d, apply); }
    else apply(d);
  };
  r.readAsText(file);
}

/* ================= настройки ================= */
const SET_GROUPS = [
  ['look', 'Оформление', 'grid', () => ({'':'Как в системе',light:'Светлое',dark:'Тёмное',emerald:'Изумрудный штаб',graphite:'Тактический графит',holo:'Голографический центр',hybrid:'Изумрудный HUD',executive:'Светлый командный',command:'Командный HUD',headquarters:'Тёмный штаб',tactical:'Тактическая сетка',daylight:'Дневной изумруд'}[D.settings.theme || ''] || 'Как в системе') + ' · заставка: ' + (D.settings.splash === false ? 'выкл.' : D.settings.splashMode === 'daily' ? 'раз в сутки' : 'каждый запуск')],
  ['msg', 'Сообщения', 'send', () => 'Подпись, шаблоны' + (D.settings.embedCode ? ', код СКиП' : '')],
  ['lists', 'Списки и статусы', 'boards', () => 'Мои: ' + (D.settings.views.mine === 'kanban' ? 'канбан' : 'список') + ' · Указания: ' + (D.settings.views.orders === 'kanban' ? 'канбан' : 'список') + ' · блоки штаба'],
  ['safe', 'Защита', 'lock', () => pinSet() ? 'Код включён' + (!SEC.decoy && auxRec() ? ' · тревога' : '') : 'Код выключен'],
  ['data', 'Данные', 'download', () => SEC.decoy ? 'Очистка' : (D.settings.lastBackup ? 'Последняя выгрузка: ' + fmtDT(D.settings.lastBackup) : 'Выгрузка ещё не делалась')],
  ['help', 'Обучение', 'hq', () => 'Обзор возможностей' + (hasDemo() ? ' · образец добавлен' : ' и образец')]
];
function settingsGroupHtml(g){
  if (g === 'look') return '<div class="fld"><span class="lbl">Тема</span><div class="seg" id="st-th">'+[['', 'Как в системе'], ['light', 'Светлое'], ['dark', 'Тёмное'], ['emerald','Изумрудный штаб'],['graphite','Графит'],['holo','Голографический'],['hybrid','Изумрудный HUD'],['executive','Светлый командный'],['command','Командный HUD · премиум'],['headquarters','Тёмный штаб · металл'],['tactical','Тактическая сетка'],['daylight','Дневной изумруд']].map(x => '<button type="button" data-v="'+x[0]+'" class="'+((D.settings.theme || '') === x[0] ? 'on' : '')+'">'+x[1]+'</button>').join('')+'</div></div>'
    + '<div class="set-sec"><h3>Кинематографическая заставка СКиП</h3><label class="switch"><input type="checkbox" id="st-splash"'+(D.settings.splash !== false ? ' checked' : '')+'><span>Показывать при запуске</span></label>'
    + '<div class="seg" id="st-spm">'+[['always', 'Каждый запуск'], ['daily', 'Раз в сутки']].map(x => '<button type="button" data-v="'+x[0]+'" class="'+((D.settings.splashMode || 'always') === x[0] ? 'on' : '')+'">'+x[1]+'</button>').join('')+'</div>'
    + '<label class="switch"><input type="checkbox" id="st-splash-sound"'+(D.settings.splashSound !== false ? ' checked' : '')+'><span>Звук кинематографической заставки</span></label>'
    + '<label class="switch"><input type="checkbox" id="st-splash-radio"'+(D.settings.splashRadio !== false ? ' checked' : '')+'><span>Голосовое радиоприветствие по времени суток</span></label>'
    + '<p class="hint" style="margin:0">На iPhone и iPad для включения звука может потребоваться касание экрана.</p>'
    + '<div class="fld"><span class="lbl">Качество видео</span><div class="seg" id="st-sq">'+[['auto','Авто'],['720','720p'],['1080','1080p']].map(x => '<button type="button" data-v="'+x[0]+'" class="'+((D.settings.splashQuality || 'auto') === x[0] ? 'on' : '')+'">'+x[1]+'</button>').join('')+'</div></div>'
    + '<div class="btn-row"><button type="button" class="btn sm" data-s="splash-test">'+ic('repeat',16)+'Проверить заставку</button></div></div>';
  if (g === 'msg') return '<label class="fld"><span class="lbl">Подпись в сообщениях</span><textarea id="st-sign" rows="2" maxlength="300" placeholder="Например: Начальник штаба Петров">'+esc(D.settings.sign || '')+'</textarea><span class="hint" style="margin:0">Добавляется в конец текста «Поставить задачу» и «Напомнить».</span></label>'
    + '<div class="set-sec"><h3>Шаблоны</h3><p>Текст для кнопок «Поставить задачу» и «Напомнить».</p><div class="btn-row"><button type="button" class="btn sm" data-s="tpl">'+ic('send', 16)+'Шаблоны</button></div></div>'
    + '<div class="set-sec"><h3>Код СКиП</h3><label class="switch"><input type="checkbox" id="st-code"'+(D.settings.embedCode ? ' checked' : '')+'><span>Добавлять код в конец сообщения</span></label>'
    + '<p class="hint" style="margin:0">С кодом задача переносится в СКиП на другом устройстве без потерь (кнопка «Вставить задачу»). Получатели без приложения увидят строку вида ⟦СКиПП:…⟧.</p></div>';
  if (g === 'lists') return '<div class="fld"><span class="lbl">Вид списков</span>'
    + [['mine','Мои задачи'],['orders','Указания']].map(x => '<div class="set-line"><span>'+x[1]+'</span><div class="seg" data-view="'+x[0]+'">'+[['list','Список'],['kanban','Канбан']].map(v => '<button type="button" data-v="'+v[0]+'" class="'+(D.settings.views[x[0]] === v[0] ? 'on' : '')+'">'+v[1]+'</button>').join('')+'</div></div>').join('') + '</div>'
    + '<div class="set-sec"><h3>Статусы</h3><p>В канбане столбцы — это статусы. Их можно добавить, переименовать и перекрасить.</p><div class="btn-row"><button type="button" class="btn sm" data-s="st-task">'+ic('boards', 16)+'Мои статусы</button><button type="button" class="btn sm" data-s="st-asg">'+ic('me', 16)+'Статусы исполнителей</button></div></div>'
    + '<div class="set-sec"><h3>Штаб</h3><div class="btn-row"><button type="button" class="btn sm" data-s="dash">'+ic('hq', 16)+'Блоки штаба</button></div></div>';
  if (g === 'safe') return '<p style="margin:0">'+(pinSet() ? (pinRecV2() ? 'Код включён. Данные зашифрованы, но цифровой PIN можно подобрать при доступе к копии базы. Для особо важных данных используйте длинный пароль и зашифрованные резервные копии.' : 'Код-пароль включён.') : 'Код выключен. Цифровой PIN удобен для входа, но недостаточно устойчив к офлайн-перебору зашифрованной базы.')+'</p>'
    + (pinSet() ? '<div class="fld"><span class="lbl">Автоблокировка</span><div class="seg" id="st-al">'+[[0,'Сразу'],[1,'1 мин'],[5,'5 мин'],[15,'15 мин'],[-1,'Выкл']].map(x => '<button type="button" data-v="'+x[0]+'" class="'+(autolockMin() === x[0] ? 'on' : '')+'">'+x[1]+'</button>').join('')+'</div><span class="hint" style="margin:0">Если приложение свёрнуто дольше этого времени, при возврате снова нужен код. Пока свёрнуто, содержимое скрыто.</span></div>' : '')
    + (SEC.decoy ? '' : '<div class="btn-row">' + (pinSet() ? '<button type="button" class="btn sm" data-s="pin-set">Сменить код</button><button type="button" class="btn sm danger-o" data-s="alarm">Тревога'+(auxRec() ? ' (вкл.)' : '')+'</button><button type="button" class="btn sm danger-o" data-s="pin-off">Выключить код</button>' : '<button type="button" class="btn sm primary" data-s="pin-set">Включить код-пароль</button>') + '</div>');
  if (g === 'data') return (SEC.decoy ? '' : '<p style="margin:0">Всё хранится только на этом устройстве и никуда не отправляется. Чтобы перенести задачи на другое устройство, выгрузите файл, передайте его любым способом (Telegram, почта, AirDrop) и загрузите там.</p>'
    + '<div class="btn-row"><button type="button" class="btn sm" data-s="backup">'+ic('download', 16)+'Выгрузить данные</button><label class="btn sm" style="cursor:pointer">'+ic('upload', 16)+'Загрузить данные<input type="file" id="st-file" accept=".json,application/json" hidden></label><button type="button" class="btn sm" data-s="xlsx">'+ic('download', 16)+'Задачи в Excel</button></div>'
    + '<div class="btn-row"><button type="button" class="btn sm" id="skipp-diagnostics">Диагностика производительности</button></div>'
    + '<p class="hint" style="margin:0">Загрузка заменяет все данные на устройстве данными из файла.</p>')
    + '<div class="set-sec"><h3>Очистка</h3><div class="btn-row"><button type="button" class="btn sm danger-o" data-s="wipe">'+ic('trash', 16)+'Удалить все данные</button></div></div>';
  return '<p style="margin:0">Короткий обзор возможностей и тестовые задачи, чтобы всё попробовать.</p><div class="btn-row"><button type="button" class="btn sm" data-s="tour">Обучение</button>'
    + (hasDemo() ? '<button type="button" class="btn sm danger-o" data-s="demo-off">Убрать образец</button>' : '<button type="button" class="btn sm" data-s="demo">Образец</button>') + '</div>';
}
function openSettings(group){
  if (!group) {
    const root = openSheet(head('Настройки') + '<div class="menu set-menu">' + SET_GROUPS.map(g => '<button type="button" data-g="'+g[0]+'">'+ic(g[2], 22)+'<span class="sm-t"><b>'+g[1]+'</b><small>'+esc(g[3]())+'</small></span><span class="ck">'+ic('chevR', 18)+'</span></button>').join('') + '</div>', {small:true});
    root.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) openSettings(b.dataset.g); });
    return;
  }
  const gi = SET_GROUPS.find(x => x[0] === group) || SET_GROUPS[0];
  const refreshRoot = () => { const r = SHEETS.length > 1 ? SHEETS[SHEETS.length - 2].ov : null; if (r) $$('.set-menu [data-g]', r).forEach(b => { const g = SET_GROUPS.find(x => x[0] === b.dataset.g); if (g) $('small', b).textContent = g[3](); }); };
  const sh = openSheet(head(gi[1]) + '<div class="sh-b">' + settingsGroupHtml(group) + '</div><div class="sh-f"><span class="sp"></span><button type="button" class="btn primary" data-close>Готово</button></div>', {small:true, onClose:refreshRoot});
  const on = (sel, ev, fn) => { const el = $(sel, sh); if (el) el.addEventListener(ev, fn); };
  const segPick = (sel, fn) => on(sel, 'click', e => { const b = e.target.closest('button'); if (!b) return; fn(b.dataset.v); $$(sel + ' button', sh).forEach(x => x.classList.toggle('on', x === b)); });
  segPick('#st-th', v => { if (commit(() => { D.settings.theme = v; })) applyTheme(); });
  segPick('#st-spm', v => { commit(() => { D.settings.splashMode = v; }); });
  segPick('#st-sq', v => { commit(() => { D.settings.splashQuality = v; }); });
  on('#st-splash-sound','change', e => { commit(() => { D.settings.splashSound = e.target.checked; }); });
  on('#st-splash-radio','change', e => { commit(() => { D.settings.splashRadio = e.target.checked; }); });
  segPick('#st-al', v => { commit(() => { D.settings.autolock = Number(v); }); });
  on('#st-sign', 'input', e => scheduleSetting('sign', e.target.value));
  on('#st-splash', 'change', e => { commit(() => { D.settings.splash = e.target.checked; }); });
  on('#st-code', 'change', e => { commit(() => { D.settings.embedCode = e.target.checked; }); });
  $$('[data-view]', sh).forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; commit(() => { D.settings.views[g.dataset.view] = b.dataset.v; }); render(); $$('button', g).forEach(x => x.classList.toggle('on', x === b)); }));
  on('#st-file', 'change', e => { const f = e.target.files && e.target.files[0]; if (f) { while (SHEETS.length) closeSheet(); restoreFrom(f); } });
  sh.addEventListener('click', async e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const k = b.dataset.s;
    if (k === 'splash-test') { while (SHEETS.length) closeSheet(); showSplash(()=>{}); }
    else if (k === 'dash') { while (SHEETS.length) closeSheet(); openDashSettings(); }
    else if (k === 'tpl') openTemplates();
    else if (k === 'alarm') { while (SHEETS.length) closeSheet(); openAlarm(); }
    else if (k === 'tour') { while (SHEETS.length) closeSheet(); openTour(); }
    else if (k === 'demo') { while (SHEETS.length) closeSheet(); addDemo(); }
    else if (k === 'demo-off') { while (SHEETS.length) closeSheet(); removeDemo(); }
    else if (k === 'st-task') openStatusEditor('task');
    else if (k === 'st-asg') openStatusEditor('asg');
    else if (k === 'backup') backup();
    else if (k === 'pin-set') { while (SHEETS.length) closeSheet(); setupPin(); }
    else if (k === 'pin-off') { if (await confirmDlg('Выключить код-пароль? Данные на устройстве будут храниться без шифрования.', 'Выключить')) { try { await disablePin(); while (SHEETS.length) closeSheet(); toast('Код-пароль выключен'); } catch(e) { toast('Не удалось отключить PIN. Защита сохранена.'); } } }
    else if (k === 'xlsx') exportTasks();
    else if (k === 'wipe') {
      if (await confirmDlg('Удалить все задачи, доски, абонентов и журнал с этого устройства? Действие можно отменить кнопкой «Отменить» до закрытия страницы.', 'Удалить всё')) {
        while (SHEETS.length) closeSheet(); commit(() => { const s = D.settings; D = blank(); D.settings = s; }); toast('Данные удалены');
      }
    }
  });
}
function openTemplates(){
  const s = D.settings.tpl;
  const sample = {title:'Подготовить донесение о наличии ГСМ', note:'Данные по состоянию на 18:00', assignees:[{name:'Иванов И.И.', status:firstA()}, {name:'Петров П.П.', status:firstA()}], due:addDays(today(), 2), priority:'high', checklist:[{text:'Сверить с журналом'}, {text:'Подписать у командира'}]};
  const block = kind => '<div class="fld"><span class="lbl">'+(kind === 'order' ? 'Поставить задачу' : 'Напомнить')+'</span>'
    + '<div class="seg" data-tk="'+kind+'">'+Object.keys(TPL[kind]).map(k => '<button type="button" data-v="'+k+'" class="'+(s[kind] === k ? 'on' : '')+'">'+TPL[kind][k].name+'</button>').join('')+'</div>'
    + '<div data-cw="'+kind+'"'+(s[kind] === 'custom' ? '' : ' hidden')+' class="fld"><textarea rows="7" data-ct="'+kind+'" placeholder="'+esc('Пример:\n' + TPL[kind].official.text)+'">'+esc((kind === 'order' ? s.customOrder : s.customRemind) || '')+'</textarea>'
    + '<div class="chips">'+TPL_KEYS.map(x => '<button type="button" class="fchip" data-ins="'+kind+'" data-k="'+x[0]+'" title="'+x[1]+'">'+x[0]+'</button>').join('')+'</div></div>'
    + '<span class="lbl" style="font-weight:500">Как будет выглядеть</span><div class="preview" data-pv="'+kind+'"></div></div>';
  const sh = openSheet(head('Шаблоны сообщений') + '<div class="sh-b">'+block('order')+block('remind')
    + '<p class="hint" style="margin:0">Строка, в которой все поля пустые (например, нет подробностей), в сообщение не попадает. Подпись задаётся в настройках.</p></div>'
    + '<div class="sh-f"><span class="sp"></span><button type="button" class="btn primary" data-close>Готово</button></div>');
  const pv = () => { $('[data-pv="order"]', sh).textContent = orderText(sample); $('[data-pv="remind"]', sh).textContent = remindText(sample); };
  pv();
  sh.addEventListener('click', e => {
    const b = e.target.closest('[data-tk] button');
    if (b) { const kind = b.parentNode.dataset.tk; scheduleTemplateSetting(kind, b.dataset.v); $$('button', b.parentNode).forEach(x => x.classList.toggle('on', x === b)); $('[data-cw="'+kind+'"]', sh).hidden = b.dataset.v !== 'custom';
      if (b.dataset.v === 'custom') { const ta = $('[data-ct="'+kind+'"]', sh); scheduleTemplateSetting(kind === 'order' ? 'customOrder' : 'customRemind', ta.value); }
      pv(); return; }
    const ins = e.target.closest('[data-ins]');
    if (ins) { const kind = ins.dataset.ins, ta = $('[data-ct="'+kind+'"]', sh), p = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
      ta.value = ta.value.slice(0, p) + ins.dataset.k + ta.value.slice(ta.selectionEnd != null ? ta.selectionEnd : p); ta.focus(); const np = p + ins.dataset.k.length; try { ta.setSelectionRange(np, np); } catch (err) {}
      ta.dispatchEvent(new Event('input', {bubbles:true})); }
  });
  sh.addEventListener('input', e => { const ta = e.target.closest('[data-ct]'); if (!ta) return; scheduleTemplateSetting(ta.dataset.ct === 'order' ? 'customOrder' : 'customRemind', ta.value); pv(); });
}
function openStatusEditor(kind){
  const key = kind === 'task' ? 'taskStatuses' : 'asgStatuses';
  const list = clone(D.settings[key]);
  const title = kind === 'task' ? 'Мои статусы' : 'Статусы исполнителей';
  const note = kind === 'task' ? 'Статусы ваших задач и ваш статус по указаниям — это столбцы канбана. Статус с отметкой «завершает» отправляет задачу в архив на следующий день.' : 'Статусы, которые вы отмечаете за каждого исполнителя. Отметка «завершает» означает, что исполнитель доложил: ему больше не уходит напоминание.';
  const sh = openSheet(head(title) + '<div class="sh-b"><p class="hint" style="margin:0">'+note+'</p><div id="se" class="cl-edit"></div></div>' + '<div class="sh-f"><button type="button" class="btn ghost" data-def>По умолчанию</button><span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn primary" data-sv>Сохранить</button></div>');
  const box = $('#se', sh);
  const draw = () => {
    box.innerHTML = list.map((s, i) => '<div class="st-ed"><button type="button" class="sw-c" data-col="'+i+'" style="--c:'+s.color+'" aria-label="Сменить цвет"></button>'
      + '<input type="text" data-t="'+i+'" maxlength="40" value="'+esc(s.name)+'" aria-label="Название статуса">'
      + '<label class="dn"><input type="checkbox" data-dn="'+i+'"'+(s.done ? ' checked' : '')+'>завершает</label>'
      + '<button type="button" class="icon-btn" data-mv="'+i+'"'+(i ? '' : ' disabled')+' aria-label="Выше">'+ic('up', 16)+'</button>'
      + '<button type="button" class="icon-btn" data-rm="'+i+'"'+(list.length > 1 ? '' : ' disabled')+' aria-label="Удалить статус">'+ic('x', 16)+'</button></div>').join('')
      + '<button type="button" class="btn sm" data-add style="justify-self:start">'+ic('plus', 16)+'Статус</button>';
  };
  draw();
  box.addEventListener('input', e => { if (e.target.dataset.t != null) list[Number(e.target.dataset.t)].name = e.target.value; });
  box.addEventListener('change', e => { if (e.target.dataset.dn != null) list[Number(e.target.dataset.dn)].done = e.target.checked; });
  box.addEventListener('click', e => {
    if (e.target.closest('[data-add]')) { list.push({id:'s' + uid(), name:'', color:COLORS[list.length % COLORS.length]}); draw(); const ins = $$('input[data-t]', box); ins[ins.length - 1].focus(); return; }
    const c = e.target.closest('[data-col]'); if (c) { const s = list[Number(c.dataset.col)]; s.color = COLORS[(COLORS.indexOf(s.color) + 1) % COLORS.length]; draw(); return; }
    const mv = e.target.closest('[data-mv]'); if (mv) { const i = Number(mv.dataset.mv); const x = list.splice(i, 1)[0]; list.splice(i - 1, 0, x); draw(); return; }
    const r = e.target.closest('[data-rm]'); if (r && list.length > 1) { list.splice(Number(r.dataset.rm), 1); draw(); }
  });
  $('[data-def]', sh).addEventListener('click', () => { list.length = 0; (kind === 'task' ? DEF_TASK_ST : DEF_ASG_ST).forEach(s => list.push(clone(s))); draw(); });
  $('[data-sv]', sh).addEventListener('click', () => {
    const clean = list.filter(s => s.name.trim()).map(s => ({id:s.id, name:s.name.trim(), color:s.color, done:!!s.done}));
    if (!clean.length) { toast('Нужен хотя бы один статус'); return; }
    if (!clean.some(s => !s.done)) { toast('Нужен хотя бы один статус без отметки «завершает»'); return; }
    if (kind === 'task' && !clean.some(s => s.done)) { toast('Отметьте «завершает» хотя бы у одного статуса — иначе задачи не уйдут в архив'); return; }
    commit(() => {
      D.settings[key] = clean;
      const ids = new Set(clean.map(s => s.id)), first = (clean.find(s => !s.done) || clean[0]).id;
      D.tasks.forEach(t => { if (kind === 'task') { if (!ids.has(t.status)) t.status = first; } else (t.assignees || []).forEach(a => { if (!ids.has(a.status)) a.status = first; }); });
    });
    closeSheet(); toast('Статусы сохранены');
  });
}
function openDashSettings(){
  const ds = D.settings.dash;
  const sh = openSheet(head('Блоки штаба') + '<div class="sh-b"><div id="dw"></div><div id="dw-add"></div></div><div class="sh-f"><button type="button" class="btn ghost" data-r>По умолчанию</button><span class="sp"></span><button type="button" class="btn primary" data-close>Готово</button></div>');
  const box = $('#dw', sh), add = $('#dw-add', sh);
  const draw = () => {
    const order = dashOrder();
    box.innerHTML = order.map((k, i) => '<div class="dw-row"><label><input type="checkbox" data-k="'+esc(k)+'"'+(ds.hidden[k] ? '' : ' checked')+'>'+esc(widgetTitle(k))+'</label>'
      + '<button type="button" class="icon-btn" data-up="'+i+'"'+(i ? '' : ' disabled')+' aria-label="Выше">'+ic('up', 16)+'</button>'
      + '<button type="button" class="icon-btn" data-dn="'+i+'"'+(i < order.length - 1 ? '' : ' disabled')+' aria-label="Ниже">'+ic('down', 16)+'</button>'
      + (ds.custom[k] ? '<button type="button" class="icon-btn" data-del="'+esc(k)+'" aria-label="Удалить показатель">'+ic('trash', 16)+'</button>' : '') + '</div>').join('');
    const boards = D.boards.slice().sort(byOrder);
    add.innerHTML = boards.length ? '<div class="set-sec" style="margin-top:6px"><h3>Показатель из доски</h3>'
      + '<div class="two"><select id="am-b" aria-label="Доска">'+optsHtml(boards.map(b => [b.id, b.title]), boards[0].id)+'</select><select id="am-c" aria-label="Столбец"></select></div>'
      + '<div class="two"><input type="text" id="am-l" maxlength="60" placeholder="Название, например: Представлены"><select id="am-k" aria-label="Что выводить">'+optsHtml([['count','Количество'],['names','Список']], 'count')+'</select></div>'
      + '<button type="button" class="btn sm" id="am-go" style="justify-self:start">'+ic('plus', 16)+'Добавить показатель</button></div>' : '';
    const fill = () => { const b = D.boards.find(x => x.id === $('#am-b', sh).value); $('#am-c', sh).innerHTML = optsHtml(b ? (b.kind === 'medals' ? medalCols().map(c => [c.id, c.title]) : (b.cols || []).map(c => [c.id, c.title])) : [], ''); };
    if (boards.length) { fill(); $('#am-b', sh).addEventListener('change', fill); }
  };
  draw();
  const setOrder = o => { commit(() => { D.settings.dash.order = o; }); render(); draw(); };
  box.addEventListener('change', e => { const c = e.target.closest('[data-k]'); if (!c) return; commit(() => { D.settings.dash.hidden[c.dataset.k] = !c.checked; }); render(); });
  box.addEventListener('click', e => {
    const o = dashOrder();
    const up = e.target.closest('[data-up]'); if (up) { const i = Number(up.dataset.up); [o[i - 1], o[i]] = [o[i], o[i - 1]]; return setOrder(o); }
    const dn = e.target.closest('[data-dn]'); if (dn) { const i = Number(dn.dataset.dn); [o[i + 1], o[i]] = [o[i], o[i + 1]]; return setOrder(o); }
    const del = e.target.closest('[data-del]'); if (del) { commit(() => { delete D.settings.dash.custom[del.dataset.del]; D.settings.dash.order = o.filter(k => k !== del.dataset.del); }); render(); draw(); }
  });
  add.addEventListener('click', e => {
    if (!e.target.closest('#am-go')) return;
    const label = $('#am-l', sh).value.trim(), colId = $('#am-c', sh).value;
    if (!label) { $('#am-l', sh).focus(); toast('Введите название показателя'); return; }
    if (!colId) { toast('В доске нет столбцов'); return; }
    const k = 'm_' + uid();
    commit(() => { D.settings.dash.custom[k] = {boardId:$('#am-b', sh).value, colId:colId, label:label, kind:$('#am-k', sh).value}; D.settings.dash.order = dashOrder().concat(k); }); render(); draw(); toast('Показатель добавлен');
  });
  $('[data-r]', sh).addEventListener('click', () => { commit(() => { D.settings.dash.order = DASH_DEFAULT.slice(); D.settings.dash.hidden = {}; }); render(); draw(); });
}


/* ================= код-пароль ================= */
const PIN_KEY = 'skipp_pin';
function pinSet(){ try { return !!localStorage.getItem(PIN_KEY); } catch (e) { return false; } }
async function hashPin(pin, salt){
  const s = salt + ':' + pin;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'f' + (h >>> 0).toString(16);
}
let INTRO_AUDIO_CONTEXT=null;
let INTRO_SOUND_REQUESTED=true;
function primeIntroAudio(){
  try {
    const AC=window.AudioContext || window.webkitAudioContext;
    if(!AC)return false;
    if(!INTRO_AUDIO_CONTEXT)INTRO_AUDIO_CONTEXT=new AC();
    const ctx=INTRO_AUDIO_CONTEXT;
    const buffer=ctx.createBuffer(1,1,ctx.sampleRate); const source=ctx.createBufferSource();
    source.buffer=buffer;source.connect(ctx.destination);source.start(0);
    ctx.resume().catch(()=>{});
    return true;
  }catch(e){return false;}
}
function pinPad(title, sub, onDone, opts){
  opts = opts || {};
  const ov = document.createElement('div'); ov.className = 'lock-screen';
  const digits = opts.digits || 4;
  ov.innerHTML = '<div class="lock-box"><img class="mark-img big" src="icon-192.png" alt="" width="64" height="64"><h2>'+esc(title)+'</h2><p class="lock-sub">'+esc(sub)+'</p><div class="pin-dots">'+'<i></i>'.repeat(digits)+'</div>'
    + '<div class="pad">'+[1,2,3,4,5,6,7,8,9].map(n => '<button type="button" data-n="'+n+'">'+n+'</button>').join('')
    + (opts.cancel ? '<button type="button" data-c class="pad-t">Отмена</button>' : (opts.forgot ? '<button type="button" data-f class="pad-t">Забыли?</button>' : '<span></span>'))
    + '<button type="button" data-n="0">0</button><button type="button" data-b class="pad-t" aria-label="Стереть">⌫</button></div>'
    + (opts.showSound ? '<div class="pin-sound-box"><button type="button" class="pin-sound-button" data-sound><span class="pin-sound-dot"></span>🔊 <span class="pin-sound-label">Активировать звук заставки</span></button><p class="pin-sound-help">На iPhone и iPad звук иногда блокируется системой. Если заставка беззвучна, нажмите эту кнопку перед вводом PIN.</p><button type="button" data-sound-info class="pin-help-link">Почему требуется нажатие?</button></div>' : '')
    + '</div>';
  document.body.appendChild(ov); document.body.classList.add('lock');
  if(opts.showSound){
    try{INTRO_SOUND_REQUESTED=localStorage.getItem('skipp_intro_audio_pref')!=='off';}catch(e){INTRO_SOUND_REQUESTED=true;}
    const b=ov.querySelector('[data-sound]');
    const update=armed=>{b.classList.toggle('armed',!!armed);b.querySelector('.pin-sound-label').textContent=armed?'Звук активирован ✓':'Принудительно включить звук';};
    update(false);
    b.addEventListener('click',()=>{
      // This is an enable/prime action, never a toggle that silently disables sound.
      INTRO_SOUND_REQUESTED=true;
      try{localStorage.setItem('skipp_intro_audio_pref','on');}catch(e){}
      const armed=primeIntroAudio();update(armed);
      if(!armed){ov.querySelector('.pin-sound-help').textContent='Не удалось активировать звук. При появлении заставки нажмите кнопку включения звука ещё раз.';}
    });
    const info=()=>{
      const help=ov.querySelector('.pin-sound-help');
      help.textContent='iOS ограничивает запуск звука без касания. Включите звук здесь, а если система всё равно блокирует его, нажмите подсвеченную кнопку на заставке. Настройки доступны в разделе «Оформление».';
      help.classList.add('pin-sound-important');
      try{localStorage.setItem('skipp_sound_hint_seen','1');}catch(e){}
    };
    ov.querySelector('[data-sound-info]').addEventListener('click',info);
    try{if(!localStorage.getItem('skipp_sound_hint_seen')){info();}}catch(e){}
  }
  let v = '';
  const dots = $$('.pin-dots i', ov), subEl = $('.lock-sub', ov);
  const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < v.length));
  let busy = false;
  const api = {
    busy(on){ busy = !!on; },
    close(){ ov.remove(); if (!SHEETS.length) document.body.classList.remove('lock'); },
    fail(msg){ busy = false; v = ''; draw(); subEl.textContent = msg; ov.querySelector('.pin-dots').classList.remove('shake'); void ov.offsetWidth; ov.querySelector('.pin-dots').classList.add('shake'); },
    reset(t, s){ busy = false; v = ''; draw(); $('h2', ov).textContent = t; subEl.textContent = s; },
    msg(s){ subEl.textContent = s; }
  };
  const press = n => { if (busy || v.length >= digits) return; v += n; draw(); if (v.length === digits) { if(opts.showSound && INTRO_SOUND_REQUESTED)primeIntroAudio(); busy = true; const x = v; setTimeout(() => onDone(x, api), 120); } };
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.n != null) press(b.dataset.n);
    else if (b.hasAttribute('data-b') && !busy) { v = v.slice(0, -1); draw(); }
    else if (b.hasAttribute('data-c')) api.close();
    else if (b.hasAttribute('data-f') && opts.forgot) opts.forgot(api);
  });
  const kd = e => { if (!document.body.contains(ov)) { document.removeEventListener('keydown', kd); return; } if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace' && !busy) { v = v.slice(0, -1); draw(); } };
  document.addEventListener('keydown', kd);
  return api;
}
function autolockMin(){ const v = D.settings.autolock; return v == null ? 5 : Number(v); }
async function enablePin(pin){
  if (!/^\d{4}(?:\d{2})?$/.test(pin)) throw new Error('PIN должен содержать 4 или 6 цифр');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pin, salt, ITER);
  const chk = await encStr(key, 'skipp');
  await IDB_WRITE_QUEUE;
  if (PENDING_WRITES || LAST_SAVE_ERROR || !STORAGE_OK || STORAGE_READONLY) throw new Error('Нельзя включить PIN: есть незавершённые или ошибочные записи');
  const original = localStorage.getItem(KEY);
  const env = await encStr(key, JSON.stringify(D));
  // Refuse to enable PIN if an old plaintext recovery copy cannot be cleared.
  await recoveryClear();
  const newPinRecord = JSON.stringify({v:2, digits:pin.length, salt:b64e(salt), iter:ITER, chk:chk});
  await writeMain(JSON.stringify({enc:1, iv:env.iv, ct:env.ct}), newPinRecord);
  try { storageWrite(PIN_KEY, newPinRecord); }
  catch(e) { setReadOnly(e); throw e; } // IDB retains PIN metadata for startup repair
  SEC.key = key; SEC.locked = false;
  // Never retain a plaintext recovery snapshot after PIN encryption is enabled.
  try { await recoveryPut(localStorage.getItem(KEY)); }
  catch(err) { console.warn('Не удалось обновить резервный снимок PIN',err); }
}
async function disablePin(){
  await IDB_WRITE_QUEUE;
  if (SEC.locked || !SEC.key) throw new Error('База заблокирована');
  // Сначала гарантированно записываем открытые данные, только затем удаляем PIN.
  const oldRaw = localStorage.getItem(KEY);
  await writeMain(JSON.stringify(D), null);
  try { localStorage.removeItem(PIN_KEY); }
  catch(err) {
    setReadOnly(err); // IDB holds the new plaintext state; startup repairs PIN metadata
    throw err;
  }
  SEC.key = null;
  ['skipp_aux', 'skipp_dx', 'skipp_pin_fail'].forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
}
async function unlockWith(pin, rec){
  const key = await tryKey(pin, rec); if (!key) return false;
  return openWithKey(key);
}
async function openWithKey(key){
  SEC.decoy = false;
  let obj = null; try { obj = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (obj && obj.enc === 1) { try { applyLoaded(JSON.parse(await decStr(key, obj))); } catch (e) { toast('Данные повреждены и не расшифровываются'); return false; } }
  else if (obj) { try { applyLoaded(obj); } catch(e) { setReadOnly(e); return false; } }
  SEC.key = key; SEC.locked = false;
  HIST.undo.length = 0; HIST.redo.length = 0;
  if (obj && obj.enc !== 1) { const result = saveLocal(); if (result === false) return false; try { await result; } catch(e) { return false; } }
  return true;
}
function setupPin(onCreated){
  const digits = auxRec() && auxRec().digits !== 6 ? 4 : 6;
  let first = null;
  pinPad('Новый код-пароль', 'Введите ' + digits + ' цифр', async (x, api) => {
    if (first == null) { first = x; api.reset('Повторите код', 'Введите те же ' + digits + ' цифр ещё раз'); return; }
    if (x !== first) { first = null; api.reset('Новый код-пароль', 'Коды не совпали. Введите ' + digits + ' цифр заново'); return; }
    api.msg('Шифрую данные…');
    try {
      if (CRYPTO_OK) await enablePin(x);
      else { throw new Error('Для PIN необходимо защищённое соединение и Web Crypto'); }
      localStorage.removeItem('skipp_pin_fail'); api.close(); toast('Код-пароль установлен, данные зашифрованы'); if (typeof onCreated === 'function') onCreated();
    } catch (e) { console.error('Не удалось включить код-пароль', e); api.fail('Не удалось создать PIN. Проверьте защищённое соединение и хранилище, затем повторите.'); }
  }, {cancel:!onCreated, digits:digits});
}
function firstRunPin(){
  if (!CRYPTO_OK || !STORAGE_OK || STORAGE_READONLY) {
    const root=document.createElement('div');root.className='lock-screen startup-security';
    root.innerHTML='<div class="lock-box"><h2>Безопасный запуск недоступен</h2><p>Для создания шифрованного PIN требуется HTTPS и доступное локальное хранилище. Откройте СКиП на опубликованном GitHub Pages.</p><button class="btn" id="retry-startup">Повторить</button></div>';
    document.body.append(root);document.body.classList.add('locked');
    root.querySelector('button').addEventListener('click',()=>location.reload());return;
  }
  document.body.classList.add('locked');
  setupPin(()=>{
    SEC.key=null;SEC.locked=true;D=blank();render();
    askPin(afterUnlock);
  });
}
function askPin(then){
  const rec = pinRec();
  if (!rec) { then(); return; }
  if ($('.lock-screen')) return;
  const FK = 'skipp_pin_fail', MAX = 10;
  const getF = () => { try { return Number(localStorage.getItem(FK)) || 0; } catch (e) { return 0; } };
  const setF = n => { try { localStorage.setItem(FK, String(n)); } catch (e) {} };
  const f0 = getF();
  pinPad('СКиП', f0 >= 6 ? 'Введите код-пароль. Осталось попыток: ' + (MAX - f0) : 'Введите код-пароль', async (x, api) => {
    api.msg('Проверяю…');
    let ok = false;
    if (rec.v === 2) {
      const aux = auxRec();
      const ks = await Promise.all([tryKey(x, rec), aux ? tryKey(x, aux) : tryKey(x, rec).then(() => null)]);
      if (ks[0]) ok = await openWithKey(ks[0]);
      else if (ks[1]) { setF(0); api.close(); await enterDuress(ks[1], aux); return; }
    }
    else { ok = (await hashPin(x, rec.salt)) === rec.h; if (ok) toast('Старый PIN без шифрования: установите новый 6-значный PIN в настройках'); }
    if (ok) { setF(0); api.close(); then(); return; }
    const n = getF() + 1; setF(n);
    if (n >= MAX) { api.fail('Превышено число попыток. Данные сохранены. Проверьте PIN или восстановите резервную копию.'); return; }
    api.fail(n >= 6 ? 'Неверный код. Осталось попыток: ' + (MAX - n) + '. Данные не удаляются' : 'Неверный код');
  }, {showSound:true, digits:rec.digits === 6 ? 6 : 4, forgot: async api => {
    api.close();
    const ok = await confirmDlg('Код восстановить нельзя. Можно сбросить приложение: будут удалены ВСЕ задачи и данные на этом устройстве. Если у вас есть выгруженный файл, данные можно будет загрузить из него.', 'Удалить всё и сбросить');
    if (ok) { try { await eraseAllLocalData(); location.reload(); } catch (e) { console.error(e); toast('Сброс не завершён. Данные могут сохраняться — повторите попытку после закрытия других вкладок.'); askPin(then); } }
    else askPin(then);
  }});
}
async function lockNow(){
  if (!pinSet() || $('.lock-screen')) return;
  await SEC.q;
  if (STORAGE_READONLY || LAST_SAVE_ERROR) { toast('Сохранение не завершено. Сначала создайте резервную копию.'); return; }
  while (SHEETS.length) closeSheet();
  if (pinRecV2()) { SEC.key = null; SEC.locked = true; SEC.decoy = false; D = blank(); HIST.undo.length = 0; HIST.redo.length = 0; }
  document.body.classList.add('locked');
  render();
  askPin(afterUnlock);
}
function afterUnlock(){
  INTRO_DONE = false;
  document.body.classList.remove('locked');
  if (D.settings.splashSound !== false) INTRO_SOUND_REQUESTED = INTRO_SOUND_REQUESTED !== false;
  autoArchive();render();startIntro();
}

/* ================= офлайн-генератор Excel (.xlsx) ================= */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b){ let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files){
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(f => {
    const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  });
  const cenSize = cen.reduce((s, x) => s + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cenSize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xe = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colL = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
function buildXlsx(sheetName, rows, widths){
  const sn = xe(String(sheetName || 'Лист1').replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Лист1');
  const body = rows.map((r, ri) => '<row r="'+(ri + 1)+'">' + r.map((v, ci) => {
    const ref = colL(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : ' s="2"';
    if (typeof v === 'number' && isFinite(v)) return '<c r="'+ref+'"'+st+'><v>'+v+'</v></c>';
    return '<c r="'+ref+'"'+st+' t="inlineStr"><is><t xml:space="preserve">'+xe(v)+'</t></is></c>';
  }).join('') + '</row>').join('');
  const cols = widths && widths.length ? '<cols>'+widths.map((w, i) => '<col min="'+(i + 1)+'" max="'+(i + 1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols>' : '';
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  return zipStore([
    {name:'[Content_Types].xml', data:X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
    {name:'_rels/.rels', data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml', data:X+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+sn+'" sheetId="1" r:id="rId1"/></sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels', data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'xl/styles.xml', data:X+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>'},
    {name:'xl/worksheets/sheet1.xml', data:X+'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+cols+'<sheetData>'+body+'</sheetData></worksheet>'}
  ]);
}

/* ================= поделиться долгим нажатием ================= */
function shareText(text){
  const SH = NP('Share');
  if (SH) { SH.share({text:text, dialogTitle:'Отправить задачу'}).catch(e => { if (!/cancel/i.test(String(e && (e.message || e)))) copyText(text, 'Не удалось открыть «Поделиться» — текст скопирован'); }); return; }
  if (navigator.share) {
    navigator.share({text:text}).catch(e => { if (!(e && e.name === 'AbortError')) copyText(text, 'Не удалось открыть «Поделиться» — текст скопирован'); });
  } else copyText(text, '«Поделиться» недоступно — текст скопирован');
}
const LP = {el:null, timer:null, ready:false, x:0, y:0, fired:0};
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-lp]'); if (!el || el.disabled) return;
  LP.el = el; LP.ready = false; LP.x = e.clientX; LP.y = e.clientY;
  clearTimeout(LP.timer);
  LP.timer = setTimeout(() => { LP.ready = true; el.classList.add('lp-on'); if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) {} } }, 500);
}, true);
document.addEventListener('pointermove', e => { if (LP.el && !LP.ready && Math.abs(e.clientX - LP.x) + Math.abs(e.clientY - LP.y) > 10) { clearTimeout(LP.timer); LP.el = null; } }, true);
document.addEventListener('pointercancel', () => { clearTimeout(LP.timer); if (LP.el) LP.el.classList.remove('lp-on'); LP.el = null; LP.ready = false; }, true);
document.addEventListener('pointerup', () => {
  clearTimeout(LP.timer);
  const el = LP.el; LP.el = null;
  if (!el) return;
  el.classList.remove('lp-on');
  if (LP.ready) { LP.ready = false; LP.fired = Date.now(); el.dispatchEvent(new CustomEvent('longshare', {bubbles:true})); }
}, true);
window.addEventListener('click', e => { if (LP.fired && Date.now() - LP.fired < 900) { LP.fired = 0; e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-lp]')) e.preventDefault(); }, true);
document.addEventListener('selectstart',e=>{if(e.target.closest('[data-lp]'))e.preventDefault();},true);
document.addEventListener('dragstart',e=>{if(e.target.closest('[data-lp]'))e.preventDefault();},true);
document.addEventListener('longshare', e => {
  const b = e.target.closest('[data-a="copy-order"],[data-a="copy-remind"]'); if (!b) return;
  const t = D.tasks.find(x => x.id === b.dataset.id); if (!t) return;
  shareText(b.dataset.a === 'copy-order' ? orderText(t) : remindText(t));
});

/* ================= голосовая постановка задачи ================= */
const NUMW = {'один':1,'одну':1,'одного':1,'два':2,'две':2,'двух':2,'три':3,'трех':3,'четыре':4,'пять':5,'шесть':6,'семь':7,'восемь':8,'девять':9,'десять':10,'пару':2};
const toNum = w => /^\d+$/.test(w) ? Number(w) : (NUMW[w] || 0);
const WDAYS = [['воскресен',0],['понедельн',1],['вторник',2],['сред',3],['четверг',4],['пятниц',5],['суббот',6]];
const MONTHS_G = ['январ','феврал','март','апрел','ма','июн','июл','август','сентябр','октябр','ноябр','декабр'];
function nextWeekday(wd){ const d = new Date(); let n = (wd - d.getDay() + 7) % 7; if (n === 0) n = 7; d.setDate(d.getDate() + n); return ymd(d); }
function parseVoice(raw){
  const r = {title:'', note:'', assignees:[], due:'', priority:'mid', repeat:'none', repeatDays:null, remind:null, checklist:[], found:{}};
  let s = ' ' + String(raw || '').replace(/ё/g, 'е').replace(/Ё/g, 'Е').replace(/\s+/g, ' ') + ' ';
  const B = '(^|[\\s,.;:!?—-])', E = '(?=$|[\\s,.;:!?—-])';
  const take = (re, fn) => { const m = s.match(re); if (!m) return false; s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); fn(m); return true; };
  // разделы: «подробности …», «пункты …» / «пункт … пункт …»
  let src = String(raw || '').replace(/ё/g, 'е').replace(/Ё/g, 'Е').replace(/\s+/g, ' ').trim();
  src = src.replace(/(^|\s)точка с запятой(?=\s|$)/gi, '; ').replace(/(^|\s)запятая(?=\s|$)/gi, ', ').replace(/(^|\s)точка(?=\s|$)/gi, '. ').replace(/\s+([,.;])/g, '$1');
  const NOTE_RE = /^(подробност|примечани|комментари|описани|детали)/i;
  const START_RE = /^(пункты|чек-?лист\S*|список|во-первых)$/i;
  const ORD_RE = /^(первое|второе|третье|четвертое|пятое|шестое|седьмое|восьмое|девятое|десятое|во-вторых|в-третьих|в-четвертых|в-пятых|далее|следующий|затем|потом)$/i;
  const NUM_NEXT = /^(\d+|один|два|три|четыре|пять|шесть|семь|восемь|девять|десять|перв\S*|втор\S*|трет\S*|четверт\S*|пят\S*|шест\S*|седьм\S*|восьм\S*|девят\S*|десят\S*)$/i;
  const W = src ? src.split(' ') : [], head = [], note = [], items = [];
  let mode = 'head', cur = null;
  const bareOf = w => (w || '').replace(/^[«"(]+|[,.;:!?»")]+$/g, '').toLowerCase();
  for (let i = 0; i < W.length; i++) {
    const w = W[i], bw = bareOf(w), nx = bareOf(W[i + 1]);
    if (NOTE_RE.test(bw) && mode !== 'note') { mode = 'note'; continue; }
    if (START_RE.test(bw) || (bw === 'пункт' && mode !== 'items' && NUM_NEXT.test(nx))) {
      mode = 'items'; cur = []; items.push(cur); if (bw === 'пункт' || (bw === 'пункты' && NUM_NEXT.test(nx))) i++; continue;
    }
    if (mode === 'items' && (bw === 'пункт' || ORD_RE.test(bw))) { cur = []; items.push(cur); if (bw === 'пункт' && NUM_NEXT.test(nx)) i++; continue; }
    if (mode === 'head') head.push(w);
    else if (mode === 'note') note.push(w);
    else { cur.push(w); if (/[,;.]$/.test(w)) { cur = []; items.push(cur); } }
  }
  const cap = x => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
  r.note = cap(note.join(' ').replace(/^[\s,.;:—-]+/, '').trim());
  r.checklist = items.map(a => a.join(' ').replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g, '').trim()).filter(Boolean).map(x => ({id:uid(), text:cap(x), done:false}));
  s = ' ' + head.join(' ') + ' ';
  // напоминание
  take(new RegExp(B + 'напомн\\S*\\s+(в день срока|за\\s+(\\S+)\\s*(дн\\S*|день|сутки|недел\\S*)?)' + E, 'i'), m => {
    if (/день срока/i.test(m[2])) r.remind = 0;
    else { const w = (m[3] || '').toLowerCase(), u = (m[4] || '').toLowerCase(); let n = toNum(w);
      if (/^(день|сутки)$/.test(w)) n = 1; if (/^недел/.test(w)) n = 7; if (/^недел/.test(u)) n = (n || 1) * 7; r.remind = n || 1; }
  });
  // приоритет
  take(new RegExp(B + '(не срочно|низкий приоритет|приоритет низкий)' + E, 'i'), () => { r.priority = 'low'; }) ||
  take(new RegExp(B + '(срочно|очень важно|важно|в первую очередь|высокий приоритет|приоритет высокий)' + E, 'i'), () => { r.priority = 'high'; });
  // повтор
  take(new RegExp(B + '(каждый день|ежедневно)' + E, 'i'), () => { r.repeat = 'daily'; }) ||
  take(new RegExp(B + 'кажд\\S*\\s+(\\S+)\\s+(дн\\S*|день)' + E, 'i'), m => { r.repeat = 'custom'; r.repeatDays = toNum(m[2].toLowerCase()) || 1; }) ||
  take(new RegExp(B + 'кажд\\S*\\s+(понедельн\\S*|вторник\\S*|сред\\S*|четверг\\S*|пятниц\\S*|суббот\\S*|воскресен\\S*)' + E, 'i'), m => { r.repeat = 'weekly'; const w = WDAYS.find(x => m[2].toLowerCase().startsWith(x[0])); if (w && !r.due) r.due = nextWeekday(w[1]); }) ||
  take(new RegExp(B + '(каждую неделю|еженедельно)' + E, 'i'), () => { r.repeat = 'weekly'; }) ||
  take(new RegExp(B + '(каждый месяц|ежемесячно)' + E, 'i'), () => { r.repeat = 'monthly'; }) ||
  take(new RegExp(B + '(каждый год|ежегодно)' + E, 'i'), () => { r.repeat = 'yearly'; });
  // срок
  const P = '(?:(?:срок(?:ом)?|до|к|на|в|во)\\s+)*';
  const setDue = v => { if (!r.due || r.repeat === 'weekly') r.due = v; };
  take(new RegExp(B + P + '(сегодня|завтра|послезавтра)' + E, 'i'), m => { const w = m[2].toLowerCase(); setDue(w === 'сегодня' ? today() : w === 'завтра' ? addDays(today(), 1) : addDays(today(), 2)); }) ||
  take(new RegExp(B + 'через\\s+(\\S+)?\\s*(дн\\S*|день|недел\\S*|месяц\\S*)' + E, 'i'), m => { const n = toNum((m[2] || '').toLowerCase()) || 1, u = m[3].toLowerCase(); setDue(/^недел/.test(u) ? addDays(today(), 7 * n) : /^месяц/.test(u) ? addMonths(today(), n) : addDays(today(), n)); }) ||
  take(new RegExp(B + P + 'конц\\S*\\s+(недели|месяца)' + E, 'i'), m => { if (/недел/i.test(m[2])) { const d = new Date(); const n = (5 - d.getDay() + 7) % 7; d.setDate(d.getDate() + n); setDue(ymd(d)); } else { const d = new Date(); setDue(ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0))); } }) ||
  take(new RegExp(B + P + '(\\d{1,2})[.\\/](\\d{1,2})(?:[.\\/](\\d{2,4}))?' + E, 'i'), m => { const y = m[4] ? (m[4].length === 2 ? 2000 + Number(m[4]) : Number(m[4])) : new Date().getFullYear(); let v = y + '-' + pad(m[3]) + '-' + pad(m[2]); if (!m[4] && v < today()) v = (y + 1) + v.slice(4); setDue(v); }) ||
  take(new RegExp(B + P + '(\\d{1,2})(?:-?(?:го|е|ого))?\\s+(январ\\S*|феврал\\S*|март\\S*|апрел\\S*|ма[яй]\\S*|июн\\S*|июл\\S*|август\\S*|сентябр\\S*|октябр\\S*|ноябр\\S*|декабр\\S*)' + E, 'i'), m => {
    const mw = m[3].toLowerCase(); let mi = MONTHS_G.findIndex((x, i) => i !== 4 && mw.startsWith(x)); if (mi < 0 && mw.startsWith('ма')) mi = 4;
    const y = new Date().getFullYear(); let v = y + '-' + pad(mi + 1) + '-' + pad(m[2]); if (v < today()) v = (y + 1) + v.slice(4); setDue(v); }) ||
  take(new RegExp(B + P + '(\\d{1,2})(?:-?(?:го|е|ого|му|ое))?\\s*(?:числ\\S*)' + E, 'i'), m => { const d = new Date(); let v = ymd(new Date(d.getFullYear(), d.getMonth(), Number(m[2]))); if (v < today()) v = ymd(new Date(d.getFullYear(), d.getMonth() + 1, Number(m[2]))); setDue(v); }) ||
  take(new RegExp(B + P + '(понедельн\\S*|вторник\\S*|сред[уаы]\\S*|четверг\\S*|пятниц\\S*|суббот\\S*|воскресен\\S*)' + E, 'i'), m => { const w = WDAYS.find(x => m[2].toLowerCase().startsWith(x[0])); if (w) setDue(nextWeekday(w[1])); });
  // исполнители: известные имена (с учётом падежей)
  const stemOf = w => { w = w.toLowerCase(); return w.length > 5 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w; };
  knownNames().forEach(n => {
    const first = n.name.split(/\s+/)[0]; if (first.length < 3) return;
    const st = stemOf(first).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    take(new RegExp(B + st + '[а-я]{0,4}(?:\\s+[А-ЯA-Z]\\.\\s?[А-ЯA-Z]\\.?)?' + E, 'i'), () => { if (!r.assignees.some(a => a.name === n.name)) r.assignees.push({name:n.name, status:firstA()}); });
  });
  // исполнители после слов «кому», «исполнитель», «поручить»
  take(new RegExp(B + '(кому|исполнител\\S*|поручить|поручаю|ответственн\\S*)[:,]?\\s+((?:[^\\s,.;]+)(?:(?:\\s*,\\s*|\\s+и\\s+)[^\\s,.;]+)*)', 'i'), m => {
    m[3].split(/\s*,\s*|\s+и\s+/).forEach(w => { w = w.trim(); if (!w) return;
      w = w.replace(/(ов|ев|ин|ын)у$/i, '$1').replace(/(ск|цк)ому$/i, '$1ий');
      w = w.charAt(0).toUpperCase() + w.slice(1);
      if (!r.assignees.some(a => a.name.toLowerCase() === w.toLowerCase())) r.assignees.push({name:w, status:firstA()}); });
  });
  // суть задачи — остаток фразы
  let t = s.replace(new RegExp(B + '(задача|поставить задачу|срок(ом)?)[:,]?' + E, 'gi'), ' ')
    .replace(/\s+/g, ' ').replace(/^[\s,.;:—-]+|[\s,;:—-]+$/g, '').replace(/^(и|до|к|на)\s+/i, '').trim();
  r.title = t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  r.found = {asg:r.assignees.length > 0, title:!!r.title, due:!!r.due, pr:r.priority !== 'mid', rep:r.repeat !== 'none', rem:r.remind != null, note:!!r.note, items:r.checklist.length > 0};
  return r;
}
function openVoice(){
  const SR = null, NSR = null;
  const hints = [['asg','Кому','Иванову и Петрову'],['title','Что сделать','подготовить донесение'],['due','Срок','до пятницы / 5 октября / через 3 дня'],['pr','Приоритет','срочно'],['rep','Повтор','каждый понедельник'],['rem','Напомнить','напомнить за день'],['note','Подробности','«подробности» и текст — в конце'],['items','Пункты','«пункты», затем «первое … второе …» или «пункт … пункт …»']];
  const sh = openSheet(head('Быстрая заметка') + '<div class="sh-b">'
    + '<div class="v-tpl" aria-hidden="true"><div class="v-tpl-h">Назовите по порядку — для полной карточки:</div>'+hints.map(h => '<div class="v-tpl-row" data-h="'+h[0]+'"><b>'+h[1]+'</b><span>'+h[2]+'</span><i class="v-ok">'+ic('check', 14)+'</i></div>').join('')
    + '<div class="v-tpl-h" style="margin-top:6px">Подробности и пункты называйте последними. Можно говорить «запятая» и «точка».</div></div>'
    + ((SR || NSR) ? '<button type="button" class="v-mic" id="v-mic" aria-label="Начать диктовку">'+ic('mic', 34)+'</button><p class="hint" id="v-st" style="text-align:center;margin:0">Нажмите и говорите</p>' : '<div class="v-hints"><p>'+ic('mic', 18)+'<span>Для голосового ввода нажмите микрофон на клавиатуре</span></p><p>'+ic('me', 18)+'<span>Чтобы распознать исполнителя при голосовом вводе, добавьте хотя бы одну задачу с его именем</span></p></div>')
    + '<textarea id="v-text" rows="4" placeholder="Здесь появится текст. Можно также напечатать или надиктовать с клавиатуры."></textarea>'
    + '</div><div class="sh-f"><span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn primary" id="v-go">Создать карточку</button></div>', {onClose:() => { stop(); if (NSR && nl) { try { NSR.removeAllListeners(); } catch (e) {} } }});
  const ta = $('#v-text', sh), btn = $('#v-mic', sh), stEl = $('#v-st', sh);
  let rec = null, on = false, base = '', got = false, restarts = 0;
  const mark = () => { const f = parseVoice(ta.value).found; $$('.v-tpl-row', sh).forEach(r => r.classList.toggle('ok', !!f[r.dataset.h])); };
  const setSt = t => { if (stEl) stEl.textContent = t; };
  function stop(msg){ if (NSR && on) { try { NSR.stop(); } catch (e) {} } on = false; if (rec) { rec.onend = null; try { rec.stop(); } catch (e) {} rec = null; } if (btn) btn.classList.remove('rec'); setSt(msg || 'Нажмите, чтобы продиктовать (можно продолжать — текст допишется)'); }
  function session(){
    rec = new SR(); rec.lang = 'ru-RU'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    base = ta.value.trim(); base = base ? base + ' ' : '';
    rec.onresult = ev => {
      got = true;
      const parts = []; for (let i = 0; i < ev.results.length; i++) parts.push(String(ev.results[i][0].transcript || '').trim());
      ta.value = (base + parts.filter(Boolean).join(' ')).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1');
      mark();
    };
    rec.onerror = ev => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') return;
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { stop(restarts ? 'Диктовка остановилась — нажмите, чтобы продолжить' : 'Нет доступа к микрофону или распознаванию речи'); if (!restarts) toast('Разрешите микрофон и распознавание речи: Настройки → Safari → Микрофон. Или используйте микрофон на клавиатуре'); return; }
      if (ev.error === 'network') { stop(); toast('Для распознавания речи нужен интернет. Без сети используйте микрофон на клавиатуре'); return; }
      stop();
    };
    rec.onend = () => {
      if (!on) return;
      if (restarts > 40) { stop(); return; }
      restarts++;
      setTimeout(() => { if (!on) return; try { session(); rec.start(); } catch (e) { stop('Диктовка остановилась — нажмите, чтобы продолжить'); } }, 120);
    };
  }
  let nl = false;
  async function nativeStart(){
    try {
      const av = await NSR.available(); if (!av || !av.available) throw new Error('na');
      let pm = await NSR.checkPermissions(); if (pm.speechRecognition !== 'granted') pm = await NSR.requestPermissions();
      if (pm.speechRecognition !== 'granted') { stop(); toast('Разрешите приложению доступ к микрофону'); return; }
      base = ta.value.trim(); base = base ? base + ' ' : '';
      if (!nl) {
        nl = true;
        await NSR.addListener('partialResults', d => { const m = ((d && d.matches) || [])[0] || ''; if (!on) return; ta.value = (base + m).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1'); mark(); });
        await NSR.addListener('listeningState', d => {
          if (!d || d.status !== 'stopped' || !on) return;
          if (restarts > 40) { stop(); return; }
          restarts++; base = ta.value.trim(); base = base ? base + ' ' : '';
          setTimeout(() => { if (on) NSR.start({language:'ru-RU', maxResults:1, partialResults:true, popup:false}).catch(() => stop('Диктовка остановилась — нажмите, чтобы продолжить')); }, 200);
        });
      }
      restarts = 0; on = true; btn.classList.add('rec'); setSt('Слушаю… нажмите ещё раз, чтобы закончить');
      await NSR.start({language:'ru-RU', maxResults:1, partialResults:true, popup:false});
    } catch (e) {
      if (!on && String(e && e.message) !== 'na') return;
      stop();
      try {
        const r = await NSR.start({language:'ru-RU', maxResults:1, partialResults:false, popup:true});
        const m = ((r && r.matches) || [])[0];
        if (m) { ta.value = ((ta.value.trim() ? ta.value.trim() + ' ' : '') + m).replace(/\s+/g, ' '); mark(); }
      } catch (e2) { toast('Распознавание речи недоступно. Используйте микрофон на клавиатуре'); }
    }
  }
  function start(){
    if (NSR) { nativeStart(); return; }
    try { restarts = 0; got = false; session(); rec.start(); on = true; btn.classList.add('rec'); setSt('Слушаю… нажмите ещё раз, чтобы закончить'); }
    catch (e) { stop(); toast('Не удалось включить микрофон. Используйте микрофон на клавиатуре'); }
  }
  if (btn) btn.addEventListener('click', () => { if (on) stop(); else start(); });
  ta.addEventListener('input', mark);
  setTimeout(() => ta.focus(), 120);
  $('#v-go', sh).addEventListener('click', () => {
    const txt = ta.value.trim(); if (!txt) { toast('Продиктуйте или введите задачу'); return; }
    stop();
    const p = parseVoice(txt);
    if (!p.title) p.title = txt;
    const task = {title:p.title, note:p.note, assignees:p.assignees, due:p.due, priority:p.priority, repeat:p.repeat, repeatDays:p.repeatDays, remind:p.remind, checklist:p.checklist, status:firstT()};
    closeSheet();
    openTaskForm(null, {task:task, forOrder:p.assignees.length > 0, noFocus:true});
    toast('Проверьте карточку и сохраните');
  });
}

/* ================= заставка с фактами ================= */
const FACTS = [
  () => { const n = activeTasks().filter(t => !isDone(t) && t.due === today()).length; return n ? 'На сегодня задач: ' + n + '. Кофе уже налит?' : null; },
  () => { const n = activeTasks().filter(isOverdue).length; return n ? 'Просрочено: ' + n + '. Ничего, сейчас разберёмся.' : null; },
  () => { const a = activeTasks().filter(t => !isDone(t)); return a.length && !a.some(isOverdue) ? 'Просрочек нет — штаб может собой гордиться.' : null; },
  () => { const w = Date.now() - 7 * 864e5; const n = D.tasks.filter(t => t.completedAt && t.completedAt > w).length; return n ? 'За последние 7 дней выполнено задач: ' + n + '.' : null; },
  () => { const m = new Map(); orderTasks().filter(t => !isDone(t)).forEach(t => t.assignees.forEach(a => { if (!aDone(a.status)) m.set(a.name, (m.get(a.name) || 0) + 1); })); let best = null; m.forEach((v, k) => { if (!best || v > best[1]) best = [k, v]; }); return best && best[1] > 1 ? 'Больше всего поручений сейчас у ' + best[0] + ': ' + best[1] + '.' : null; },
  () => { const n = orderTasks().filter(t => !isDone(t) && allReported(t)).length; return n ? 'Указаний, где все уже доложили: ' + n + '. Пора обобщать!' : null; },
  () => { const a = activeTasks().filter(t => !isDone(t) && t.createdAt); if (!a.length) return null; const d = Math.floor((Date.now() - Math.min.apply(null, a.map(t => t.createdAt))) / 864e5); return d >= 7 ? 'Самой «древней» открытой задаче уже ' + d + ' ' + plural(d, 'день', 'дня', 'дней') + '. Может, пора?' : null; },
  () => { const n = activeTasks().filter(isImportant).length; return n ? 'Задач с высоким приоритетом: ' + n + '.' : null; },
  () => { const n = D.tasks.filter(t => t.archived).length; return n ? 'В архиве уже ' + n + ' ' + plural(n, 'выполненная задача', 'выполненные задачи', 'выполненных задач') + '.' : null; },
  () => { const n = D.journal.length; return n ? 'В ЖУПиОР записей: ' + n + '. Порядок в документах — порядок в голове.' : null; },
  () => { const n = D.subs.length; return n ? 'В справочнике абонентов: ' + n + '.' : null; },
  () => { const n = activeTasks().filter(t => !isDone(t) && t.due === addDays(today(), 1)).length; return n ? 'Завтра срок у задач: ' + n + '. Можно начать уже сегодня.' : null; },
  () => { const n = activeTasks().filter(remindActive).length; return n ? 'Сработало напоминаний: ' + n + '.' : null; },
  () => { let x = 0, y = 0; activeTasks().forEach(t => (t.checklist || []).forEach(i => { y++; if (i.done) x++; })); return y ? 'Пунктов чек-листов выполнено: ' + x + ' из ' + y + '.' : null; },
  () => { const c = [0,0,0,0,0,0,0]; activeTasks().forEach(t => { if (t.due) c[parseD(t.due).getDay()]++; }); const mx = Math.max.apply(null, c); if (mx < 2) return null; const names = ['воскресенье','понедельник','вторник','среду','четверг','пятницу','субботу']; return 'Чаще всего сроки выпадают на ' + names[c.indexOf(mx)] + '.'; },
  () => { const n = activeTasks().filter(t => t.repeat && t.repeat !== 'none').length; return n ? 'Повторяющихся задач: ' + n + ' — следующие заведутся сами.' : null; },
  () => { const n = (D.trash || []).length; return n ? 'В корзине элементов: ' + n + '. Через 30 дней они исчезнут сами.' : null; },
  () => { const n = activeTasks().filter(t => !isDone(t) && !t.due).length; return n ? 'Задач без срока: ' + n + '. Срок — лучший друг исполнения.' : null; },
  () => 'Поручение без срока — это просто пожелание.',
  () => 'Хорошо поставленная задача — уже наполовину выполненная.',
  () => 'Доложить о выполнении — тоже задача. Желательно вовремя.',
  () => 'СКиП не спит, не ест и не уходит в отпуск. Но напоминает только вам.',
  () => 'Если задача висит больше месяца, она уже часть интерьера.',
  () => 'Ни одна задача не пострадала при создании этого приложения.',
  () => 'Лучшее время поставить задачу — вчера. Второе лучшее — сейчас.',
  () => 'Канбан придумали на заводах Toyota. Ваши задачи в хорошей компании.',
  () => 'Чек-лист из трёх пунктов выполняют чаще, чем из тридцати.',
  () => 'Совет: долгое нажатие на «Поставить задачу» сразу открывает «Поделиться».',
  () => 'Совет: скажите «срочно» при голосовом вводе — приоритет станет высоким.',
  () => 'Повторение — мать учения и еженедельных отчётов.'
];
function pickFacts(k){
  let deck = []; try { deck = JSON.parse(localStorage.getItem('skipp_facts') || '[]'); } catch (e) {}
  const out = []; let guard = 0;
  while (out.length < k && guard < 80) {
    guard++;
    if (!deck.length) { deck = FACTS.map((_, i) => i); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
    const i = deck.shift(); let s = null; try { s = FACTS[i](); } catch (e) {}
    if (s && !out.includes(s)) out.push(s);
  }
  try { localStorage.setItem('skipp_facts', JSON.stringify(deck)); } catch (e) {}
  return out;
}
function greeting(){ const h = new Date().getHours(); return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : h < 23 ? 'Добрый вечер' : 'Доброй ночи'; }
// Pre-recorded, user-approved greetings with real radio effects. Never generate personal speech from task data.
function splashGreetingVoiceFile(){
  const g = greeting();
  const name = g === 'Доброе утро' ? '01_dobroe_utro' : g === 'Добрый день' ? '02_dobryy_den' : g === 'Добрый вечер' ? '03_dobryy_vecher' : '04_dobroy_nochi';
  return 'assets/voice/' + name + '.mp3';
}
const STAMP_SVG = '<svg class="sp-art" viewBox="0 0 260 300" width="260" height="300" aria-hidden="true">'
  + '<g class="sp-imprint"><circle cx="130" cy="214" r="74" fill="rgba(0,0,0,.25)"/><image href="icon-512.png" x="58" y="142" width="144" height="144" clip-path="circle(72px at 72px 72px)"/></g>'
  + '<g class="sp-hand">'
  +   '<circle cx="130" cy="112" r="26" fill="#8a5a2b"/><circle cx="121" cy="103" r="8" fill="#a8743f"/><rect x="114" y="132" width="32" height="12" rx="5" fill="#6e4520"/>'
  +   '<ellipse cx="130" cy="146" rx="26" ry="8" fill="#6e4520"/><rect x="119" y="146" width="22" height="44" fill="#7d5126"/><rect x="119" y="146" width="7" height="44" fill="#966232"/>'
  +   '<rect x="64" y="184" width="132" height="12" rx="5" fill="#4a4f4b"/><path d="M70 194 L190 194 L212 262 Q213 274 200 274 L60 274 Q47 274 48 262 Z" fill="#2b2f2c"/><path d="M70 194 L96 194 L80 274 L60 274 Q47 274 48 262 Z" fill="#363b37"/>'
  +   '<rect x="50" y="270" width="160" height="10" rx="4" fill="#1f4a33"/>'
  + '</g></svg>';
// The actual database is read only after PIN unlock, so no data is exposed by the startup video.
function splashLiveData(){
  const mine = mineTasks().filter(t => !isDone(t));
  const orders = orderTasks().filter(t => !isDone(t));
  const open = mine.concat(orders);
  const overdue = open.filter(isOverdue).length;
  const people = new Set();
  orders.forEach(t => (t.assignees || []).forEach(a => { if (!aDone(a.status)) people.add(a.name); }));
  const day = new Date().toLocaleDateString('ru-RU', {weekday:'short',day:'numeric',month:'long'});
  const welcome = greeting() + ', командир.';
  const summary = open.length ? 'На контроле ' + open.length + ' ' + plural(open.length,'поручение','поручения','поручений') + '.' + (overdue ? ' Требуют внимания: ' + overdue + '.' : ' Просрочек нет.') : 'Активных поручений нет. Штаб готов к работе.';
  return {day, welcome, summary, cards:[['Мои задачи',mine.length],['Указания в работе',orders.length],['Просрочено',overdue],['Исполнителей на контроле',people.size]]};
}
function splashVideoFiles(portrait){
  const quality = D.settings.splashQuality || 'auto';
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slow = !!(conn && (conn.saveData || /(^|slow-)2g/.test(conn.effectiveType || '')));
  const high = quality !== '720' && !(quality === 'auto' && slow);
  const base = portrait ? 'portrait' : 'landscape';
  return {src:'assets/skip-intro-'+base+'-'+(high ? '1080' : '720')+'.mp4',poster:'assets/skip-'+base+'-poster.jpg',finished:'assets/skip-hud-'+base+'.jpg'};
}
function showSplash(then){
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const live = splashLiveData();
  const media = splashVideoFiles(portrait);
  const ov = document.createElement('div');
  ov.className = 'splash ski-splash ' + (portrait ? 'ski-portrait' : 'ski-landscape');
  ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Заставка СКиП');
  const escCard = (c,i) => '<div class="ski-stat ski-stat-'+i+'"><div class="ski-stat-label">'+esc(c[0])+'</div><strong class="ski-stat-value">'+esc(c[1])+'</strong></div>';
  ov.innerHTML = '<div class="ski-frame" id="ski-frame">'
    + '<video class="ski-video" playsinline webkit-playsinline preload="auto" muted poster="'+media.poster+'" aria-label="Заставка СКиП"></video>'
    + '<div class="ski-hud" aria-live="off">'
    + '<div class="ski-greeting">'+esc(live.welcome)+'</div>'
    + '<div class="ski-date">'+esc(live.day)+'</div>'
    + live.cards.map(escCard).join('')
    + '<div class="ski-summary">'+esc(live.summary)+'</div>'
    + '</div></div>'
    + '<div class="ski-actions"><button type="button" class="ski-sound" title="Перезапустить заставку со звуком и радиоприветствием">'+ic('bell',16)+'<span>Включить звук' + (D.settings.splashRadio === false ? '' : ' и голос') + '</span></button>'
    + '<button type="button" class="ski-close">Пропустить '+ic('chevR',16)+'</button></div>';
  document.body.appendChild(ov);
  const video=$('.ski-video',ov),frame=$('.ski-frame',ov), btn=$('.ski-sound',ov);
  let done=false, fallback=false, soundEnabled=false, videoEnded=false, triedLow=false;
  let radioContext=INTRO_AUDIO_CONTEXT, radioBuffer=null, radioSource=null, radioPending=null, radioStarted=false, radioPlaying=false; INTRO_AUDIO_CONTEXT=null;
  const hasAudio = D.settings.splashSound !== false;
  const hasRadio = hasAudio && D.settings.splashRadio !== false;
  const soundLabel = hasRadio ? 'Включить звук и голос' : 'Включить звук';
  const wantAudio=hasAudio && INTRO_SOUND_REQUESTED !== false;
  btn.hidden = !hasAudio; btn.classList.add('ski-highlight-sound');
  const stopRadio = () => {
    if(radioSource){ try {radioSource.onended=null;radioSource.stop();}catch(e){} radioSource=null; }
    radioPlaying=false;
  };
  const close = () => {
    if(done) return; done=true;
    stopRadio();
    if(radioContext){radioContext.close().catch(()=>{});radioContext=null;}
    video.pause(); video.removeAttribute('src'); video.load();
    window.removeEventListener('orientationchange',orientationChanged);
    document.removeEventListener('visibilitychange',onVisibility);
    clearTimeout(loadTimeout);clearTimeout(durationTimeout);
    ov.classList.add('out');setTimeout(()=>{ov.remove(); if(then)then();},300);
  };
  // A user gesture unlocks WebAudio on iOS. Audio is decoded asynchronously and
  // emitted only when the live greeting text appears at the end of the video.
  const armRadio = () => {
    if(!hasRadio || !soundEnabled || done)return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC)return;
    try {
      if(!radioContext)radioContext=new AC();
      radioContext.resume().catch(()=>{}); // call synchronously in the button gesture
      if(!radioPending){
        const ctx=radioContext;
        radioPending=fetch(splashGreetingVoiceFile()).then(r=>{if(!r.ok)throw new Error('Radio voice not available');return r.arrayBuffer();})
          .then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{if(!done){radioBuffer=buffer; maybeRadio();}})
          .catch(()=>{}); // Intro remains functional even if the voice file is missing/offline
      }
    } catch(e){}
  };
  const maybeRadio = () => {
    if(done || fallback || !hasRadio || !soundEnabled || radioStarted || !radioBuffer || !radioContext || radioContext.state!=='running')return;
    if(video.currentTime<5.60 || video.currentTime>7.40)return;
    try {
      const source=radioContext.createBufferSource(); source.buffer=radioBuffer;
      const level=radioContext.createGain(); level.gain.value=0.92;
      source.connect(level);level.connect(radioContext.destination);
      radioSource=source;radioStarted=true;radioPlaying=true;
      // On iOS the video volume slider is read-only: mute the soundtrack during the spoken message.
      video.muted=true;
      source.onended=()=>{radioPlaying=false;radioSource=null;if(!done){if(!videoEnded && soundEnabled)video.muted=false;else if(videoEnded)setTimeout(close,260);}};
      source.start();
    } catch(e){radioPlaying=false;}
  };
  const showFallback = () => {
    if(done || fallback)return;fallback=true;video.pause();stopRadio();
    frame.style.backgroundImage='url("'+media.finished+'")';
    frame.classList.add('ski-still');ov.classList.add('ski-show-data');btn.hidden=true;
  };
  const sync = () => {
    if(done)return;
    ov.classList.toggle('ski-show-data',fallback || video.currentTime>=5.65);
    if(!fallback)maybeRadio();
  };
  const orientationChanged = () => {
    if(window.matchMedia('(orientation: portrait)').matches===portrait)return;
    close(); // avoid distorted video after device rotation
  };
  const onVisibility=()=>{
    if(done)return;
    if(document.hidden){video.pause();if(radioContext && radioContext.state==='running')radioContext.suspend().catch(()=>{});}
    else if(!fallback){
      // iOS may suspend WebAudio after backgrounding. Require a new tap before audible playback.
      if(radioContext && radioContext.state==='suspended'){soundEnabled=false;stopRadio();video.muted=true;btn.querySelector('span').textContent=soundLabel;}
      video.play().catch(()=>{});
    }
  };
  window.addEventListener('orientationchange',orientationChanged);
  document.addEventListener('visibilitychange',onVisibility);
  $('.ski-close',ov).addEventListener('click',e=>{e.stopPropagation();close();});
  ov.addEventListener('click',e=>{if(e.target===ov)close();});
  btn.addEventListener('click',e=>{
    e.stopPropagation();if(done || fallback)return;
    if(!soundEnabled){
      soundEnabled=true;radioStarted=false;radioBuffer=null;radioPending=null;stopRadio();videoEnded=false;
      video.pause();video.currentTime=0;video.muted=false;
      armRadio();
      clearTimeout(durationTimeout);durationTimeout=setTimeout(()=>{if(!done && !fallback)close();},13000);
      btn.querySelector('span').textContent='Выключить звук';
      video.play().catch(()=>{soundEnabled=false;video.muted=true;btn.querySelector('span').textContent=soundLabel;video.play().catch(showFallback);});
    }else{
      soundEnabled=false;stopRadio();video.muted=true;
      btn.querySelector('span').textContent=soundLabel;
      if(videoEnded)close();
    }
  });
  video.addEventListener('timeupdate',sync);
  video.addEventListener('seeked',sync);
  video.addEventListener('ended',()=>{
    videoEnded=true;ov.classList.add('ski-show-data');
    // Preserve the last HUD frame until the slightly longer night greeting finishes.
    if(!radioPlaying)close();
  });
  video.addEventListener('error',()=>{
    if(!triedLow && /1080/.test(media.src)){
      triedLow=true;video.pause();video.src=media.src.replace('1080','720');video.load();
      video.muted=true;video.play().catch(showFallback);
    }else showFallback();
  });
  const loadTimeout=setTimeout(()=>{if(video.readyState===0)showFallback();},15000);
  let durationTimeout=setTimeout(()=>{if(!done && !fallback)close();},13000);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){showFallback();}
  else {
    video.src=media.src;video.load();
    video.muted=!wantAudio;
    soundEnabled=wantAudio;
    if(wantAudio)armRadio();
    video.play().then(()=>{
      if(!video.muted){btn.querySelector('span').textContent='Выключить звук';btn.classList.remove('ski-highlight-sound');}
    }).catch(()=>{
      // Safari/iOS rejects an unmuted autoplay even after PIN verification.
      // Continue silently and offer a real user-gesture retry in the splash.
      soundEnabled=false;video.muted=true;btn.hidden=false;btn.classList.add('ski-highlight-sound');
      btn.querySelector('span').textContent='Нажмите, чтобы включить звук';
      video.play().catch(showFallback);
    });
  }
}

/* ================= обучение ================= */
const TOUR = [
  ['hq', 'Добро пожаловать в СКиП', 'Система контроля и планирования. Все данные хранятся только на этом устройстве и никуда не отправляются.'],
  ['send', 'Мои задачи и указания', 'Задача без исполнителей попадает в «Мои задачи», с исполнителями — в «Указания». Статус каждого исполнителя отмечаете вы, а свой статус — отдельно: сбор, обобщение, отправка.'],
  ['copy', 'Потренируйтесь делиться', 'Обычное нажатие «Поставить задачу» и «Напомнить» копирует текст. Удерживайте любую кнопку около половины секунды: откроется выбор способа отправки. Ниже можно потренироваться без настоящей отправки.'],
  ['mic', 'Быстрая заметка голосом', 'Нажмите круглую кнопку с микрофоном. Продиктуйте исполнителя, задачу, срок, приоритет и пункты. После распознавания проверьте карточку перед сохранением.'],
  ['cal', 'Сроки и точное время', 'В задаче укажите дату и необязательное время выполнения. Для напоминания можно выбрать количество дней или отдельные дату и время. При закрытом PWA системные уведомления не отправляются.'],
  ['boards', 'Настройте свою доску', 'В «Доски» создайте простой список, реестр ФИО или собственный шаблон. В «Настроить» выберите нужные поля: текст, дата, число, список, да/нет. Поля можно переставлять и помечать обязательными.'],
  ['plus', 'Быстрое добавление без повторов', 'В доске нажмите «Быстро», выберите столбец один раз. После ввода названия нажимайте Enter: появится следующая пустая строка. Дополнительные значения сохраняются, пока вы их не измените.'],
  ['list', 'Добавление целым списком', 'Нажмите «Добавить списком». Вставьте фамилии или названия по строкам, а дополнительные поля разделяйте точкой с запятой либо табуляцией. Все записи получат выбранный столбец.'],
  ['grid', 'Темы и вид приложения', 'В настройках → «Оформление» можно оставить прежнюю светлую/тёмную тему либо выбрать изумрудную, графитовую, голографическую или комбинированную. У каждой заставки свои пропорции экрана.'],
  ['gear', 'Защита и перенос данных', 'В настройках включите код-пароль, установите автоблокировку и периодически выгружайте резервную копию. Перед обновлением на GitHub Pages обязательно сохраните данные отдельно.']
];
function openTour(){
  let i = 0;
  const ov = document.createElement('div'); ov.className = 'tour';
  document.body.appendChild(ov); document.body.classList.add('lock');
  const finish = () => { try { localStorage.setItem('skipp_tour', '1'); } catch (e) {} ov.remove(); if (!SHEETS.length) document.body.classList.remove('lock'); };
  const draw = () => {
    const s = TOUR[i], last = i === TOUR.length - 1;
    ov.innerHTML = '<div class="tour-box"><button type="button" class="tour-skip" data-t="skip">Пропустить</button>'
      + '<div class="tour-ic">'+ic(s[0], 40)+'</div><h2>'+esc(s[1])+'</h2><p>'+esc(s[2])+'</p>'
      + (i===2?'<div class="tour-practice"><button type="button" class="btn" data-practice="order">Поставить задачу</button><button type="button" class="btn" data-practice="remind">Напомнить</button><div id="tour-practice-result" aria-live="polite">Удерживайте кнопку пальцем 0,5 секунды</div></div>':'')
      + '<div class="tour-dots">'+TOUR.map((_, k) => '<i class="'+(k === i ? 'on' : '')+'"></i>').join('')+'</div>'
      + '<div class="tour-nav">'+(i ? '<button type="button" class="btn" data-t="prev">Назад</button>' : '<span></span>')
      + (last ? '<div class="btn-row"><button type="button" class="btn" data-t="demo">Показать образец</button><button type="button" class="btn primary" data-t="end">Начать</button></div>' : '<button type="button" class="btn primary" data-t="next">Далее</button>')
      + '</div></div>';
  };
  draw();
  let practiceTimer=null,practiceHeld=false,practiceStart=0;
  const practiceSuccess=()=>{practiceHeld=true;const result=$('#tour-practice-result',ov);if(result)result.innerHTML='<b>✓ Долгое нажатие!</b><br>В настоящей карточке откроется системное «Поделиться» с мессенджерами, AirDrop и другими приложениями.';};
  ov.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-practice]');if(!b)return;practiceHeld=false;practiceStart=Date.now();clearTimeout(practiceTimer);practiceTimer=setTimeout(practiceSuccess,520);});
  ov.addEventListener('pointerup',()=>{clearTimeout(practiceTimer);if(practiceStart&&Date.now()-practiceStart>=500)practiceSuccess();practiceStart=0;});
  ov.addEventListener('pointercancel',()=>{clearTimeout(practiceTimer);practiceStart=0;});
  ov.addEventListener('contextmenu',e=>{if(e.target.closest('[data-practice]'))e.preventDefault();});
  ov.addEventListener('click',e=>{const b=e.target.closest('[data-practice]');if(!b)return;const result=$('#tour-practice-result',ov);if(result&&!practiceHeld)result.textContent='Короткое нажатие: текст скопирован в буфер обмена (демонстрация). Удерживайте для меню отправки.';});
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t;
    if (t === 'next') { i++; draw(); } else if (t === 'prev') { i--; draw(); }
    else if (t === 'skip' || t === 'end') finish();
    else if (t === 'demo') { finish(); addDemo(); }
  });
}

/* ================= образец ================= */
const hasDemo = () => D.tasks.some(t => t.demo) || D.subs.some(s => s.demo) || D.boards.some(b => b.demo) || D.journal.some(j => j.demo);
function addDemo(){
  if (hasDemo()) { toast('Образец уже добавлен'); go('dash'); return; }
  const T = today(), st = id => tSt().some(s => s.id === id) ? id : firstT(), doneSt = (tSt().find(s => s.done) || tSt()[0]).id;
  const as = id => aSt().some(s => s.id === id) ? id : firstA(), aDoneSt = (aSt().find(s => s.done) || aSt()[0]).id;
  const base = (o, k) => Object.assign({id:uid(), demo:true, note:'', assignees:[], due:'', priority:'mid', status:firstT(), repeat:'none', repeatDays:null, remind:null, checklist:[], sentMeta:null, createdAt:Date.now() - k * 3600e3, updatedAt:Date.now(), order:Date.now() + k, completedAt:null, archived:false, spawned:false}, o);
  commit(() => {
    [['Коростов А.В.', '+7 900 000-00-01', 'ЗССПД 101'], ['Иванов И.И.', '+7 900 000-00-02', 'ЗССПД 102'], ['Петров П.П.', '+7 900 000-00-03', 'ЗССПД 103']].forEach(x => D.subs.push({id:uid(), demo:true, name:'(образец) ' + x[0], phone:x[1], address:x[2]}));
    D.tasks.push(
      base({title:'(образец) Проверить журнал учёта', due:T, priority:'high', checklist:[{id:uid(), text:'Сверить записи за неделю', done:true}, {id:uid(), text:'Проверить подписи', done:false}, {id:uid(), text:'Доложить командиру', done:false}]}, 1),
      base({title:'(образец) Подготовить еженедельный отчёт', due:addDays(T, 2), repeat:'weekly', remind:1}, 2),
      base({title:'(образец) Сверить списки личного состава', due:addDays(T, -1), status:st('collect')}, 3),
      base({title:'(образец) Подготовить донесение о наличии ГСМ', note:'Данные по состоянию на 18:00', due:addDays(T, 1), priority:'high', status:st('collect'), assignees:[{name:'(образец) Коростов А.В.', status:aDoneSt}, {name:'(образец) Иванов И.И.', status:as('work')}]}, 4),
      base({title:'(образец) Доложить о готовности связи', due:T, remind:0, assignees:[{name:'(образец) Петров П.П.', status:as('accepted')}]}, 5),
      base({title:'(образец) Провести инструктаж по охране труда', status:doneSt, completedAt:Date.now(), assignees:[{name:'(образец) Иванов И.И.', status:aDoneSt}]}, 6)
    );
    D.journal.push({id:uid(), demo:true, createdAt:Date.now(), number:'15', date:T, direction:'out', brief:'(образец) О подготовке донесения о наличии ГСМ', party:'(образец) Коростов А.В.', mark:''},
      {id:uid(), demo:true, createdAt:Date.now(), number:'7', date:addDays(T, -1), direction:'in', brief:'(образец) О проведении проверки связи', party:'Штаб', mark:'Исполнено'});
    const bid = uid(), c1 = uid(), c2 = uid(), c3 = uid();
    D.boards.push({id:bid, demo:true, title:'Образец: идеи', kind:'generic', order:Date.now(), cols:[{id:c1, title:'Новые'}, {id:c2, title:'В работе'}, {id:c3, title:'Готово'}]});
    D.bcards.push({id:uid(), demo:true, board:bid, col:c1, title:'Обновить схему оповещения', note:'Добавить новых абонентов', remark:'Согласовать с начальником связи', order:1},
      {id:uid(), demo:true, board:bid, col:c2, title:'Шаблон еженедельного отчёта', note:'', remark:'', order:2},
      {id:uid(), demo:true, board:bid, col:c3, title:'Перенести задачи в СКиП', note:'Готово!', remark:'', order:3});
  });
  toast('Образец добавлен. Убрать его можно в настройках'); go('dash');
}
function removeDemo(){
  commit(() => {
    const ids = new Set(D.boards.filter(b => b.demo).map(b => b.id));
    D.tasks = D.tasks.filter(t => !t.demo); D.subs = D.subs.filter(s => !s.demo); D.journal = D.journal.filter(j => !j.demo);
    D.boards = D.boards.filter(b => !b.demo); D.bcards = D.bcards.filter(c => !c.demo && !ids.has(c.board));
    D.trash = (D.trash || []).filter(x => !(x.item && x.item.demo));
  });
  toast('Образец убран');
}
let INTRO_DONE = false;
function startIntro(){
  if (!pinSet() || SEC.locked) return;
  if (INTRO_DONE) return; INTRO_DONE = true;
  const tour = () => { try { if (!localStorage.getItem('skipp_splash_settings_tip')) { localStorage.setItem('skipp_splash_settings_tip','1');setTimeout(()=>toast('Настройки заставки и звука доступны в «Настройки → Оформление»'),500); } } catch(e) {} let seen = false; try { seen = !!localStorage.getItem('skipp_tour'); } catch (e) {} if (!seen) openTour(); else setTimeout(backupReminder, 300); };
  let shown = ''; try { shown = localStorage.getItem('skipp_splash_day') || ''; } catch (e) {}
  if (D.settings.splash !== false && (D.settings.splashMode !== 'daily' || shown !== today())) { try { localStorage.setItem('skipp_splash_day', today()); } catch (e) {} showSplash(tour); } else tour();
}

/* ================= перенос задачи через текст сообщения ================= */
const CODE_RE = /⟦СКиПП:([A-Za-z0-9+/=]+)⟧/;
function taskCode(t){
  const o = {t:t.title, n:t.note || '', a:(t.assignees || []).map(a => a.name), d:t.due || '', p:t.priority || 'mid', c:(t.checklist || []).map(i => i.text).filter(Boolean), r:t.repeat || 'none', rd:t.repeatDays || null, m:t.remind == null ? null : t.remind, s:(D.settings.sign || '').trim()};
  return '⟦СКиПП:' + b64e(new TextEncoder().encode(JSON.stringify(o))) + '⟧';
}
function readCode(text){
  const m = String(text || '').match(CODE_RE); if (!m) return null;
  try { const o = JSON.parse(new TextDecoder().decode(b64d(m[1]))); return o && o.t ? o : null; } catch (e) { return null; }
}
function parseMessage(text){
  const code = readCode(text);
  if (code) return {exact:true, title:code.t, note:code.n, names:code.a || [], due:code.d || '', priority:code.p || 'mid', checklist:code.c || [], repeat:code.r || 'none', repeatDays:code.rd, remind:code.m, author:code.s || ''};
  const strip = s => s.replace(/^[\s📌👤⏰❗📅]+/u, '').trim();
  const lines = String(text || '').replace(CODE_RE, '').split(/\r?\n/).map(s => s.trim());
  const r = {exact:false, title:'', note:'', names:[], due:'', priority:'mid', checklist:[], repeat:'none', repeatDays:null, remind:null, author:''};
  const rest = []; let structured = false, afterAsk = false;
  lines.forEach(raw => {
    const l = strip(raw); if (!l) { rest.push(''); return; }
    let m;
    if (/^(ЗАДАЧА|НАПОМИНАНИЕ)$/i.test(l)) { structured = true; return; }
    if ((m = l.match(/^Кому:\s*(.+)$/i)) || (/^👤/u.test(raw) && (m = [0, l]))) { r.names = m[1].split(/\s*,\s*/).filter(Boolean); structured = true; return; }
    if ((m = l.match(/^Срок:?\s*(?:до\s*)?(\d{2})\.(\d{2})\.(\d{4})/i))) { r.due = m[3] + '-' + m[2] + '-' + m[1]; structured = true; return; }
    if (/^Срок:?\s*без срока/i.test(l)) { structured = true; return; }
    if (/^Приоритет:\s*высокий/i.test(l)) { r.priority = 'high'; return; }
    if ((m = l.match(/^По задаче:\s*(.+)$/i))) { r.title = m[1]; structured = true; return; }
    if ((m = l.match(/^[—–-]\s+(.+)$/))) { r.checklist.push(m[1]); return; }
    if (/^Прошу\s/i.test(l) || /^Напоминание$/i.test(l)) { afterAsk = true; return; }
    if (afterAsk) { r.author = r.author ? r.author + ' ' + l : l; return; }
    rest.push(l);
  });
  if (!structured) {
    const p = parseVoice(text);
    return {exact:false, title:p.title || String(text).trim().slice(0, 300), note:p.note, names:p.assignees.map(a => a.name), due:p.due, priority:p.priority, checklist:p.checklist.map(i => i.text), repeat:p.repeat, repeatDays:p.repeatDays, remind:p.remind, author:''};
  }
  const body = rest.join('\n').replace(/\n{2,}/g, '\n').trim().split('\n').filter(Boolean);
  if (!r.title) r.title = body.shift() || '';
  else if (body.length && !r.note) { /* остальное — подробности */ }
  r.note = body.join('\n');
  return r;
}
function openPasteTask(){
  let mode = 'me';
  const sh = openSheet(head('Вставить задачу') + '<div class="sh-b">'
    + '<p class="hint" style="margin:0">Скопируйте сообщение с задачей в мессенджере и вставьте сюда. Приложение заполнит карточку, вам останется проверить и сохранить.</p>'
    + '<button type="button" class="btn" id="pt-clip">'+ic('copy', 18)+'Вставить из буфера обмена</button>'
    + '<textarea id="pt-text" rows="8" placeholder="Или вставьте текст вручную: нажмите и удерживайте → «Вставить»"></textarea>'
    + '<div class="fld"><span class="lbl">Как добавить</span><div class="seg" id="pt-mode"><button type="button" data-v="me" class="on">Задача для меня</button><button type="button" data-v="copy">Копия как есть</button></div>'
    + '<span class="hint" id="pt-mh" style="margin:0">Задача попадёт в «Мои задачи», автор сообщения — в подробности.</span></div>'
    + '<p class="hint" id="pt-st" style="margin:0"></p>'
    + '</div><div class="sh-f"><span class="sp"></span><button type="button" class="btn" data-close>Отмена</button><button type="button" class="btn primary" id="pt-go">Распознать</button></div>');
  const ta = $('#pt-text', sh), stEl = $('#pt-st', sh);
  const status = () => { const v = ta.value.trim(); stEl.textContent = !v ? '' : readCode(v) ? '✓ Найден код СКиПП — задача перенесётся точно.' : 'Кода СКиПП нет — текст будет разобран приблизительно, проверьте карточку.'; };
  ta.addEventListener('input', status);
  $('#pt-clip', sh).addEventListener('click', async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { ta.value = t; status(); } else toast('Буфер обмена пуст'); }
    catch (e) { toast('Нет доступа к буферу. Вставьте текст в поле вручную'); ta.focus(); }
  });
  $('#pt-mode', sh).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.v; $$('#pt-mode button', sh).forEach(x => x.classList.toggle('on', x === b));
    $('#pt-mh', sh).textContent = mode === 'me' ? 'Задача попадёт в «Мои задачи», автор сообщения — в подробности.' : 'Исполнители сохранятся — задача попадёт в «Указания». Удобно для переноса между своими устройствами.'; });
  $('#pt-go', sh).addEventListener('click', () => {
    const txt = ta.value.trim(); if (!txt) { toast('Вставьте текст задачи'); return; }
    const p = parseMessage(txt);
    if (!p.title) { toast('Не удалось найти суть задачи'); return; }
    let note = p.note || '';
    if (mode === 'me' && p.author) note = ('Поставил: ' + p.author + (note ? '\n' + note : '')).trim();
    const task = {title:p.title, note:note, due:p.due || '', priority:p.priority || 'mid', repeat:p.repeat || 'none', repeatDays:p.repeatDays || null, remind:p.remind == null ? null : p.remind, status:firstT(),
      checklist:(p.checklist || []).map(x => ({id:uid(), text:x, done:false})), assignees:mode === 'copy' ? (p.names || []).map(n => ({name:n, status:firstA()})) : []};
    closeSheet();
    openTaskForm(null, {task:task, forOrder:task.assignees.length > 0, noFocus:true});
    toast(p.exact ? 'Задача перенесена — проверьте и сохраните' : 'Проверьте карточку и сохраните');
  });
  setTimeout(() => ta.focus(), 100);
}

/* ================= тревога (тревожный код) ================= */
const AUX_KEY = 'skipp_aux', DECOY_KEY = 'skipp_dx';
function auxRec(){ try { const r = JSON.parse(localStorage.getItem(AUX_KEY) || 'null'); return r && r.v === 2 ? r : null; } catch (e) { return null; } }
async function tryKey(pin, rec){ try { const k = await deriveKey(pin, b64d(rec.salt), safeIterations(rec.iter)); await decStr(k, rec.chk); return k; } catch (e) { return null; } }
async function enterDuress(key, aux){
  HIST.undo.length = 0; HIST.redo.length = 0; INTRO_DONE = true;
  if (aux.mode === 'wipe') {
    try {
      [KEY, DECOY_KEY, AUX_KEY, 'skipp_facts', UKEY, 'skipp_pin_fail'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem(PIN_KEY, JSON.stringify({v:2, digits:aux.digits || 4, salt:aux.salt, iter:aux.iter || ITER, chk:aux.chk}));
    } catch (e) {}
    D = blank(); D.settings.splash = false; SEC.decoy = false; SEC.key = key; SEC.locked = false;
    SEC.duressWipe = true;
    try { await recoveryClear(); const result = saveLocal(); if (result === false) throw new Error('Не удалось записать новую базу'); await result; }
    finally { SEC.duressWipe = false; }
  } else {
    SEC.decoy = true; SEC.key = key; SEC.locked = false;
    let obj = null; try { obj = JSON.parse(localStorage.getItem(DECOY_KEY) || 'null'); } catch (e) {}
    D = blank();
    if (obj && obj.enc === 1) { try { applyLoaded(JSON.parse(await decStr(key, obj))); } catch (e) { D = blank(); } }
  }
  U.tab = 'dash'; document.body.classList.remove('locked'); render();
}
function openAlarm(){
  const aux = auxRec();
  const sh = openSheet(head('Тревога') + '<div class="sh-b">'
    + '<p style="margin:0">Тревожный код — второй код из 4 цифр. Его вводят вместо обычного, если приложение требуют открыть под давлением. Экран ввода и время проверки одинаковые для обоих кодов.</p>'
    + (aux ? '<div class="banner" style="margin:0">Тревога включена. Режим: <b>'+(aux.mode === 'wipe' ? 'обнулить приложение' : 'чистый вход')+'</b>.</div>' : '')
    + '<div class="fld"><span class="lbl">Что делать при вводе тревожного кода</span>'
    + '<button type="button" class="btn al-opt" data-m="clean"><b>Чистый вход</b><span>Приложение откроется пустым — без заставки, обучения и задач. Ваши данные останутся зашифрованными: с обычным кодом всё будет на месте.</span></button>'
    + '<button type="button" class="btn al-opt danger-o" data-m="wipe"><b>Обнулить приложение</b><span>Все данные на устройстве будут безвозвратно удалены. Приложение откроется пустым, тревожный код станет обычным.</span></button></div>'
    + '<p class="hint" style="margin:0">Затем нужно придумать тревожный код — он должен отличаться от обычного.</p>'
    + '</div><div class="sh-f">'+(aux ? '<button type="button" class="btn danger-o" data-off>Выключить тревогу</button>' : '')+'<span class="sp"></span><button type="button" class="btn" data-close>Закрыть</button></div>');
  sh.addEventListener('click', async e => {
    const b = e.target.closest('[data-m]');
    if (b) { const mode = b.dataset.m; closeSheet(); setupDuress(mode); return; }
    if (e.target.closest('[data-off]')) {
      if (await confirmDlg('Выключить тревожный код? Данные режима «Чистый вход» будут удалены.', 'Выключить')) { try { localStorage.removeItem(AUX_KEY); localStorage.removeItem(DECOY_KEY); } catch (err) {} closeSheet(); toast('Тревога выключена'); }
    }
  });
}
function setupDuress(mode){
  const main = pinRecV2(); if (!main || !CRYPTO_OK) { toast('Сначала включите обычный код-пароль'); return; }
  let first = null;
  const digits = main.digits === 6 ? 6 : 4;
  pinPad('Тревожный код', 'Придумайте ' + digits + ' цифр — не такие, как обычный код', async (x, api) => {
    if (first == null) { first = x; api.reset('Повторите тревожный код', 'Введите те же ' + digits + ' цифр ещё раз'); return; }
    if (x !== first) { first = null; api.reset('Тревожный код', 'Коды не совпали. Введите ' + digits + ' цифр заново'); return; }
    api.msg('Проверяю…');
    if (await tryKey(x, main)) { first = null; api.reset('Тревожный код', 'Этот код совпадает с обычным. Придумайте другой'); return; }
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(x, salt, ITER);
      const chk = await encStr(key, 'skipp');
      localStorage.setItem(AUX_KEY, JSON.stringify({v:2, digits:digits, salt:b64e(salt), iter:ITER, chk:chk, mode:mode}));
      localStorage.removeItem(DECOY_KEY);
      api.close(); toast('Тревожный код установлен: ' + (mode === 'wipe' ? 'обнуление' : 'чистый вход'));
    } catch (e) { api.close(); toast('Не удалось сохранить тревожный код'); }
  }, {cancel:true, digits:digits});
}

/* ================= напоминание о резервной копии ================= */
function backupReminder(){
  if (SEC.decoy) return;
  const s = D.settings, now = Date.now();
  if (!s.firstUse) { commit(() => { D.settings.firstUse = now; }); return; }
  if (!D.tasks.length) return;
  const last = s.lastBackup || s.firstUse;
  if (now - last < 7 * 864e5 || now < (s.backupSnooze || 0)) return;
  const days = Math.floor((now - last) / 864e5);
  const sh = openSheet(head('Пора сделать резервную копию') + '<div class="sh-b"><p style="margin:0">'
    + (s.lastBackup ? 'С последней выгрузки данных прошло ' + days + ' ' + plural(days, 'день', 'дня', 'дней') + '.' : 'Вы ещё ни разу не выгружали данные.')
    + ' Если телефон потеряется или браузер очистит память, задачи можно будет восстановить только из файла.</p></div>'
    + '<div class="sh-f"><button type="button" class="btn ghost" data-later>Напомнить завтра</button><span class="sp"></span><button type="button" class="btn primary" data-now>'+ic('download', 18)+'Выгрузить сейчас</button></div>', {small:true});
  $('[data-later]', sh).addEventListener('click', () => { commit(() => { D.settings.backupSnooze = Date.now() + 864e5; }); closeSheet(); });
  $('[data-now]', sh).addEventListener('click', () => { closeSheet(); backup(); });
}

/* ================= действия ================= */
function openThing(kind, id){
  if (kind === 'task') { const t = D.tasks.find(x => x.id === id); if (t) openTaskForm(t); }
  else if (kind === 'bcard') openBCard(id);
  else if (kind === 'person') openPerson(id);
  else if (kind === 'sub') openSub(id);
  else if (kind === 'j') openJournalForm(id);
}
function statusMenu(id, ai){
  const t = D.tasks.find(x => x.id === id); if (!t) return;
  const a = ai != null ? t.assignees[ai] : null;
  const cur = a ? a.status : t.status;
  const list = a ? aSt() : tSt();
  menu(a ? a.name : (hasAsg(t) ? 'Мой статус' : 'Статус задачи'), list.map(s => ({v:s.id, label:s.name, color:s.color, on:s.id === cur})), v => {
    if (v === cur) return;
    commit(() => { const x = D.tasks.find(y => y.id === id); if (!x) return; if (a) { x.assignees[ai].status = v; x.updatedAt = Date.now(); } else setOverall(x, v); });
  }, t.title);
}
function quickAdd(){
  const el = $('#quick'); const v = el ? el.value.trim() : '';
  if (!v) { if (el) el.focus(); return; }
  commit(() => D.tasks.push({id:uid(), title:v, note:'', assignees:[], due:'', priority:'mid', status:firstT(), repeat:'none', repeatDays:null, remind:null, checklist:[], sentMeta:null, createdAt:Date.now(), updatedAt:Date.now(), order:Date.now(), completedAt:null, archived:false, spawned:false}));
  const n = $('#quick'); if (n) n.focus();
  toast('Задача добавлена');
}
async function handle(a, el){
  const id = el.dataset.id;
  switch (a) {
    case 'tab': go(el.dataset.tab); break;
    case 'board-more': {const key=el.dataset.boardKey;if(key && key.length<250){BOARD_VISIBLE.set(key,(BOARD_VISIBLE.get(key)||BOARD_BATCH)+BOARD_BATCH);render();}break;}
    case 'page-prev': changePage(el.dataset.kind,-1); break;
    case 'page-next': changePage(el.dataset.kind,1); break;
    case 'ext-new-day': openTaskForm(null,{task:{due:el.dataset.day}}); break;
    case 'ext-backup': backup(); break;
    case 'ext-bulk-all': {const list=D.tasks.filter(extTaskMatches).sort(urgencySortFast); const page=pageWindow(list,'search',PAGE_SIZE_SEARCH,JSON.stringify([EXT.q,EXT.status,EXT.priority,EXT.scope])); page.items.forEach(t=>{if(!t.archived)EXT_BULK.add(t.id);});render();break;}
    case 'ext-bulk-clear': EXT_BULK.clear();render();break;
    case 'ext-bulk-apply': extBulkApply();break;
    case 'ext-filter-save': extSaveFilter(); break;
    case 'ext-filter-reset': extApplyFilter({}); render(); break;
    case 'ext-filter-load': {const f=extSavedFilters().find(x=>x.id===id); if(f){extApplyFilter(f.filter);render();} break;}
    case 'ext-filter-delete': extRemoveFilter(id); break;
    case 'more': openMore(); break;
    case 'settings': openSettings(); break;
    case 'undo': undo(); break;
    case 'redo': redo(); break;
    case 'quick-add': quickAdd(); break;
    case 'voice': openVoice(); break;
    case 'paste-task': openPasteTask(); break;
    case 'new-order': openTaskForm(null, {forOrder:true}); break;
    case 'st-menu': statusMenu(id, el.dataset.ai != null ? Number(el.dataset.ai) : null); break;
    case 'copy-order': { const t = D.tasks.find(x => x.id === id); if (t) copyText(orderText(t), 'Задача скопирована — вставьте в мессенджер'); break; }
    case 'copy-remind': { const t = D.tasks.find(x => x.id === id); if (t) copyText(remindText(t), 'Напоминание скопировано — вставьте в мессенджер'); break; }
    case 'asg-toggle': U.asgOpen = U.asgOpen || {}; U.asgOpen[id] = el.getAttribute('aria-expanded') !== 'true'; render(); break;
    case 'cl-toggle': U.clOpen[id] = !U.clOpen[id]; render(); break;
    case 'cl-item': commit(() => { const t = D.tasks.find(x => x.id === id); if (!t) return; const i = t.checklist[Number(el.dataset.ix)]; if (i) { i.done = !i.done; t.updatedAt = Date.now(); } }); break;
    case 'set-view': commit(() => { D.settings.views[el.dataset.key] = el.dataset.v; }); render(); break;
    case 'toggle-done': U.showDone[el.dataset.key] = !U.showDone[el.dataset.key]; render(); break;
    case 'expand': U.exp[el.dataset.key] = !U.exp[el.dataset.key]; render(); break;
    case 'asg': U.asg = el.dataset.name; render(); break;
    case 'asg-go': U.asg = el.dataset.name; U.search = ''; U.tab = 'orders'; saveUI(); render(); window.scrollTo(0, 0); break;
    case 'dash-settings': openDashSettings(); break;
    case 'cal-prev': case 'cal-next': { const delta = a === 'cal-next' ? 1 : -1; if (U.calMode === 'week') { U.sel = addDays(U.sel, 7 * delta); const d = parseD(U.sel); U.cal = {y:d.getFullYear(),m:d.getMonth()}; } else { const d = new Date(U.cal.y, U.cal.m + delta, 1); U.cal = {y:d.getFullYear(), m:d.getMonth()}; } render(); break; }
    case 'cal-mode': { U.calMode = U.calMode === 'week' ? 'month' : 'week'; const d = parseD(U.sel); if (U.calMode === 'week') U.cal = {y:d.getFullYear(),m:d.getMonth()}; render(); break; }
    case 'cal-today': { const d = new Date(); U.cal = {y:d.getFullYear(), m:d.getMonth()}; U.sel = today(); render(); break; }
    case 'pick-day': U.sel = el.dataset.day; { const d = parseD(U.sel); if (d.getMonth() !== U.cal.m) U.cal = {y:d.getFullYear(), m:d.getMonth()}; } render(); break;
    case 'add-task-day': openTaskForm(null, {task:{due:U.sel}}); break;
    case 'pick-board': U.board = id; saveUI(); render(); break;
    case 'add-board': openNewBoard(); break;
    case 'board-settings': openBoardSettings(); break;
    case 'add-bcard': openBCard(null, el.dataset.col); break;
    case 'board-rapid': openRapidBoard(); break;
    case 'board-bulk': openBulkBoard(); break;
    case 'add-person': openPerson(null); break;
    case 'add-mcol': openMcol(null); break;
    case 'edit-mcol': openMcol(id); break;
    case 'bulk-people': openBulkPeople(); break;
    case 'export-board': exportBoard(); break;
    case 'add-sub': openSub(null); break;
    case 'copy-phone': { const p = D.subs.find(x => x.id === id); if (p) copyText(p.phone, 'Номер скопирован'); break; }
    case 'add-j': openJournalForm(null); break;
    case 'j-filter': U.jFilter = el.dataset.v; render(); break;
    case 'export-journal': exportJournal(); break;
    case 'restore': commit(() => { const t = D.tasks.find(x => x.id === id); if (!t) return; t.archived = false; t.archivedAt = null; setOverall(t, firstT()); }); toast('Задача возвращена в работу'); break;
    case 'tomorrow-task': {
      const t=D.tasks.find(x=>x.id===id);if(!t||isDone(t))break;
      if(commit(()=>{t.due=addDays(today(),1);t.updatedAt=Date.now();}))toast('Срок перенесён на завтра');
      break;
    }
    case 'repeat-new':openTaskForm(null,{task:{repeat:'weekly',due:today()}});break;
    case 'repeat-edit': {const t=D.tasks.find(x=>x.id===id);if(t)openTaskForm(t);break;}
    case 'repeat-stop': {
      const t=D.tasks.find(x=>x.id===id);if(!t)break;
      if(await confirmDlg('Остановить повторение «'+t.title+'»? Существующие экземпляры сохранятся.','Остановить')){
        commit(()=>{t.repeat='none';t.repeatDays=null;t.updatedAt=Date.now();});toast('Повторение остановлено');
      }break;
    }
    case 'del-task': commit(() => { const x = D.tasks.find(y => y.id === id); if (x) toTrash('task', x); }); toast('Перемещено в корзину'); break;
    case 'clear-archive': if (await confirmDlg('Переместить все задачи из архива в корзину?', 'Переместить')) commit(() => { D.tasks.filter(x => x.archived).forEach(x => toTrash('task', x)); }); break;
    case 'trash-restore': { let err = null; commit(() => { const x = D.trash.find(y => y.id === id); if (x) err = restoreTrash(x); }); toast(err || 'Восстановлено'); break; }
    case 'trash-del': if (await confirmDlg('Удалить навсегда? Восстановить будет нельзя.')) commit(() => { D.trash = D.trash.filter(y => y.id !== id); }); break;
    case 'trash-clear': if (await confirmDlg('Очистить корзину? Всё в ней будет удалено навсегда.', 'Очистить')) { commit(() => { D.trash = []; }); toast('Корзина очищена'); } break;
  }
}
document.addEventListener('click', e => {
  if (DND.just) { e.preventDefault(); e.stopPropagation(); return; }
  if (e.target.closest('.ov')) return;
  const a = e.target.closest('[data-a]');
  if (a) { if (!a.disabled) handle(a.dataset.a, a); return; }
  if (e.target.closest('a')) return;
  const o = e.target.closest('[data-open]');
  if (o) openThing(o.dataset.open, o.dataset.id);
}, true);
document.addEventListener('input', e => {
  if (e.target.id === 'ext-q') { EXT.q=e.target.value; render(); }
  else if (e.target.id === 'q-tasks') { U.search = e.target.value; render(); }
  else if (e.target.id === 'sub-q') { U.subQ = e.target.value; render(); }
});
document.addEventListener('change', e => {
  if(e.target.dataset?.change==='ext-bulk-check'){
    if(e.target.checked)EXT_BULK.add(e.target.dataset.id);else EXT_BULK.delete(e.target.dataset.id);
    const counter=document.querySelector('.ext-bulk-bar .hint');
    if(counter)counter.textContent='Выбрано: '+extBulkSelection().filter(t=>pageWindow(D.tasks.filter(extTaskMatches).sort(urgencySortFast),'search',PAGE_SIZE_SEARCH,JSON.stringify([EXT.q,EXT.status,EXT.priority,EXT.scope])).items.some(x=>x.id===t.id)).length;
    return;
  }
  if(e.target.id==='ext-bulk-action'){
    const host=document.getElementById('ext-bulk-value-host');if(!host)return;
    const kind=e.target.value;
    if(kind==='due')host.innerHTML='<input type="date" id="ext-bulk-value" aria-label="Новый срок; пустое значение снимает срок">';
    else if(kind==='delete'||kind==='tomorrow')host.innerHTML='<span class="hint">Дополнительных параметров нет</span>';
    else if(kind==='status')host.innerHTML='<select id="ext-bulk-value">'+tSt().map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select>';
    else host.innerHTML='<select id="ext-bulk-value"><option value="high">Высокий</option><option value="mid">Обычный</option><option value="low">Низкий</option></select>';
    return;
  }
  if (e.target.dataset && e.target.dataset.change === 'cal-due') { const id=e.target.dataset.id, due=e.target.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(parseD(due).getTime()) || ymd(parseD(due))!==due) { toast('Некорректная дата'); render(); return; } const changed=commit(()=>{const t=D.tasks.find(x=>x.id===id && !x.archived); if(!t) throw new Error('Задача не найдена'); t.due=due; t.updatedAt=Date.now();}); if(changed) toast('Новый срок поставлен в очередь сохранения'); else render(); return; } if(e.target.id==='ext-status'){EXT.status=e.target.value;render();} else if(e.target.id==='ext-priority'){EXT.priority=e.target.value;render();} else if(e.target.id==='ext-scope'){EXT.scope=e.target.value;render();} else if(e.target.id==='ext-period'){EXT.period=Number(e.target.value);render();} else if(e.target.id==='ext-import'){const f=e.target.files&&e.target.files[0];if(f)restoreFrom(f);}  if (e.target.dataset && e.target.dataset.change === 'j-sort') { U.jSort = e.target.value; render(); } });
document.addEventListener('click',e=>{if(e.target && e.target.id==='skipp-diagnostics')showDiagnostics();});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'quick') { e.preventDefault(); quickAdd(); } });
$('#fab-v').addEventListener('click', openVoice);
$('#fab').addEventListener('click', () => { if (U.tab === 'orders') openTaskForm(null, {forOrder:true}); else if (U.tab === 'cal') openTaskForm(null, {task:{due:U.sel}}); else openTaskForm(null); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    SEC.hiddenAt = Date.now();
    if (pinSet() && !SEC.locked) { document.body.classList.add('privacy'); if (autolockMin() === 0) lockNow(); }
    return;
  }
  const al = autolockMin();
  if (pinSet() && !SEC.locked && al > 0 && SEC.hiddenAt && Date.now() - SEC.hiddenAt >= al * 60000) lockNow();
  document.body.classList.remove('privacy');
  if (!SEC.locked && !$('.lock-screen')) { autoArchive(); render(); }
});
window.addEventListener('storage', e => {
  if (e.key !== KEY || STORAGE_READONLY || e.newValue === LAST_RAW) return;
  if (PRIMARY_IDB_ENABLED || SEC.key || SEC.locked || PENDING_WRITES) {
    setReadOnly(new Error('База изменена в другой вкладке; обновите страницу для безопасной загрузки'));
    toast('Изменения в другой вкладке. Сохранение заблокировано до перезагрузки.');
    return;
  }
  if (!e.newValue) { setReadOnly(new Error('База удалена в другой вкладке')); return; }
  try {
    const o = JSON.parse(e.newValue);
    if (!o || o.enc) throw new Error('Неожиданный формат');
    validateData(o);
    if (o.savedAt && D.savedAt && o.savedAt < D.savedAt) throw new Error('Конфликт версий');
    applyLoaded(o); LAST_RAW = e.newValue;
    HIST.undo.length = 0; HIST.redo.length = 0; render();
  } catch (err) { setReadOnly(err); toast('Конфликт данных: обновите страницу после создания резервной копии'); }
});

window.addEventListener('beforeunload', e => {
  if (PENDING_WRITES > 0) { e.preventDefault(); e.returnValue = ''; }
});
/* ================= запуск ================= */
async function startApp(){
  await initializePrimary();
  load();
  if (!STORAGE_READONLY && !SEC.locked && LAST_RAW) recoveryGet().then(snap => { if (!snap) recoveryQueue(LAST_RAW); }).catch(() => {});
  autoArchive();
  try { if (sessionStorage.getItem('skipp_wiped')) sessionStorage.removeItem('skipp_wiped'); } catch (e) {}
  if (pinSet()) { document.body.classList.add('locked'); askPin(afterUnlock); }
  else if (!STORAGE_READONLY) { document.body.classList.add('locked'); firstRunPin(); }
  render();
  if (STORAGE_READONLY && !SEC.locked) setTimeout(() => offerRecovery(), 250);
  if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
  const seenPreciseReminder=new Set();
  setInterval(() => {
    const d=today();if(d!==U.lastDay){U.lastDay=d;autoArchive();if(!SHEETS.length)render();}
    if(document.hidden||SEC.locked)return;
    for(const task of D.tasks){
      if(!task.remindAt||isDone(task)||task.archived||seenPreciseReminder.has(task.id))continue;
      const ms=new Date(task.remindAt).getTime();if(!Number.isFinite(ms))continue;
      if(Date.now()>=ms&&Date.now()-ms<65000){seenPreciseReminder.add(task.id);toast('Напоминание: '+task.title.slice(0,90));if(!SHEETS.length)render();}
    }
  }, 15000);
  U.lastDay = today();
}
if ('serviceWorker' in navigator && location.protocol === 'https:') { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
startApp().catch(err => { setReadOnly(err); console.error('Ошибка запуска',err); });
})();
