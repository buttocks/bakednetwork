# WWE / WWF Ringside — Baked.live tube package

A standalone theme for a WWE/WWF Baked.live channel. Built separately from existing WrestleTube/RetroWrestling files. No WWE logos, downloaded media, or third-party modules are embedded.

## Contents

- `skin.css` — WWE/WWF arena look, responsive dark red/gold styling; optional modern mode.
- `skin.js` — top arena banner, now-playing status, watch/chat/playlist shortcuts, current-video locator, Attitude/Modern switch, cinema toggle, share link, clickable spoiler reveals.
- `filters.json` — 53 enabled Baked.live Chat Filters in the proven `{name,source,flags,replace,active,filterlinks}` array format: WWE/WWF/RAW/SmackDown chips, moves, wrestlers, crowd chants, promo/heel/face markup, spoiler tags.
- `Publish-to-GitHub.ps1` and `RUN-PUBLISH.cmd` — optional one-time publisher for the existing `buttocks/bakednetwork` repository. Requires Git and GitHub push authentication; does NOT touch any live tube settings.

## Easiest installation: GitHub-hosted CSS/JS

1. Open this ZIP's extracted directory and double-click `RUN-PUBLISH.cmd`, **or** publish the three files manually under `themes/WWE-WWF/` in the `buttocks/bakednetwork` repo.
2. In your WWE/WWF tube's Baked.live channel administration settings, use **External CSS** and **External Javascript** URLs. After publication, the URL patterns will be:

   External CSS:
   `https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/themes/WWE-WWF/skin.css`

   External Javascript:
   `https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@main/themes/WWE-WWF/skin.js`

   The publisher also prints **commit-pinned URLs**, which are recommended for an initial tested release. **These URLs will not work until the files are published to GitHub.**
3. Leave the tube's **internal CSS and JavaScript empty** if using this package alone. Do not also load `RetroWrestling-WrestleTube-Merged.js` in the same channel, which would duplicate interface elements.
4. Back up any existing chat filters. Load `filters.json` using the tube's Chat Filters import/paste facility. Importing may replace existing rules; merge intentionally if you want to keep old rules. The CSS/JS URLs **do not** automatically import chat filters.
5. Save settings, allow the channel script if your browser prompts, and hard refresh the tube (`Ctrl+Shift+R`). Make sure **Ignore Channel Javascript** is off.

## Example chat commands

- `:wwf:` · `:wwe:` · `:raw:` · `:smackdown:` · `:mania:` · `:316:` · `:rko:` · `:taker:`
- `:what:` · `:wooo:` · `:yes:` · `:acknowledge:` · `:thisisawesome:`
- `[promo]Let me tell you something![/promo]`
- `[heel]BOOOOO[/heel]`
- `[face]LET'S GO![/face]`
- `[chant]THIS IS AWESOME[/chant]`
- `[spoiler]Match result here[/spoiler]` (click to reveal)

**Notes:** Filters are intentional colon-token replacements, not automatic replacements of everyday wrestling words. The `:word:` macros may overlap with existing native emote shortcuts on some tubes; check before merging. No chat moderation, permissions, queue deletion, or video handling is changed by this package. If the channel already has a custom theme, back it up before switching.

## Local validation

The JavaScript was checked with `node --check`. All filter regular expressions were compiled as JavaScript RegExps. Live behavior still needs a browser test in the target Baked.live tube, particularly filter import and current-video status.