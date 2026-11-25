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

Operator subsequently approved live /Wrestling registration and general multi-promotion programming. Registration submitted; broadening catalog remains a separate next step.

Operator confirmed actual YouTube playback but reported hidden overlay could not be recovered without pausing. Added persistent parent-document Baked TV menu trigger to all feed pages; browser regression test submitted.

YouTube interaction follow-up: dedicated persistent 44px Baked TV toolbar outside the YouTube video rectangle, no extra reveal button in YouTube mode. Archive overlay unchanged. Regression submitted; live user verification pending.

WCW operator identified video-game simulation in Archive item 270419 Monday Nitro Hour 1. Removed that item and two similarly named suspect uploads from independent catalogs; blocked matching identifier family and added Archive metadata gaming checks. Remaining unknown footage is not automatically proven authentic by metadata.

Operator confirmed YouTube playback and usable separate toolbar in live WCW. NJPW mixed-source validation passed run 45529187357. General Wrestling discovery now rotates official sources across promotions; WCW Archive search expanded with gaming exclusions. WCW currently YouTube-only after suspect Archive footage removal; WWF-WWE Archive-only. Restore mixed-source balance with vetted candidates; Archive reuse permissions remain unconfirmed.

Playlist cleanup verified runs 45531347326 and 45531602024: 43 removed (Wrestling 11, luchatube 29, WID 3), three candidates skipped by safety checks. Repeated 404 plus successful YouTube metadata absence required for YouTube removals. Macro recheck uses six workers and two simultaneous checks per host, with cooldown and uncertain-host diagnostics.

Consolidated 19 byte-identical legacy wrestletube/ files into existing canonical tubes/WrestleTube/ copies after dependency scan 45533065560; corrected two documentation references. Historical pinned versions retained. Rollback parent 2e08b75ccdc8f53f5c77450a275af7465af1fa1e.

PlaylistTools-Standalone.js canonical implementation is tubes/shared/modules/PlaylistTools-Standalone.js. Legacy modules/ entry is a compatibility loader, not a second implementation. Android APK dependency not inspected; preserve old entry point. User approved canonical location.

Removed seven root duplicate WID and WrestleTube assets after dependency scan 45533707469 found no unpinned references to these paths. WID live CSS/JS URLs are commit-pinned, so historical files remain available independently of main; prior CSS checksum mismatch remains unresolved and no live WID settings were changed. Rollback parent db6a0449dfb56db4f51223131142a555fc4e94be.

Added 14 user-specified channels and central registry (25 total). New channels read-only until verified; family relationships provisional except explicitly identified Dragon Gate secondary. Sumo URL normalized to /tv/sumo. Four parallel backup/dependency batches; playlist audits follow after backup confirmation.

Paced macro run 45532049589 succeeded: Wrestling and WWF-WWE each removed 210, each one unknown URL remaining; cumulative confirmed macro removals 633. Joshi and Puro verified rank 3 and backed up (45534795166,45534922142); playlist sizes 455 and 81, unavailable candidates 1 and 4 respectively. Keep read-only onboarding until next reviewed changes. Shared Playlist Tools browser test failed because ubuntu-latest resolved to unsupported 26.04; pin runner to 24.04.

All 14 family onboarding channels verified admin rank 3 and successful backups in run 45536265998. Shared playlist tools functional test passed 45536387897. User reports broken skins and requested NWA-TNA channel; registered and submitted batched skin reviews. NWA-TNA slug pending live confirmation. No automatic skin replacement.

Joshi2 verified rank 3, backed up, 10 protected playlist entries, zero legacy references in run 45538021819. NWA-TNA skin-only retry 45538283890 status completed / success.

NWA-TNA theme deployed successfully 45538283890. Playlist Tools diagnostics 45539268505: JS persisted, ignore_channeljs false, module not executed automatically, direct injection mounts successfully. Investigate custom script consent/initialization; do not consider direct injection a live install. NWA-TNA feed browser test 45537614521 guide and toolbar pass, YouTube playback failed in runner.
