/*!
 * Baked.live Channel: Real Dads Hideout
 * Channel helper / module loader
 */

(function () {
    "use strict";

    window[CHANNEL.name] = window[CHANNEL.name] || {};
    const RDH = window[CHANNEL.name];

    /* ---------------------------------------------------------
       Favicon
       --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Scroll playlist to current item
       --------------------------------------------------------- */
    $("#scroll-btn").remove();

    $("<button>", {
        id: "scroll-btn",
        class: "btn btn-sm btn-default",
        title: "Scroll playlist to current item",
        type: "button"
    })
        .append('<span class="glyphicon glyphicon-hand-right"></span>')
        .prependTo("#videocontrols")
        .on("click", function () {
            if (typeof scrollQueue === "function") {
                scrollQueue();
            }
        });

    /* ---------------------------------------------------------
       Xaekai sequenced module loader
       --------------------------------------------------------- */
    const moduleLoader = {
        options: {
            designator: {
                prefix: "geeeek-",
                delay: 90 * 1000
            },

            playlist: {
                collapse: true,
                hidePlaylist: true,
                inlineBlame: true,
                moveReporting: true,
                quickQuality: false,
                recentMedia: true,
                simpleLeader: true,
                syncCheck: true,
                thumbnails: true,
                timeEstimates: true,
                volumeControl: false
            },

            chatext: {
                persistIgnore: true,
                smartScroll: true,
                maxMessages: 220
            },

            userlist: {
                autoHider: true
            },

            various: {
                notepad: true,
                emoteToggle: true
            }
        },

        modules: {
            settings: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_settings.min.js"
            },
            audio: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/oldjs/external_audiolib.js"
            },
            privmsg: {
                active: 1,
                rank: 1,
                url: "https://resources.pink.horse/js/module_privmsg.min.js"
            },
            whispers: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_whispers.js"
            },
            userlist: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_userlist.min.js"
            },
            md5hash: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_md5.min.js"
            },
            designator: {
                active: 0,
                rank: -1,
                url: "https://resources.pink.horse/js/module_designator.min.js"
            },
            playlist: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_playlist.min.js"
            },
            notifier: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_alerts.min.js"
            },
            chatline: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_chatline.min.js"
            },
            chatext: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_chatext.min.js"
            },
            colormap: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_colormap.min.js"
            },
            unimoji: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_unimoji.min.js"
            },
            chatcolor: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_chatcolor.min.js"
            },
            dectalk: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_tts.min.js"
            },
            hotkeys: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_hotkeys.min.js"
            },
            layout: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_layout.min.js"
            },
            various: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_various.min.js"
            },
            embedmedia: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_embedmedia.min.js"
            },
            ci_library: {
                active: 0,
                rank: -1,
                url: "https://resources.pink.horse/js/library_chaticons.min.js"
            },
            time: {
                active: 1,
                rank: -1,
                url: "https://resources.pink.horse/js/module_time.min.js"
            }
        },

        index: [],
        position: 0,

        initialize: function () {
            if (CLIENT.modules) {
                return;
            }

            CLIENT.modules = this;
            RDH.modulesOptions = this.options;
            this.index = Object.keys(this.modules);

            console.info("[RDH Modules] Begin loading.");
            this.loadNext();
        },

        loadNext: function () {
            if (this.position >= this.index.length) {
                console.info("[RDH Modules] Loading complete.");
                return;
            }

            const key = this.index[this.position++];
            const module = this.modules[key];

            if (!module.active) {
                this.loadNext();
                return;
            }

            if (module.rank > CLIENT.rank) {
                if (module.rank === 0 && CLIENT.rank === -1) {
                    socket.once("login", (data) => {
                        if (data && data.success) {
                            $.getScript(module.url);
                        }
                    });
                }

                this.loadNext();
                return;
            }

            console.info("[RDH Modules] Loading:", key);

            $.getScript(module.url)
                .done(() => this.loadNext())
                .fail((jqxhr, settings, error) => {
                    console.error("[RDH Modules] Failed:", key, error || "unknown error");
                    this.loadNext();
                });
        }
    };

    moduleLoader.initialize();

    /* ---------------------------------------------------------
       Client-side Giphy command
       Usage: $giphy search terms
       --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Channel defaults
       --------------------------------------------------------- */
    function applyChannelDefaults() {
        if (!window.USEROPTS) {
            return;
        }

        USEROPTS.sort_rank = 1;
        USEROPTS.sort_afk = 1;
        USEROPTS.layout = "fluid";
    }

    applyChannelDefaults();
    setTimeout(applyChannelDefaults, 1500);
    setTimeout(applyChannelDefaults, 5000);

    /* ---------------------------------------------------------
       Interface labels
       --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       Click an emote to append its code to the chat line
       --------------------------------------------------------- */
    $("#chatwrap")
        .off("click.rdhEmote", ".channel-emote")
        .on("click.rdhEmote", ".channel-emote", function (event) {
            event.preventDefault();

            const $chatline = $("#chatline");
            const code = $(this).attr("title");

            if (!code) {
                return;
            }

            $chatline.val(($chatline.val() || "") + code + " ");
            $chatline.trigger("focus");
        });

    /* ---------------------------------------------------------
       Click a username to append it to the chat line
       --------------------------------------------------------- */
    $("#messagebuffer")
        .off("click.rdhUsername", ".username")
        .on("click.rdhUsername", ".username", function (event) {
            event.preventDefault();

            const $chatline = $("#chatline");
            const username = $(this).text().trim();

            if (!username) {
                return;
            }

            $chatline.val(($chatline.val() || "") + username + " ");
            $chatline.trigger("focus");
        });
})();

