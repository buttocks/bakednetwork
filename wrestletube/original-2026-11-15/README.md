# WrestleTube — original snapshot (2026-11-15)

This directory preserves source files supplied for the WrestleTube channel. No cleanup, fixes, formatting, rule changes, or functional rewrites were applied. It is an archival copy only; the live Baked.live channel was not redirected to GitHub.

## Verified original files

| Path | Source | Original SHA-256 |
| --- | --- | --- |
| `channel-internal.css` | supplied internal CSS (original text attachment) | `8b7b6ec3251b933eaa8d3d63649256c00b30142f55ccde788ac98407a0990eab` |
| `chat-filters.json` | supplied chat-filter rules (original text attachment) | `2a7a7e255c3833472456fb45069d5de6bd1861ae3f9450286bbf5ebadca1a118` |
| `channel-motd.html` | supplied channel MOTD HTML (original text attachment) | `f1f7face06366c13084af18b86c161480fe6a6f6c1dd56336510350213a79532` |

All three files were read back from GitHub after uploading and compared character-for-character with the supplied source.

## Other existing production sources (not yet copied)

- Channel internal JavaScript: supplied inline in chat. To make a *byte-exact* original archive, export it directly from the channel editor as a .js or .txt file. Do not silently reconstruct it from escaped chat formatting.
- External CSS: `https://baked.live/css/wtube.css` — supplied live URL, not downloaded or mirrored in this snapshot.
- Xaekai's module dependencies are still loaded from `https://resources.pink.horse/js/` by the existing channel JavaScript. No external module source was bundled in this snapshot.

## Editing / rollback policy

1. Keep every file in `original-2026-11-15` immutable.
2. Build future revised versions in a **different** folder. Never overwrite this snapshot.
3. Preserve upstream attribution and copyright notices.
4. Before changing channel settings, back up the exact live configuration and test the GitHub-hosted copies in isolation.
5. Do not replace any channel JavaScript, CSS, filter, MOTD, or external module URL until a future version has been validated and explicitly selected.
6. A GitHub-hosted archival file is **not** proof that scripts can safely be served as executable JavaScript or CSS to the channel. Validate content types, CORS, and dependency loading before any cutover.
