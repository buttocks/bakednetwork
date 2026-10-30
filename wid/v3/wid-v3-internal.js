/*!
 **|  Baked.live Channel: WID V3 Internal Script
 **|
 **|  WID channel code maintained and customized by the channel team.
 **|  Includes selected legacy modules/components originally written by Xaekai.
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
   WID V3 LEGACY EMBIGGEN KEEPER
   Ported from the proven RDH v0.1.27 strategy.
   Preserve only the real working Pink Horse Embiggen button.
   No observers, no polling, no #textEmotes/Unimoji movement.
   ========================================================= */
(function () {
    "use strict";

    if (!window.jQuery) return;
    var $ = window.jQuery;
    var ns = ".widV3LegacyEmbiggen";
    var template = null;

    function buttonText($el) {
        return [
            $el.text(),
            $el.attr("title"),
            $el.attr("aria-label"),
            $el.val()
        ].filter(Boolean).join(" ");
    }

    function findButton() {
        var $found = $();

        $("button, a.btn, input[type='button']").each(function () {
            var $el = $(this);
            if (/embiggen\s+emote\s+list/i.test(buttonText($el))) {
                $found = $el;
                return false;
            }
        });

        return $found;
    }

    function captureTemplate() {
        var $live = findButton();
        if (!$live.length) return;

        $live.addClass("wid-v3-legacy-embiggen");
        template = $live.clone(true, true);
        template
            .removeAttr("id")
            .removeClass("hidden invisible")
            .addClass("wid-v3-legacy-embiggen")
            .prop("hidden", false)
            .attr("aria-hidden", "false")
            .css({
                display: "",
                visibility: "",
                opacity: ""
            });
    }

    function placeLiveButton() {
        var $live = findButton();
        var $macros = $("#emotelistbtn");

        if (!$live.length || !$macros.length) return;

        $live
            .addClass("wid-v3-legacy-embiggen")
            .removeClass("hidden invisible")
            .prop("hidden", false)
            .attr("aria-hidden", "false")
            .css({
                display: "",
                visibility: "",
                opacity: ""
            })
            .detach()
            .insertAfter($macros);

        captureTemplate();
    }

    function restoreIfMissing() {
        var $macros = $("#emotelistbtn");
        if (!$macros.length) return;

        var $live = findButton();
        if ($live.length) {
            placeLiveButton();
            return;
        }

        if (!template || !template.length) return;

        template.clone(true, true)
            .removeAttr("id")
            .removeClass("hidden invisible")
            .addClass("wid-v3-legacy-embiggen")
            .prop("hidden", false)
            .attr("aria-hidden", "false")
            .css({
                display: "",
                visibility: "",
                opacity: ""
            })
            .insertAfter($macros);
    }

    function start() {
        setTimeout(placeLiveButton, 300);

        $(document)
            .off(ns)
            .on("mousedown" + ns + " pointerdown" + ns, "button, a.btn, input[type='button']", function () {
                var $el = $(this);
                if (/embiggen\s+emote\s+list/i.test(buttonText($el))) {
                    captureTemplate();
                }
            })
            .on("click" + ns, "button, a.btn, input[type='button']", function () {
                var $el = $(this);
                if (/embiggen\s+emote\s+list/i.test(buttonText($el))) {
                    setTimeout(restoreIfMissing, 0);
                    setTimeout(restoreIfMissing, 100);
                }
            })
            .on("hidden.bs.modal" + ns, "#emotelist", function () {
                setTimeout(restoreIfMissing, 0);
            })
            .on("shown.bs.modal" + ns, "#emotelist", function () {
                setTimeout(captureTemplate, 0);
            })
            .on("click" + ns, "#emotelistbtn", function () {
                setTimeout(placeLiveButton, 200);
            });
    }

    if (document.body) {
        start();
    } else {
        $(start);
    }
})();

/* WID V3 STALE CHAT WRAPPER CLEANUP
   Only undoes wrappers created by older V3 test builds. */
