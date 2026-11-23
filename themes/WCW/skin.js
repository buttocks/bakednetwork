/* WCW Tube v1.1: original WrestleTube/Xaekai channel engine, WCW styling only. */
(function(w,d){
 if(!/^\/(tv|r)\//i.test(w.location.pathname)||w.__wcwTubeRunning)return;
 w.__wcwTubeRunning=true;
 function mount(){
   if(!w.jQuery||!w.CLIENT||!w.CHANNEL||!w.USEROPTS||!d.querySelector('nav.navbar')||!d.getElementById('chatwrap')||!d.getElementById('videocontrols'))return false;
   w.__wcwCinemaCss="/* Cinema Chat Mode */\nbody.cinemachat #motdwrap     { display: none; }\nbody.cinemachat #queue        { display: none; }\nbody.cinemachat #footer       { display: none; }\nbody.cinemachat #currenttitle { display: none; }\nbody.cinemachat .toggle-label { display: none; }\nbody.cinemachat .dropLabel    { display: none; }\nbody.cinemachat #videowrap-header { display: none; }\n\n#cinemasizeinc,\n#cinemasizedec,\n#cinematoggle {\n    position: fixed !important;\n    top: 0 !important;\n    font-size: 16px !important;\n    padding: 1px 5px !important;\n    border: 2px solid rgba(255,255,255,0.5) !important;\n    z-index:3000;\n    cursor:pointer;\n}\n\n#cinematoggle  { right: 2px; }\n#cinemasizeinc { right: 31px; }\n#cinemasizedec { right: 60px; }\n\nbody.cinemachat #cinematoggle {\n    text-shadow: 0 0 3px white;\n}\n\nbody.cinemachat.synchtube #cinematoggle {\n    right: calc(%WIDTH% + 2px);\n}\n\nbody.cinemachat #chatwrap {\n    position:fixed !important;\n    top:0 !important;\n    padding:0px !important;\n    width: %WIDTH% !important;\n    height:100% !important;\n    z-index:3001 !important;\n    background-color:#222222 !important;\n}\nbody.cinemachat:not(.synchtube) #chatwrap { left:0 !important; }\nbody.cinemachat.synchtube #chatwrap { right:0 !important; }\n\nbody.cinemachat #chatwrap #messagebuffer,\nbody.cinemachat #chatwrap #userlist {\n    height: calc(100% - 59px) !important;\n}\n\nbody.cinemachat #chatline {\n    width:calc(100% - 1px) !important;\n    position: relative !important;\n}\nbody.cinemachat:not(.synchtube) #chatline { left: 0px !important; }\nbody.cinemachat.synchtube #chatline { right: 0px !important; }\n\n\n\nbody.cinemachat #videowrap .embed-responsive {\n    height:100% !important;\n    width: 100% !important;\n    top: 0 !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap .embed-responsive { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap .embed-responsive { left: 0 !important; }\n\nbody.cinemachat #videowrap {\n    position: fixed !important;\n    top: 0 !important;\n    padding:0 !important;\n    z-index: 3000 !important;\n    background-color:black;\n    height:100% !important;\n    width: calc(100% - %WIDTH%) !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap { left: 0 !important; }\n\n\nbody.cinemachat #pmbar {\n    width: calc(100% - %WIDTH%) !important;\n    bottom: 42px;\n}\nbody.cinemachat:not(.synchtube) #pmbar { left: %WIDTH%; }\n\n\n\n\nbody.cinemachat #pmbar .panel-heading {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat #pmbar .panel {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat .pm-panel:hover {\n    border-color: #bbb;\n}\nbody.cinemachat #pmbar .panel:hover {\n    opacity: 0.9;\n    background-color: rgba(0,0,0,0.77);\n}\n\n/* Active poll atop the video  */\nbody.cinemachat #pollwrap div.active:not(.dismissed) {\n    position:fixed !important;\n    top:  12px !important;\n    z-index:9999 !important;\n    min-width: 400px;\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.77);\n}\n\nbody.cinemachat:not(.synchtube) #pollwrap div.active:not(.dismissed) {\n    left: calc(%WIDTH% + 32px) !important;\n}\nbody.cinemachat.synchtube #pollwrap div.active:not(.dismissed) {\n    left: 32px !important;\n}\n\nbody:not(.cinemachat) #pollwrap .dismiss {\n    display: none;\n}\n\nbody.cinemachat.cinema-nopoll #pollwrap {\n    display: none!important;\n}\n";
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
if(!this[CHANNEL.name].branding)this[CHANNEL.name].branding=$(".navbar-brand").html('<b class="wcw-navbar-logo">WCW</b>').css({"background-image":"none","min-width":"88px"});
if(!this[CHANNEL.name].favicon)this[CHANNEL.name].favicon=$('<link>').attr({rel:'shortcut icon',type:'image/svg+xml',href:'https://upload.wikimedia.org/wikipedia/commons/3/3a/WCW_%281988-1999%29_Logo.svg'}).appendTo('head');
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
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{collapse:true,inlineBlame:true,moveReporting:true,quickQuality:false,recentMedia:true,simpleLeader:true,syncCheck:true,thumbnails:true,timeEstimates:true,volumeControl:false},chatext:{persistIgnore:true,smartScroll:true,maxMessages:120},userlist:{autoHider:true},various:{notepad:true,emoteToggle:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_designator.min.js",done:true},playlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatext.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatcolor.min.js",done:true},colormap:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_unimoji.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@fa274637b3506aeee2b3bd7fb3fef4aa55cf619b/themes/WCW/legacy-layout.js",done:true},various:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


/*
 ** Navbar Autohider
 */
USEROPTS.sort_rank = 1;
USEROPTS.sort_afk = 1;
USEROPTS.qbtn_hide = "true";

$(".server-msg-reconnect").text("Welcome to WCW Tube! Keep the playlist wrestling-related.");
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
   const nav=d.querySelector('nav.navbar');
   if(!d.getElementById('wcw-banner')){
     const banner=d.createElement('div');
     banner.id='wcw-banner';
     banner.innerHTML="<img class=\"wcw-mark\" src=\"https://upload.wikimedia.org/wikipedia/commons/3/3a/WCW_%281988-1999%29_Logo.svg\" alt=\"WCW\" decoding=\"async\"><div class=\"wcw-broadcast-text\"><strong>WORLD CHAMPIONSHIP WRESTLING</strong><small>MONDAY NITRO · THUNDER · SATURDAY NIGHT</small></div><img class=\"wcw-watermark\" src=\"https://upload.wikimedia.org/wikipedia/commons/8/82/WCW_%281999-2001%29_Logo.svg\" alt=\"\" decoding=\"async\" loading=\"lazy\">";
     nav.insertAdjacentElement('afterend',banner);
     // Baked's fixed navbar occupies the top of the viewport but may not
     // reserve document flow space. If it overlaps the banner, add precisely
     // the missing space. Never touch native layout, cinema, or scroll state.
     function clearNavbarOverlap(){
       if(!banner.isConnected || !nav.isConnected)return;
       const bar=nav.getBoundingClientRect();
       const box=banner.getBoundingClientRect();
       const horizontalOverlap=bar.left<box.right && bar.right>box.left;
       if(!horizontalOverlap || bar.bottom<=box.top+2 || bar.top>=box.bottom)return;
       // Reserve the navbar height on first render. Account for any existing
       // margin so applying the fix twice never accumulates empty space.
       const current=parseFloat(w.getComputedStyle(banner).marginTop)||7;
       const gap=Math.ceil(bar.bottom-box.top+9);
       if(gap>0){
         banner.style.setProperty('margin-top',(current+gap)+'px');
       }
     }
     w.requestAnimationFrame(clearNavbarOverlap);
     w.setTimeout(clearNavbarOverlap,350);
   }
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
