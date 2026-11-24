# Baked.live tubes — central project

This directory is the source of truth for **all Baked.live tube administration**. Do not add new tube-management scripts or skins to the separate SlamVision/player repository.

## Organization

- `bridge/`: Shared Baked.live admin bridge, GitHub Actions request transport, read-only skin / playlist / emote audits and documented restoration process.
- `luchatube/`: Lucha Tube-specific skin. Preserve its original art and independent channel JavaScript.
- `NJPW/`: NJPW Tube configuration and future skin changes. Preserve NJPW's own art and JavaScript.
- Add other channels as sibling folders when granted permission.

## Safety and workflow

1. Confirm per-tube admin permissions, record live state.
2. Create and verify a **private** complete backup: CSS, JS, MOTD, chat filters, macros/emote JSON, playlist and artwork references. Keep the downloaded ZIP out of public Git.
3. Identify confirmed broken assets/emotes and only delete after preserving a restore list. Imgur `removed.png` redirects, confirmed 404/410, owner-confirmed Lensdump and known retired hosts may qualify. Treat rate limits and Postimages false failures as uncertain.
4. Preserve current-playing playlist media and channel-specific features. Only refresh available iframe entries after reliable, repeated checks.
5. Use WrestleTube's JavaScript as a **reference baseline**; preserve each tube's feature-specific changes.
6. Keep CSS/JS internal only if under editor limits; otherwise publish audited files under this repository and link them without replacing pre-existing external links.
7. Validate and verify each live change. Keep the previous version for rollback.

## Separate upstream video players

Existing SlamVision players are currently published by `buttocks/suplex-baked-player`. These are **media-source dependencies**, not the permanent home for Baked.live tube-management code. Do not break existing playlist URLs merely to relocate administrative scripts.

## Access

The GitHub Actions bridge in this repository requires the **repo-scoped** GitHub Actions secret `BAKED_LIVE_PASSWORD` before it can log in. Secrets and sensitive snapshots must never be committed. The request file in `bridge/request.json` triggers a single scoped operation, and results are attached as GitHub Actions artifacts (7-day retention). Do not publish complete channel backups in the public repo.