(function () {
    "use strict";
    if (!window.jQuery) return;
    var $ = window.jQuery;

    function cleanup() {
        var $row = $("#wid-v3-chat-input-row");
        if (!$row.length) return;

        var $chat = $("#chatline");
        var $form = $row.closest("form");

        if ($chat.length && $form.length) {
            $chat.detach().prependTo($form);
        }

        $("#wid-v3-chat-tools").children().each(function () {
            $(this).detach().appendTo("#leftcontrols");
        });

        $("#wid-v3-chat-tools").remove();
        $row.remove();
    }

    $(cleanup);
    setTimeout(cleanup, 500);
})();


/* =========================================================
   WID V3 EMOTE RESIZER + CHAT HELPERS
   Restores the old oversized-emote detection/hover behavior
   without affecting ordinary .pic embeds.
   ========================================================= */
(function () {
    "use strict";

    if (!window.jQuery) return;
    var $ = window.jQuery;

    var NORMAL_MAX_W = 160;
    var NORMAL_MAX_H = 80;
    var BIG_TEST_W = 200;
    var BIG_TEST_H = 120;
    var HOVER_MAX_W = 420;
    var HOVER_MAX_H = 300;

    function fitWithin(w, h, maxW, maxH) {
        if (!w || !h) return { w:maxW, h:maxH };
        var scale = Math.min(1, maxW / w, maxH / h);
        return {
            w: Math.max(1, Math.round(w * scale)),
            h: Math.max(1, Math.round(h * scale))
        };
    }

    function tagEmote(img) {
        if (!img || img.nodeType !== 1) return;
        if (!img.classList.contains("channel-emote")) return;

        /* The schedule emote already has its own explicit large sizing rule. */
        if ((img.getAttribute("title") || "").toLowerCase() === "widschedule") {
            return;
        }

        function inspect() {
            var w = img.naturalWidth || 0;
            var h = img.naturalHeight || 0;

            if (w > BIG_TEST_W || h > BIG_TEST_H) {
                var hover = fitWithin(w, h, HOVER_MAX_W, HOVER_MAX_H);
                img.setAttribute("data-big", "true");
                img.style.setProperty("--wid-emote-hover-w", hover.w + "px");
                img.style.setProperty("--wid-emote-hover-h", hover.h + "px");
            } else {
                img.removeAttribute("data-big");
                img.style.removeProperty("--wid-emote-hover-w");
                img.style.removeProperty("--wid-emote-hover-h");
            }
        }

        if (img.complete && img.naturalWidth) {
            inspect();
        } else if (!img.dataset.widResizeBound) {
            img.dataset.widResizeBound = "1";
            img.addEventListener("load", inspect, { passive:true });
        }
    }

    function scanEmotes(root) {
        root = root || document;

        if (root.matches && root.matches(".channel-emote")) {
            tagEmote(root);
        }

        if (root.querySelectorAll) {
            root.querySelectorAll(".channel-emote").forEach(tagEmote);
        }
    }

    function startObserver() {
        scanEmotes(document);

        var buffer = document.getElementById("messagebuffer");
        if (!buffer) return;

        var observer = new MutationObserver(function (records) {
            records.forEach(function (record) {
                record.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) scanEmotes(node);
                });
            });
        });

        observer.observe(buffer, {
            childList:true,
            subtree:true
        });
    }

    /* Click emote -> append emote name to the chat box. */
    $("#chatwrap")
        .off("click.widV3EmoteInsert", ".channel-emote")
        .on("click.widV3EmoteInsert", ".channel-emote", function (e) {
            e.preventDefault();
            var name = $(this).attr("title");
            var $chat = $("#chatline");
            if (!name || !$chat.length) return;

            $chat.val(($chat.val() || "") + name + " ");
            $chat.focus();
        });

    /* Click username -> append username to the chat box. */
    $("#messagebuffer")
        .off("click.widV3UserInsert", ".username")
        .on("click.widV3UserInsert", ".username", function (e) {
            e.preventDefault();
            var name = $(this).text();
            var $chat = $("#chatline");
            if (!name || !$chat.length) return;

            $chat.val(($chat.val() || "") + name + " ");
            $chat.focus();
        });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startObserver, { once:true });
    } else {
        startObserver();
    }

    setTimeout(function () { scanEmotes(document); }, 750);
    setTimeout(function () { scanEmotes(document); }, 2000);
})();


