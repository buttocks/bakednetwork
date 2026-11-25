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

User requires existing wrestling JS base/modules for new builds and overhauls. Created shared WrestleTube-derived base, parameterized branding and added Playlist Tools to existing sequencer. Original pinned dependencies and module selections retained. NWA-TNA pilot generated from shared source; validation before live rollout.

User preference: YouTube items should start with closed captions off. Shared Baked TV player requests captions off and unloads captions on readiness/API change; YouTube may override via viewer settings or burned-in subtitles. Native Baked.live player is separate.

MTV verified rank 3, 708 entries, backup and skin audit successful, zero legacy references (45540562353). Compact native toolbar Playlist Tools v1.2 passed functional tests (45541210842), including permission hiding and Escape dismissal. Shared wrestling base syntax/consistency passed (45539678689); live initialization not yet verified. User prefers native compact toolbar controls over floating panels.

RetroWrestling v1.3.5 deployed; user confirms better layout and captions gone. Design standards: full-size fading overlays, native Tools dropdown, no redundant header controls. Latest browser test 45542978471 seven established feeds passed, NWA-TNA playback still failed. Submitted shared wrestling base deployment and structured read-only skin health scan across registry.

Skin health scan 45543653807: all 28 completed. Broken visible images: NJPWALT 3, DG/DGalt/joshi/puro 1 each. Prioritize exact image URL review before replacement. Automation failed to detect JS modules even on user-confirmed working RetroWrestling; runtime results not conclusive. NWA-TNA external shared base URL configured, runtime unverified (45543653796).

Priority audit 45544108485 confirmed broken visible assets: NJPWALT Discord/Gyazo/Uproxx; DG and DGalt Wikimedia Dglogo3.png; joshi Discord GIF; puro Discord PNG. Added original text-based Dragon Gate fallback wordmark (not official logo), pending location verification and guarded replacement. No live artwork changed.

Asset-location audit 45544562593: DG/DGalt logo is MOTD artwork; NJPWALT two MOTD images and one chat image; Puro one MOTD image; Joshi chat GIF only. Submitted exact URL-only MOTD repairs for DG/DGalt with backup, rendered image verification and rollback. Joshi chat GIF and NJPWALT chat image are not skin defects.

DDT onboarded successfully (45546112283), rank 3, four items, no legacy paths, broken MOTD logo. Network total 29 verified/backed up. NJPWALT main NJPW CSS/MOTD mirror verified (45546755182). DG/DGalt user-supplied Imgur transparent artwork in use; compact size deployment pending (45547887791).

User visually verified compact transparent Dragon Gate logo and DDT logo. DDT old schedules unreachable; migrate via separate new feed with validated source catalog. Submitted read-only playlist review for 16 channels in three batches. No live changes in this batch.

DDT playback diagnostic run 45552262195: 34 error-150 embed failures; full run 45552262184: seven established feeds playing, DDT and NWA-TNA timed out. Added diagnostic comparison of documented standard and privacy-enhanced embed hosts, including Lucha as comparison. Neither new feed installed live.
