# Tube JavaScript baseline policy

WrestleTube's channel JavaScript is the **reference baseline** for the Baked.live tube family, managed in buttocks/bakednetwork under tubes/.

It is **not** a mandate to deploy byte-identical JavaScript to all tubes.
Some tubes deliberately include additional or modified features.

## Change rules

1. Back up each target tube's exact current inline JS, CSS, MOTD and settings before any deployment.
2. Compare the target tube's script against WrestleTube's baseline before applying a common improvement.
3. Preserve each tube's intentional differences: player behavior, channel-specific controls, playlists, macros, moderation, styling integration, special features, and configuration.
4. Port common bug fixes and reusable features with explicit per-tube compatibility checks; do not wholesale copy-and-replace WrestleTube's JS.
5. Keep each tube's original configuration, artwork URLs, channel-specific aliases and embed logic.
6. Validate changes on the particular tube, log the changed functions and retain a rollback copy.
7. Routine reskins are **CSS-only** unless a specific feature requires a JS change approved for that tube.

For Lucha Tube: the Nov 24, 2026 old-school Mexican wrestling skin is CSS-only. The existing inline JS was preserved unchanged. The original full channel backup is saved in the authorized GitHub Actions artifact and was provided to the owner as a private ZIP.

When future development warrants a shared JS module, separate shared logic from channel-specific configuration and override hooks rather than forcibly synchronizing entire JS blobs.

## Hands-off deployment policy

- The owner describes the result; the assistant makes the required repository and live changes through the existing authenticated bridge.
- Do **not** respond with CSS/JS snippets or manual paste instructions when the bridge supports the operation.
- Every change runs as: inspect current state → preserve rollback → edit the smallest relevant code/configuration → run validation → deploy → verify live state and show the result.
- Only request human intervention for access/permissions that the available connection actually cannot perform.
- Keep built-in CSS/JS only when capacity allows; prefer GitHub-hosted additions when the internal size cap would be exceeded. Never overwrite external script/style links without first comparing and backing them up.
- For each tube, preserve its customized JavaScript while using WrestleTube as the shared reference.
