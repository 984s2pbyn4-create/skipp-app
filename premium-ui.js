/* СКиП 4.9.2: безопасная визуальная надстройка, без доступа к данным, PIN и криптографии.
 * Источники метрик: только уже отображённые исходным приложением агрегаты.
 * Отдельная тема хранится как несекретный идентификатор в localStorage; пользовательские задачи не читаются и не записываются.
 */
(() => {
  'use strict';
  const THEME_KEY = 'skip_premium_visual_theme_v1';
  const themes = [
    ['aurum', 'Изумрудный штаб', 'Изумруд, золото, световые орбиты'],
    ['frost', 'Полярное стекло', 'Ледяные оттенки и глубина стекла'],
    ['foundry', 'Тактический графит', 'Сталь, янтарное свечение и точная сетка'],
    ['ivory2', 'Светлый штаб', 'Светлый камень, латунь и зелёные акценты'],
    ['cosmos', 'Космическая орбита', 'Индиго, фиолетовый и светящиеся орбиты']
  ];
  const permitted = new Set(themes.map(x => x[0]));
  const root = document.documentElement;
  const readSelection = () => {
    try { const v = localStorage.getItem(THEME_KEY) || ''; return permitted.has(v) ? v : ''; }
    catch (_) { return ''; }
  };
  let current = readSelection();
  let lastRealm = null;
  let baseline = null;
  let pending = false;
  let rootMutation = false;

  function applyTheme() {
    if (!current) return;
    if (root.getAttribute('data-theme') !== current) {
      rootMutation = true;
      root.setAttribute('data-theme', current);
    }
  }
  function selectTheme(v) {
    current = permitted.has(v) ? v : '';
    try { if (current) localStorage.setItem(THEME_KEY, current); else localStorage.removeItem(THEME_KEY); }
    catch (_) {}
    if (current) applyTheme();
    else {
      document.querySelector('.sk-dashboard-shell')?.remove();
      baseline=null;
      // Core app applies its saved theme on the next normal render; we do not alter its settings.
      root.removeAttribute('data-theme');
      const selected = document.querySelector('#st-th button.on');
      if (selected && selected.dataset.v) root.setAttribute('data-theme', selected.dataset.v);
    }
    refreshChoice();
    schedule();
  }
  function refreshChoice() {
    const p = document.querySelector('#sk-premium-theme-picker');
    if (!p) return;
    p.querySelectorAll('[data-skip-premium]').forEach(b => {
      const isActive = b.dataset.skipPremium === current;
      b.classList.toggle('on', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
  }
  function mountChoice() {
    const native = document.querySelector('#st-th');
    if (!native || document.querySelector('#sk-premium-theme-picker')) return;
    const wrapper = document.createElement('section');
    wrapper.id = 'sk-premium-theme-picker';
    wrapper.className = 'sk-premium-picker';
    wrapper.setAttribute('aria-label', 'Премиальные темы');
    wrapper.innerHTML = '<h3>Премиальные темы СКиП</h3>' +
      '<p class="sk-premium-explain">Оформление всех вкладок. Настройки PIN, заставки и базы остаются прежними.</p>' +
      '<div class="sk-premium-options">' + themes.map(t =>
        '<button type="button" class="sk-theme-choice" data-skip-premium="'+t[0]+'"><b>'+t[1]+'</b><small>'+t[2]+'</small></button>'
      ).join('') +
      '<button type="button" class="sk-theme-choice sk-classic" data-skip-premium=""><b>Стандартная тема</b><small>Вернуться к оформлению из настроек приложения</small></button></div>';
    native.insertAdjacentElement('afterend', wrapper);
    wrapper.addEventListener('click', event => {
      const b = event.target.closest('button[data-skip-premium]');
      if (b) selectTheme(b.dataset.skipPremium);
    });
    refreshChoice();
  }

  // Metrics use only aggregates that the core has already rendered on the unlocked Штаб.
  // This deliberately does not invent a historical 'Выполнено' total or access encrypted storage.
  function renderMetrics() {
    const main = document.getElementById('main');
    const header = document.querySelector('#top h1');
    const locked = document.body.classList.contains('locked') ||
      document.body.classList.contains('privacy') || !!document.querySelector('.lock-screen:not([hidden])');
    if (locked) { baseline = null; lastRealm = null; return; }
    if (!current) return;
    if (!main || !header || header.textContent.trim() !== 'Штаб') return;
    const tiles = [...main.querySelectorAll('.tiles > .tile')];
    if (tiles.length < 4) return;
    const valueFor = name => {
      const el = tiles.find(t => t.textContent.includes(name));
      return el ? Number(el.querySelector('b')?.textContent.trim()) : NaN;
    };
    const mine = valueFor('Мои задачи');
    const orders = valueFor('Указания в работе');
    const overdue = valueFor('Просрочено');
    const people = valueFor('Исполнителей на контроле');
    if (![mine, orders, overdue, people].every(Number.isFinite)) return;
    const hero = main.querySelector('.hero')?.textContent || '';
    const matchToday = hero.match(/(?:у\s+|для\s+)(\d+)\s+срок\s+сегодня/iu);
    const today = matchToday ? Number(matchToday[1]) : 0;
    const stats = {active:mine + orders, mine, orders, overdue, today, people};
    // Scope statistics to the current unlocked UI session. We never write them to storage.
    if (!baseline) { baseline = {...stats}; lastRealm = 'session'; }
    const old = main.querySelector('.sk-dashboard-shell');
    const signature = JSON.stringify(stats) + ':' + JSON.stringify(baseline);
    if (old?.dataset.signature === signature) return;
    const signed = (n) => n > 0 ? '+'+n : n < 0 ? '−'+Math.abs(n) : '0';
    const card = (key, title, detail) => {
      const d = stats[key] - baseline[key];
      const good = (key === 'overdue') ? d < 0 : d > 0;
      const target = ({active:'mine', mine:'mine', orders:'orders', overdue:'ext_search', today:'cal', people:'orders'})[key];
      return '<button type="button" class="sk-stat" data-a="tab" data-tab="'+target+'" aria-label="'+title+' '+stats[key]+' изменение '+signed(d)+'">' +
        '<span class="sk-stat-label">'+title+'</span>'+
        '<strong>'+stats[key]+'</strong>'+
        '<small class="sk-delta '+(d===0?'neutral':good?'positive':'negative')+'">'+signed(d)+'</small>'+
        '<span class="sk-stat-detail">'+detail+'</span></button>';
    };
    const todayLocal = new Date();
    const mon = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate());
    mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
    const week = Array.from({length:7}, (_,i) => {
      const d = new Date(mon);d.setDate(mon.getDate()+i);
      const isToday = d.toDateString() === todayLocal.toDateString();
      const label = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i];
      return '<button type="button" class="sk-day'+(isToday?' today':'')+'" data-a="tab" data-tab="cal" aria-label="Календарь, '+d.toLocaleDateString('ru-RU')+'">' +
        '<span>'+label+'</span><strong>'+d.getDate()+'</strong><em>'+(isToday?'Сегодня':'·')+'</em></button>';
    }).join('');
    const shortcut = (name,tab) => '<button type="button" class="sk-quick-link" data-a="tab" data-tab="'+tab+'">'+name+' →</button>';
    const node = document.createElement('section');
    node.className = 'sk-dashboard-shell sk-command-panel';
    node.dataset.signature = signature;
    node.setAttribute('aria-label', 'Командная панель штаба');
    node.innerHTML = '<div class="sk-dashboard-greeting"><span>ОПЕРАТИВНАЯ ОБСТАНОВКА</span><h2>Командный центр СКиП</h2><p>Текущие показатели и изменения с первого открытия «Штаба» в этом сеансе</p></div>'+
      '<div class="sk-stat-grid">'+card('active','В работе','Мои задачи и указания')+
      card('mine','Мои задачи','Активные личные задачи')+
      card('orders','Указания','Активные указания')+
      card('overdue','Просрочено','Требуют внимания')+
      card('today','На сегодня','Срок исполнения сегодня')+
      card('people','Исполнители','На контроле')+'</div>'+
      '<div class="sk-command-grid"><div class="sk-subpanel"><h3>Календарь · текущая неделя</h3><div class="sk-week">'+week+'</div><p>Нажмите на день, чтобы открыть календарь.</p></div>'+
      '<div class="sk-subpanel"><h3>Быстрый доступ</h3><div class="sk-quick-grid">'+shortcut('Мои задачи','mine')+shortcut('Указания','orders')+shortcut('Доски','boards')+shortcut('Аналитика','ext_analytics')+'</div><p>Разделы открываются средствами приложения.</p></div></div>'+
      '<div class="sk-session-note">Динамика рассчитывается по текущему сеансу. Показатель «Выполнено» требует отдельной интеграции в ядро приложения: недоступные значения не подменяются вымышленными.</div>';
    if (old) old.replaceWith(node);
    else {
      const existing = main.querySelector('.tiles');
      if (existing) existing.insertAdjacentElement('beforebegin', node);
    }
    // Original aggregates remain in the DOM for native app logic; CSS suppresses the duplicate row.
    // Premium cards use the existing data-a=tab event protocol for navigation.
  }
  function sync() {
    pending = false;
    applyTheme();
    mountChoice();
    renderMetrics();
  }
  function schedule() {
    if (pending) return;
    pending = true;
    Promise.resolve().then(sync);
  }
  new MutationObserver(muts => {
    if (muts.length === 1 && muts[0].type === 'attributes' && rootMutation) { rootMutation=false; return; }
    rootMutation=false;
    schedule();
  }).observe(root,{attributes:true,attributeFilter:['data-theme']});
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e => {
    // The next render may update stats or native theme, scheduled once per microtask.
    if (e.target.closest('#st-th button') && current) selectTheme('');
  }, true);
  applyTheme();
  schedule();
})();