/* =========================================================
   WID V3 BROKEN EMOTE RECORD CLEANER
   Deletes broken emote ENTRIES from the channel rather than
   merely hiding their tiles in the emote list.

   Exact known dead URLs are removed immediately. For other
   Imgur/imgbb emotes, provider placeholder dimensions are
   learned from multiple known-dead examples; automatic removal
   only activates when the examples agree on one signature.
   ========================================================= */
(function () {
    "use strict";

    if (!window.jQuery || !window.socket || !window.CHANNEL || !window.CLIENT) return;

    /* Channel JS runs for everyone. Only moderator-or-higher clients should
       issue permanent emote removal requests. */
    if (Number(CLIENT.rank || 0) < 2) return;

    var $ = window.jQuery;
    var ns = ".widV3BrokenEmoteRecords";
    var removed = Object.create(null);

    var brokenSources = [
        "https://i.imgur.com/uoS0qOm.gif",
        "https://i.ibb.co/wRLkpVs/ezgif-com-gif-maker-26.gif",
        "https://imgur.com/bR75s4Q.gif",
        "https://i.ibb.co/VpqQ7wPf/1704508202861-removebg-preview-ezgif-com-crop.png"
    ];

    var providerRefs = {
        imgur: [
            "https://i.imgur.com/uoS0qOm.gif",
            "https://imgur.com/bR75s4Q.gif"
        ],
        imgbb: [
            "https://i.ibb.co/wRLkpVs/ezgif-com-gif-maker-26.gif",
            "https://i.ibb.co/VpqQ7wPf/1704508202861-removebg-preview-ezgif-com-crop.png"
        ]
    };

    var providerSignature = {
        imgur: "",
        imgbb: ""
    };

    function normalize(url) {
        return String(url || "")
            .replace(/^http:\/\//i, "https://")
            .replace(/\/$/, "")
            .toLowerCase();
    }

    function providerFor(url) {
        var value = normalize(url);

        if (/https:\/\/(?:i\.)?imgur\.com\//i.test(value)) {
            return "imgur";
        }

        if (/https:\/\/i\.ibb\.co\//i.test(value)) {
            return "imgbb";
        }

        return "";
    }

    function signatureFor(img) {
        if (!img || !img.naturalWidth || !img.naturalHeight) return "";
        return String(img.naturalWidth) + "x" + String(img.naturalHeight);
    }

    var exactBroken = Object.create(null);
    brokenSources.forEach(function (url) {
        exactBroken[normalize(url)] = true;
    });

    function emoteUrl(emote) {
        if (!emote) return "";
        return emote.image || emote.url || emote.src || "";
    }

    function emoteKey(emote) {
        return String(
            (emote && (emote.name || emote.code || emote.id)) ||
            emoteUrl(emote) ||
            ""
        );
    }

    function removeEntry(emote, reason) {
        if (!emote) return;

        var key = emoteKey(emote);
        if (!key || removed[key]) return;

        removed[key] = true;

        console.warn(
            "[WID V3] Removing broken emote entry:",
            emote.name || key,
            reason || ""
        );

        socket.emit("removeEmote", emote);
    }

    function loadSignature(url, done) {
        var probe = new Image();
        var finished = false;

        function finish(sig) {
            if (finished) return;
            finished = true;
            done(sig || "");
        }

        probe.onload = function () {
            finish(signatureFor(probe));
        };

        probe.onerror = function () {
            finish("");
        };

        probe.src = url;
    }

    function learnProvider(provider, urls, done) {
        var signatures = [];
        var pending = urls.length;

        if (!pending) {
            done();
            return;
        }

        urls.forEach(function (url) {
            loadSignature(url, function (sig) {
                if (sig) signatures.push(sig);

                pending--;
                if (pending > 0) return;

                /* Only trust a provider-wide placeholder signature when
                   every known-dead reference agrees. */
                if (
                    signatures.length === urls.length &&
                    signatures.every(function (value) {
                        return value === signatures[0];
                    })
                ) {
                    providerSignature[provider] = signatures[0];
                    console.info(
                        "[WID V3] Learned broken " + provider +
                        " placeholder signature:",
                        signatures[0]
                    );
                }

                done();
            });
        });
    }

    function learnProviderSignatures(done) {
        var providers = Object.keys(providerRefs);
        var pending = providers.length;

        if (!pending) {
            done();
            return;
        }

        providers.forEach(function (provider) {
            learnProvider(provider, providerRefs[provider], function () {
                pending--;
                if (!pending) done();
            });
        });
    }

    function scanChannelEmotes() {
        var emotes = Array.isArray(CHANNEL.emotes)
            ? CHANNEL.emotes.slice()
            : [];

        emotes.forEach(function (emote) {
            var url = emoteUrl(emote);
            var normalized = normalize(url);

            if (!url) return;

            if (exactBroken[normalized]) {
                removeEntry(emote, "known dead URL");
                return;
            }

            var provider = providerFor(url);
            var expected = provider && providerSignature[provider];

            if (!provider || !expected) return;

            var probe = new Image();

            probe.onload = function () {
                if (signatureFor(probe) === expected) {
                    removeEntry(
                        emote,
                        provider + " static error placeholder"
                    );
                }
            };

            /* A transient load error alone is NOT enough to delete an emote. */
            probe.src = url;
        });
    }

    function runCleanup() {
        scanChannelEmotes();
    }

    $(function () {
        /* Exact known dead entries can be removed immediately. */
        runCleanup();

        /* Then learn safe provider signatures and remove matching records. */
        learnProviderSignatures(function () {
            runCleanup();
        });

        setTimeout(runCleanup, 1500);
    });

    /* Re-run only on explicit emote-list use; no observers or polling. */
    $(document)
        .off(ns)
        .on("click" + ns, "#emotelistbtn", function () {
            setTimeout(runCleanup, 250);
        })
        .on("shown.bs.modal" + ns, "#emotelist", function () {
            setTimeout(runCleanup, 100);
        });
})();

/* =========================================================
   WID V3 POLL CENTERING — GEOMETRY-SCOPED
   Detect the actual cinema arrangement (wide video/narrow chat)
   without guessing the external layout module's class names.
   No polling, reparenting, or broad mutation observers.
   ========================================================= */
(function () {
    "use strict";

    if (window.__widV3PollCinemaDetector) return;
    window.__widV3PollCinemaDetector = true;

    var cssClass = "wid-v3-cinema-poll";
    var framePending = false;

    function update() {
        framePending = false;
        var chat = document.getElementById("chatwrap");
        var video = document.getElementById("videowrap");
        if (!chat || !video || !document.body) return;

        var width = document.documentElement.clientWidth || window.innerWidth;
        var cw = chat.getBoundingClientRect().width;
        var vw = video.getBoundingClientRect().width;

        // In normal WID, both panels are substantial columns.
        // In cinema, video occupies most of the screen and chat is narrow.
        var cinema = width >= 800 &&
                     cw >= 120 && vw >= 480 &&
                     cw / width < 0.34 &&
                     vw / width > 0.63 &&
                     vw > cw * 2;

        document.body.classList.toggle(cssClass, cinema);
    }

    function schedule() {
        if (framePending) return;
        framePending = true;
        requestAnimationFrame(update);
    }

    function init() {
        var chat = document.getElementById("chatwrap");
        var video = document.getElementById("videowrap");
        if (!chat || !video) return;

        schedule();
        window.addEventListener("resize", schedule, {passive: true});

        if (window.ResizeObserver) {
            var resizeObserver = new ResizeObserver(schedule);
            resizeObserver.observe(chat);
            resizeObserver.observe(video);
            window.__widV3PollCinemaResizeObserver = resizeObserver;
        }

        document.addEventListener("click", function (event) {
            if (event.target.closest("nav, .navbar, [id*='layout'], [class*='layout']")) {
                setTimeout(schedule, 50);
                setTimeout(schedule, 350);
            }
        }, false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {once: true});
    } else {
        init();
    }
})();
