# WrestleTube — WWE/WWF chat effects addon (2026-11-22)

This is a **filter-only extension** for the existing WrestleTube channel, not a replacement skin. Your existing WrestleTube internal JavaScript remains unchanged.

## Files

- `filters-merged.json` — complete **206** filters: original 153 rules preserved in the same order, followed by 53 wrestling effects. **Import this file to replace the current channel filter set.**
- `filters-new-only.json` — the 53 new rules by themselves, for inspection or a manual per-rule addition workflow. **Do not use a replace-all import of this file**, or you'll lose original rules.
- `filters-effects.css` — CSS for only the new chat effect classes, in case you maintain your CSS separately. Do not use it by itself as your entire External CSS if you wish to keep your current skin.
- `channel-css-plus-filters.css` — your exact 2026-11-22 WrestleTube External CSS from pinned commit `2dabdd69d4ed232daab36b06b2dab0525780f2ad`, followed by only the new filter effect CSS. **Use this as the External CSS URL** if the live channel still uses the pinned CSS the user supplied.

## Installation

1. In WrestleTube channel settings, save/export the current filters before replacing anything.
2. Open **Edit → Chat Filters** (or the channel's filter import editor) and import `filters-merged.json`, replacing the old filter list once. Do not append the 206-rule file to an already-populated list or you'll duplicate filters.
3. Under **Admin Settings → External CSS**, replace the existing CSS URL with the **commit-pinned** `channel-css-plus-filters.css` URL from this release. The base CSS from the screenshot is preserved in this file; the added CSS affects `#messagebuffer .wwf-*` only.
4. Keep the existing **External JavaScript** set to:
   `https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/channel-internal.js`
5. Hard-refresh, test `:wwf4:`, `:316:`, `:rko4:`, `:what4:`, and `[promo]test[/promo]`. Test an old emote and chat filter to confirm nothing regressed.

## Safety and restoration

- The 153 original rules are unmodified (including deliberately duplicated original regexes).
- The 47 new colon-style shortcuts were checked against the 8,183-emote definition export and there are no exact name collisions.
- The existing channel JS does not need the new WWE/WWF skin.js.
- The six new bracket effects are `[promo]`, `[heel]`, `[face]`, `[gold]`, `[chant]`, `[ringspoiler]`. The last uses CSS to reveal on hover/focus.
- Existing external CSS URL for rollback:
  `https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@2dabdd69d4ed232daab36b06b2dab0525780f2ad/wrestletube/testing/lean-v1/channel-combined-test.css`
- Original export is preserved at `tubes/WrestleTube/backups/2026-11-22/chat-filters.json`.
- Nothing in this GitHub package modifies the live Baked.live channel; it must be imported manually in the channel admin UI.
