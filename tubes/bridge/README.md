# Baked.live tube management bridge

The Baked.live administration bridge now belongs to **buttocks/bakednetwork**.

## Channel layout

- `../NJPW/` — NJPW Tube settings and assets.
- `../luchatube/` — Lucha Tube skin, artwork links and adjustments.
- `bridge.mjs` — scoped Baked.live socket/Playwright operations.
- `skin-backup.mjs` — full private backups with MOTD, CSS/JS, macros/emotes JSON, filters, playlists and selected referenced assets.
- `emote-cleanup.mjs` — URL audit; conservative removal of confirmed dead emotes.
- `playlist-audit.mjs` — read-only availability checks, preserving custom iframe/live channel entries.
- `request.json` — the one-time action request; updating this file triggers the GitHub Actions bridge.

## One-time credential in THIS repo

Add `BAKED_LIVE_PASSWORD` as an **Actions repository secret** at:

https://github.com/buttocks/bakednetwork/settings/secrets/actions

The secret from the previous `suplex-baked-player` repository cannot be copied by the GitHub content API. Do not put passwords in commits, workflow logs or chat messages.

The bot uses the existing account `buttman-gpt`. The first audit should confirm NJPW and Lucha Tube permissions. The run attaches its results privately for seven days.

## Example read-only request

```json
{
  "schema": 1,
  "request_id": "njpw_audit_sample_01",
  "channel": "NJPW",
  "action": "audit"
}
```

The deployment workflow has no write-token privilege for the repository; the user or authorized connected editor commits each reviewed command. Keep a rollback ZIP before any destructive operation.

## Source organization

All new tube-management code, css/JS and administrative configuration belongs to `tubes/`. Existing SlamVision video **player URLs** remain separate until an explicitly tested player migration.

For JavaScript, use WrestleTube as reference baseline **without overwriting** tube-specific features.
