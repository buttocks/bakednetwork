# RetroWrestling — WrestleTube Merge v1.3.1

## Current direct URLs (Baked.live Admin Settings)

**External CSS:**

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/RetroWrestling/RetroWrestling.css

**External Javascript:**

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js

Save both fields (changes automatically saved), then hard-refresh the channel with Ctrl+Shift+R. If a **Script Access** prompt appears, allow this channel's script; check that **Ignore Channel Javascript** is not enabled in Options. If the CSS changes but the arena header and buttons do not appear, the browser is not running the JS — check script access or the DevTools Console/Network for a blocked request.

## v1.3.1 corrections

- Fixed old WrestleTube welcome notice in RetroWrestling's merged JavaScript, including stale message replacement if another channel script overwrites it.
- Adjusted chat header, status notice, message lines, playlist title and uploader spacing.

## Features

- Red-and-gold RetroWrestling skin, compact arena header, ticker, watch/chat/playlist shortcuts, focus and effects toggles, bell, copy-link.
- New **✂ Playlist Tools** button located directly in the native playlist toolbar, using the shared v1.2 dropdown. No floating or header shortcut.
- Delete selected rows, last N entries, duplicate videos, title matches, position ranges, or all except currently playing.
- Protect first N entries and the currently playing item. Preview, manual confirmation, typed confirmation for batches of 20+, stop sending pending requests, JSON metadata export.
- Original WrestleTube Xaekai modules, playlist scroll, chat name and emote shortcuts, and navbar enhancements preserved. The old forced per-second fluid layout override was removed to avoid spacing shifts.

**Important:** playlist deletion requires channel permissions. JSON export is a reference snapshot, not an automatic restore function. Test on a disposable playlist before bulk deletion.

## Source

- `RetroWrestling-WrestleTube-Merged.js` — only JS needed for RetroWrestling.
- `RetroWrestling.css` — skin and v1.3 spacing refinements.
- `RetroWrestling.js` — earlier alternate combined script (not the recommended version).
- `RetroWrestling-Theme.js` — earlier standalone arena UI.
- `../shared/modules/PlaylistTools-Standalone.js` — reusable module for other channels, separate from any theme.

Reusable Playlist Tools module (other tubes only):

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/shared/modules/PlaylistTools-Standalone.js

Do **not** include the standalone module again alongside the merged RetroWrestling JS, or load earlier versions simultaneously.

## Notes

The linked legacy 2022 script referenced a separate Dropbox `Playlistbatchdelete.js` that could not be independently inspected. The batch-delete manager here is independently implemented and has not been tested against a live moderator session.

For rollback, replace the two URLs with the previous channel settings backups; restoring JavaScript does not restore deleted playlist entries.

## v1.3.2
Legacy embedded Playlist Tools removed; loads shared module. Live external JS URL migration pending.
