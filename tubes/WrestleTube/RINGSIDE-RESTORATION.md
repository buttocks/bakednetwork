# WrestleTube background restoration — staged

The uploaded black-and-white ring photo belongs at `assets/rinng.jpg`. The uploaded photo's Git blob SHA matches the recovered JPEG exactly. Deployment validates the published image before applying any changes.

- `ringside-restoration.css`: append to the current channel CSS (do not replace original chat-effect rules).
- `ringside-motd.html`: proposed replacement for the old welcome boxes and popups, using the archived chat shortcut guide. Preserve the existing main-channel no-politics rule in addition to the new standard house rules.
- Channel scope: /Wrestling only. No playlist, permission, filter, module, external CSS or JS changes.
- Before deployment compare with the latest live MOTD and save live backups. Validate the image, layout, cinema mode, rule toggle, help guide, and unchanged queue and playback. Do not automatically apply to the secondary channels.
