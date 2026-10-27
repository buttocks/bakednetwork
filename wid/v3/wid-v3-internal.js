/*!
 **|  Baked.live Channel: WID V2.0 Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
if (!this[CHANNEL.name]) {
    this[CHANNEL.name] = {}
}
if (!this[CHANNEL.name].branding) {
    this[CHANNEL.name].branding = $(".navbar-brand").html("").css({
        "background-image": 'url("https://i.postimg.cc/fyPsnDQ6/chatlogo.png")',
        "background-size": "100%",
        "min-width": "35px",
        "background-repeat": "no-repeat",
        "background-position": "center center"
    })
}
if (!this[CHANNEL.name].favicon) {
    this[CHANNEL.name].favicon = $("<link/>").prop("id", "favicon").attr("rel", "shortcut icon").attr("type", "image/png").attr("sizes", "64x64").attr("href", "https://i.imgur.com/wIBpxF3.png").appendTo("head")
}
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
({options:{designator:{prefix:"wid-",delay:90*1e3},
playlist:{
collapse:true,
hidePlaylist:true,
inlineBlame:true,
moveReporting:true,
quickQuality:false,
recentMedia:true,
simpleLeader:true,
syncCheck:true,
thumbnails:true,
timeEstimates:true,
volumeControl:false},
chatext:{persistIgnore:true,
smartScroll:true,
maxMessages:220},
userlist:{autoHider:true},
various:{notepad:true,emoteToggle:true}},
modules:
{settings:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_settings.min.js",done:true},audio:
{active:1,rank:-1,url:"https://resources.pink.horse/oldjs/external_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://resources.pink.horse/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_whispers.js",done:true},userlist:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://resources.pink.horse/js/module_designator.min.js",done:true},playlist:
{active:1,rank:-1,url:"https://resources.pink.horse/js/module_playlist.min.js",done:true},notifier:
{active:1,rank:-1,url:"https://resources.pink.horse/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatext.min.js",done:true},colormap:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_unimoji.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_chatcolor.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_layout.min.js",done:true},various:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_embedmedia.min.js",done:true},ci_library:{active:1,rank:-1,url:"https://resources.pink.horse/js/library_chaticons.min.js",done:true},time:{active:1,rank:-1,url:"https://resources.pink.horse/js/module_time.min.js",done:true}},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader()},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;$.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this))}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",(data=>{if(data.success){$.getScript(module.url)}}))})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();

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

/*
**  Client-side Giphy Search Bot Command Emulation
**    Written by Xaekai
*/

({
    embedCode: '.pic',
    errorCode: 'ssc:red ',
    giphyKey: 'dc6zaTOxFJmzC',
    setupListener: function(){
        socket.on("chatMsg", this.handleChatMsg.bind(this)); 
    },
    handleChatMsg: function(data){
        if (CLIENT.name === data.username && data.msg.trim().indexOf('$giphy') > -1){
            var search = data.msg.trim().split('$giphy').pop();
            this.giphySearch(search);
        }
    },
    giphySearch: function(query){
        $.getJSON(`https://api.giphy.com/v1/gifs/search?api_key=${this.giphyKey}&q=${encodeURIComponent(query)}`)
            .done((data)=>{
                if(data.data.length > 0){ 
                    var index = Math.floor(Math.random()*data.data.length); 
                    var image = data.data[index].images.original.url; 
                    socket.emit("chatMsg", { msg: image + this.embedCode, meta: {} });
                    }
                else {
                    socket.emit("chatMsg", { msg: this.errorCode + " No gif found for " + search }); 
                    }     
            })
            .error(function(data) { 
                console.error("Giphy error: " + data);
            })
            ;
    },
    start: function(){
        if(CLIENT.giphy){ return }else{ CLIENT.giphy = this }
        this.setupListener();
    },
}).start();

setInterval(function(){
    USEROPTS.sort_rank = 1;
    USEROPTS.sort_afk = 1;
    USEROPTS.layout = "fluid";
},1000);


