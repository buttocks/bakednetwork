/* WWE / WWF Ringside — Baked.live channel skin v1.4
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
        <button type="button" data-wwf="search" aria-expanded="false" aria-controls="wwf-search-panel">⌕ SEARCH</button>
        <button type="button" data-wwf="share">↗ SHARE</button>
      </nav>
      <section id="wwf-search-panel" class="wwf-search-panel" aria-label="Search wrestling media and playlist" hidden>
        <form id="wwf-search-form" class="wwf-search-form">
          <label for="wwf-search-query">SEARCH</label>
          <select id="wwf-search-provider" aria-label="Search where">
            <option value="youtube">YouTube videos</option>
            <option value="queue">Current playlist</option>
            <option value="google">Google</option>
            <option value="imdb">IMDb</option>
          </select>
          <input id="wwf-search-query" type="search" autocomplete="off" maxlength="240" placeholder="Search for wrestling videos…" required>
          <button type="submit" class="wwf-search-go">SEARCH</button>
          <button type="button" data-wwf-search-close aria-label="Close search">✕</button>
        </form>
        <div id="wwf-search-results" role="status" aria-live="polite"></div>
      </section>
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

    // Search is self-contained: the original WrestleTube under-chat search module
    // is disabled in its loader, and a #showsearch control may have no handler.
    // Never alter the original channel module configuration just to open search.
    const searchPanel = select('#wwf-search-panel', header);
    const searchInput = select('#wwf-search-query', header);
    const searchResults = select('#wwf-search-results', header);
    const searchProvider = select('#wwf-search-provider', header);
    function toggleSearch(open) {
      searchPanel.hidden = !open;
      button('search').setAttribute('aria-expanded', String(open));
      if (open) window.requestAnimationFrame(() => searchInput.focus());
    }
    button('search').addEventListener('click', () => toggleSearch(searchPanel.hidden));
    select('[data-wwf-search-close]', header).addEventListener('click', () => toggleSearch(false));
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); toggleSearch(false); button('search').focus(); }
    });
    searchProvider.addEventListener('change', () => {
      searchResults.replaceChildren();
      searchInput.placeholder = searchProvider.value === 'queue'
        ? 'Find a title in the loaded playlist…'
        : searchProvider.value === 'youtube' ? 'Search for wrestling videos…' : 'Enter search terms…';
    });
    select('#wwf-search-form', header).addEventListener('submit', event => {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) { searchInput.focus(); return; }
      searchResults.replaceChildren();
      if (searchProvider.value === 'queue') {
        const entries = Array.from(document.querySelectorAll('#queue .queue_entry'));
        const term = query.toLocaleLowerCase();
        const matches = entries.filter(entry => (entry.querySelector('.qe_title')?.textContent || entry.textContent || '').toLocaleLowerCase().includes(term));
        const summary = document.createElement('p');
        summary.textContent = matches.length
          ? matches.length + ' matching playlist item' + (matches.length === 1 ? '' : 's')
          : 'No matches in the currently loaded playlist.';
        searchResults.appendChild(summary);
        for (const entry of matches.slice(0, 30)) {
          const result = document.createElement('button');
          result.type = 'button';
          result.className = 'wwf-search-result';
          result.textContent = (entry.querySelector('.qe_title')?.textContent || entry.textContent || '').trim().slice(0, 160);
          result.addEventListener('click', () => {
            document.querySelectorAll('#queue .wwf-search-hit').forEach(el => el.classList.remove('wwf-search-hit'));
            entry.classList.add('wwf-search-hit');
            if (document.body.classList.contains('wwf-cinema-fallback')) setFallbackCinema(false);
            entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
          searchResults.appendChild(result);
        }
        return;
      }
      const encoded = encodeURIComponent(query);
      const target = searchProvider.value === 'google'
        ? 'https://www.google.com/search?q=' + encoded
        : searchProvider.value === 'imdb'
          ? 'https://www.imdb.com/find/?q=' + encoded
          : 'https://www.youtube.com/results?search_query=' + encoded;
      // Search is a direct user action; no third-party scripts or permissions.
      window.open(target, '_blank', 'noopener,noreferrer');
      const summary = document.createElement('p');
      summary.textContent = 'Opened ' + searchProvider.selectedOptions[0].text + ' results in a new tab.';
      searchResults.appendChild(summary);
    });

    // Use WrestleTube's real Xaekai cinema toggle whenever its layout module
    // is installed. If it is not loaded on this channel, supply an equivalent
    // split-screen cinema mode instead of merely dimming the chat.
    const cinemaWidthKey = 'baked-wwf-cinema-width:' + location.pathname.toLowerCase();
    let cinemaWidth = 20;
    try {
      const stored = Number(localStorage.getItem(cinemaWidthKey));
      if (Number.isFinite(stored) && stored >= 15 && stored <= 32) cinemaWidth = Math.round(stored);
    } catch (_) { /* storage optional */ }
    const cinemaControls = document.createElement('div');
    cinemaControls.id = 'wwf-cinema-fallback-controls';
    cinemaControls.setAttribute('aria-label', 'Cinema mode controls');
    cinemaControls.innerHTML = '<button type="button" data-wwf-cinema="decrease" title="Narrower cinema chat" aria-label="Narrower cinema chat">−</button>' +
      '<button type="button" data-wwf-cinema="increase" title="Wider cinema chat" aria-label="Wider cinema chat">+</button>' +
      '<button type="button" data-wwf-cinema="exit" title="Exit cinema mode" aria-label="Exit cinema mode">✕ EXIT CINEMA</button>';
    document.body.appendChild(cinemaControls);
    function updateCinemaUI() {
      const on = document.body.classList.contains('cinemachat');
      const ctl = button('focus');
      ctl.textContent = on ? '▣ EXIT CINEMA' : '▣ CINEMA';
      ctl.setAttribute('aria-pressed', String(on));
    }
    function updateCinemaWidth(next) {
      cinemaWidth = Math.max(15, Math.min(32, next));
      document.body.style.setProperty('--wwf-cinema-chat-width', cinemaWidth + 'vw');
      try { localStorage.setItem(cinemaWidthKey, String(cinemaWidth)); } catch (_) { /* optional */ }
    }
    function setFallbackCinema(on) {
      document.body.classList.toggle('wwf-cinema-fallback', on);
      document.body.classList.toggle('cinemachat', on);
      if (typeof window.handleWindowResize === 'function') {
        try { window.handleWindowResize(); } catch (_) { /* layout helper optional */ }
      }
      updateCinemaUI();
    }
    updateCinemaWidth(cinemaWidth);
    cinemaControls.addEventListener('click', event => {
      const action = event.target.closest('[data-wwf-cinema]')?.getAttribute('data-wwf-cinema');
      if (action === 'exit') setFallbackCinema(false);
      else if (action === 'increase') updateCinemaWidth(cinemaWidth + 1);
      else if (action === 'decrease') updateCinemaWidth(cinemaWidth - 1);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('wwf-cinema-fallback')) setFallbackCinema(false);
    });
    const cinemaObserver = new MutationObserver(() => {
      if (!document.body.classList.contains('cinemachat')) {
        document.body.classList.remove('wwf-cinema-fallback');
      }
      updateCinemaUI();
    });
    cinemaObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    updateCinemaUI();

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
    button('focus').addEventListener('click', () => {
      if (document.body.classList.contains('wwf-cinema-fallback')) {
        setFallbackCinema(false);
        return;
      }
      const nativeToggle = document.querySelector('#cinematoggle');
      if (nativeToggle && nativeToggle !== button('focus')) {
        nativeToggle.click();
        updateCinemaUI();
        return;
      }
      setFallbackCinema(!document.body.classList.contains('cinemachat'));
    });
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