/* RetroWrestling + WrestleTube v1.3.2
 * Unified external JS, stable playlist tools and classic WrestleTube features.
 * Playlist and arena UI initialize before legacy modules.
 */
(function(){
'use strict';
if(!/\/tv\/RetroWrestling\/?$/i.test(location.pathname))return;
function boot(){
  if(window.RetroWrestlingMergedV13 || !document.body)return;
  window.RetroWrestlingMergedV13=true;
  document.documentElement.dataset.rwMergedVersion='1.3.2';

  // The channel might still have the old WrestleTube internal JS enabled.
  // Rewrite only its stale welcome notice, leaving real server status intact.
  const rwWelcome = 'Welcome to RetroWrestling! Enjoy the classics and add your favorite wrestling videos!';
  function correctOldWelcome() {
    document.querySelectorAll('.server-msg-reconnect').forEach(function(node){
      if (/welcome to wrestletube/i.test(node.textContent || '')) node.textContent = rwWelcome;
    });
  }
  correctOldWelcome();
  setInterval(correctOldWelcome, 3000);
  try{
/* Shared Playlist Tools — maintained independently of this skin. */
(function(){
 const script=document.createElement('script');
 script.src='https://buttocks.github.io/bakednetwork/tubes/shared/modules/PlaylistTools-Standalone.js?v=1.2';
 script.onerror=()=>console.error('[RetroWrestling] Playlist Tools failed to load');
 document.head.appendChild(script);
})();
/* RetroWrestling arena UI v1.0. Add separate PlaylistTools-Standalone.js for management. */
(function () {
  'use strict';
  if (window.RetroWrestlingArenaV1 && document.getElementById('rw-header')) return;
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
  <button id="rw-lights" type="button">✦ Effects</button></div>
  <div id="rw-ticker">WELCOME TO THE ARENA · CLASSIC WRESTLING · THE MAIN EVENT STARTS HERE</div>`;
  const navbar = document.querySelector('nav.navbar, .navbar');
  if (navbar) navbar.insertAdjacentElement('afterend', header);
  else document.body.insertBefore(header,document.body.firstChild);
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
  }catch(e){console.error('[RetroWrestling] Arena startup:',e);}
  setTimeout(function(){
    try{
      if (!window.CHANNEL?.name || !window.CLIENT)return;
      window[window.CHANNEL.name] = window[window.CHANNEL.name] || {};
/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
// Keep existing RetroWrestling channel branding and favicon.
if (!document.getElementById('scroll-btn')) { var scrollbtn = $('<button id="scroll-btn" class="btn btn-sm btn-default" title="Scroll playlist to current item" />')
  .append('<span class="glyphicon glyphicon-hand-right" />')
  .prependTo("#videocontrols")
  .on("click", function() {
    if (typeof scrollQueue === 'function') scrollQueue();
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


/* Respect user's saved Baked.live layout rather than forcing it every second. */
/* Keep playlist buttons visible. */

$("#showchansettings").text("Mod Menu");
$(".server-msg-reconnect").text("Welcome to RetroWrestling! Enjoy the classics and add your favorite wrestling videos!");
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
    }catch(e){console.error('[RetroWrestling] Legacy enhancement error:',e);}
  },200);
  console.info('[RetroWrestling] v1.3.2 loaded; playlist toolbar and arena initializing.');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
