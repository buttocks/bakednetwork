# BakedNetwork maintenance status

Updated 2026-11-24.

- Nine authorized channels; all have configuration backup artifacts. Macros retained as JSON, not downloaded artwork.
- RetroWrestling: two external URLs migrated; zero legacy references confirmed.
- WCW: two external URLs migrated; 210 confirmed dead macros removed; 24 playlist items preserved.
- Wrestling: one external URL migrated; 11 potentially unavailable playlist entries; macro scan inconclusive for 7,759 URLs.
- WWF-WWE: two external URLs migrated; macro scan inconclusive for 7,759 URLs.
- RDH: two external URLs migrated; 15 uncertain macros retained.
- WID: CSS byte mismatch blocked migration; three dead macros removed; four potentially unavailable playlist entries.
- ScaryTube: two external URLs migrated; all 85 macros working.
- NJPW and luchatube: next cleanup batch submitted; existing independent feed identities retained.

## Next actions
Resolve WID CSS using exact historical bytes, verify remaining legacy references, retry inconclusive macro URLs with throttling, investigate playlist candidates without interrupting playback, complete canonical root cleanup only after dependency checks. Extend independent wrestling feeds using shared duration-weighted 60% YouTube / 40% Archive engine; retain SlamVision separately. No unverified feed registration.

## Evidence
First cleanup batch: https://github.com/buttocks/bakednetwork/actions/runs/45467435264
Second cleanup batch: https://github.com/buttocks/bakednetwork/actions/runs/45468850602
Original backups: runs 45458643814 and 45461441839 (expire 2026-12-24).

## Verified repository cleanup — 2026-11-24
Removed 29 SHA-identical legacy duplicates from main for RDH, RetroWrestling, WCW and WWF-WWE. Repository-wide dependency scan (run 45472368331) found only two harmless RDH sibling-loader/diagnostic references; canonical rdh-modern.js remains present. Pre-cleanup rollback commit: 17a73b44949f417bf8172981ffca0e3423170697. WID historical URL and ScaryTube macro dependencies remain retained. Further cleanup requires verification of outstanding dependencies.

## Wrestling catalog update — 2026-11-25 UTC
YouTube API authenticated for all feeds. Run 45523481228 added 30 official YouTube programs; 115 entries before catalog correction. Full events welcome; discovery duration maximum extended to eight hours, game/simulation entries excluded from official video discovery. Removed 1 game candidate(s) from WWF-WWE catalog. Shared player startup watchdog improved. New feed registration still pending playback and rights verification. The target is 60/40 by airtime, not count.

Browser run 45526159422: all seven deployed feeds started Archive playback with zero JS errors. YouTube playback unverified. Operator chose optional standalone WrestleTube, no live /wrestling registration. WCW, WWF-WWE and RetroWrestling enrolled for add-only live registration based on browser startup evidence. Archive reuse permissions remain unconfirmed.

Live registration run 45526833113 succeeded: WCW, WWF-WWE and RetroWrestling added as permanent managed feeds. NJPW classics/events and Lucha already present. WrestleTube remains standalone by operator choice. Next: catalog quality, YouTube playback verification, and outstanding repository cleanup.
