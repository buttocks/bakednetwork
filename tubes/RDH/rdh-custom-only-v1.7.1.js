/* RDH custom-only channel layer. No Xaekai modules or native playlist overrides. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhCustomOnly)return;
function init(){
 if(!w.CHANNEL?.name||!w.CLIENT||!w.jQuery||!w.socket||!d.body)return false;
 if(w.__rdhCustomOnly)return true;
 const $=w.jQuery, RDH=w[w.CHANNEL.name]=w[w.CHANNEL.name]||{};
 w.__rdhCustomOnly={version:"1.7.1",ready:false};
 try{
     if (!RDH.favicon) {
        $("#favicon").remove();

        RDH.favicon = $("<link/>")
            .prop("id", "favicon")
            .attr("rel", "shortcut icon")
            .attr("type", "image/png")
            .attr("sizes", "64x64")
            .attr("href", "https://i.imgur.com/6pI7lZ6.png")
            .appendTo("head");
    }


     function applyLabels() {
        $("#showchansettings").text("Mod Menu");
        $(".server-msg-reconnect").text(
            "Welcome to Real Dad's Hideout!"
        );
        $(".server-msg-disconnect").text("Your Connection Is Bad!");
        $("#showsearch").text("Search");
        $("#showmediaurl").text("Add");
        $("#clearplaylist").text("Clear");
        $("#mediarefresh").text("Refresh");
        $("#emotelistbtn").text("Macros");
    }

    applyLabels();
    setTimeout(applyLabels, 1000);


 }catch(e){console.error("[RDH] branding",e)}
 try{
     const giphy = {
        embedCode: ".pic",
        errorCode: "ssc:red ",
        apiKey: "dc6zaTOxFJmzC",

        start: function () {
            if (CLIENT.giphy) {
                return;
            }

            CLIENT.giphy = this;
            socket.on("chatMsg", this.handleChatMsg.bind(this));
        },

        handleChatMsg: function (data) {
            if (!data || CLIENT.name !== data.username) {
                return;
            }

            const message = String(data.msg || "").trim();
            const commandIndex = message.indexOf("$giphy");

            if (commandIndex === -1) {
                return;
            }

            const query = message.slice(commandIndex + 6).trim();

            if (!query) {
                socket.emit("chatMsg", {
                    msg: this.errorCode + " Usage: $giphy search terms",
                    meta: {}
                });
                return;
            }

            this.search(query);
        },

        search: function (query) {
            $.getJSON(
                "https://api.giphy.com/v1/gifs/search",
                {
                    api_key: this.apiKey,
                    q: query,
                    limit: 25,
                    rating: "r"
                }
            )
                .done((data) => {
                    const results = data && Array.isArray(data.data) ? data.data : [];

                    if (!results.length) {
                        socket.emit("chatMsg", {
                            msg: this.errorCode + " No GIF found for " + query,
                            meta: {}
                        });
                        return;
                    }

                    const result = results[Math.floor(Math.random() * results.length)];
                    const image =
                        result &&
                        result.images &&
                        result.images.original &&
                        result.images.original.url;

                    if (!image) {
                        socket.emit("chatMsg", {
                            msg: this.errorCode + " No usable GIF found for " + query,
                            meta: {}
                        });
                        return;
                    }

                    socket.emit("chatMsg", {
                        msg: image + this.embedCode,
                        meta: {}
                    });
                })
                .fail((jqxhr, textStatus, errorThrown) => {
                    console.error("[RDH Giphy]", textStatus, errorThrown);

                    socket.emit("chatMsg", {
                        msg: this.errorCode + " Giphy search failed.",
                        meta: {}
                    });
                });
        }
    };

    giphy.start();


 }catch(e){console.error("[RDH] Giphy",e)}
 try{
 /*!
 * RDH Modern Modules
 * Safe migration layer for Real Dad's Hideout.
 * RDH custom features only; native Baked handles the playlist and controls.
 */
