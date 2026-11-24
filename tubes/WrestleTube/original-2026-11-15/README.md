# WrestleTube — original snapshot (2026-11-15)

This directory preserves source files supplied for the WrestleTube channel. No cleanup, fixes, formatting, rule changes, or functional rewrites were applied. It is an archival copy only; the live Baked.live channel was not redirected to GitHub.

## Verified original files

| Path | Source | Original SHA-256 |
| --- | --- | --- |
| `channel-internal.css` | supplied internal CSS (original text attachment) | `8b7b6ec3251b933eaa8d3d63649256c00b30142f55ccde788ac98407a0990eab` |
| `chat-filters.json` | supplied chat-filter rules (original text attachment) | `2a7a7e255c3833472456fb45069d5de6bd1861ae3f9450286bbf5ebadca1a118` |
| `channel-motd.html` | supplied channel MOTD HTML (original text attachment) | `f1f7face06366c13084af18b86c161480fe6a6f6c1dd56336510350213a79532` |

All three files were read back from GitHub after uploading and compared character-for-character with the supplied source.

## Added original snapshot files

- `channel-internal.js`: user's unescaped inline JavaScript, archived as provided and read-back verified. As it was supplied in chat rather than as a raw file upload, a byte-for-byte file-export comparison remains unavailable.
- `external-wtube.css`: CSS from the user's external CSS paste. Only the surrounding Markdown code fence was removed to make a usable .css asset; CSS code itself was not reformatted or changed. GitHub content read-back verified.
- `external-wtube-supplied.md`: the complete original Markdown upload, code fences included, archived unmodified and read-back verified.

## Outstanding upstream module dependencies

- Original external CSS live URL: `https://baked.live/css/wtube.css`. **Live channel unchanged.** This repository's external-wtube.css is an archived copy, not yet an active hosting URL.
- The internal JS references 25 named Xaekai modules at `https://resources.pink.horse/js/`. These are **not yet mirrored**. The upstream endpoints were not reachable from our environment, so their source contents could not be authenticated.
- Before a self-hosted loader is activated, obtain and verify each required module's source files, check permission to redistribute Xaekai's copyrighted code, validate cross-file dependencies and expected loading order, and test hosting before changing a single live URL.

## Editing / rollback policy

1. Keep every file in `original-2026-11-15` immutable.
2. Build future revised versions in a **different** folder. Never overwrite this snapshot.
3. Preserve upstream attribution and copyright notices.
4. Before changing channel settings, back up the exact live configuration and test the GitHub-hosted copies in isolation.
5. Do not replace any channel JavaScript, CSS, filter, MOTD, or external module URL until a future version has been validated and explicitly selected.
6. A GitHub-hosted archival file is **not** proof that scripts can safely be served as executable JavaScript or CSS to the channel. Validate content types, CORS, and dependency loading before any cutover.
