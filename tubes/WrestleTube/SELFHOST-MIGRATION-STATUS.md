# WrestleTube self-hosting migration — staging only

**Status (2026-11-15): In progress. NOT live.**

The current channel configuration has not been changed. Do not switch the channel JavaScript, external CSS, filters, or module URLs to this directory until a complete replacement and rollback have been verified.

## Preserved baseline

See [original-2026-11-15](./original-2026-11-15/). The user-supplied internal JS, internal CSS, external CSS, chat filters, and MOTD are archived there. The original JavaScript currently loads Xaekai modules from `https://resources.pink.horse/js/`.

## Inventory

- Module loader: **25 entries**, **19 enabled**, **6 disabled**.
- Original module collector: **25/25 JavaScript files plus 1 spoiler image**, ZIP manifest hashes verified.
- Local, URL-rewritten candidate modules: **25/25 passed `node --check` syntax validation**.
- Remaining *static* asset dependencies scanned from these modules: **47 required downloads** (mainly audio, one cinema stylesheet, and one color-map image). The spoiler cover is already collected.
- Optional static assets for currently disabled modules: **7** (fancy stylesheet and search icons).
- The disabled chat-icons library also constructs many asset paths dynamically; these are **not included in the static count**.
- Separate non-`resources.pink.horse` services may remain, such as `thumbs.pink.horse`, `identicons.pink.horse`, `ip.pink.horse`, TTS, and video/media providers.

## Deployment requirements

1. Collect missing assets using the user-side preparation script; reject missing or HTML-error responses.
2. Verify all file hashes, module order, enabled/disabled settings, and unchanged original backups.
3. Inspect dependencies inside any newly collected CSS (including `url(...)` references).
4. Prepare candidate JS, CSS and filters with paths served from `wrestletube/versions/selfhost-v1/`; do not use upstream links in the candidate.
5. Verify hosted asset URLs, MIME types and cross-origin loads, then browser-test relevant channel features in a non-production context.
6. Keep the current production configuration available for a one-step rollback.
7. Seek permission to publish the third-party copyrighted Xaekai modules and their associated assets; preserve attribution and copyright notices.

## Hosting candidate

Expected public repo URL prefix (not yet deployed):

`https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/wrestletube/versions/selfhost-v1/`

For deployment, prefer an immutable commit/tag reference over `@main` after files are published and verified. A URL in this document is an **intended path**, not evidence the asset exists or can be loaded.

**Never use the original archive directory for edited releases.**
