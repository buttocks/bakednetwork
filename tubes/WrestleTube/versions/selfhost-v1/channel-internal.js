/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|
 **@preserve
 */
if (!this[CHANNEL.name]) {
    this[CHANNEL.name] = {}
}
if (!this[CHANNEL.name].branding) {
    this[CHANNEL.name].branding = $(".navbar-brand").html("").css({
        "background-image": 'url("https://i.imgur.com/E2r6gvt.png")',
        "background-size": "96%",
        "min-width": "150px",
        "background-repeat": "no-repeat",
        "background-position": "center center"
    })
}
if (!this[CHANNEL.name].favicon) {
    this[CHANNEL.name].favicon = $("<link/>").prop("id", "favicon").attr("rel", "shortcut icon").attr("type", "image/png").attr("sizes", "64x64").attr("href", "https://i.imgur.com/r47qL1x.png").appendTo("head")
}
/*!
 **|   Legacy feature modules
 **|
**@preserve
*/
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{hidePlaylist:false,collapse:false,inlineBlame:false,moveReporting:true,quickQuality:false,recentMedia:false,simpleLeader:true,syncCheck:true,thumbnails:false,timeEstimates:false,volumeControl:false},userlist:{autoHider:true},various:{notepad:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_designator.min.js",done:true},playlist:{timeEstimates:false,thumbnails:false,recentMedia:false,inlineBlame:false,hidePlaylist:false,collapse:false,active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_alerts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_hotkeys.min.js",done:true},various:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[Baked modules]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[Baked modules]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[Baked modules]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


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

