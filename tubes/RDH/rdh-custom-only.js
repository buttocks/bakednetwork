/* RDH custom-only channel layer. No Xaekai modules or native playlist overrides. */
(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhCustomOnly)return;
function init(){
 if(!w.CHANNEL?.name||!w.CLIENT||!w.jQuery||!w.socket||!d.body)return false;
 if(w.__rdhCustomOnly)return true;
 const $=w.jQuery, RDH=w[w.CHANNEL.name]=w[w.CHANNEL.name]||{};
 w.__rdhCustomOnly={version:"1.0.0",ready:false};
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
        version: "0.1.28",
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
       MOTD collapse
       --------------------------------------------------------- */
    modern.register("motdCollapse", {
        timer: null,

        start: function () {
            this.timer = setTimeout(function () {
                const $motd = $("#motd");
                if ($motd.length && $motd.is(":visible")) {
                    const $toggle = $("#togglemotd");
                    if ($toggle.length) {
                        // Let CyTube synchronize the native plus/minus icon.
                        $toggle.trigger("click");
                    } else {
                        $motd.stop(true, true).slideUp(350);
                    }
                }
            }, 20000);
        },

        stop: function () {
            clearTimeout(this.timer);
            this.timer = null;
        }
    });



    /* ---------------------------------------------------------
       MOTD newsletter and House Rules dropdowns.
       Reuses the existing links and House Rules details element.
       --------------------------------------------------------- */
    modern.register("motdDropdowns", {
        observer: null,

        apply: function () {
            const motd = document.getElementById("motd");
            if (!motd || motd.querySelector("#rdh-motd-actions")) return;

            const rules = Array.from(motd.querySelectorAll("details")).find(function (entry) {
                const summary = entry.querySelector("summary");
                return summary && /house rules/i.test(summary.textContent);
            });
            if (!rules) return;

            // Find the newsletter heading as a text node, not a layout-dependent selector.
            const walker = document.createTreeWalker(motd, 4);
            let titleNode = null;
            let node;
            while ((node = walker.nextNode())) {
                if (/^latest newsletters:?$/i.test(node.textContent.trim())) {
                    titleNode = node;
                    break;
                }
            }
            if (!titleNode || !titleNode.parentElement) return;

            // Keep all existing PDF links and the chat-command note intact.
            let panel = null;
            for (let candidate = titleNode.parentElement;
                 candidate && candidate !== motd;
                 candidate = candidate.parentElement) {
                if (candidate.contains(rules)) break;
                const linkNames = Array.from(candidate.querySelectorAll("a[href]"))
                    .map(function (a) { return a.textContent.toLowerCase(); });
                if (linkNames.some(function (s) { return s.includes("wrestling observer newsletter"); }) &&
                    linkNames.some(function (s) { return s.includes("pro wrestling torch newsletter"); })) {
                    panel = candidate;
                    break;
                }
            }
            if (!panel || !panel.parentNode) return;

            const controls = document.createElement("div");
            controls.id = "rdh-motd-actions";

            const newsletters = document.createElement("details");
            newsletters.id = "rdh-newsletters";
            const summary = document.createElement("summary");
            summary.appendChild(document.createTextNode("Latest Newsletters"));
            const caret = document.createElement("span");
            caret.className = "rdh-news-caret";
            caret.setAttribute("aria-hidden", "true");
            caret.textContent = "▾";
            summary.appendChild(caret);

            const content = document.createElement("div");
            content.className = "rdh-newsletter-content";
            panel.classList.add("rdh-newsletter-original");
            const heading = titleNode.parentElement;
            if (heading !== panel && heading.textContent.trim().toLowerCase() === "latest newsletters") {
                heading.classList.add("rdh-newsletter-old-title");
            } else if (heading === panel) {
                titleNode.textContent = "";
            }

            panel.parentNode.insertBefore(controls, panel);
            content.appendChild(panel);
            newsletters.appendChild(summary);
            newsletters.appendChild(content);
            controls.appendChild(newsletters);
            controls.appendChild(rules);

            // Both controls start folded; native details manages their toggling.
            newsletters.open = false;
            rules.open = false;
        },

        start: function () {
            const motd = document.getElementById("motd");
            if (!motd) return;
            this.apply();
            const self = this;
            this.observer = new MutationObserver(function () {
                if (!motd.querySelector("#rdh-motd-actions")) self.apply();
            });
            this.observer.observe(motd, { childList: true, subtree: true });
        },

        stop: function () {
            if (this.observer) this.observer.disconnect();
            this.observer = null;
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
    modern.start("motdCollapse");
    modern.start("motdDropdowns");
    modern.start("premiumPlaylist");
})();
 }catch(e){console.error("[RDH] custom modules",e)}
 w.__rdhCustomOnly.ready=!!RDH.modern?.modules?.premiumPlaylist?.started;
 return true;
}
if(!init()){let n=0;const t=w.setInterval(()=>{if(init()||++n>=120)w.clearInterval(t)},250)}
})(window,document);
