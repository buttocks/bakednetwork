# WCW Tube — WrestleTube original import v1.0

A simple **WCW / Monday Nitro skin** using WrestleTube's original CSS and JavaScript engine. No extra controls, no custom filter rules, and no newly invented emotes.

## Package contents
- `skin.js`: Original WrestleTube Xaekai module loader (25 definitions), chat, emote and playlist interactions, with WCW navbar/favicon branding and a small WCW logo strip
- `skin.css`: WrestleTube's complete CSS preserved first, followed by WCW navy/steel/gold styling
- `legacy-layout.js`: The original Cinema module with its CSS template embedded instead of the additional random cache-busting request
- `filters.json`: **Exact copy of WrestleTube's 153 original filter rules**
- `emotes.json`: **Exact copy of WrestleTube's 8,183 emote definitions**

## Install into WCW Tube
1. Back up WCW Tube's current emotes and filter rules, if any.
2. Set **Admin Settings → External JavaScript** to this release's pinned `skin.js` URL and **External CSS** to the matching `skin.css` URL.
3. Import `filters.json` as the complete filter list: **replace**, don't append if older WrestleTube rules are installed.
4. Import `emotes.json` through the channel's emote import/editor: **replace**, don't append if already imported.
5. Hard-refresh (Ctrl+F5) and test Layout → Cinema Mode, playlist controls, chat emotes and original filters.

No live Baked.live settings were changed. External emote image/GIF URLs still point to the original hosts; the images themselves are not backed up. The original WrestleTube export contains some older regexes that are intentionally preserved as-is. Original WrestleTube and WWF/WWE files are untouched.
