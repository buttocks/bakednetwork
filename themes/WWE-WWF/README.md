# WWE / WWF Ringside v1.5 — Baked.live

A standalone WWE/WWF visual skin that works **beside** WrestleTube's existing channel logic. New filter shortcuts use ordinary emote-style names with collision-safe numbered suffixes.

## Existing channel functions — keep these

Keep the existing self-hosted channel-internal.js from this release **in its current channel slot**:

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/channel-internal.js

It contains the original 25 Xaekai module definitions, `scrollQueue()`, chat username/emote clicking, navbar autohide, and native button behavior. The WWE/WWF `skin.js` supplies only the new UI, reusing the original scroll and native buttons where available. Do not load two separate copies of the module loader.

## Files

- `skin.css`: Original WrestleTube external chat-effect CSS followed by the WWE/WWF dark arena skin, with real WWF and WWE background logo watermarks and a toggle.
- `skin.js`: Arena UI, now-playing, the Attitude/Modern theme toggle, logos toggle, cinema mode, shortcuts to native Mod Menu and Macros, and share button.
- `filters.json`: **206 filters**: the **153 original WrestleTube rules in their original order and unchanged**, then **53 new WWE/WWF rules**. This is an importable Baked.live/CyTube-style JSON array.

## Chat filters — normal triggers without emote collisions

The **47 new wrestling shortcuts** use standard emote-style triggers. Where an emote already owns a name, the filter uses the next unused numeric suffix, following existing channel conventions (for example, `:wwf4:`, `:rko4:`, `:what4:`). A name such as `:316:` remains available if the uploaded channel-emote list does not already claim it.

The names were checked against the **8,183 emotes in the supplied November 22, 2026 export** and the active original filter rules that can be compiled as JavaScript regular expressions. No new shortcut exactly duplicates an emote or collides with a tested active legacy regex. Six historical PCRE-only legacy regexes were left unchanged.

The old `wtfx_` and `wtfx001`-style aliases are **replaced**, not retained. You do not need special prefixes or arbitrary sequence numbers to use new effects.

| Existing emote or old trigger | New filter trigger |
|---|---|
| `:wwf:` | `:wwf4:` |
| `:wwe:` | `:wwe4:` |
| `:raw:` | `:raw:` |
| `:smackdown:` | `:smackdown:` |
| `:nxt:` | `:nxt5:` |
| `:attitude:` | `:attitude2:` |
| `:mania:` | `:mania:` |
| `:rumble:` | `:rumble2:` |
| `:survivor:` | `:survivor2:` |
| `:mitb:` | `:mitb2:` |
| `:ecw:` | `:ecw3:` |
| `:wcw:` | `:wcw4:` |
| `:nwo:` | `:nwo3:` |
| `:dx:` | `:dx3:` |
| `:316:` | `:316:` |
| `:rko:` | `:rko4:` |
| `:stunner:` | `:stunner4:` |
| `:tombstone:` | `:tombstone2:` |
| `:peopleselbow:` | `:peopleselbow:` |
| `:frogplash:` | `:frogplash:` |
| `:rock:` | `:rock3:` |
| `:austin:` | `:austin10:` |
| `:taker:` | `:taker4:` |
| `:cena:` | `:cena2:` |
| `:hbk:` | `:hbk5:` |
| `:bret:` | `:bret3:` |
| `:orton:` | `:orton:` |
| `:tripleh:` | `:tripleh3:` |
| `:hulkamania:` | `:hulkamania2:` |
| `:headtable:` | `:headtable:` |
| `:heelturn:` | `:heelturn:` |
| `:facepop:` | `:facepop:` |
| `:jobber:` | `:jobber3:` |
| `:botch:` | `:botch6:` |
| `:ppv:` | `:ppv:` |
| `:dingding:` | `:dingding:` |
| `:what:` | `:what4:` |
| `:wooo:` | `:wooo:` |
| `:yes:` | `:yes4:` |
| `:no:` | `:no7:` |
| `:thisisawesome:` | `:thisisawesome:` |
| `:fightforever:` | `:fightforever:` |
| `:holyshit:` | `:holyshit2:` |
| `:youcantseeme:` | `:youcantseeme:` |
| `:acknowledge:` | `:acknowledge:` |
| `:restinpeace:` | `:restinpeace:` |
| `:letsgo:` | `:letsgo:` |

The other six formatting rules use `[promo]`, `[heel]`, `[face]`, `[gold]`, `[chant]`, and `[ringspoiler]`. `[ringspoiler]` avoids overlapping the old `[spoiler]` filter.

**Import the new merged file by replacing the channel's current filters, not appending it to an existing 206-rule import.** CSS and JS links don't import filters automatically.

## Logos

- Historic WWF block logo: https://commons.wikimedia.org/wiki/File:World_Wrestling_Federation_block_logo.svg
- Modern WWE white logo: https://commons.wikimedia.org/wiki/File:WWE_white_logo.svg

They are displayed via Wikimedia Commons SVG URLs as low-opacity background graphics. These remain third-party trademarks, used here for an unofficial fan channel, with no WWE affiliation implied.

## Installation and validation

Use the pinned commit `skin.js` and `skin.css` URLs shown in the release chat in the external JavaScript and external CSS settings of your WWE/WWF Baked.live tube. Keep the original channel internal JavaScript where it already lives. Hard-refresh after saving, and test Mod Menu, emotes, the filter import, chat effects, logos and queue scrolling in a test session.

The revised JS passes `node --check` and the new rule regexps validate under JavaScript. Six preserved legacy rules have unsupported PCRE syntax in JavaScript; these old rules were left unchanged rather than silently rewritten. Live channel testing is still required.


## v1.5 — Cinema slowdown and redundant Search fix

Previous v1.4's custom cinema fallback created a page-wide MutationObserver,
interacted with the page's resize handling, and included a duplicate Search.
That build has been replaced by a lightweight, click-driven cinema controller.

- No `MutationObserver`, resize dispatch, or 4-second cinema mode polling.
- Prefer original Xaekai cinema controls when `#cinematoggle` and `#cinemaStyle` exist.
- Otherwise use a split chat/video viewport with a single CSS class, +/− chat width, and a direct Exit button (or Escape). It does not modify the original channel module loader.
- Removed the redundant Search button and panel. The playlist's own search is retained.
- Kept existing WWF/WWE logos, queue, player, and the original 206-rule merged filters.

**Install both v1.5 pinned external CSS and external JS URLs.** If Firefox is
slow on v1.4, first clear the old External JavaScript field and refresh. Restore
the original version to roll back. Live Baked/Firefox extension testing remains
necessary; an extension-specific performance problem is not ruled out.
