/* RetroWrestling + WrestleTube merged JavaScript v1.1
 * Includes classic WrestleTube enhancements, portable playlist tools, arena UI.
 * Host as External JavaScript; this exceeds the 20KB internal editor limit.
 * Do not simultaneously load RetroWrestling.js or PlaylistTools-Standalone.js.
 */

/* --- WrestleTube legacy channel enhancements --- */
/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
// Original WTTTV branding/favicon intentionally omitted for RetroWrestling.
// Preserve the current tube's own channel branding and favicon.
if (!document.getElementById("scroll-btn")) {
var scrollbtn = $('<button id="scroll-btn" class="btn btn-sm btn-default" title="Scroll playlist to current item" />')
  .append('<span class="glyphicon glyphicon-hand-right" />')
  .prependTo("#videocontrols")
  .on("click", function() {
    if (typeof scrollQueue === "function") scrollQueue();
  });
}

/*!
 **|   Xaekai's Sequenced Module Loader
 **|
**@preserve
*/
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{collapse:true,inlineBlame:true,moveReporting:true,quickQuality:false,recentMedia:true,simpleLeader:true,syncCheck:true,thumbnails:true,timeEstimates:true,volumeControl:false},chatext:{persistIgnore:true,smartScroll:true,maxMessages:120},userlist:{autoHider:true},various:{notepad:true,emoteToggle:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://resources.pink.horse/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://resources.pink.horse/js/module_designator.min.js",done:true},playlist:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatext.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatcolor.min.js",done:true},colormap:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_unimoji.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_layout.min.js",done:true},various:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://resources.pink.horse/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://resources.pink.horse/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://resources.pink.horse/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://resources.pink.horse/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://resources.pink.horse/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


/*
 ** Navbar Autohider
 */
$("#navbar-autohide").remove();
(function() {

    if ($("#navbar-autohide").length)
        return

    $("<style>")
        .prop("id", "navbar-autohide")
        .attr("type", "text/css")
        .appendTo("head")
        .text("\
\
@media screen and (min-width: 1024px){\
    nav.navbar:not(:hover) { opacity: 0.15; transition: opacity .5s ease-out;}\
    nav.navbar:hover { opacity: 1.00; transition: opacity .3s ease-out;}\
}\
\
");

})();


setInterval(function(){
    USEROPTS.sort_rank = 1;
    USEROPTS.sort_afk = 1;
    USEROPTS.layout = "fluid";
},1000);
USEROPTS.qbtn_hide = "true";

$("#showchansettings").text("Mod Menu");
$(".server-msg-reconnect").text("Welcome to WrestleTube! Please add wrestling related videos to the playlist!");
$(".server-msg-disconnect").text("Your Connection Is Bad!");
$("#showsearch").text("Search");
$("#showmediaurl").text("Add");
$("#clearplaylist").text("Clear");
$("#mediarefresh").text("Refresh Media");
$("#emotelistbtn").text("Macros");

/* click .channel-emote and append to chat input line */ 
$('#chatwrap').on('click', '.channel-emote', function(e) {
     e.preventDefault();

     var $emote = $(this);
     var $chatline = $('#chatline');

     $chatline.val($chatline.val() + $emote.attr('title') + ' ');
});

/* click .username and append to chat input line with a colon */ 
$('#messagebuffer').on('click', '.username', function(e) {
     e.preventDefault();

     var $username = $(this);
     var $chatline = $('#chatline');

     $chatline.val($chatline.val() + $username.text() + ' ');
});

/* --- Portable playlist manager --- */
/* Baked.live / CyTube Playlist Tools v1.0 — reusable, no external dependencies. */
(function () {
  'use strict';
  if (window.BakedPlaylistToolsV1) return;
  window.BakedPlaylistToolsV1 = true;
  if (!/\/(tv|r)\//i.test(location.pathname)) return;

  const KEY = 'bpt-protected:' + location.pathname.toLowerCase();
  const S = { open:false, selecting:false, selected:new Set(), busy:false, cancel:false, count:0, observer:null, seenQueue:null };
  try { S.count = Math.max(0, Math.min(9999, parseInt(localStorage.getItem(KEY) || '0', 10) || 0)); } catch (_e) {}
  const $ = s => document.querySelector(s);
  const all = s => Array.from(document.querySelectorAll(s));
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isPermitted = () => typeof window.hasPermission === 'function' &&
    !!window.hasPermission('playlistdelete') && !!window.hasPermission('seeplaylist');
  const sock = () => window.socket && typeof window.socket.emit === 'function' ? window.socket : null;
  const jq = () => window.jQuery || window.$;

  const style = document.createElement('style');
  style.id = 'bpt-styles';
  style.textContent = `
#bpt-root {position:fixed;z-index:2147481000;right:17px;bottom:18px;font:13px/1.4 system-ui,Segoe UI,sans-serif;color:#f1f2f7}
#bpt-root *{box-sizing:border-box}
#bpt-open{background:#242632;border:1px solid #cbb46b;color:#f7de89;border-radius:24px;padding:10px 15px;box-shadow:0 6px 24px #0008;font-weight:800;cursor:pointer}
#bpt-panel{width:min(390px,calc(100vw - 24px));max-height:min(690px,calc(100vh - 75px));overflow:auto;padding:16px;background:#171923;border:1px solid #cbb46b;border-radius:14px;box-shadow:0 14px 50px #000c;display:none}
#bpt-root.bpt-visible #bpt-panel{display:block} #bpt-root.bpt-visible #bpt-open{display:none}
#bpt-panel h3{font-size:16px;margin:0;color:#f6dc8b;letter-spacing:.03em}
#bpt-panel .bpt-sub{font-size:11px;color:#b9c0ce;margin:4px 0 12px}
#bpt-panel .bpt-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
#bpt-panel label{display:block;color:#d5d8e3;font-weight:600;margin:9px 0 4px}
#bpt-panel select,#bpt-panel input{width:100%;min-height:32px;border:1px solid #596071;border-radius:6px;background:#242736;color:#fff;padding:6px 8px}
#bpt-panel select:focus,#bpt-panel input:focus{outline:2px solid #cfb46b;outline-offset:1px}
#bpt-panel button{cursor:pointer;border:1px solid #666e80;border-radius:7px;background:#30384a;color:#fff;padding:7px 10px}
#bpt-panel button:hover:not(:disabled){background:#46536b} #bpt-panel button:disabled{opacity:.45;cursor:not-allowed}
#bpt-panel .bpt-buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
#bpt-panel .bpt-danger{background:#8d3036;border-color:#d76c69;font-weight:800}
#bpt-panel .bpt-danger:hover:not(:disabled){background:#ac4548}
#bpt-panel .bpt-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
#bpt-preview{font-size:12px;white-space:pre-wrap;margin:12px 0 0;padding:10px;background:#252837;border-radius:8px;color:#e4e6ec;max-height:130px;overflow:auto}
#bpt-status{font-size:12px;color:#ffe29a;min-height:17px;margin-top:9px}
#bpt-panel .bpt-small{font-size:11px;color:#9fa6b5;margin-top:8px}
#bpt-panel .bpt-x{background:transparent;border:0;font-size:19px;padding:0 5px;line-height:1}
#queue .bpt-check{display:inline-flex!important;align-items:center;vertical-align:middle;margin:0 6px 0 5px;cursor:pointer}
#queue .bpt-check input{appearance:auto!important;width:15px!important;height:15px!important;opacity:1!important;position:static!important;margin:0!important}
#queue .bpt-check input:disabled{cursor:not-allowed}
@media (max-width:540px){#bpt-root{right:8px;bottom:8px}}
`;
  (document.head || document.documentElement).appendChild(style);

  const root = document.createElement('div');
  root.id = 'bpt-root';
  root.innerHTML = `
    <button type="button" id="bpt-open" title="Playlist maintenance tools">☷ Playlist Tools</button>
    <section id="bpt-panel" role="dialog" aria-label="Playlist management tools">
      <div class="bpt-head"><h3>Playlist Tools</h3><button type="button" id="bpt-close" class="bpt-x" title="Close">×</button></div>
      <p class="bpt-sub">Reusable across Baked.live / CyTube channels · permission-aware</p>
      <label for="bpt-protect">Protect first N positions</label>
      <input id="bpt-protect" type="number" min="0" max="9999" value="0" />
      <label for="bpt-mode">Deletion method</label>
      <select id="bpt-mode">
        <option value="selected">Manually selected rows</option>
        <option value="last">Last N playlist entries</option>
        <option value="duplicates">Duplicates (keep first instance)</option>
        <option value="title">Title contains text</option>
        <option value="range">Position range</option>
        <option value="others">Everything except now playing</option>
      </select>
      <div id="bpt-n-wrap" hidden><label for="bpt-n">How many from the end?</label><input id="bpt-n" type="number" min="1" value="10" /></div>
      <div id="bpt-title-wrap" hidden><label for="bpt-title">Title search</label><input id="bpt-title" placeholder="Text in video title" /></div>
      <div id="bpt-range-wrap" hidden><div class="bpt-row"><div><label for="bpt-from">From position</label><input id="bpt-from" type="number" min="1" value="1" /></div><div><label for="bpt-to">To position</label><input id="bpt-to" type="number" min="1" value="20" /></div></div></div>
      <div class="bpt-buttons"><button type="button" id="bpt-select">Show row checkboxes</button><button type="button" id="bpt-all">Select eligible</button><button type="button" id="bpt-none">Clear selection</button></div>
      <pre id="bpt-preview" aria-live="polite"></pre>
      <div class="bpt-buttons"><button type="button" id="bpt-backup">Export playlist JSON</button><button type="button" id="bpt-delete" class="bpt-danger">Review & Delete</button><button type="button" id="bpt-cancel" hidden>Stop</button></div>
      <div id="bpt-status" aria-live="polite"></div>
      <p class="bpt-small">Currently playing and protected top entries are never deleted. Bulk deletes require confirmation; removal cannot be undone by this tool. Only use on channels you moderate.</p>
    </section>`;
  (document.body || document.documentElement).appendChild(root);
  const id = name => root.querySelector('#bpt-' + name);

  function getEntries() {
    const J = jq();
    return all('#queue .queue_entry').map((el, index) => {
      let uid = el.getAttribute('data-uid') || el.dataset.uid;
      let media = {};
      try { if (typeof J === 'function') { const d = J(el); uid = d.data('uid') ?? uid; media = d.data('media') || {}; } } catch (_e) {}
      const title = String(media.title || el.querySelector('.qe_title,.qe_title_text,.queue_title')?.textContent || el.textContent || '').trim().slice(0, 600);
      const active = el.classList.contains('queue_active') ||
        (window.PL_CURRENT != null && String(uid) === String(window.PL_CURRENT));
      return {el, pos:index+1, uid, media, title, active};
    });
  }
  function protectedEntry(entry) {
    return entry.pos <= S.count || entry.active || entry.uid === undefined || entry.uid === null || entry.uid === '';
  }
  function getTargets() {
    const entries = getEntries();
    const mode = id('mode').value;
    const eligible = entries.filter(e => !protectedEntry(e));
    if (mode === 'selected') return eligible.filter(e => S.selected.has(String(e.uid)));
    if (mode === 'last') {
      const n = Math.max(0, Math.min(entries.length, +id('n').value || 0));
      return entries.slice(-n).filter(e => !protectedEntry(e));
    }
    if (mode === 'title') {
      const term = id('title').value.toLowerCase().trim();
      return term ? eligible.filter(e => e.title.toLowerCase().includes(term)) : [];
    }
    if (mode === 'range') {
      const from = Math.max(1, +id('from').value || 0);
      const to = Math.max(from, +id('to').value || 0);
      return eligible.filter(e => e.pos >= from && e.pos <= to);
    }
    if (mode === 'duplicates') {
      const seen = new Set(), result = [];
      for (const e of entries) {
        const media = e.media || {};
        const key = media.id != null && media.type ? String(media.type) + ':' + String(media.id) : '';
        if (!key) continue;
        if (seen.has(key) && !protectedEntry(e)) result.push(e);
        else seen.add(key);
      }
      return result;
    }
    if (mode === 'others') {
      // Refuse this broad operation if there is no identifiable active entry.
      return entries.some(e => e.active) ? eligible : [];
    }
    return [];
  }
  function preview() {
    const entries = getEntries(), candidates = getTargets();
    const list = candidates.slice(0, 6).map(e => '  ' + e.pos + '. ' + (e.title || '(untitled)'));
    const message = [entries.length + ' total · ' + S.count + ' top entries protected · ' + candidates.length + ' to remove'];
    if (id('mode').value === 'others' && !entries.some(e => e.active)) message.push('No active video detected — cannot delete all other entries.');
    if (list.length) message.push(...list);
    if (candidates.length > 6) message.push('  … and ' + (candidates.length-6) + ' more');
    id('preview').textContent = message.join('\n');
    id('delete').disabled = S.busy || !isPermitted() || !sock() || !candidates.length;
    id('delete').title = !isPermitted() ? 'Requires playlist-delete permission in this channel' : '';
    id('select').textContent = S.selecting ? 'Hide row checkboxes' : 'Show row checkboxes';
  }
  function setupChecks() {
    getEntries().forEach(entry => {
      const el = entry.el;
      const J = jq(); let uid = el.getAttribute('data-uid') || el.dataset.uid;
      try { if (typeof J === 'function') uid = J(el).data('uid') ?? uid; } catch (_e) {}
      let tag = el.querySelector('.bpt-check');
      if (!S.selecting) { if (tag) tag.remove(); return; }
      if (!tag) {
        tag = document.createElement('label');
        tag.className = 'bpt-check'; tag.title = 'Select playlist row for removal';
        const check = document.createElement('input');
        check.type = 'checkbox'; check.setAttribute('aria-label', 'Select for deletion');
        check.addEventListener('click', e => e.stopPropagation());
        check.addEventListener('change', () => {
          const value = String(check.closest('.queue_entry')?.getAttribute('data-uid') || check.dataset.bptUid || '');
          if (check.checked) S.selected.add(value); else S.selected.delete(value);
          preview();
        });
        tag.appendChild(check);
        el.insertBefore(tag, el.firstChild);
      }
      const check = tag.querySelector('input');
      check.dataset.bptUid = String(uid ?? '');
      check.disabled = protectedEntry(entry);
      check.checked = !check.disabled && S.selected.has(String(uid));
    });
  }
  function update() { if (S.busy) return; if (S.selecting) setupChecks(); preview(); }
  function setMode() {
    const mode = id('mode').value;
    id('n-wrap').hidden = mode !== 'last';
    id('title-wrap').hidden = mode !== 'title';
    id('range-wrap').hidden = mode !== 'range';
    preview();
  }
  function status(text) { id('status').textContent = text; }
  function exportBackup() {
    const items = getEntries();
    const data = {
      format:'baked-playlist-snapshot-v1', channel:location.pathname, exportedAt:new Date().toISOString(),
      note:'Reference-only export; Baked Playlist Tools does not import/requeue automatically.',
      entries:items.map(e => ({position:e.pos, uid:e.uid, title:e.title, type:e.media.type||null,
        mediaId:e.media.id||null, duration:e.media.seconds||null, currentlyPlaying:e.active}))
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'baked-' + location.pathname.split('/').pop().replace(/[^a-z0-9_-]/ig,'_') + '-playlist-' + Date.now() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    status('Playlist export initiated (' + items.length + ' entries).');
  }
  async function deleteTargets() {
    if (S.busy) return;
    if (!isPermitted() || !sock()) { status('No permission or playlist connection.'); return; }
    const originalChannel = location.pathname;
    const selected = getTargets();
    if (!selected.length) return;
    const count = selected.length;
    if (!window.confirm('Remove ' + count + ' playlist entr' + (count===1?'y':'ies') + '?\nCurrently playing and the first ' + S.count + ' positions stay protected.\nThis cannot be undone.')) return;
    if (count >= 20 && window.prompt('For safety, type DELETE ' + count + ' to confirm:') !== 'DELETE ' + count) { status('Cancelled.'); return; }
    S.busy = true; S.cancel = false;
    id('cancel').hidden = false; id('delete').disabled = true;
    status('Starting removal requests…');
    const uids = [...new Set(selected.map(e => String(e.uid)))];
    let sent=0, skipped=0;
    try {
      for (const uid of uids) {
        if (S.cancel || location.pathname !== originalChannel || !isPermitted() || !sock()) break;
        const latest = getEntries().find(e => String(e.uid) === uid);
        // Re-evaluate position and current video immediately before each removal.
        if (!latest || protectedEntry(latest)) { skipped++; continue; }
        sock().emit('delete', latest.uid);
        sent++;
        status('Sent ' + sent + ' / ' + uids.length + ' removal requests' + (skipped ? ' (' + skipped + ' skipped)' : '') + '.');
        await pause(250);
      }
      await pause(700);
      const remains = uids.filter(uid => getEntries().some(e => String(e.uid) === uid)).length;
      status((S.cancel ? 'Stopped. ' : '') + sent + ' request(s) sent. ' + remains + ' targeted entries still visible; server permissions and queue updates determine actual removals.');
      S.selected.clear();
    } catch (error) { status('Stopped after ' + sent + ' requests: ' + String(error.message || error)); }
    finally { S.busy=false; id('cancel').hidden=true; update(); }
  }
  id('open').addEventListener('click', () => {root.classList.add('bpt-visible'); S.open=true; update();});
  id('close').addEventListener('click', () => {root.classList.remove('bpt-visible'); S.open=false;});
  id('mode').addEventListener('change', setMode);
  for (const field of ['n','title','from','to']) id(field).addEventListener('input', preview);
  id('protect').value = String(S.count);
  id('protect').addEventListener('change', () => {
    S.count = Math.max(0, Math.min(9999, parseInt(id('protect').value,10) || 0));
    id('protect').value=String(S.count);
    try {localStorage.setItem(KEY, String(S.count));} catch (_e) {}
    update();
  });
  id('select').addEventListener('click', () => { S.selecting=!S.selecting; setupChecks(); preview(); });
  id('all').addEventListener('click', () => {getEntries().filter(e=>!protectedEntry(e)).forEach(e=>S.selected.add(String(e.uid))); S.selecting=true; id('mode').value='selected'; setMode(); setupChecks(); preview();});
  id('none').addEventListener('click', () => {S.selected.clear(); setupChecks(); preview();});
  id('backup').addEventListener('click', exportBackup);
  id('delete').addEventListener('click', deleteTargets);
  id('cancel').addEventListener('click', () => {S.cancel=true; status('Stop requested — any already-sent deletes cannot be reversed.');});
  document.addEventListener('keydown', e => {if (e.key === 'Escape' && S.open) id('close').click();});
  function attachQueue() {
    const queue = $('#queue');
    if (!queue || queue === S.seenQueue) return;
    if (S.observer) S.observer.disconnect();
    S.seenQueue=queue;
    let timer;
    S.observer=new MutationObserver(() => {clearTimeout(timer);timer=setTimeout(update,180);});
    S.observer.observe(queue,{childList:true,subtree:true});
    update();
  }
  attachQueue();
  setInterval(() => {attachQueue();if (S.open && !S.busy) preview();}, 2500);
  setMode();
})();

/* --- RetroWrestling arena UI --- */
/* RetroWrestling arena UI v1.0. Add separate PlaylistTools-Standalone.js for management. */
(function () {
  'use strict';
  if (window.RetroWrestlingArenaV1) return;
  window.RetroWrestlingArenaV1 = true;
  if (!/\/tv\/RetroWrestling\/?$/i.test(location.pathname)) return;
  const header = document.createElement('section');
  header.id = 'rw-header';
  header.setAttribute('aria-label','RetroWrestling arena controls');
  header.innerHTML = `
  <div class="rw-headtop"><div><div class="rw-kicker">Baked.live presents · Ringside Network</div>
  <div class="rw-crown">★ RETRO WRESTLING ★</div><div class="rw-kicker">Classic matches · Vintage promos · Main event energy</div></div>
  <div class="rw-headright"><span class="rw-live"><span class="rw-dot"></span> ON AIR</span><div id="rw-viewers" style="margin-top:5px"></div></div></div>
  <div class="rw-now"><strong>NOW SHOWING</strong><span id="rw-song">Waiting for the next match card…</span></div>
  <div class="rw-controls"><a href="#videowrap" id="rw-watch">▣ Watch</a><a href="#chatwrap" id="rw-chat">✉ Chat</a>
  <a href="#queue" id="rw-queue">☷ Playlist</a><button id="rw-share" type="button">↗ Copy Channel Link</button>
  <button id="rw-bell" type="button">◉ Ring Bell</button><button id="rw-focus" type="button">◧ Focus</button>
  <button id="rw-lights" type="button">✦ Effects</button><button id="rw-tools" type="button">⚙ Playlist Tools</button></div>
  <div id="rw-ticker">WELCOME TO THE ARENA · CLASSIC WRESTLING · THE MAIN EVENT STARTS HERE</div>`;
  document.body.insertBefore(header,document.body.firstChild);
  const button = name => header.querySelector('#rw-'+name);
  let muted=false,focus=false;
  try {muted=localStorage.getItem('rw-effects-disabled')==='yes';}catch(_e){}
  document.body.classList.toggle('rw-lights-off',muted);
  button('lights').textContent=muted?'✦ Effects Off':'✦ Effects On';
  button('lights').addEventListener('click',()=>{
    muted=!muted; document.body.classList.toggle('rw-lights-off',muted);
    button('lights').textContent=muted?'✦ Effects Off':'✦ Effects On';
    try{localStorage.setItem('rw-effects-disabled',muted?'yes':'no');}catch(_e){}
  });
  button('focus').addEventListener('click',()=>{focus=!focus;document.body.classList.toggle('rw-focus',focus);button('focus').textContent=focus?'◧ Exit Focus':'◧ Focus';});
  button('share').addEventListener('click',async()=>{
    const link=location.origin+location.pathname;
    try{await navigator.clipboard.writeText(link);button('share').textContent='✓ Link Copied';}
    catch(_e){window.prompt('Copy channel link:',link);button('share').textContent='↗ Copy Channel Link';}
    setTimeout(()=>button('share').textContent='↗ Copy Channel Link',2300);
  });
  button('tools').addEventListener('click',()=>{
    const open=document.querySelector('#bpt-open'),panel=document.querySelector('#bpt-panel');
    if (open && open.offsetParent!==null) open.click();
    else if(panel){document.querySelector('#bpt-root')?.classList.add('bpt-visible');}
    else alert('Playlist Tools not installed. Add PlaylistTools-Standalone.js or use the combined JavaScript file.');
  });
  button('bell').addEventListener('click',()=>{
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      const a=new Audio(), t=a.currentTime;
      [480,610,790].forEach((freq,index)=>{
        const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07/(index+1),t+.015);
        g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+1.7);
      });setTimeout(()=>a.close().catch(()=>{}),2000);
    }catch(_e){}
  });
  const slogans=['MAIN EVENT ENERGY • EVERY NIGHT','FROM THE TERRITORIES TO THE BIG ARENA',
    'THE BELL RINGS • THE CROWD ROARS','OLD-SCHOOL WRESTLING • NO COMMERCIAL BREAKS'];
  let ticker=0, last='';
  function update(){
    let text=document.querySelector('#currenttitle')?.textContent?.trim()||'';
    if(!text || /nothing playing/i.test(text)){
      text=document.querySelector('#queue .queue_active .qe_title')?.textContent?.trim()||'';
    }
    text=text.replace(/^currently playing\s*:?\s*/i,'').trim();
    text=text||'Waiting for the next match card…';
    button('song').textContent=text;
    last=text;
    const usercount=document.querySelector('#usercount')?.textContent?.trim();
    button('viewers').textContent=usercount ? usercount+' ringside' : 'RINGSIDE TV';
  }
  update();setInterval(update,3000);
  setInterval(()=>{button('ticker').textContent=slogans[ticker++%slogans.length]+' · '+last.toUpperCase().slice(0,110);},9000);
})();
