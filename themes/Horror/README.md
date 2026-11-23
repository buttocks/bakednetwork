# Horror Tube v1.0 — Midnight Cinema

A ready-to-install dark crimson Horror Tube skin based on the working WrestleTube / Xaekai engine. The player, playlist, native chat, original **Layout → Cinema Mode**, and the module loader remain in charge. No secondary player controls, no reimplementation of Cinema, and no new emote set.

## Files

| File | Purpose |
|---|---|
| `skin.js` | External JavaScript: original WrestleTube engine, Horror Tube branding and the **Horror Effects** navbar dropdown |
| `skin.css` | External CSS: original WrestleTube stylesheet plus red-black theater layout, chat accents, and horror effect styles |
| `legacy-layout.js` | Isolated original Xaekai Cinema module, with the original cinema CSS template passed inline |
| `filters.json` | **120 total rules**: 88 useful neutral WrestleTube rules plus 32 new horror effects |
| `filters-base.json` | 88 general-purpose WrestleTube rules only |
| `filters-horror-only.json` | 32 newly added horror effects only |
| `effects-guide.json` | Names, explanations and examples powering the dropdown |
| `FILTER-CHEATSHEET.txt` | Copy/paste list of every horror filter |

### Removed original filters

The original 153 WrestleTube rules have been curated down to 88 general-purpose image/media, formatting, spoiler, presentation and effects rules. The other 65 original rules, including wrestling names, wrestler memes, channel-specific joke replacements and invasive substitutions, were intentionally left out. Existing neutral filters retain their exact original definitions and activation state.

New horror stamps include `:jumpscare:`, `:slasher:`, `:finalgirl:`, `:bloodmoon:`, `:haunted:`, `:foundfootage:`, `:vhs:` and `:possessed:`. Format examples include `[hwhisper]something moved[/hwhisper]`, `[hglitch]do not look[/hglitch]` and `[hspoiler]hidden reveal[/hspoiler]`. All new shorthand names were checked against the exported 8,183 WrestleTube emote definitions to avoid name collisions.

### Horror Effects menu

A single **☾ HORROR EFFECTS ▾** button appears in the navbar. The dropdown contains 26 stamps and 6 text effects, each with its trigger and a short description. Clicking a row inserts the trigger in the message box without sending it. For bracketed effects, select existing text in the chat input before clicking to wrap it, or edit the inserted example.

The menu itself is a guide: **chat filters must be imported** for visible effects.

## Install on Baked.live / Horror Tube

1. Back up Horror Tube's existing chat filters if any. No live channel settings were changed by publishing these files.
2. Open Horror Tube **Admin Settings**. Set **External JavaScript** to this release's pinned `skin.js` link and **External CSS** to the matching `skin.css` link.
3. Go to **Chat Filters** and **replace** the existing rules with `filters.json` (120-rule complete package). Do not append the complete list to a channel with the same rules already installed.
4. Save and hard refresh with `Ctrl + F5`.
5. Test `Layout → Cinema Mode`, original video/playlist controls, and the Horror Effects dropdown.

Alternative: If the clean `filters-base.json` is already installed, append **only** `filters-horror-only.json`. The new effects are standalone and do not require additional emotes.

### Compatibility / rollback

The external JS includes the original WrestleTube module loader; do not simultaneously load a separate original channel-internal WrestleTube JS or an older WCW/WWF skin. No wrestling-specific filter rules are included. The original WrestleTube, WCW and WWF/WWE projects remain untouched.

Some original kept filters use legacy PCRE constructs and were preserved as exported; they may not compile in a plain JavaScript regex checker. The new horror regexes are simple independent matches. The scripts passed source and JavaScript syntax checks, but live Baked/Firefox/uBlock behavior needs testing.

## Later: WrestleTube filter dropdown

The compact filtering guide is scoped to Horror Tube. A similar dropdown for **selected original WrestleTube filters** can be added later without changing this release.