(function () {
    "use strict";

    if (!window.CHANNEL || !window.CLIENT || !window.jQuery) return;

    const $ = window.jQuery;
    const RDH = window[CHANNEL.name] = window[CHANNEL.name] || {};

    if (RDH.modern && RDH.modern.loaded) return;

    const modern = RDH.modern = {
        loaded: true,
        version: "0.1.29",
        modules: {},
        state: {},
        register: function (name, module) {
            this.modules[name] = module;
        },
        start: function (name) {
            const module = this.modules[name];
            if (!module || module.started) return false;
            try {
                if (typeof module.start === "function") module.start();
                module.started = true;
                console.info("[RDH Modern] Started:", name);
                return true;
            } catch (err) {
                console.error("[RDH Modern] Failed:", name, err);
                return false;
            }
        },
        stop: function (name) {
            const module = this.modules[name];
            if (!module || !module.started) return false;
            try {
                if (typeof module.stop === "function") module.stop();
                module.started = false;
                console.info("[RDH Modern] Stopped:", name);
                return true;
            } catch (err) {
                console.error("[RDH Modern] Stop failed:", name, err);
                return false;
            }
        },
        status: function () {
            const result = {};
            Object.keys(this.modules).forEach((name) => {
                result[name] = !!this.modules[name].started;
            });
            return result;
        }
    };

    /* ---------------------------------------------------------
       Diagnostics
       --------------------------------------------------------- */
    modern.register("diagnostics", {
        start: function () {
            RDH.modernStatus = function () {
                const legacy = CLIENT.modules && CLIENT.modules.modules
                    ? Object.keys(CLIENT.modules.modules).filter((name) => CLIENT.modules.modules[name].active)
                    : [];

                const status = {
                    modernVersion: modern.version,
                    modernModules: modern.status(),
                    legacyModulesStillActive: legacy
                };

                console.table(status.modernModules);
                console.info("[RDH Modern] Legacy modules still active:", legacy);
                return status;
            };
        }
    });

    /* ---------------------------------------------------------
       Emote inspector
       Our replacement for the old inline emote-size helper.
       Does not interfere with legacy layout/modules.
       --------------------------------------------------------- */
    modern.register("emotes", {
        observer: null,

        inspect: function (img) {
            if (!img || img.nodeName !== "IMG" || !img.classList.contains("channel-emote")) return;

            const update = function () {
                if (img.naturalWidth > 200 || img.naturalHeight > 120) {
                    img.setAttribute("data-big", "true");
                } else {
                    img.removeAttribute("data-big");
                }
            };

            if (img.complete) update();
            else img.addEventListener("load", update, { once: true });
        },

        scan: function (root) {
            const scope = root && root.querySelectorAll ? root : document;

            if (
                scope.nodeName === "IMG" &&
                scope.classList &&
                scope.classList.contains("channel-emote")
            ) {
                this.inspect(scope);
            }

            scope.querySelectorAll("img.channel-emote").forEach(this.inspect);
        },

        start: function () {
            const self = this;
            self.scan(document);

            self.observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.nodeType === 1) self.scan(node);
                    });
                });
            });

            self.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        stop: function () {
            if (this.observer) this.observer.disconnect();
            this.observer = null;
        }
    });

    /* ---------------------------------------------------------
       Chat click helpers
       --------------------------------------------------------- */
    modern.register("chatHelpers", {
        namespace: ".rdhModernChat",

        start: function () {
            const ns = this.namespace;

            $("#chatwrap")
                .off("click" + ns, ".channel-emote")
                .on("click" + ns, ".channel-emote", function (event) {
                    event.preventDefault();

                    const code = $(this).attr("title") || $(this).attr("alt") || "";
                    if (!code) return;

                    const $chatline = $("#chatline");
                    const current = $chatline.val() || "";
                    const spacer = current && !/\s$/.test(current) ? " " : "";

                    $chatline.val(current + spacer + code + " ").trigger("focus");
                });

            $("#messagebuffer")
                .off("click" + ns, ".username")
                .on("click" + ns, ".username", function (event) {
                    event.preventDefault();

                    const name = $(this).text().trim();
                    if (!name) return;

                    const $chatline = $("#chatline");
                    const current = $chatline.val() || "";
                    const spacer = current && !/\s$/.test(current) ? " " : "";

                    $chatline.val(current + spacer + name + " ").trigger("focus");
                });
        },

        stop: function () {
            $("#chatwrap").off(this.namespace);
            $("#messagebuffer").off(this.namespace);
        }
    });

    /* ---------------------------------------------------------
       Playlist featured-show identifiers
       Gives each recurring RDH show its own compact visual marker.
       --------------------------------------------------------- */
    modern.register("premiumPlaylist", {
        observer: null,
        timer: null,
        interval: null,

        types: [
            { key: "wor",  pattern: /(?:^|[^a-z0-9])WOR(?:[^a-z0-9]|$)|wrestling\s+observer\s+radio/i },
            { key: "wol",  pattern: /(?:^|[^a-z0-9])WOL(?:[^a-z0-9]|$)|wrestling\s+observer(?:[^a-z0-9]+|\s+)live/i },
            { key: "f4d",  pattern: /(?:^|[^a-z0-9])F4D(?:[^a-z0-9]|$)|filthy\s+four\s+daily/i },
            { key: "ad",   pattern: /(?:^|[^a-z0-9])AFTER\s+DARK(?:\s+RADIO)?(?:[^a-z0-9]|$)/i },
            { key: "ltbh", pattern: /(?:^|[^a-z0-9])LTB\s*(?:&\s*)?[HD](?=[^a-z0-9]|$)|lions\s*,?\s*tigers\s*,?\s*bears\s*(?:&|and)\s*(?:head|dirt|disco)\b/i },
            { key: "bvv",  pattern: /(?:^|[^a-z0-9])BVV(?:[^a-z0-9]|$)|big\s+vinny\s+v/i },
            { key: "bv",   pattern: /(?:^|[^a-z0-9])B\s*&\s*V(?:[^a-z0-9]|$)|(?:^|[^a-z0-9])BVT(?:[^a-z0-9]|$)|^\s*bryan\s*(?:&|and)\s+/i },
            { key: "ctm",  pattern: /castrating\s+the\s+marks/i }
        ],

        getType: function (title) {
            const raw = String(title || "");
            const normalized = raw
                .replace(/[\u200B-\u200D\uFEFF]/g, "")
                .replace(/\u00a0/g, " ")
                .replace(/[–—]/g, "-")
                .replace(/\s+/g, " ")
                .trim();
            const upper = normalized.toUpperCase();

            // Direct recurring-show aliases first. These intentionally avoid
            // relying on punctuation-sensitive regexes because older playlist
            // titles use several inconsistent naming formats.
            if (/^WOR\b/.test(upper) || upper.includes("WRESTLING OBSERVER RADIO")) return "wor";
            if (/(?:^|[^A-Z0-9])WOL(?:[^A-Z0-9]|$)/.test(upper) || /WRESTLING\s+OBSERVER(?:[^A-Z0-9]+|\s+)LIVE/.test(upper)) return "wol";
            if (/^F4D\b/.test(upper) || upper.includes("FILTHY FOUR DAILY") || upper.includes("FIGURE FOUR DAILY")) return "f4d";
            if (upper.includes("AFTER DARK")) return "ad";
            // Lions, Tigers, Bears & Head (new name) / Dirt or Disco (older name).
            // Group both eras under the same featured-show category.
            if (/(?:^|[^A-Z0-9])LTB\s*(?:&\s*)?[HD](?=[^A-Z0-9]|$)/.test(upper) ||
                /LIONS\s*,?\s*TIGERS\s*,?\s*BEARS\s*(?:&|AND)\s*(?:HEAD|DIRT|DISCO)\b/.test(upper)) return "ltbh";
            if (upper.startsWith("BIG VINNY V") || /(?:^|[^A-Z0-9])BVV(?:[^A-Z0-9]|$)/.test(upper)) return "bvv";
            if (/(?:^|[^A-Z0-9])BVT(?:[^A-Z0-9]|$)/.test(upper)) return "bv";
            if (/^B\s*&\s*V\b/.test(upper)) return "bv";
            if (/^BRYAN\s*(?:&|AND)\s+/.test(upper) || /(?:^|\b)BRYAN\s*(?:&|AND)\s+VINNY(?:\s+SHOW)?\b/.test(upper)) return "bv";
            if (upper.includes("CASTRATING THE MARKS")) return "ctm";

            for (let i = 0; i < this.types.length; i++) {
                if (this.types[i].pattern.test(normalized)) return this.types[i].key;
            }
            return "";
        },

        scan: function () {
            const self = this;
            const typeClasses = "rdh-featured rdh-featured-wor rdh-featured-wol rdh-featured-bv rdh-featured-bvv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc";

            $("#queue li.queue_entry, #queue .queue_entry").each(function () {
                const $entry = $(this);
                const $title = $entry.find(".qe_title").first();
                const title = ($title.length ? $title.text() : $entry.text()).trim();
                const type = self.getType(title);
                const wantedClass = type ? "rdh-featured-" + type : "";

                const hasCorrectState =
                    (!!type === $entry.hasClass("rdh-featured")) &&
                    (!type || $entry.hasClass(wantedClass));

                if (!hasCorrectState) {
                    $entry.removeClass(typeClasses);
                    if (type) $entry.addClass("rdh-featured " + wantedClass);
                }
            });
        },

        scheduleScan: function () {
            const self = this;
            clearTimeout(self.timer);
            self.timer = setTimeout(function () {
                self.scan();
            }, 80);
        },

        start: function () {
            const self = this;
            self.scan();

            // Watch the whole page rather than one queue node. Baked can replace
            // or virtualize playlist DOM while scrolling, which otherwise leaves
            // newly-rendered rows untagged.
            self.observer = new MutationObserver(function () {
                self.scheduleScan();
            });

            self.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });

            // Periodic safety scan catches virtualized/reused rows even if the
            // site mutates attributes/properties without a useful DOM event.
            self.interval = setInterval(function () {
                self.scan();
            }, 1000);
        },

        stop: function () {
            clearTimeout(this.timer);
            clearInterval(this.interval);
            this.interval = null;
            if (this.observer) this.observer.disconnect();
            this.observer = null;
            $("#queue .rdh-featured, #queue [class*='rdh-featured-']")
                .removeClass("rdh-featured rdh-featured-wor rdh-featured-wol rdh-featured-bv rdh-featured-bvv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc");
        }
    });





    modern.start("diagnostics");
    modern.start("emotes");
    // Native MOTD toggle remains under visitor control.
    // Saved compact MOTD contains native details; no legacy rearrangement.
    modern.start("premiumPlaylist");
})();
 }catch(e){console.error("[RDH] custom modules",e)}
 w.__rdhCustomOnly.ready=!!RDH.modern?.modules?.premiumPlaylist?.started;
 return true;
}
if(!init()){let n=0;const t=w.setInterval(()=>{if(init()||++n>=120)w.clearInterval(t)},250)}
})(window,document);