$("#showchansettings").text("Mod Menu");
$(".server-msg-reconnect").text("Welcome to W.I.D. #1 Sports Network on Baked");
$(".server-msg-disconnect").text("Your Connection Is Bad!");
$("#showsearch").text("Search");
$("#showmediaurl").text("Add");
$("#clearplaylist").text("Clear");
$("#mediarefresh").text("Refresh Media");
$("#emotelistbtn").text("Macros");


/* =========================================================
   WID V3 SAFE UI LAYER
   Keeps the legacy V2 module behavior, but the V3 skin itself
   is isolated from the preserved original files.
   ========================================================= */
(function () {
    "use strict";

    function applyWidV3() {
        document.documentElement.classList.add("wid-v3");
        if (document.body) {
            document.body.classList.add("wid-v3");
        }

        /* V3 intentionally keeps the navigation visible. */
        $("#navbar-autohide").remove();

        $("#showchansettings").text("Mod Menu");
        $("#showsearch").text("Search");
        $("#showmediaurl").text("Add");
        $("#clearplaylist").text("Clear");
        $("#mediarefresh").text("Refresh Media");
        $("#emotelistbtn").text("Macros");
    }

    applyWidV3();
    $(applyWidV3);
    setTimeout(applyWidV3, 1500);
})();


/* =========================================================
   WID V3 EMBIGGEN BUTTON PERSISTENCE
   Preserve Xaekai's original button + click handler when the
   emote menu rebuild temporarily removes it from the DOM.
   ========================================================= */
(function () {
    "use strict";

    var savedEmbiggenButton = null;
    var observer = null;
    var restoreTimer = null;

    function labelOf(el) {
        if (!el) return "";
        return [
            el.textContent || "",
            el.getAttribute && (el.getAttribute("title") || ""),
            el.getAttribute && (el.getAttribute("aria-label") || ""),
            el.value || ""
        ].join(" ").replace(/\s+/g, " ").trim();
    }

    function findLiveEmbiggenButton() {
        var nodes = document.querySelectorAll(
            'button, a.btn, input[type="button"], input[type="submit"]'
        );

        for (var i = 0; i < nodes.length; i++) {
            if (/embiggen/i.test(labelOf(nodes[i]))) {
                return nodes[i];
            }
        }
        return null;
    }

    function getControlsHost() {
        var macros = document.getElementById("emotelistbtn");

        if (macros && macros.parentNode) {
            return macros.parentNode;
        }

        return document.getElementById("chatcontrols")
            || document.getElementById("leftcontrols")
            || document.querySelector(".chat-controls")
            || null;
    }

    function rememberOrRestore() {
        var live = findLiveEmbiggenButton();

        if (live) {
            savedEmbiggenButton = live;
            return;
        }

        if (!savedEmbiggenButton) {
            return;
        }

        if (document.documentElement.contains(savedEmbiggenButton)) {
            return;
        }

        var host = getControlsHost();
        if (!host || !document.documentElement.contains(host)) {
            return;
        }

        var macros = document.getElementById("emotelistbtn");

        if (macros && macros.parentNode === host) {
            if (macros.nextSibling) {
                host.insertBefore(savedEmbiggenButton, macros.nextSibling);
            } else {
                host.appendChild(savedEmbiggenButton);
            }
        } else {
            host.appendChild(savedEmbiggenButton);
        }

        console.info("[WID V3] Restored Embiggen emote button.");
    }

    function scheduleRestore() {
        if (restoreTimer) {
            clearTimeout(restoreTimer);
        }

        restoreTimer = setTimeout(rememberOrRestore, 60);
    }

    function start() {
        rememberOrRestore();

        observer = new MutationObserver(scheduleRestore);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        /* Backup check for old module code that mutates outside normal hooks. */
        setInterval(rememberOrRestore, 1000);
    }

    if (document.body) {
        start();
    } else {
        $(start);
    }
})();
