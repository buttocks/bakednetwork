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

The bot uses the existing account `buttman-gpt`. The account has verified global administrator rank 10. The registered scope is defined in `../channels.json`; global permissions do not authorize arbitrary channel changes. Bridge artifacts have a 30-day retention setting. Treat configuration backups as sensitive, and review artifact access before sharing them.

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

## WrestleTube chat configuration synchronization

Master: `/Wrestling`. Mirrors: `/wrestling2`, `/wrestling3`, `/Wrestling4`, `/wrestling5`. No other tube participates.

- Configuration: `../shared/wrestling-chat-sync.json`.
- Read-only inventory: `chat-sync-inventory.mjs`.
- Guarded native import pilot: `chat-sync-pilot.mjs`.
- The master is read-only; destination lists are backed up before import.
- Preserve ordered filters and all macro definitions, including duplicate names.
- Verify exact returned lists after import; attempt rollback only when the observed live state can safely be attributed to the import.
- Do not change skins, playlists, or permissions.
- Automatic writes are enabled for the four mirrors only. The scheduled workflow runs hourly at minute 13 (UTC), subject to GitHub Actions scheduling delays. It skips exact matches and stops on the first failed destination. Set `automaticWrites` to `false` in the shared configuration to disable scheduled writes.

### Verified baseline — 2026-11-25

| Channel | Filters | Macro definitions |
| --- | ---: | ---: |
| Wrestling | 206 | 7973 |
| wrestling2 | 148 | 8990 |
| wrestling3 | 121 | 9180 |
| Wrestling4 | 121 | 9151 |
| wrestling5 | 121 | 7158 |

Each list contains one conflicting duplicate macro name. Inventory preserves those entries rather than choosing a winner. Native import controls were verified in [run 45700407481](https://github.com/buttocks/bakednetwork/actions/runs/45700407481). Wrestling 2 pilot passed in [run 45700731231](https://github.com/buttocks/bakednetwork/actions/runs/45700731231). All four mirrors were verified exact in [run 45701361511](https://github.com/buttocks/bakednetwork/actions/runs/45701361511), with 206 filters and 7973 macro definitions per channel. Hourly synchronization has been enabled; the first scheduled execution remains unverified.

