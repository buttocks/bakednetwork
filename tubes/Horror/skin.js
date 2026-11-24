/* Horror Tube v1.0: original WrestleTube engine with themed filter guide. */
(function(w,d){
 if(!/^\/(tv|r)\//i.test(w.location.pathname)||w.__horrorTubeRunning)return;
 w.__horrorTubeRunning=true;

 const effects=[{"trigger":":horrortube:","title":"HORROR TUBE","description":"The room's own late-night broadcast title","tone":"title","insert":":horrortube: "},{"trigger":":slasher:","title":"SLASHER SEASON","description":"A blood-red slasher movie title","tone":"blood","insert":":slasher: "},{"trigger":":finalgirl:","title":"FINAL GIRL","description":"Survivor badge","tone":"silver","insert":":finalgirl: "},{"trigger":":bloodmoon:","title":"BLOOD MOON","description":"Crimson moon warning","tone":"blood","insert":":bloodmoon: "},{"trigger":":possessed:","title":"POSSESSED","description":"Haunted purple lettering","tone":"ghost","insert":":possessed: "},{"trigger":":creepy:","title":"SOMETHING IS WRONG","description":"A creepy alert","tone":"ghost","insert":":creepy: "},{"trigger":":jumpscare:","title":"JUMP SCARE!","description":"A sudden, bold jump-scare label (no flashing)","tone":"warning","insert":":jumpscare: "},{"trigger":":midnight:","title":"AFTER MIDNIGHT","description":"Midnight screening tag","tone":"silver","insert":":midnight: "},{"trigger":":vhs:","title":"● REC  VHS","description":"Retro found-tape badge","tone":"vhs","insert":":vhs: "},{"trigger":":haunted:","title":"HAUNTED","description":"Ghostly message label","tone":"ghost","insert":":haunted: "},{"trigger":":deadinside:","title":"DEAD INSIDE","description":"Cold, unsettling text","tone":"silver","insert":":deadinside: "},{"trigger":":vampire:","title":"VAMPIRE HOURS","description":"Blood-red vampire badge","tone":"blood","insert":":vampire: "},{"trigger":":zombie:","title":"THE UNDEAD","description":"Undead-green badge","tone":"toxic","insert":":zombie: "},{"trigger":":foundfootage:","title":"FOUND FOOTAGE","description":"Camcorder-style film tag","tone":"vhs","insert":":foundfootage: "},{"trigger":":itsalive:","title":"IT'S ALIVE!","description":"Mad-scientist announcement","tone":"toxic","insert":":itsalive: "},{"trigger":":dontlook:","title":"DON'T LOOK","description":"Ominous warning","tone":"warning","insert":":dontlook: "},{"trigger":":behindyou:","title":"BEHIND YOU","description":"Something is lurking behind you","tone":"warning","insert":":behindyou: "},{"trigger":":watchout:","title":"WATCH OUT","description":"A danger warning","tone":"warning","insert":":watchout: "},{"trigger":":redrum:","title":"REDRUM","description":"A reversed-message-inspired title","tone":"blood","insert":":redrum: "},{"trigger":":paranormal:","title":"PARANORMAL ACTIVITY","description":"Unexplained-activity tag","tone":"ghost","insert":":paranormal: "},{"trigger":":bodyhorror:","title":"BODY HORROR","description":"Visceral cinema badge","tone":"blood","insert":":bodyhorror: "},{"trigger":":screamqueen:","title":"SCREAM QUEEN","description":"Classic horror heroine title","tone":"silver","insert":":screamqueen: "},{"trigger":":survive:","title":"SURVIVOR","description":"Survival ribbon","tone":"toxic","insert":":survive: "},{"trigger":":ouija:","title":"OUIJA BOARD","description":"Old spirit-board lettering","tone":"ghost","insert":":ouija: "},{"trigger":":suspense:","title":"SUSPENSE","description":"Theatrical suspense title","tone":"silver","insert":":suspense: "},{"trigger":":theend:","title":"THE END...?","description":"An ominous end card","tone":"vhs","insert":":theend: "},{"trigger":"[hwhisper]...[/hwhisper]","tag":"hwhisper","title":"WHISPER","description":"Subtle whispering text","style":"whisper","insert":"[hwhisper]your text[/hwhisper]"},{"trigger":"[hglitch]...[/hglitch]","tag":"hglitch","title":"GLITCH","description":"Unsettling glitch-styled text","style":"glitch","insert":"[hglitch]your text[/hglitch]"},{"trigger":"[hblood]...[/hblood]","tag":"hblood","title":"BLOOD LETTERS","description":"A blood-red message","style":"blood","insert":"[hblood]your text[/hblood]"},{"trigger":"[hstatic]...[/hstatic]","tag":"hstatic","title":"STATIC","description":"TV static lettering","style":"static","insert":"[hstatic]your text[/hstatic]"},{"trigger":"[hspoiler]...[/hspoiler]","tag":"hspoiler","title":"HIDDEN SPOILER","description":"Blurred text that reveals on hover/focus","style":"spoiler","insert":"[hspoiler]your text[/hspoiler]"},{"trigger":"[hnight]...[/hnight]","tag":"hnight","title":"NIGHT VISION","description":"Green night-vision message","style":"night","insert":"[hnight]your text[/hnight]"}];
 function mountHorrorUi(){
  const nav=d.querySelector('nav.navbar');
  if(!nav)return;
  if(!d.getElementById('horror-banner')){
   const banner=d.createElement('section');
   banner.id='horror-banner';
   banner.setAttribute('aria-label','Horror Tube midnight cinema');
   banner.innerHTML='<div class="horror-banner-identity"><span class="horror-overline">THE MIDNIGHT FEATURE</span><strong>HORROR <em>TUBE</em></strong><small>ENTER IF YOU DARE · NO REFUNDS AFTER DARK</small></div><div class="horror-banner-side" aria-hidden="true"><span class="horror-moon"></span><b>THE LATE SHOW</b></div>';
   nav.insertAdjacentElement('afterend',banner);
   const align=()=>{
    if(!nav.isConnected||!banner.isConnected)return;
    const n=nav.getBoundingClientRect(),b=banner.getBoundingClientRect();
    if(n.bottom>b.top+2&&n.top<b.bottom&&n.left<b.right&&n.right>b.left){
     banner.style.marginTop=((parseFloat(w.getComputedStyle(banner).marginTop)||8)+Math.ceil(n.bottom-b.top+8))+'px';
    }
   };
   w.requestAnimationFrame(align);w.setTimeout(align,330);
  }
  if(d.getElementById('horror-effects-nav'))return;
  const list=nav.querySelector('ul.navbar-nav')||nav.querySelector('ul.nav');
  if(!list)return;
  const li=d.createElement('li');li.id='horror-effects-nav';
  const toggle=d.createElement('button');
  toggle.id='horror-effects-toggle';toggle.type='button';
  toggle.textContent='☾ HORROR EFFECTS ▾';
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','horror-effects-dropdown');
  const panel=d.createElement('div');panel.id='horror-effects-dropdown';panel.hidden=true;
  const intro=d.createElement('p');intro.className='horror-menu-intro';
  intro.textContent='Click an effect to insert its trigger in chat. Filters must be installed by the channel admin.';
  panel.appendChild(intro);
  effects.forEach((effect,i)=>{
   if(i===0||i===26){
    const header=d.createElement('div');header.className='horror-menu-heading';
    header.textContent=i===0?'HORROR STAMPS (26)':'TEXT EFFECTS (6)';
    panel.appendChild(header);
   }
   const button=d.createElement('button');button.type='button';button.className='horror-effect-option';
   button.dataset.insert=effect.insert;button.dataset.wrap=effect.tag||'';
   const code=d.createElement('code');code.textContent=effect.trigger;
   const meta=d.createElement('span');meta.className='horror-option-meta';
   const title=d.createElement('strong');title.textContent=effect.title;
   const desc=d.createElement('small');desc.textContent=effect.description;
   meta.appendChild(title);meta.appendChild(desc);
   button.appendChild(code);button.appendChild(meta);panel.appendChild(button);
  });
  li.appendChild(toggle);li.appendChild(panel);list.appendChild(li);
  function open(show){panel.hidden=!show;toggle.setAttribute('aria-expanded',String(show));}
  toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(panel.hidden);});
  d.addEventListener('click',e=>{if(!li.contains(e.target))open(false);});
  d.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){open(false);toggle.focus();}});
  panel.addEventListener('click',e=>{
   const btn=e.target.closest('button[data-insert]');
   if(!btn||!panel.contains(btn))return;
   e.preventDefault();
   const chat=d.getElementById('chatline');if(!chat)return;
   const start=typeof chat.selectionStart==='number'?chat.selectionStart:chat.value.length;
   const end=typeof chat.selectionEnd==='number'?chat.selectionEnd:start;
   const selected=chat.value.slice(start,end),tag=btn.dataset.wrap;
   const content=tag&&selected?'['+tag+']'+selected+'[/'+tag+']':btn.dataset.insert;
   const lead=start>0&&chat.value[start-1]&&!/\s/.test(chat.value[start-1])?' ':'';
   const text=lead+content+(tag?'':' ');
   if(typeof chat.setRangeText==='function')chat.setRangeText(text,start,end,'end');
   else chat.value=chat.value.slice(0,start)+text+chat.value.slice(end);
   chat.dispatchEvent(new Event('input',{bubbles:true}));chat.focus();open(false);
  });
 }

 function mount(){
   if(!w.jQuery||!w.CLIENT||!w.CHANNEL||!w.USEROPTS||!d.querySelector('nav.navbar')||!d.getElementById('chatwrap')||!d.getElementById('videocontrols'))return false;
   w.__horrorCinemaCss="/* Cinema Chat Mode */\nbody.cinemachat #motdwrap     { display: none; }\nbody.cinemachat #queue        { display: none; }\nbody.cinemachat #footer       { display: none; }\nbody.cinemachat #currenttitle { display: none; }\nbody.cinemachat .toggle-label { display: none; }\nbody.cinemachat .dropLabel    { display: none; }\nbody.cinemachat #videowrap-header { display: none; }\n\n#cinemasizeinc,\n#cinemasizedec,\n#cinematoggle {\n    position: fixed !important;\n    top: 0 !important;\n    font-size: 16px !important;\n    padding: 1px 5px !important;\n    border: 2px solid rgba(255,255,255,0.5) !important;\n    z-index:3000;\n    cursor:pointer;\n}\n\n#cinematoggle  { right: 2px; }\n#cinemasizeinc { right: 31px; }\n#cinemasizedec { right: 60px; }\n\nbody.cinemachat #cinematoggle {\n    text-shadow: 0 0 3px white;\n}\n\nbody.cinemachat.synchtube #cinematoggle {\n    right: calc(%WIDTH% + 2px);\n}\n\nbody.cinemachat #chatwrap {\n    position:fixed !important;\n    top:0 !important;\n    padding:0px !important;\n    width: %WIDTH% !important;\n    height:100% !important;\n    z-index:3001 !important;\n    background-color:#222222 !important;\n}\nbody.cinemachat:not(.synchtube) #chatwrap { left:0 !important; }\nbody.cinemachat.synchtube #chatwrap { right:0 !important; }\n\nbody.cinemachat #chatwrap #messagebuffer,\nbody.cinemachat #chatwrap #userlist {\n    height: calc(100% - 59px) !important;\n}\n\nbody.cinemachat #chatline {\n    width:calc(100% - 1px) !important;\n    position: relative !important;\n}\nbody.cinemachat:not(.synchtube) #chatline { left: 0px !important; }\nbody.cinemachat.synchtube #chatline { right: 0px !important; }\n\n\n\nbody.cinemachat #videowrap .embed-responsive {\n    height:100% !important;\n    width: 100% !important;\n    top: 0 !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap .embed-responsive { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap .embed-responsive { left: 0 !important; }\n\nbody.cinemachat #videowrap {\n    position: fixed !important;\n    top: 0 !important;\n    padding:0 !important;\n    z-index: 3000 !important;\n    background-color:black;\n    height:100% !important;\n    width: calc(100% - %WIDTH%) !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap { left: 0 !important; }\n\n\nbody.cinemachat #pmbar {\n    width: calc(100% - %WIDTH%) !important;\n    bottom: 42px;\n}\nbody.cinemachat:not(.synchtube) #pmbar { left: %WIDTH%; }\n\n\n\n\nbody.cinemachat #pmbar .panel-heading {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat #pmbar .panel {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat .pm-panel:hover {\n    border-color: #bbb;\n}\nbody.cinemachat #pmbar .panel:hover {\n    opacity: 0.9;\n    background-color: rgba(0,0,0,0.77);\n}\n\n/* Active poll atop the video  */\nbody.cinemachat #pollwrap div.active:not(.dismissed) {\n    position:fixed !important;\n    top:  12px !important;\n    z-index:9999 !important;\n    min-width: 400px;\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.77);\n}\n\nbody.cinemachat:not(.synchtube) #pollwrap div.active:not(.dismissed) {\n    left: calc(%WIDTH% + 32px) !important;\n}\nbody.cinemachat.synchtube #pollwrap div.active:not(.dismissed) {\n    left: 32px !important;\n}\n\nbody:not(.cinemachat) #pollwrap .dismiss {\n    display: none;\n}\n\nbody.cinemachat.cinema-nopoll #pollwrap {\n    display: none!important;\n}\n";
   (function(){
/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
if(!this[CHANNEL.name])this[CHANNEL.name]={};
if(!this[CHANNEL.name].branding)this[CHANNEL.name].branding=$(".navbar-brand").html('<b class="horror-nav-brand">HORROR <span>TUBE</span></b>').css({"background-image":"none","min-width":"155px"});
scrollbtn = $('<button id="scroll-btn" class="btn btn-sm btn-default" title="Scroll playlist to current item" />')
  .append('<span class="glyphicon glyphicon-hand-right" />')
  .prependTo("#videocontrols")
  .on("click", function() {
    scrollQueue();
  });

/*!
 **|   Xaekai's Sequenced Module Loader
 **|
**@preserve
*/
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{collapse:true,inlineBlame:true,moveReporting:true,quickQuality:false,recentMedia:true,simpleLeader:true,syncCheck:true,thumbnails:true,timeEstimates:true,volumeControl:false},chatext:{persistIgnore:true,smartScroll:true,maxMessages:120},userlist:{autoHider:true},various:{notepad:true,emoteToggle:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_designator.min.js",done:true},playlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatext.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatcolor.min.js",done:true},colormap:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_unimoji.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@813b531c8bc0625aa06bfbb2935e1e3c8938b866/themes/Horror/legacy-layout.js",done:true},various:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


/*
 ** Navbar Autohider
 */
USEROPTS.sort_rank = 1;
USEROPTS.sort_afk = 1;
USEROPTS.qbtn_hide = "true";

$(".server-msg-reconnect").text("Welcome to Horror Tube. Lights out, volume up.");
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
   }).call(w);
   mountHorrorUi();
   return true;
 }
 let attempts=0;
 function ready(){
   if(mount())return;
   if(++attempts<=48)w.setTimeout(ready,250);
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})(window,document);
