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
        version: "0.1.27",
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




    /* ---------------------------------------------------------
       Preserve the original working legacy Embiggen behavior.
       The Pink Horse module destroys its button on modal close,
       so capture a handler-preserving clone before use and
       restore only the button if the original disappears.
       No observers, no polling, no wrapper movement.
       --------------------------------------------------------- */
    modern.register("legacyEmbiggenKeeper", {
        namespace: ".rdhLegacyEmbiggen",
        template: null,

        findButton: function () {
            let $found = $();

            $("button, a.btn, input[type='button']").each(function () {
                const $el = $(this);
                const text = [
                    $el.text(),
                    $el.attr("title"),
                    $el.attr("aria-label"),
                    $el.val()
                ].filter(Boolean).join(" ");

                if (/embiggen\s+emote\s+list/i.test(text)) {
                    $found = $el;
                    return false;
                }
            });

            return $found;
        },

        captureTemplate: function () {
            const $live = this.findButton();
            if (!$live.length) return;

            $live.addClass("rdh-legacy-embiggen");
            this.template = $live.clone(true, true);
            this.template
                .removeAttr("id")
                .removeClass("hidden invisible")
                .addClass("rdh-legacy-embiggen")
                .prop("hidden", false)
                .attr("aria-hidden", "false")
                .css({
                    display: "",
                    visibility: "",
                    opacity: ""
                });
        },

        placeLiveButton: function () {
            const $live = this.findButton();
            const $macros = $("#emotelistbtn");

            if (!$live.length || !$macros.length) return;

            $live
                .addClass("rdh-legacy-embiggen")
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

            this.captureTemplate();
        },

        restoreIfMissing: function () {
            const $macros = $("#emotelistbtn");
            if (!$macros.length) return;

            const $live = this.findButton();
            if ($live.length) {
                this.placeLiveButton();
                return;
            }

            if (!this.template || !this.template.length) return;

            const $clone = this.template.clone(true, true);
            $clone
                .removeAttr("id")
                .removeClass("hidden invisible")
                .addClass("rdh-legacy-embiggen")
                .prop("hidden", false)
                .attr("aria-hidden", "false")
                .css({
                    display: "",
                    visibility: "",
                    opacity: ""
                })
                .insertAfter($macros);
        },

        start: function () {
            const self = this;

            setTimeout(function () {
                self.placeLiveButton();
            }, 300);

            $(document)
                .off(self.namespace)
                .on("mousedown" + self.namespace + " pointerdown" + self.namespace, "button, a.btn, input[type='button']", function () {
                    const $el = $(this);
                    const text = [
                        $el.text(),
                        $el.attr("title"),
                        $el.attr("aria-label"),
                        $el.val()
                    ].filter(Boolean).join(" ");

                    if (/embiggen\s+emote\s+list/i.test(text)) {
                        self.captureTemplate();
                    }
                })
                .on("click" + self.namespace, "button, a.btn, input[type='button']", function () {
                    const $el = $(this);
                    const text = [
                        $el.text(),
                        $el.attr("title"),
                        $el.attr("aria-label"),
                        $el.val()
                    ].filter(Boolean).join(" ");

                    if (/embiggen\s+emote\s+list/i.test(text)) {
                        setTimeout(function () {
                            self.restoreIfMissing();
                        }, 0);
                        setTimeout(function () {
                            self.restoreIfMissing();
                        }, 100);
                    }
                })
                .on("hidden.bs.modal" + self.namespace, "#emotelist", function () {
                    setTimeout(function () {
                        self.restoreIfMissing();
                    }, 0);
                })
                .on("shown.bs.modal" + self.namespace, "#emotelist", function () {
                    setTimeout(function () {
                        self.captureTemplate();
                    }, 0);
                })
                .on("click" + self.namespace, "#emotelistbtn", function () {
                    setTimeout(function () {
                        self.placeLiveButton();
                    }, 200);
                });
        },

        stop: function () {
            $(document).off(this.namespace);
            this.template = null;
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
    modern.start("legacyEmbiggenKeeper");

    console.info(
        "[RDH Modern] Migration layer loaded. Legacy module loader remains intact."
    );
})();
