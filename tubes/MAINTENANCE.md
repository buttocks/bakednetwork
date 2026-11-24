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
