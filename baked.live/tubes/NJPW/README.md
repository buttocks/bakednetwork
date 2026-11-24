# NJPW Tube

Baked.live room: https://baked.live/tv/NJPW

## Status

- The `buttman-gpt` read-only admin audit on November 24, 2026 confirmed channel rank 3.
- The first full original backup was captured privately in the earlier `suplex-baked-player` GitHub Actions workflow and provided to the channel owner. **Do not put that original backup in this public repository.**
- Initial snapshot: 35 playlist entries, 6,774 emote definitions, 114 chat filters.
- Skin, MOTD, inline/external JS and CSS should stay unchanged until the central bridge completes a channel-specific validation.
- Continue checking dead media and emotes under the centralized `baked.live/tubes/bridge` workflow.

## Policy

Preserve existing NJPW-themed background and logos. WrestleTube JS is the reference implementation, but NJPW's features are not to be replaced wholesale. Use the same conservative dead-link criteria as Lucha Tube while preserving uncertain hosts.

## Preliminary offline emote check (from the secured backup)

No live NJPW emotes were changed during this inspection. The backup contains **6,774** emote entries. Known retired-host matches: **11 Lensdump** and **1 Oblivionent**. One Gfycat URL is a separate candidate requiring review. Image URLs redirecting to Imgur's `removed.png` placeholder cannot be reliably identified from the saved JSON alone; run the full URL audit through the authenticated bakednetwork bridge before removing them. Preserve Postimages links unless explicitly confirmed broken.

The new repository's first bridge audit failed at **Check Baked.live account secret**, not at code validation. The secret `BAKED_LIVE_PASSWORD` must be configured specifically in `buttocks/bakednetwork`; the original repository secret does not transfer automatically.
