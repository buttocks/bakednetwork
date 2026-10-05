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
        version: "0.1.0",
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
       Playlist premium title highlighter
       Marks the recurring shows people come to RDH for.
       --------------------------------------------------------- */
    modern.register("premiumPlaylist", {
        observer: null,
        timer: null,

        patterns: [
            /(^|[^a-z0-9])WOR([^a-z0-9]|$)/i,
            /(^|[^a-z0-9])B\s*&\s*V([^a-z0-9]|$)/i,
            /(^|[^a-z0-9])LTBH([^a-z0-9]|$)/i,
            /castrating\s+the\s+marks/i
        ],

        isPremiumTitle: function (title) {
            return this.patterns.some(function (pattern) {
                return pattern.test(title);
            });
        },

        scan: function () {
            const self = this;

            $("#queue li.queue_entry, #queue .queue_entry").each(function () {
                const $entry = $(this);
                const $title = $entry.find(".qe_title").first();
                const title = ($title.length ? $title.text() : $entry.text()).trim();
                const premium = self.isPremiumTitle(title);
                const hasPremium = $entry.hasClass("rdh-premium-video");

                // Only touch the DOM when the state actually changes.
                // This avoids MutationObserver feedback loops that can make
                // legacy playlist hover previews flicker.
                if (premium !== hasPremium) {
                    $entry.toggleClass("rdh-premium-video", premium);
                }

                if ($title.length) {
                    const titleHasPremium = $title.hasClass("rdh-premium-title");
                    if (premium !== titleHasPremium) {
                        $title.toggleClass("rdh-premium-title", premium);
                    }
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

            const queue = document.getElementById("queue");
            if (!queue) return;

            self.observer = new MutationObserver(function () {
                self.scheduleScan();
            });

            self.observer.observe(queue, {
                childList: true,
                subtree: true,
                characterData: true
            });
        },

        stop: function () {
            clearTimeout(this.timer);
            if (this.observer) this.observer.disconnect();
            this.observer = null;
            $("#queue .rdh-premium-video").removeClass("rdh-premium-video");
            $("#queue .rdh-premium-title").removeClass("rdh-premium-title");
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

    console.info(
        "[RDH Modern] Migration layer loaded. Legacy module loader remains intact."
    );
})();
