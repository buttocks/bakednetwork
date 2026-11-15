# WrestleTube: conservative redundancy cleanup (testing only)

Branch: `wrestletube-lean-test-v1`.
Source baseline: `wrestletube-selfhost-v1-20261115`, plus combined stylesheet from `wrestletube-external-only-test-v1`.

## Changes
1. Removed only the redundant **New Line** chat-filter rule. The earlier **Line break** rule matches `:br:` with identical source/flags/replacement/active/link settings. Chat filters: 153 -> 152.
2. Fixed two relative `../images/spoilers.png` paths in combined external CSS to `https://baked.live/images/spoilers.png`, preserving the document-relative destination used by the original inline stylesheet. This assumes the original Baked.live asset exists; confirm visually in the testing tube.

## Deliberately preserved
- 25 JS module files, original activation states (19 on / 6 off), load ordering, shared settings, and loader untouched.
- Triple nested shake and spoiler filters, which may intentionally work in multiple passes.
- All other 152 filter definitions, flags, ordering, enable states, and replacements.
- All CSS rules and their cascade order (including the intentional .well override).
- Every emote alias and the :zayn: name collision, pending review.
- Original archive, tagged release, and the current live channel unchanged.

## Testing
- Use `channel-combined-test.css` as the **External CSS** URL on /tv/test, with internal CSS empty.
- Keep the existing pinned v1 External JS URL unchanged.
- Import `chat-filters-test.json` into the TEST channel filters (Baked.live does not automatically fetch arbitrary filter JSON URLs).
- Verify :br:, nested [shake]/[sp] markup, spoiler hover, chat, playlist and emote click.
- Roll back the filters or CSS to the original tagged release if behavior differs.

This is NOT a proven browser QA pass. Do not deploy to the live WrestleTube channel without test validation.
