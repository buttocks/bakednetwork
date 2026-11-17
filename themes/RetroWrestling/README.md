# RetroWrestling — Classic Arena (WrestleTube Merge)

Championship-style RetroWrestling skin with the original WrestleTube enhancements and reusable playlist-management tools.

## Install — Baked.live Channel Settings > Admin Settings

**External CSS (direct CDN URL):**

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/themes/RetroWrestling/RetroWrestling.css

**External JavaScript (direct CDN URL, WrestleTube merged):**

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/themes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js

1. Save a backup of any existing internal/external channel CSS and JavaScript.
2. Replace the External CSS and External JavaScript inputs with the **exact full URLs above**. Remove any accidentally appended tracking text (for example `?utm_source`).
3. Do not also load `RetroWrestling.js`, `RetroWrestling-Theme.js`, or `PlaylistTools-Standalone.js`: the merged file already contains both feature modules.
4. Close Channel Settings and hard-refresh (**Ctrl+Shift+R**).
5. Confirm the red/gold arena banner and the **Playlist Tools** button appear. For playlist deletion, log in with a moderator/owner account.

### Why not raw.githubusercontent.com?

GitHub's raw host can serve JS/CSS with `Content-Type: text/plain` and `X-Content-Type-Options: nosniff`, so browsers reject those files when loaded as scripts/stylesheets. jsDelivr provides correctly typed, direct-use GitHub CDN URLs.

If the screen still looks unchanged after refreshing, check Baked.live user/account preferences for **Ignore Channel CSS** and **Ignore Channel Javascript**, and inspect the browser DevTools Console/Network for blocked external file requests.

## Source files

- `RetroWrestling.css` — the arena skin, dark red/gold styling, video, chat and queue.
- `RetroWrestling-WrestleTube-Merged.js` — **recommended** combined external JS, including original WrestleTube Xaekai modules, chat/username shortcuts, navbar behavior, playlist-scroll button, arena controls and playlist manager.
- `RetroWrestling.js` — theme and playlist manager without original WrestleTube modules (alternate, not used when merged file is active).
- `RetroWrestling-Theme.js` — arena controls only.
- `../../modules/PlaylistTools-Standalone.js` — playlist-management module for other tubes.

**Standalone module direct URL for other tubes:**

https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/modules/PlaylistTools-Standalone.js

Append to a different tube's *existing* JS rather than overwriting the tube's JavaScript. Do not load twice.

## Playlist tools / safety

Selected entries, last N, duplicate media, title matches, position ranges, or all except currently playing. User can protect first N queue entries, preview targets, export playlist metadata JSON, confirm before deleting, and stop sending further delete requests. Deletions require server-side playlist delete permissions; no deletion happens automatically. Exported JSON is **not** a restorable full backup, and deleted entries cannot be recovered by reverting the script.

This build is syntax checked; in-channel execution and live deletion still require hands-on verification using a disposable playlist.

## Source note

The shared legacy 2022 JS references a separate Dropbox `Playlistbatchdelete.js`, whose contents were not available for inspection. This project uses an independent playlist manager. The original WrestleTube script from `wrestletube/original-2026-11-15/channel-internal.js` was merged while omitting its old channel-specific logo and favicon so RetroWrestling's branding stays intact.

## Rollback

Restore the previous channel CSS/JS references or editor backups. Changes made to the playlist itself are not reversible by changing scripts.
