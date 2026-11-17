# RetroWrestling Classic Arena v1.0

A championship-arena skin and modular playlist-management controls for the [Baked.live RetroWrestling channel](https://baked.live/tv/RetroWrestling).

## Files

- `RetroWrestling.css` — channel CSS.
- `RetroWrestling.js` — combined RetroWrestling theme script and playlist tools; paste this in the channel JavaScript editor.
- `RetroWrestling-Theme.js` — theme logic without playlist tools, for developers / separate integration.
- `PlaylistTools-Standalone.js` — reusable playlist tools for other tubes, no RetroWrestling visuals.

**Installing RetroWrestling:** Back up any existing channel CSS and JS in the channel editor before replacing them. Paste `RetroWrestling.css` in CSS and `RetroWrestling.js` in JavaScript, save, then refresh. Do not append the standalone playlist module to `RetroWrestling.js`, since it is already included.

**Installing on another tube:** Append `PlaylistTools-Standalone.js` to the existing channel JavaScript after backing it up. If the channel exceeds the inline JS limit, host your combined script through the channel's External JavaScript setting. Do not replace the other tube's existing features.

## Playlist tools

- Select individual entries, delete last N, remove duplicates, title search, position range, remove all except currently playing.
- Protect currently playing and first N entries (N saved separately per channel).
- Preview before deletion, confirmation, extra typed confirmation for 20+ items, stop pending requests.
- Export playlist information as JSON. Export is **reference only**, not a restorable backup.
- Requires server-side `playlistdelete` and `seeplaylist` permissions; uses CyTube-style `delete` socket events.

**Safety:** Never use on a channel you are not authorized to moderate. No automatic deletion takes place on installation. Live moderator-account behavior is not yet verified; test on a disposable playlist first.

## Relationship to supplied 2022 JavaScript

The shared `java2022.js` contains a module loader referencing an external `Playlistbatchdelete.js` at Dropbox. That separate file was not accessible for inspection. The playlist module here is a newly authored implementation, **not a copy or verified re-creation** of the external Dropbox batch-delete module. The legacy script also uses an assortment of unrelated Xaekai `resources.pink.horse` modules. None are bundled or silently loaded here.

## Rollback

Restore the original CSS and JavaScript saved from your channel editor. Playlist entries removed by moderators through the tools are not restored by this rollback.