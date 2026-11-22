# WWF/WWE — WrestleTube port v2.1

The new skin uses the original WrestleTube channel CSS and JavaScript instead of the old custom Ringside UI.

## Files and provenance

- `skin.js`: the archived WrestleTube channel internal JavaScript, with the original sequenced Xaekai module loader, playlist tools, chat-emote handling, native Layout menu and Cinema support. It now starts safely from Baked's External JavaScript field and uses WWF/WWE branding. The old 1-second forced layout writes and navbar opacity fade were removed.
- `skin.css`: exact original WrestleTube 2026-11-22 external CSS at the top, followed by wrestling-filter effect CSS and era styling.
- `legacy-layout.js`: Xaekai's Extended Layout Options code, with a single adaptation: its Cinema CSS is supplied inline from `skin.js` instead of another cache-busted network fetch. All original cinema buttons, sizing and `/cinema` handling remain in the original module.
- `filters.json`: existing 206 merged WrestleTube+WWF/WWE chat filters, untouched.

## Era skins

A small navbar selector offers five: WWWF Classic (sepia/gold), WWF Golden (red/yellow), WWF New Generation (blue/purple/yellow), WWF Attitude (black/red/white — **default**), and WWE Modern (graphite/red/white). The wallpaper displays early WWWF, WWWF globe, WWF block, WWF New Generation and WWE historic logos. Logos can be toggled off; the user's selection is saved in localStorage for this tube.

## Installation

In WWF/WWE Tube's Admin Settings, replace **both External CSS and External JavaScript** with this release's matching commit-pinned links. Do **not** also load the old Ringside JS, a separate WrestleTube channel-internal JS, or an independent layout addon. This port includes the engine and native Layout/Cinema module already.

Keep the 206 chat filters you installed. If not installed, import `filters.json` once as a replacement, not an append. Hard refresh. Test Layout → Cinema Mode, native ± controls, playlist scroll/controls, emotes, and the era selector.

The port uses the archived 25-module loader and does not touch the live WrestleTube channel or its historical GitHub backups. External logo artwork remains at its existing hosts. Source and syntax checks do not replace actual Firefox/uBlock live validation.

## v2.1 — Logos are visible above the player and chat

The previous background collage was covered by WrestleTube's opaque page containers. A visible six-card, full-color logo gallery now sits **directly before the main player/chat row**. It has early WWWF, WWWF globe, Golden WWF, New Generation, Attitude scratch, and modern WWE logos. Clicking a card switches eras; the navbar selector still works. A failed external logo image shows a readable WWF/WWE fallback. The LOGOS control hides/shows the gallery. No changes to the Xaekai Cinema module, chat, queue, or 206 filters.
