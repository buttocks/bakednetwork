/* WWE / WWF Ringside — Baked.live channel skin v1.5
   External Javascript URL: host this file as JS (e.g. jsDelivr + GitHub).
   Designed for Baked.live/CyTube channel pages. No external dependencies.
*/
(function () {
  'use strict';
  if (!/^\/(?:tv|r)\/[^/]+\/?$/i.test(location.pathname)) return;
  if (window.__wweWwfSkinV1) return;
  window.__wweWwfSkinV1 = true;

  // Visual layer only: the self-hosted WrestleTube module loader remains in channel-internal.js.
  const key = 'baked-wwf-style:' + location.pathname.toLowerCase();
  const marksKey = 'baked-wwf-marks:' + location.pathname.toLowerCase();
  const select = (selector, parent = document) => parent.querySelector(selector);
  const fallback = 'The next main event is being lined up…';
  const slogans = [
    'THEN • NOW • FOREVER • TOGETHER',
    'THE ATTITUDE ERA NEVER DIES',
    'FROM MONDAY NIGHT RAW TO WRESTLEMANIA',
    'CLASSIC WWF • MODERN WWE • ALL ERAS',
    'IF YOU SMELL WHAT THE CHAT IS COOKING'
  ];
  let tick = 0;
  let lastTitle = '';

  function saveStyle(mode) {
    try { localStorage.setItem(key, mode); } catch (_) { /* storage optional */ }
  }
  function loadStyle() {
    try { return localStorage.getItem(key) === 'modern' ? 'modern' : 'attitude'; }
    catch (_) { return 'attitude'; }
  }
  function showTemporary(el, text, defaultText) {
    el.textContent = text;
    window.setTimeout(() => { if (el.isConnected) el.textContent = defaultText; }, 1800);
  }
  function goTo(selector, focusSelector) {
    const target = select(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    if (focusSelector) {
      const input = select(focusSelector);
      if (input) window.setTimeout(() => input.focus({ preventScroll: true }), 180);
    }
  }
  function nowPlaying() {
    const possibilities = [
      select('#currenttitle')?.textContent,
      select('#queue .queue_entry.queue_active .qe_title')?.textContent,
      select('#queue .queue_active .qe_title')?.textContent,
      select('#currentmedia .qe_title')?.textContent
    ];
    for (const value of possibilities) {
      const title = (value || '').replace(/^\s*(?:now playing|currently playing)\s*:?\s*/i, '').trim();
      if (title && !/^(?:nothing playing|no video|no media|loading\.{0,3})$/i.test(title)) return title;
    }
    return '';
  }

  function mount() {
    if (select('#wwf-arena')) return;
    if (!document.body) return;
    const header = document.createElement('section');
    header.id = 'wwf-arena';
    header.setAttribute('aria-label', 'WWE and WWF channel controls');
    header.innerHTML = `
      <div class="wwf-hero">
        <div class="wwf-watermarks" aria-hidden="true">
          <img class="wwf-mark wwf-mark-classic" src="https://upload.wikimedia.org/wikipedia/commons/6/68/World_Wrestling_Federation_block_logo.svg" alt="" decoding="async">
          <img class="wwf-mark wwf-mark-modern" src="https://upload.wikimedia.org/wikipedia/commons/d/df/WWE_white_logo.svg" alt="" decoding="async">
        </div>
        <div class="wwf-hero-title">
          <div class="wwf-overline">BAKED.LIVE // RINGSIDE BROADCAST</div>
          <div class="wwf-brand"><span class="wwf-brand-old">WWF</span><span class="wwf-vs">/</span><span class="wwf-brand-new">WWE</span><span class="wwf-brand-tail">TV</span></div>
          <div class="wwf-subtitle">THE GOLDEN ERA. THE ATTITUDE ERA. THE NEW ERA.</div>
        </div>
        <div class="wwf-on-air" role="status"><span class="wwf-status-dot"></span><span id="wwf-status">STANDBY</span><small id="wwf-fans">RINGSIDE</small></div>
      </div>
      <div class="wwf-now"><span class="wwf-now-label">NOW SHOWING</span><span id="wwf-track" title="Currently playing">${fallback}</span></div>
      <nav class="wwf-actions" aria-label="Channel shortcuts">
        <button type="button" data-wwf="watch">▶ WATCH</button>
        <button type="button" data-wwf="chat">◉ CHAT</button>
        <button type="button" data-wwf="queue">☰ MATCH CARD</button>
        <button type="button" data-wwf="current">⌖ FIND PLAYING</button>
        <button type="button" data-wwf="theme" aria-pressed="false">◈ ERA: ATTITUDE</button>
        <button type="button" data-wwf="marks" aria-pressed="true" title="Show or hide WWF/WWE background logos">★ LOGOS ON</button>
        <button type="button" data-wwf="focus" aria-pressed="false">▣ CINEMA</button>
        <button type="button" data-wwf="mod" class="wwf-module-action" hidden>⚙ MOD MENU</button>
        <button type="button" data-wwf="macros" class="wwf-module-action" hidden>☻ MACROS</button>
        <button type="button" data-wwf="share">↗ SHARE</button>
      </nav>
      <div class="wwf-ticker" aria-live="off"><b>RINGSIDE WIRE</b><span id="wwf-ticker-text">${slogans[0]}</span></div>`;

    const navbar = select('nav.navbar');
    const main = select('#main') || select('#mainpage') || select('#content');
    if (navbar && navbar.parentNode) navbar.insertAdjacentElement('afterend', header);
    else if (main && main.parentNode) main.parentNode.insertBefore(header, main);
    else document.body.insertBefore(header, document.body.firstChild);

    const button = action => select(`[data-wwf="${action}"]`, header);
    function setTheme(mode) {
      document.body.classList.toggle('wwf-modern', mode === 'modern');
      document.body.classList.toggle('wwf-attitude', mode !== 'modern');
      button('theme').textContent = mode === 'modern' ? '◈ ERA: MODERN' : '◈ ERA: ATTITUDE';
      button('theme').setAttribute('aria-pressed', String(mode === 'modern'));
      saveStyle(mode);
    }
    setTheme(loadStyle());
    let marksVisible = true;
    try { marksVisible = localStorage.getItem(marksKey) !== 'off'; } catch (_) { /* optional */ }
    function setMarks(visible) {
      marksVisible = visible;
      document.body.classList.toggle('wwf-hide-marks', !visible);
      button('marks').textContent = visible ? '★ LOGOS ON' : '☆ LOGOS OFF';
      button('marks').setAttribute('aria-pressed', String(visible));
      try { localStorage.setItem(marksKey, visible ? 'on' : 'off'); } catch (_) { /* optional */ }
    }
    setMarks(marksVisible);
    button('marks').addEventListener('click', () => setMarks(!marksVisible));

    // Existing WrestleTube controls are the authority; never reimplement their handlers.
    const moduleControls = { mod: '#showchansettings', macros: '#emotelistbtn' };
    function activateExistingControl(action) {
      const source = select(moduleControls[action]);
      if (source && !header.contains(source)) source.click();
    }
    Object.keys(moduleControls).forEach(action => {
      button(action).addEventListener('click', () => activateExistingControl(action));
    });
    function updateModuleShortcuts() {
      for (const [action, selector] of Object.entries(moduleControls)) {
        const nativeButton = select(selector);
        button(action).hidden = !nativeButton || nativeButton === button(action);
      }
    }
    updateModuleShortcuts();

    button('watch').addEventListener('click', () => goTo('#videowrap'));
    button('chat').addEventListener('click', () => goTo('#chatwrap', '#chatline'));
    button('queue').addEventListener('click', () => goTo('#queue'));
    button('current').addEventListener('click', () => {
      // Prefer the original WTTTV scrollQueue() implementation if loaded.
      if (typeof window.scrollQueue === 'function') {
        try { window.scrollQueue(); return; } catch (_) { /* fall back to DOM */ }
      }
      const existing = select('#scroll-btn');
      if (existing && !header.contains(existing)) { existing.click(); return; }
      const current = select('#queue .queue_entry.queue_active') || select('#queue .queue_active');
      if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else goTo('#queue');
    });
    button('theme').addEventListener('click', () => setTheme(document.body.classList.contains('wwf-modern') ? 'attitude' : 'modern'));
    // One cinema controller at a time. Prefer the native Xaekai module and
    // use a CSS-only split layout if it is not loaded on this tube.
    // No observer, custom resize dispatch, polling, or iframe reconstruction.
    const cinemaKey = 'baked-wwf-cinema-width:' + location.pathname.toLowerCase();
    let chatWidth = 20;
    try {
      const cached = Number(localStorage.getItem(cinemaKey));
      if (Number.isFinite(cached) && cached >= 15 && cached <= 32) chatWidth = Math.round(cached);
    } catch (_) { /* storage optional */ }
    const cinemaPanel = document.createElement('div');
    cinemaPanel.id = 'wwf-cinema-controls';
    cinemaPanel.hidden = true;
    cinemaPanel.setAttribute('role', 'group');
    cinemaPanel.setAttribute('aria-label', 'Cinema mode controls');
    cinemaPanel.innerHTML = '<button type="button" data-wwf-cinema="smaller" title="Narrower chat">−</button>' +
      '<button type="button" data-wwf-cinema="bigger" title="Wider chat">+</button>' +
      '<button type="button" data-wwf-cinema="exit" title="Exit cinema">✕ EXIT CINEMA</button>';
    document.body.appendChild(cinemaPanel);
    const cinemaActive = () => document.body.classList.contains('wwf-cinema-owned');
    function syncCinemaTitle(on) {
      button('focus').textContent = on ? '▣ EXIT CINEMA' : '▣ CINEMA';
      button('focus').setAttribute('aria-pressed', String(on));
    }
    function resizeCinemaChat(next) {
      chatWidth = Math.min(32, Math.max(15, Math.round(next)));
      document.body.style.setProperty('--wwf-cinema-width', chatWidth + 'vw');
      try { localStorage.setItem(cinemaKey, String(chatWidth)); } catch (_) { /* storage optional */ }
    }
    function setOwnCinema(on) {
      if (cinemaActive() === on) return;
      document.body.classList.toggle('wwf-cinema-owned', on);
      cinemaPanel.hidden = !on;
      syncCinemaTitle(on);
    }
    function findNativeCinemaToggle() {
      const native = document.getElementById('cinematoggle');
      return native && document.getElementById('cinemaStyle') ? native : null;
    }
    function toggleCinema() {
      if (cinemaActive()) {
        setOwnCinema(false);
        return;
      }
      const native = findNativeCinemaToggle();
      if (native) {
        native.click();
        syncCinemaTitle(document.body.classList.contains('cinemachat'));
        return;
      }
      if (!select('#videowrap') || !select('#chatwrap')) {
        showTemporary(button('focus'), 'CINEMA UNAVAILABLE', '▣ CINEMA');
        return;
      }
      setOwnCinema(true);
    }
    resizeCinemaChat(chatWidth);
    cinemaPanel.querySelector('[data-wwf-cinema="smaller"]').addEventListener('click', event => {
      event.preventDefault();
      resizeCinemaChat(chatWidth - 1);
    });
    cinemaPanel.querySelector('[data-wwf-cinema="bigger"]').addEventListener('click', event => {
      event.preventDefault();
      resizeCinemaChat(chatWidth + 1);
    });
    cinemaPanel.querySelector('[data-wwf-cinema="exit"]').addEventListener('click', event => {
      event.preventDefault();
      setOwnCinema(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && cinemaActive()) setOwnCinema(false);
    });
    button('focus').addEventListener('click', toggleCinema);
    button('share').addEventListener('click', async () => {
      const url = location.origin + location.pathname;
      try {
        if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        showTemporary(button('share'), '✓ COPIED', '↗ SHARE');
      } catch (_) {
        window.prompt('Copy channel link:', url);
      }
    });

    // Click-to-reveal spoiler filters. No message text is modified by this script.
    const chat = select('#messagebuffer');
    if (chat) {
      chat.addEventListener('click', event => {
        const spoiler = event.target.closest('.wwf-spoiler');
        if (!spoiler || !chat.contains(spoiler)) return;
        spoiler.classList.toggle('wwf-revealed');
      });
      chat.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const spoiler = event.target.closest('.wwf-spoiler');
        if (spoiler && chat.contains(spoiler)) { event.preventDefault(); spoiler.classList.toggle('wwf-revealed'); }
      });
    }

    // Non-destructive text updates. Does not replace the existing channel module loader.
    function refresh() {
      if (!header.isConnected) return;
      const title = nowPlaying();
      if (title !== lastTitle) {
        lastTitle = title;
        select('#wwf-track', header).textContent = title || fallback;
        select('#wwf-status', header).textContent = title ? 'ON AIR' : 'STANDBY';
        header.classList.toggle('wwf-playing', Boolean(title));
      }
      updateModuleShortcuts();
      const count = select('#usercount')?.textContent?.trim();
      select('#wwf-fans', header).textContent = count ? `${count} RINGSIDE` : 'RINGSIDE';
    }
    refresh();
    const refreshTimer = window.setInterval(refresh, 4000);
    const tickerTimer = window.setInterval(() => {
      if (!header.isConnected) { window.clearInterval(refreshTimer); window.clearInterval(tickerTimer); return; }
      select('#wwf-ticker-text', header).textContent = slogans[(++tick) % slogans.length];
    }, 10000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();