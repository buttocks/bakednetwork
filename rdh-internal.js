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
            "Welcome to The Hideout! Please add wrestling related podcasts to the playlist!"
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
   Auto-collapse MOTD after 20 seconds
   --------------------------------------------------------- */
(function () {
    var motdTimer = null;

    function scheduleMotdCollapse() {
        clearTimeout(motdTimer);

        motdTimer = setTimeout(function () {
            var $motd = $("#motd");

            if ($motd.length && $motd.is(":visible")) {
                $motd.stop(true, true).slideUp(350);
            }
        }, 20000);
    }

    scheduleMotdCollapse();
})();
