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
        version: "0.1.3",
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

        types: [
            { key: "wor",  pattern: /(?:^|[^a-z0-9])WOR(?:[^a-z0-9]|$)|wrestling\s+observer\s+radio/i },
            { key: "f4d",  pattern: /(?:^|[^a-z0-9])F4D(?:[^a-z0-9]|$)|filthy\s+four\s+daily/i },
            { key: "ad",   pattern: /(?:^|[^a-z0-9])AFTER\s+DARK(?:\s+RADIO)?(?:[^a-z0-9]|$)/i },
            { key: "ltbh", pattern: /(?:^|[^a-z0-9])LTB\s*&?\s*H(?:[^a-z0-9]|$)|lance\s+storm.*bryan\s+alvarez/i },
            { key: "bv",   pattern: /(?:^|[^a-z0-9])B\s*&\s*V(?:[^a-z0-9]|$)|(?:^|[^a-z0-9])BVT(?:[^a-z0-9]|$)|big\s+vinny\s+v|^\s*bryan\s*(?:&|and)\s+/i },
            { key: "ctm",  pattern: /castrating\s+the\s+marks/i }
        ],

        getType: function (title) {
            for (let i = 0; i < this.types.length; i++) {
                if (this.types[i].pattern.test(title)) return this.types[i].key;
            }
            return "";
        },

        scan: function () {
            const self = this;
            const typeClasses = "rdh-featured rdh-featured-wor rdh-featured-bv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc";

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
            $("#queue .rdh-featured, #queue [class*='rdh-featured-']")
                .removeClass("rdh-featured rdh-featured-wor rdh-featured-bv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc");
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
