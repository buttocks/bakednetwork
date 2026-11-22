/* WWF / WWE v2.2 — WrestleTube engine port, adapted for this channel.
 * Original Xaekai module loader and chat/playlist implementations preserved.
 */
(function(win,doc){
 if(!(win.location.pathname.startsWith('/tv/')||win.location.pathname.startsWith('/r/')))return;
 if(win.__wwfWweEnginePortStarted)return;
 win.__wwfWweEnginePortStarted=true;
 const eraKey='wwf-wwe-era:'+win.location.pathname.toLowerCase();
 const logosKey='wwf-wwe-logos:'+win.location.pathname.toLowerCase();
 const eras={"wwwf":{"label":"WWWF · CLASSIC","years":"1963–1979"},"golden":{"label":"WWF · GOLDEN","years":"1982–1993"},"newgen":{"label":"WWF · NEW GENERATION","years":"1993–1997"},"attitude":{"label":"WWF · ATTITUDE","years":"1997–2002"},"modern":{"label":"WWE · MODERN","years":"2002–NOW"}};
 function mountEra(){
  if(doc.getElementById('wwf-era-picker'))return;
  const nav=doc.querySelector('nav.navbar');if(!nav)return;
  const item=doc.createElement('li');item.id='wwf-era-picker';
  item.innerHTML='<label for="wwf-era-select">ERA</label><select id="wwf-era-select" aria-label="Wrestling era theme"><option value="wwwf">WWWF · CLASSIC</option><option value="golden">WWF · GOLDEN</option><option value="newgen">WWF · NEW GENERATION</option><option value="attitude">WWF · ATTITUDE</option><option value="modern">WWE · MODERN</option></select><button type="button" id="wwf-logo-switch" title="Toggle background logos">★ LOGOS</button>';
  const navList=nav.querySelector('ul.navbar-nav')||nav.querySelector('ul.nav');
  if(navList)navList.appendChild(item);else nav.appendChild(item);
  const strip=doc.createElement('div');strip.id='wwf-era-strip';
  strip.innerHTML="\n<section class=\"wwf-restored-hero\" aria-label=\"WWF and WWE Ringside broadcast\">\n  <div class=\"wwf-restored-marks\" aria-hidden=\"true\">\n    <img class=\"wwf-restored-mark-classic\" src=\"https://upload.wikimedia.org/wikipedia/commons/6/68/World_Wrestling_Federation_block_logo.svg\" alt=\"\" decoding=\"async\">\n    <img class=\"wwf-restored-mark-modern\" src=\"https://upload.wikimedia.org/wikipedia/commons/d/df/WWE_white_logo.svg\" alt=\"\" decoding=\"async\">\n  </div>\n  <div class=\"wwf-restored-identity\">\n    <div class=\"wwf-restored-overline\">BAKED.LIVE // RINGSIDE BROADCAST</div>\n    <div class=\"wwf-restored-brand\"><span class=\"wwf-restored-wwf\">WWF</span><span class=\"wwf-restored-slash\">/</span><span class=\"wwf-restored-wwe\">WWE</span><span class=\"wwf-restored-tv\">TV</span></div>\n    <div class=\"wwf-restored-tagline\">THE GOLDEN ERA. THE ATTITUDE ERA. THE NEW ERA.</div>\n  </div>\n  <div class=\"wwf-restored-onair\" role=\"status\"><span class=\"wwf-live-dot\"></span><span id=\"wwf-live-state\">STANDBY</span><small id=\"wwf-live-users\">RINGSIDE</small></div>\n</section>\n<div class=\"wwf-restored-now\"><strong>NOW SHOWING</strong><span id=\"wwf-restored-track\">The next main event is being lined up…</span></div>\n<div class=\"wwf-restored-wire\"><strong>RINGSIDE WIRE</strong><span>THEN · NOW · FOREVER · TOGETHER</span><b id=\"wwf-era-title\">WWF · ATTITUDE</b><small id=\"wwf-era-years\">1997–2002</small></div>\n<div class=\"wwf-logo-gallery\" aria-label=\"WWWF WWF and WWE logo eras\"><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"wwwf\" aria-pressed=\"false\" title=\"Show WWWF 1963 theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wide-Wrestling-Federation-WWWF-Logo-1963-1971.png\" loading=\"eager\" decoding=\"async\" alt=\"Original WWWF 1963 logo\"></span><span class=\"wwf-era-card-name\">WWWF 1963</span><small>EARLY YEARS</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"wwwf\" aria-pressed=\"false\" title=\"Show WWWF 1971 theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wide-Wrestling-Federation-WWWF-Logo-1971-1979.png\" loading=\"eager\" decoding=\"async\" alt=\"WWWF 1971 globe logo\"></span><span class=\"wwf-era-card-name\">WWWF 1971</span><small>THE GLOBE</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"golden\" aria-pressed=\"false\" title=\"Show WWF GOLDEN theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wrestling-Federation-WWF-Logo-1985-1998-3D.png\" loading=\"eager\" decoding=\"async\" alt=\"Classic 1980s WWF gold blue 3D logo\"></span><span class=\"wwf-era-card-name\">WWF GOLDEN</span><small>1980s CLASSICS</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"newgen\" aria-pressed=\"false\" title=\"Show NEW GENERATION theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://upload.wikimedia.org/wikipedia/commons/7/7f/WWF_New_Gen_Logo.svg\" loading=\"eager\" decoding=\"async\" alt=\"WWF New Generation logo\"></span><span class=\"wwf-era-card-name\">NEW GENERATION</span><small>1993–1997</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"attitude\" aria-pressed=\"false\" title=\"Show ATTITUDE ERA theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://prowrestlingstories.com/wp-content/uploads/2019/09/WWF-Attitude-Era-Scratch-Logo.jpg\" loading=\"eager\" decoding=\"async\" alt=\"WWF Attitude Era scratch logo\"></span><span class=\"wwf-era-card-name\">ATTITUDE ERA</span><small>1997–2002</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"modern\" aria-pressed=\"false\" title=\"Show WWE MODERN theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWE</span><img src=\"https://upload.wikimedia.org/wikipedia/commons/d/df/WWE_white_logo.svg\" loading=\"eager\" decoding=\"async\" alt=\"Modern white WWE logo\"></span><span class=\"wwf-era-card-name\">WWE MODERN</span><small>2002–NOW</small></button></div>";
  // Insert directly above Baked's main chat/player row. Background wallpaper
  // painted on body used to disappear behind opaque #wrap panels.
  const content=doc.getElementById('main') || doc.getElementById('mainpage') || doc.querySelector('#chatwrap')?.parentElement;
  if(content && content.parentNode) content.parentNode.insertBefore(strip,content);
  else nav.insertAdjacentElement('afterend',strip);
  // Failed third-party images still show a readable era logo title.
  strip.querySelectorAll('.wwf-era-card img').forEach(img=>{
    img.addEventListener('error',()=>img.closest('.wwf-era-card')?.classList.add('wwf-logo-failed'),{once:true});
  });
  const choose=doc.getElementById('wwf-era-select'),logos=doc.getElementById('wwf-logo-switch');
  let era='attitude',visible=true;
  try{const stored=win.localStorage.getItem(eraKey);if(eras[stored])era=stored;visible=win.localStorage.getItem(logosKey)!=='off';}catch(_){}
  function applyEra(which){
   which=eras[which]?which:'attitude';doc.body.dataset.wwfEra=which;choose.value=which;
   doc.getElementById('wwf-era-title').textContent=eras[which].label;
   doc.getElementById('wwf-era-years').textContent=eras[which].years;
   strip.querySelectorAll('[data-wwf-card]').forEach(card=>{
     card.setAttribute('aria-pressed',String(card.dataset.wwfCard===which));
   });
   try{win.localStorage.setItem(eraKey,which);}catch(_){}
  }
  function applyLogos(on){
   doc.body.classList.toggle('wwf-logos-off',!on);
   logos.textContent=on?'★ LOGOS':'☆ LOGOS';logos.setAttribute('aria-pressed',String(on));
   try{win.localStorage.setItem(logosKey,on?'on':'off');}catch(_){}
  }
  choose.addEventListener('change',()=>applyEra(choose.value));
  strip.addEventListener('click',event=>{
   const card=event.target.closest('[data-wwf-card]');
   if(card && strip.contains(card))applyEra(card.dataset.wwfCard);
  });
  logos.addEventListener('click',()=>applyLogos(doc.body.classList.contains('wwf-logos-off')));
  applyEra(era);applyLogos(visible);
  // Update the restored original-style broadcast header without changing
  // the player, chat, or any Xaekai layout classes.
  function updateRingsideStatus(){
   if(!strip.isConnected)return false;
   const sources=[
    doc.getElementById('currenttitle')?.textContent,
    doc.querySelector('#queue .queue_entry.queue_active .qe_title')?.textContent,
    doc.querySelector('#queue .queue_active .qe_title')?.textContent
   ];
   const showing=sources.map(s=>(s||'').replace(/^\\s*(?:currently playing|now playing)\\s*:?\\s*/i,'').trim())
    .find(s=>s && !/^(?:no video|nothing playing|loading\\.{0,3})$/i.test(s))||'';
   const title=strip.querySelector('#wwf-restored-track');
   const state=strip.querySelector('#wwf-live-state');
   if(title && title.textContent!==(showing||'The next main event is being lined up…')){
    title.textContent=showing||'The next main event is being lined up…';
   }
   if(state)state.textContent=showing?'ON AIR':'STANDBY';
   strip.classList.toggle('wwf-is-live',!!showing);
   const counter=doc.getElementById('usercount')?.textContent?.trim();
   const viewers=strip.querySelector('#wwf-live-users');
   if(viewers)viewers.textContent=counter?counter+' RINGSIDE':'RINGSIDE';
   return true;
  }
  updateRingsideStatus();
  const ringsideTimer=win.setInterval(()=>{
   if(!updateRingsideStatus())win.clearInterval(ringsideTimer);
  },8000);
 }
 function mount(){
  if(!win.jQuery||!win.CHANNEL||!win.CLIENT||!win.USEROPTS||
     !doc.querySelector('nav.navbar')||!doc.querySelector('#chatwrap')||
     !doc.querySelector('#videocontrols'))return false;
  if(win.__wwfWweEnginePortMounted)return true;
  win.__wwfWweEnginePortMounted=true;
  win.__wwfWweCinemaCss="/* Cinema Chat Mode */\nbody.cinemachat #motdwrap     { display: none; }\nbody.cinemachat #queue        { display: none; }\nbody.cinemachat #footer       { display: none; }\nbody.cinemachat #currenttitle { display: none; }\nbody.cinemachat .toggle-label { display: none; }\nbody.cinemachat .dropLabel    { display: none; }\nbody.cinemachat #videowrap-header { display: none; }\n\n#cinemasizeinc,\n#cinemasizedec,\n#cinematoggle {\n    position: fixed !important;\n    top: 0 !important;\n    font-size: 16px !important;\n    padding: 1px 5px !important;\n    border: 2px solid rgba(255,255,255,0.5) !important;\n    z-index:3000;\n    cursor:pointer;\n}\n\n#cinematoggle  { right: 2px; }\n#cinemasizeinc { right: 31px; }\n#cinemasizedec { right: 60px; }\n\nbody.cinemachat #cinematoggle {\n    text-shadow: 0 0 3px white;\n}\n\nbody.cinemachat.synchtube #cinematoggle {\n    right: calc(%WIDTH% + 2px);\n}\n\nbody.cinemachat #chatwrap {\n    position:fixed !important;\n    top:0 !important;\n    padding:0px !important;\n    width: %WIDTH% !important;\n    height:100% !important;\n    z-index:3001 !important;\n    background-color:#222222 !important;\n}\nbody.cinemachat:not(.synchtube) #chatwrap { left:0 !important; }\nbody.cinemachat.synchtube #chatwrap { right:0 !important; }\n\nbody.cinemachat #chatwrap #messagebuffer,\nbody.cinemachat #chatwrap #userlist {\n    height: calc(100% - 59px) !important;\n}\n\nbody.cinemachat #chatline {\n    width:calc(100% - 1px) !important;\n    position: relative !important;\n}\nbody.cinemachat:not(.synchtube) #chatline { left: 0px !important; }\nbody.cinemachat.synchtube #chatline { right: 0px !important; }\n\n\n\nbody.cinemachat #videowrap .embed-responsive {\n    height:100% !important;\n    width: 100% !important;\n    top: 0 !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap .embed-responsive { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap .embed-responsive { left: 0 !important; }\n\nbody.cinemachat #videowrap {\n    position: fixed !important;\n    top: 0 !important;\n    padding:0 !important;\n    z-index: 3000 !important;\n    background-color:black;\n    height:100% !important;\n    width: calc(100% - %WIDTH%) !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap { left: 0 !important; }\n\n\nbody.cinemachat #pmbar {\n    width: calc(100% - %WIDTH%) !important;\n    bottom: 42px;\n}\nbody.cinemachat:not(.synchtube) #pmbar { left: %WIDTH%; }\n\n\n\n\nbody.cinemachat #pmbar .panel-heading {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat #pmbar .panel {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat .pm-panel:hover {\n    border-color: #bbb;\n}\nbody.cinemachat #pmbar .panel:hover {\n    opacity: 0.9;\n    background-color: rgba(0,0,0,0.77);\n}\n\n/* Active poll atop the video  */\nbody.cinemachat #pollwrap div.active:not(.dismissed) {\n    position:fixed !important;\n    top:  12px !important;\n    z-index:9999 !important;\n    min-width: 400px;\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.77);\n}\n\nbody.cinemachat:not(.synchtube) #pollwrap div.active:not(.dismissed) {\n    left: calc(%WIDTH% + 32px) !important;\n}\nbody.cinemachat.synchtube #pollwrap div.active:not(.dismissed) {\n    left: 32px !important;\n}\n\nbody:not(.cinemachat) #pollwrap .dismiss {\n    display: none;\n}\n\nbody.cinemachat.cinema-nopoll #pollwrap {\n    display: none!important;\n}\n";
  (function(){
/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
// WWF/WWE branding only: all WrestleTube/Xaekai modules remain intact.
if (!this[CHANNEL.name]) this[CHANNEL.name]={};
$(".navbar-brand").css({"background-image":"none","min-width":"0"}).html('<strong class="wwf-nav-brand">WWF <span>/</span> WWE</strong>');
if (!document.getElementById('scroll-btn')) $('<button id="scroll-btn" class="btn btn-sm btn-default" title="Scroll playlist to current item" />')
  .append('<span class="glyphicon glyphicon-hand-right" />')
  .prependTo("#videocontrols")
  .on("click", function() {
    if(typeof scrollQueue==='function')scrollQueue(); else document.querySelector('#queue .queue_entry.queue_active')?.scrollIntoView({block:'center'});
  });

/*!
 **|   Xaekai's Sequenced Module Loader
 **|
**@preserve
*/
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{collapse:true,inlineBlame:true,moveReporting:true,quickQuality:false,recentMedia:true,simpleLeader:true,syncCheck:true,thumbnails:true,timeEstimates:true,volumeControl:false},chatext:{persistIgnore:true,smartScroll:true,maxMessages:120},userlist:{autoHider:true},various:{notepad:true,emoteToggle:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_designator.min.js",done:true},playlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatext.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatcolor.min.js",done:true},colormap:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_unimoji.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@dd49db59f589867f66742021ddcb81c7b160d40c/themes/WWE-WWF/legacy-layout.js",done:true},various:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


/*
 ** Navbar Autohider
 */
USEROPTS.sort_rank = 1;
USEROPTS.sort_afk = 1;
USEROPTS.qbtn_hide = "true";

$(".server-msg-reconnect").text("Welcome to WWF / WWE! Please add wrestling-related videos.");
$(".server-msg-disconnect").text("Your Connection Is Bad!");
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
  }).call(win);
  mountEra();
  return true;
 }
 let attempts=0;
 function boot(){
  if(mount())return;
  if(++attempts<=48)win.setTimeout(boot,250);
  else console.warn('[WWF/WWE] Channel controls unavailable; port did not start.');
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})(window,document);