/* ---------------------------------------------------------
   RDH modern migration layer
   Bundled directly into the channel script so Baked does not
   need to load a second external script for playlist tagging.
   --------------------------------------------------------- */

/*!
 * RDH Modern Modules
 * Safe migration layer for Real Dad's Hideout.
 * Legacy modules stay active until an RDH replacement is explicitly enabled.
 */
(function () {
    "use strict";

    if (!window.CHANNEL || !window.CLIENT || !window.jQuery) return;

    const $ = window.jQuery;
    const RDH = window[CHANNEL.name] = window[CHANNEL.name] || {};

    if (RDH.modern && RDH.modern.loaded) return;

    const modern = RDH.modern = {
        loaded: true,
        version: "0.1.19",
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
                    $motd.stop(true, true).slideUp(350);
                }
            }, 20000);
        },

        stop: function () {
            clearTimeout(this.timer);
            this.timer = null;
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
            { key: "ltbh", pattern: /(?:^|[^a-z0-9])LTB\s*&?\s*H(?:[^a-z0-9]|$)|lance\s+storm.*bryan\s+alvarez/i },
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
            if (upper.startsWith("LTB&H") || upper.startsWith("LTBH") || upper.startsWith("LTB & H")) return "ltbh";
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
            self.interval = setInterval(function () {
                self.ensureButton();
            }, 5000);

            $(document)
                .off("click.rdhEmbiggenRecovery", "#emotelistbtn")
                .on("click.rdhEmbiggenRecovery", "#emotelistbtn", function () {
                    setTimeout(function () {
                        self.ensureButton();
                    }, 100);
                });

            $(document)
                .off(
                    "shown.bs.modal.rdhEmbiggen hidden.bs.modal.rdhEmbiggen",
                    "#emotelist"
                )
                .on(
                    "shown.bs.modal.rdhEmbiggen hidden.bs.modal.rdhEmbiggen",
                    "#emotelist",
                    function () {
                        setTimeout(function () {
                            self.ensureButton();
                        }, 100);
                    }
                );
        },

        stop: function () {
            clearInterval(this.interval);
            this.interval = null;

            $(document).off(".rdhEmbiggen").off(".rdhEmbiggenRecovery");
            $("#" + this.buttonId).off(".rdhEmbiggen").remove();
            $("#emotelist").removeClass("rdh-emotelist-large");
        }
    });

    /*
     * SAFE MIGRATION FLAGS
     *
     * These features are ours and are safe to run beside the legacy modules.
     * No legacy Xaekai module is disabled here.
     */
    modern.start("diagnostics");
    modern.start("emotes");
    modern.start("motdCollapse");
    modern.start("premiumPlaylist");
    modern.start("embiggenEmotes");

    console.info(
        "[RDH Modern] Migration layer loaded. Legacy module loader remains intact."
    );
})();
