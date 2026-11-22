# WWE / WWF Ringside v1.2 — Baked.live

A standalone WWE/WWF visual skin that works **beside** WrestleTube's existing channel logic. New filter shortcuts are namespaced to prevent them from hijacking ordinary emote names.

## Existing channel functions — keep these

Keep the existing self-hosted channel-internal.js from this release **in its current channel slot**:

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/channel-internal.js

It contains the original 25 Xaekai module definitions, `scrollQueue()`, chat username/emote clicking, navbar autohide, and native button behavior. The WWE/WWF `skin.js` supplies only the new UI, reusing the original scroll and native buttons where available. Do not load two separate copies of the module loader.

## Files

- `skin.css`: Original WrestleTube external chat-effect CSS followed by the WWE/WWF dark arena skin, with real WWF and WWE background logo watermarks and a toggle.
- `skin.js`: Arena UI, now-playing, the Attitude/Modern theme toggle, logos toggle, cinema mode, shortcuts to native Mod Menu, Macros and Search, and share button.
- `filters.json`: **206 filters**: the **153 original WrestleTube rules in their original order and unchanged**, then **53 new WWE/WWF rules**. This is an importable Baked.live/CyTube-style JSON array.

## Chat filters — avoiding emote collisions

The new **47 chat-shortcut rules no longer use `:wwf:`, `:rko:`, `:what:` etc.** Those short tokens could already be actual channel emote names. Instead, each new shortcut has two equivalent, isolated forms:

- **Named** `:wtfx_wwf:`, `:wtfx_rko:`, `:wtfx_316:`, `:wtfx_what:`
- **Numbered** `:wtfx001:`, `:wtfx016:`, `:wtfx015:`, `:wtfx037:` respectively

The numbers correspond to the order of the 47 new wrestling shortcuts in `filters.json`, not to original WrestleTube filters. The other six new formatting rules use `[promo]`, `[heel]`, `[face]`, `[gold]`, `[chant]`, and `[ringspoiler]` tags. `[ringspoiler]` avoids the original `[spoiler]` filter. The original 153 rules are preserved as-is; some of them are intentionally emote-specific and were not renamed.

Aliases have been checked against the **153 preserved legacy filter patterns**: no legacy filter that compiles as a JavaScript RegExp matches any new alias. Actual channel emotes should still be checked against the namespaced aliases if you add new emotes later.

**Replace** the channel's current filter JSON with this merged array after making a backup; do not append the 206 rules to an already-installed set or you will duplicate filters. CSS and JS URLs do not import filters automatically.

## Logos

- Historic WWF block logo: https://commons.wikimedia.org/wiki/File:World_Wrestling_Federation_block_logo.svg
- Modern WWE white logo: https://commons.wikimedia.org/wiki/File:WWE_white_logo.svg

They are displayed via Wikimedia Commons SVG URLs as low-opacity background graphics. These remain third-party trademarks, used here for an unofficial fan channel, with no WWE affiliation implied.

## Installation and validation

Use the pinned commit `skin.js` and `skin.css` URLs shown in the release chat in the external JavaScript and external CSS settings of your WWE/WWF Baked.live tube. Keep the original channel internal JavaScript where it already lives. Hard-refresh after saving, and test Mod Menu, emotes, the filter import, chat effects, logos and queue scrolling in a test session.

The revised JS passes `node --check` and the new rule regexps validate under JavaScript. Six preserved legacy rules have unsupported PCRE syntax in JavaScript; these old rules were left unchanged rather than silently rewritten. Live channel testing is still required.