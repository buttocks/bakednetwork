# WrestleTube snapshot — 2026-11-22

**Provenance:** User-supplied full emote export (8,183 entries), chat filter export (153 rules), screenshot of Admin Settings, and exact external CSS and JavaScript CDN URLs supplied on 2026-11-22. This is an archived reference, **not** a deployment.

## Captured files

- `channel-emotes.json`: Full exported emote **definitions** (8,183 entries). All image/GIF links remain external; their binaries are **not** backed up here. One duplicate name (`:zayn:`) is preserved.
- `chat-filters.json`: Original 153 filter rules, including their active flags and order; matches `tubes/WrestleTube/original-2026-11-15/chat-filters.json`.
- `channel-external.css`: Exact CSS blob from pinned test commit `2dabdd69d4ed232daab36b06b2dab0525780f2ad` at `tubes/WrestleTube/testing/lean-v1/channel-combined-test.css`.
- `channel-internal.js`: Exact JS blob from tag `wrestletube-selfhost-v1-20261115` at `tubes/WrestleTube/versions/selfhost-v1/channel-internal.js`.
- `admin-settings-observed.json`: Settings manually transcribed from the user-provided screenshot. A screenshot may not show all text within an input field; no password is stored.

## Other reference material

- `tubes/WrestleTube/original-2026-11-15/`: Earlier archived internal CSS, MOTD, JS, CSS and chat filters.
- Tag `wrestletube-selfhost-v1-20261115`: staging files for 25 module scripts and some accompanying resources.
- `themes/WWE-WWF/`: Separately developed theme with its own 206-rule merged filter set. **Do not confuse that merge with this 153-rule original channel export.**

## Not captured / not fully recoverable

- Live playlist / playback queue and its order; not present in supplied export.
- Any live settings not shown in the screenshot (including current internal CSS and MOTD if changed from earlier archive).
- Binary contents of all external emote GIFs/images, third-party modules/assets and media on external hosting services.
- Browser-tested confirmation that the supplied exports equal the live Baked.live channel at the moment of this snapshot.

**No changes were made to the live Baked.live channel by creating this GitHub backup.**
