# Baked 2.0 compatibility migration

Status: HOLD legacy script migration pending verified native parity.

## Upstream announcement
Gallios announced that the majority of Xaekai's scripts are now integrated into Baked itself and will no longer need inclusion in external JS after the Baked 2.0 update is fully deployed. This announcement does not identify individual modules, confirm a completed rollout, or establish native feature parity on every tube.

## Inventory
The authenticated read-only workflow inventories all registered owned tubes in `tubes/channels.json`. It records script hashes, sanitized external script locations, recognizable module references and observed UI controls. Observed controls alone are not evidence of native implementation. No settings, playlist entries, permissions, or scripts are modified.

The canonical shared wrestling loader currently references settings, audio, privmsg, whispers, userlist, md5hash, playlist, notifier, chatline, chatext, chatcolor, colormap, unimoji, dectalk, hotkeys, layout, various, embedmedia and time. Inactive modules include designator, chaticons, ci_library, AvtrClient, fancysheet and search. Preserve attribution and existing pinned assets. The loader also includes the separate BakedNetwork Playlist Tools module; do not classify it as an upstream Xaekai dependency.

## Migration gates
1. Record current live script URLs, inline JS hash, module markers and observed controls.
2. Obtain upstream confirmation of completed rollout and per-feature native replacements.
3. Verify native behavior in an isolated browser or explicitly authorized pilot, including settings, private messages, chat behavior, alerts, hotkeys, layout, timestamps, media embeds, playlist thumbnails, attribution, move reporting, estimates and sync checks.
4. Back up original inline JS, external JS/CSS, channel options, filters, macros, and playlist. Preserve custom channel logic; never erase an entire mixed-purpose script because it includes Xaekai code.
5. Pilot the smallest reviewed removal with a rollback copy. Verify both regular-user and administrator behavior. No global deployment until pilot passes.
6. Expand one channel family at a time; verify every channel independently.

## Protected features
Custom themes and artwork, channel-specific branding, chat filter/macro configurations, shared playlist tools and multipart safeguards, Baked TV feeds, YouTube/Dailymotion/Archive players, permanent playlist entries, current playback, RDH bot, ScaryTube stream, permissions and external integrations remain unchanged. Keep legacy URLs and archived source copies available until dependency migration is confirmed.

Do not troubleshoot upstream-wide chat failures as local skin failures. Pause new Xaekai modernization and shared-loader rollouts; unrelated feed/catalog work may continue.

Inventory is evidence, not authorization to disable modules. No automatic removal is enabled.
