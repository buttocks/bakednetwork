# NJPW Tube

Baked.live room: https://baked.live/tv/NJPW

## Current channel

- The full original channel snapshot is preserved privately in the GitHub Actions backup package.
- On November 24, 2026, confirmed-dead emotes were cleaned: 302 removed and 6,472 retained, preserving uncertain URLs.
- The MOTD **Links** dropdown and its obsolete popup were removed. The Rules popup, original lion artwork, channel scripts and welcome message remain.
- [arena-skin.css](./arena-skin.css) is the additional compact red/gold/black theme layer. The original inline CSS stays below it.
- The versioned [refresh.mjs](./refresh.mjs) deploys the skin and MOTD cleanup with SHA baseline checks and private rollback files.

## Independent NJPW TV feeds

We host the **player pages and schedules**, not the videos. Media uses direct Internet Archive URLs. The player has a TV guide, UTC-synchronized programs, daily order rotation and source retry.

- [NJPW CLASSICS](./feed.html?channel=classics) — 8 classic NJPW matches
- [NJPW EVENT ARCHIVE](./feed.html?channel=events) — 16 tournament/event video items
- [programs.json](./programs.json) — curated source catalog
- [feed-status.json](./feed-status.json) — latest conservative online/offline status
- [check-sources.py](./check-sources.py) — checks source and player HTTP availability without downloading entire videos

The [shared controller](../feeds/README.md) automatically adds these two iframes to the NJPW room when confirmed online and removes them if their player pages or media sources are repeatedly confirmed unavailable. It never deletes other people's entries or the currently playing item. All changes use the existing authenticated Baked.live admin account; no passwords are stored in the repository.

## Source and rollback policy

WrestleTube's JavaScript remains the shared reference, not a replacement for NJPW-specific features. Avoid duplicate inline modules. External script/style URLs remain unchanged without separate inspection. Archive recordings may have source-imposed playback and usage limitations.