/* Tagged-show original URL control. Uses the existing native media model. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhTaggedUrl)return;
w.__rdhTaggedUrl=true;
const style=d.createElement("style");
style.id="rdh-tagged-url-style";
style.textContent=
"#queue .rdh-video-url-pill{display:inline-flex!important;align-items:center;padding:2px 7px;margin:0;max-width:100%;border:1px solid #397f90;border-radius:5px;background:#102c35;color:#b6f7ff;font-size:11px;line-height:16px;cursor:pointer;pointer-events:auto!important;vertical-align:middle;position:relative;z-index:2}"+
"#queue .rdh-video-url-pill:hover,#queue .rdh-video-url-pill:focus-visible{border-color:#7df3ff;color:white;background:#194653}"+
"#queue .rdh-attribution-group{display:inline-flex!important;align-items:center;justify-content:flex-start;gap:0;flex-wrap:wrap;flex:0 1 auto;max-width:100%;text-align:left}"+
"#queue .rdh-url-line{display:none;align-items:center;gap:6px;margin-left:8px;vertical-align:middle;text-align:left;white-space:normal}"+
"#queue .queue_entry.rdh-featured:hover .rdh-url-line,#queue .queue_entry.rdh-featured:focus-within .rdh-url-line{display:inline-flex}"+
"#queue .rdh-url-line.rdh-url-fallback{margin-left:0;clear:both}"+
"#queue .rdh-url-line input{background:#081a21;color:#d2f6ff;border:1px solid #397f90;border-radius:3px;font-size:12px;width:min(220px,48vw);padding:2px 4px}"+
"@media (hover:none), (pointer:coarse), (max-width:767px){#queue .queue_entry.rdh-featured .rdh-url-line{display:inline-flex!important;max-width:100%;flex-wrap:wrap}#queue .rdh-video-url-pill{min-height:44px;padding:4px 10px;touch-action:manipulation;font-size:12px}}";
(d.head||d.documentElement).appendChild(style);
function urlFor(row){
 const original=row.querySelector("a.qbtn-original[href]");
 const media=w.jQuery?.(row).data("media");
 let raw=original?.getAttribute("href");
 if(!raw&&media&&typeof w.formatURL==="function"){try{raw=w.formatURL(media)}catch(e){}}
 if(!raw||raw==="#")return null;
 try{const url=new URL(raw);return /^(https?):$/.test(url.protocol)&&!url.username&&!url.password?url.href:null}catch(e){return null}
}
function ensure(row){
 if(!row?.matches("#queue .queue_entry.rdh-featured"))return null;
 const url=urlFor(row);if(!url)return null;
 let line=row.querySelector(".rdh-url-line");
 if(line&&line.dataset.url===url)return line;
 if(line)line.remove();
 line=d.createElement("span");line.className="rdh-url-line";line.dataset.url=url;
 const btn=d.createElement("button");btn.type="button";btn.className="rdh-video-url-pill";btn.textContent="Copy video URL";btn.title=url;
 btn.setAttribute("aria-label","Copy original video URL");
 btn.addEventListener("click",async e=>{
  e.preventDefault();e.stopPropagation();
  try{if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");await navigator.clipboard.writeText(url);btn.textContent="Copied!";w.setTimeout(()=>{btn.textContent="Copy video URL"},1400)}
  catch(err){let field=line.querySelector("input");if(!field){field=d.createElement("input");field.type="text";field.readOnly=true;field.value=url;field.setAttribute("aria-label","Original video URL");line.append(field)}field.focus();field.select();btn.textContent="Copy selected URL";}
 });
 line.append(btn);
 // Match the visible native attribution, rather than modifying native action controls.
 const attribution=[...row.querySelectorAll("span,div,small,p")].filter(el=>!el.closest(".btn-group,.rdh-url-line")&&/^\s*Added by\s*:/i.test(el.textContent)&&el.textContent.trim().length<130&&el.getClientRects().length).sort((a,b)=>a.textContent.length-b.textContent.length).find(el=>!el.querySelector(".qe_title"));
 if(attribution){
 // Keep attribution and copy control in one compact inline group even when
 // the native details container uses flex or block-level children.
 let group=attribution.querySelector(":scope > .rdh-attribution-group");
 if(!group){
  group=d.createElement("span");group.className="rdh-attribution-group";
  const nodes=[...attribution.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()||n.nodeType===1&&!n.matches(".btn-group,.rdh-url-line")&&!n.querySelector("button,a.btn,.btn-group"));
  if(nodes.length){attribution.insertBefore(group,nodes[0]);for(const n of nodes)group.append(n)}else{attribution.prepend(group)}
 }
 group.append(line);
}
 else{line.classList.add("rdh-url-fallback");row.append(line)}
 return line;
}
function targetRow(node){return node?.closest?.("#queue .queue_entry")||null}
d.addEventListener("pointerover",e=>{const row=targetRow(e.target);if(row)ensure(row)},true);
d.addEventListener("focusin",e=>{const row=targetRow(e.target);if(row)ensure(row)},true);
// Rows can be recycled; remove stale controls whenever the classifier changes or native media changes.
function refresh(){for(const line of d.querySelectorAll("#queue .rdh-url-line")){const row=line.closest(".queue_entry");if(!row?.matches(".rdh-featured")||line.dataset.url!==urlFor(row))line.remove()}for(const row of d.querySelectorAll("#queue .queue_entry.rdh-featured"))ensure(row)}
w.setInterval(refresh,1000);
})(window,document);


/* Restore RDH stylesheet identity hooks without overriding the native userlist. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhFlairHooks)return;
w.__rdhFlairHooks=true;
function userlist(){
 const $=w.jQuery;if(!$)return;
 for(const row of d.querySelectorAll("#userlist .userlist_item")){
  const name=$(row).data("name");
  if(typeof name!=="string"||!/^[a-zA-Z0-9_-]{1,40}$/.test(name))continue;
  // Native CyTube stores username in its second child. Verify its text before styling.
  const label=[...row.children].find(el=>el.textContent.trim()===name);
  if(!label)continue;
  const cls="userlist-"+name;
  for(const c of [...label.classList])if(c.startsWith("userlist-")&&c!==cls)label.classList.remove(c);
  if(!label.classList.contains(cls))label.classList.add(cls);
  if(!row.id||row.id.startsWith("useritem-")){if(row.id!=="useritem-"+name)row.id="useritem-"+name}
  if(!label.id||label.id.startsWith("userlist-")){if(label.id!==cls)label.id=cls}
 }
}
function clean(root){
 if(!root||root.nodeType!==1)return;
 const nodes=[];
 if(root.matches("[title],[data-original-title]"))nodes.push(root);
 nodes.push(...root.querySelectorAll("[title],[data-original-title]"));
 for(const el of nodes){
  if(!el.closest("#queue .queue_entry"))continue;
  for(const attr of ["title","data-original-title"]){
   if(/^\s*added\s+by\s*:/i.test(el.getAttribute(attr)||""))el.removeAttribute(attr);
  }
 }
}
function install(){
 if(!d.body||!w.jQuery)return false;
 let scheduled=false;
 function update(){scheduled=false;userlist();const queue=d.querySelector("#queue");if(queue)clean(queue)}
 function schedule(){if(!scheduled){scheduled=true;w.setTimeout(update,50)}}
 update();
 new MutationObserver(records=>{
  for(const r of records){
   if(r.target.closest?.("#userlist")||r.target.closest?.("#queue")||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches("#userlist,#queue")||n.querySelector("#userlist,#queue")))){schedule();break}
  }
 }).observe(d.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","title","data-original-title"]});
 w.setInterval(update,2000);
 return true;
}
if(!install()){let n=0;const t=w.setInterval(()=>{if(install()||++n>=120)w.clearInterval(t)},250)}
})(window,document);


/* RDH native presence notifications: no Xaekai hooks or chat renderer overrides. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhPresenceDissolve)return;
const state=w.__rdhPresenceDissolve={delay:7000,duration:850,marked:0};
const seen=new WeakSet();
const pattern=/^(?:\[\d{1,2}:\d{2}(?::\d{2})?\]\s*)?(?:\[server\]\s*:\s*)?[a-z0-9_-]{1,40}\s+(?:has\s+)?(?:joined|left|disconnected)(?:\s+(?:from\s+)?(?:the\s+)?(?:channel|room))?(?:\s+\(aliases:\s*[^)\r\n]*\))?[.!]?\s*$/i;
function install(){
 if(!d.body)return false;
 const style=d.createElement("style");style.id="rdh-presence-dissolve";
 style.textContent="#messagebuffer .rdh-presence-dissolve{overflow:hidden!important;box-sizing:border-box;transition:opacity .85s ease,max-height .85s ease,margin .85s ease,padding .85s ease,transform .85s ease,border-color .85s ease!important}"+
 "#messagebuffer .rdh-presence-fading{opacity:0!important;max-height:0!important;min-height:0!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important;border-color:transparent!important;transform:translateY(-3px);pointer-events:none!important}"+
 "@media(prefers-reduced-motion:reduce){#messagebuffer .rdh-presence-dissolve{transition:opacity .15s linear!important}}";
 (d.head||d.documentElement).appendChild(style);
 function mark(row){
  if(!row||seen.has(row)||row.parentElement?.id!=="messagebuffer")return;
  // The native server renderer may use escaped [server] class names.
  const serverClass=[...row.classList].some(c=>c.startsWith("chat-msg-")&&c.slice(9).replace(/[^a-z]/gi,"").toLowerCase()==="server");
  const typed=row.matches(".server-msg,.server-whisper")||!!row.querySelector(".server-whisper,.server-msg");
  if(!serverClass&&!typed)return;
  // Timestamp and message can each carry server-whisper; inspect the full row,
  // not the first matching span (which is often just the timestamp).
  const text=(row.textContent||"").replace(/\s+/g," ").trim();
  if(!pattern.test(text))return;
  seen.add(row);state.marked++;row.dataset.rdhPresenceDissolve="pending";
  w.setTimeout(()=>{
   if(!row.isConnected)return;
   row.style.maxHeight=row.getBoundingClientRect().height+"px";
   row.classList.add("rdh-presence-dissolve");void row.offsetHeight;
   row.dataset.rdhPresenceDissolve="fading";row.classList.add("rdh-presence-fading");
   w.setTimeout(()=>{if(row.isConnected&&row.dataset.rdhPresenceDissolve==="fading")row.remove()},state.duration+80);
  },state.delay);
 }
 function scan(){const b=d.getElementById("messagebuffer");if(b)for(const row of b.children)mark(row)}
 let queued=false;
 function schedule(){if(!queued){queued=true;w.setTimeout(()=>{queued=false;scan()},30)}}
 scan();
 new MutationObserver(records=>{
  for(const r of records){const el=r.target.nodeType===1?r.target:r.target.parentElement;if(el?.closest("#messagebuffer")||[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==="messagebuffer"||n.querySelector("#messagebuffer")))){schedule();break}}
 }).observe(d.body,{childList:true,subtree:true,characterData:true});
 return true;
}
if(!install()){let n=0;const t=w.setInterval(()=>{if(install()||++n>=120)w.clearInterval(t)},250)}
})(window,document);


/* RDH clickable newsletter commands. A deliberate click sends the same
   chat command as typing it; the bot's existing private reply is unchanged. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhNewsletterCommands)return;
const state=w.__rdhNewsletterCommands={lastSend:0};
const commands=new Set(["!won","!torch"]);
function install(){
 if(!d.body)return false;
 const style=d.createElement("style");style.id="rdh-newsletter-command-style";
 style.textContent="#motd .rdh-newsletter-command{display:inline-flex!important;align-items:center;justify-content:center;vertical-align:baseline;padding:2px 7px;margin:0 2px;border:1px solid #397f90;border-radius:4px;background:#102c35;color:#a1f9ff;font:inherit;font-weight:700;line-height:1.3;cursor:pointer;white-space:nowrap}"+
 "#motd .rdh-newsletter-command:hover,#motd .rdh-newsletter-command:focus-visible{color:#fff;border-color:#7df3ff;background:#194653;outline-offset:2px}"+
 "#motd .rdh-newsletter-status{display:block;color:#a1f9ff;font-size:11px;line-height:1.4;margin-top:4px}"+
 "@media (pointer:coarse),(hover:none){#motd .rdh-newsletter-command{min-height:44px;min-width:44px;padding:4px 9px;touch-action:manipulation}}";
 (d.head||d.documentElement).appendChild(style);
 function status(rules,msg){
  const host=d.querySelector("#motd .rdh-newsletter-controls")?.parentElement||rules;
  let el=host.querySelector(".rdh-newsletter-status");
  if(!el){el=d.createElement("span");el.className="rdh-newsletter-status";el.setAttribute("role","status");el.setAttribute("aria-live","polite");(host===rules?(rules.querySelector(":scope > div")||rules):host).append(el)}
  el.textContent=msg;
 }
 function wire(){
  const motd=d.getElementById("motd");if(!motd)return;
  const rules=[...motd.querySelectorAll("details")].find(e=>/House Rules/i.test(e.querySelector("summary")?.textContent||""));if(!rules)return;
  for(const el of [...motd.querySelectorAll(".rdh-newsletter-controls b,.rdh-newsletter-controls strong,.rdh-newsletter-controls code,details b,details strong,details code")]){
   const cmd=el.textContent.trim().toLowerCase();
   if(!commands.has(cmd)||el.closest(".rdh-newsletter-command")||!el.parentElement)continue;
   const btn=d.createElement("button");btn.type="button";btn.className="rdh-newsletter-command";btn.dataset.command=cmd;btn.textContent=cmd;
   btn.setAttribute("aria-label",cmd==="!won"?"Request Wrestling Observer newsletter link":"Request Pro Wrestling Torch newsletter link");
   btn.addEventListener("click",e=>{
    e.preventDefault();e.stopPropagation();
    if(!w.socket?.connected||!w.CLIENT?.logged_in){status(rules,"Sign in and connect to chat to request a newsletter.");return}
    const now=Date.now();if(now-state.lastSend<2500){status(rules,"Please wait a moment before requesting again.");return}
    try{
     w.socket.emit("chatMsg",{msg:cmd,meta:{}});
     state.lastSend=now;status(rules,"Request sent. Check your private messages for the bot's reply.");
    }catch(err){status(rules,"Could not send the request. Try again when connected.")}
   });
   el.replaceWith(btn);
  }
 }
 let queued=false;
 const schedule=()=>{if(!queued){queued=true;w.setTimeout(()=>{queued=false;wire()},40)}};
 wire();
 new MutationObserver(records=>{
  if(records.some(r=>r.target.closest?.("#motd")||[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==="motd"||n.querySelector("#motd")))))schedule();
 }).observe(d.body,{childList:true,subtree:true});
 return true;
}
if(!install()){let n=0;const t=w.setInterval(()=>{if(install()||++n>=120)w.clearInterval(t)},250)}
})(window,document);


/* Legacy filter output compatibility. Native Baked chat stays authoritative. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhMediaCompat)return;
const state=w.__rdhMediaCompat={videos:0,audio:0};
const scope="#messagebuffer,#pmbar,.baked-pm-messages";
function url(raw){try{const u=new URL(raw);return /^(https?):$/.test(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}
function senderRank(el){
 const row=el.closest('[class*="chat-msg-"]');
 const cls=[...(row?.classList||[])].find(x=>x.startsWith("chat-msg-"));
 const name=cls?.slice(9);if(!name||!w.jQuery)return -2;
 try{const item=typeof w.findUserlistItem==="function"?w.findUserlistItem(name):null;const rank=item&&Number(w.jQuery(item).data("rank"));return Number.isFinite(rank)?rank:-2}catch{return -2}
}
function video(img){
 let source=url(img.getAttribute("data-src")||img.getAttribute("src"));
 if(!source)return;
 const rank=senderRank(img),flags=img.getAttribute("data-params")||"";
 const el=d.createElement("video");el.className="webm rdh-embedded-video";el.preload="none";el.playsInline=true;el.controls=!(rank>=2&&flags.includes("c"));el.muted=!(rank>=1&&flags.includes("m"));el.loop=rank>=1&&flags.includes("l");el.autoplay=rank>=1&&flags.includes("a")&&(el.muted||rank>=2);el.volume=.33;
 if(img.classList.contains("imgur")){
  const u=new URL(source);if(u.hostname!=="i.imgur.com")return;
  u.pathname=u.pathname.replace(/\.(?:gifv|mp4|webm)$/i,"");
  for(const ext of ["mp4","webm"]){const child=d.createElement("source");child.src=u.href.replace(/([?#].*)?$/,(_,tail)=>"."+ext+(tail||""));child.type="video/"+ext;el.append(child);}
 }else el.src=source;
 const anchor=img.closest("a");if(anchor){anchor.after(el);img.remove();if(!anchor.textContent.trim()&&!anchor.querySelector("span")){anchor.textContent="Open video";}}else img.replaceWith(el);
 state.videos++;
}
function sound(span){
 if(span.classList.contains("rdh-media-parsed")||span.querySelector("audio"))return;
 const source=url((span.getAttribute("data-proto")||"")+(span.getAttribute("data-path")||""));if(!source)return;
 const audio=d.createElement("audio");audio.preload="none";audio.volume=.4;audio.src=source;audio.controls=true;audio.className="rdh-embedded-audio";
 // Do not create unrestricted autoplay from anonymous/unknown senders.
 if(span.classList.contains("autoplay")&&senderRank(span)>=1)audio.autoplay=true;
 span.classList.add("rdh-media-parsed","parsed");span.style.removeProperty("display");span.append(audio);state.audio++;
}
function install(){
 if(!d.body)return false;
 const style=d.createElement("style");style.id="rdh-media-compat-style";style.textContent="#messagebuffer video.rdh-embedded-video,#pmbar video.rdh-embedded-video,.baked-pm-messages video.rdh-embedded-video{display:block;max-width:100%;max-height:360px;height:auto} .rdh-media-parsed{display:inline-block!important;max-width:100%;vertical-align:middle} .rdh-embedded-audio{display:block;max-width:100%;width:250px;height:38px}";
 (d.head||d.documentElement).append(style);
 function scan(){for(const root of d.querySelectorAll(scope)){root.querySelectorAll("img.webm").forEach(video);root.querySelectorAll(".sound-embed:not(.rdh-media-parsed)").forEach(sound)}}
 let queued=false;function schedule(){if(!queued){queued=true;w.setTimeout(()=>{queued=false;scan()},30)}}
 scan();new MutationObserver(records=>{if(records.some(r=>r.target.closest?.(scope)||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches(scope)||n.querySelector(scope)))))schedule()}).observe(d.body,{childList:true,subtree:true});
 return true;
}
if(!install()){let n=0;const t=w.setInterval(()=>{if(install()||++n>=120)w.clearInterval(t)},250)}
})(window,document);


/* RDH chat editing hotkeys: scoped to chat/PM inputs, no legacy moderation hooks. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhChatHotkeys)return;
w.__rdhChatHotkeys={version:"1.0"};
const isInput=e=>!!e?.matches?.("#chatline,.pm-input")&&typeof e.selectionStart==="number"&&!e.disabled&&!e.readOnly;
const plain={p:".pic",b:"**",i:"__",s:"spoiler",m:"flop",f:"flip","/":"tilt-forward","\\":"tilt-reverse","\x60":"~~"};
const shifted={b:"blur",s:"shake"};
const braced=new Set(["spoiler","flop","flip","tilt-forward","tilt-reverse","blur","shake"]);
let shift=false;
function edit(el,insert,start,end,selectStart,selectEnd){
 el.setRangeText(insert,start,end,"end");
 el.setSelectionRange(selectStart,selectEnd);
 el.dispatchEvent(new Event("input",{bubbles:true}));
}
w.addEventListener("keydown",e=>{
 shift=e.shiftKey||e.key==="Shift";
 if(!isInput(e.target)||!e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
 const key=e.key.toLowerCase(),tag=(e.shiftKey?shifted:plain)[key];if(!tag)return;
 const el=e.target,start=el.selectionStart,end=el.selectionEnd,selected=el.value.slice(start,end);
 const wrap=braced.has(tag),suffix=tag===".pic",open=suffix?"":wrap?"["+tag+"]\u200a":tag,close=suffix?tag:wrap?"\u200a[/"+tag+"]":tag;
 const replacement=open+selected+close;
 const caret=suffix?start+replacement.length:start+open.length;
 e.preventDefault();e.stopImmediatePropagation();
 edit(el,replacement,start,end,caret,selected&&!suffix?caret+selected.length:caret);
},true);
w.addEventListener("keyup",e=>{shift=e.shiftKey&&e.key!=="Shift"},true);
w.addEventListener("blur",()=>{shift=false});
w.addEventListener("paste",e=>{
 const el=e.target;if(!isInput(el)||!shift)return;
 const text=e.clipboardData?.getData("text/plain");if(!text||text!==text.trim())return;
 let u;try{u=new URL(text)}catch{return}
 if(!/^https?:$/.test(u.protocol)||u.username||u.password||!/\.(?:png|gif|jpe?g|webp|avif)$/i.test(u.pathname))return;
 const start=el.selectionStart,end=el.selectionEnd,out=text+".pic";
 e.preventDefault();e.stopImmediatePropagation();edit(el,out,start,end,start+out.length,start+out.length);
},true);
})(window,document);
