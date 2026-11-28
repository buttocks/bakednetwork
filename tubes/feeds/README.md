# Shared Baked TV feed manager

Owned embeddable channels are registered in [managed.json](./managed.json).
The controller is reusable for other permitted Baked.live tubes: each entry
specifies the target tube, URL, display name, and health-status key.

## Reconciliation

The GitHub Actions workflow [manage-owned-tube-feeds.yml](../../.github/workflows/manage-owned-tube-feeds.yml)
runs on a 30-minute schedule and when a feed manager source changes.

1. Validate all media URL origins and approved feed endpoints.
2. Check direct video links using one-byte Range HTTP requests.
3. Verify the hosted player page; two consecutive confirmed page failures or
   all-media permanent failures are required before a feed is offline.
4. Preserve a previous state when results are inconclusive (403/429,
   timeouts, and similar host restrictions).
5. Log into each configured tube with the existing repository secret.
6. Add a missing, confirmed-working owned iframe; delete a confirmed-down one
   only if it is not currently playing.
7. Verify every changed playlist row via the Baked.live socket state. Preserve
   all unregistered playlist entries.
8. Attach a temporary private reconciliation artifact.

The job uses the **same concurrency group** as the manual administration
bridge, so playlist mutations are serialized.

The source recordings are not hosted here. This system does not evade source
access restrictions. HTTP reachability does not guarantee browser decoding or
that public reuse rights have been established; validate each source before
expanding its catalog.

## Add another tube

Create a per-tube catalog, status checker, hosted iframe player, and then a
registry entry only after the bot's admin rank and backup have been verified.
If another tube needs different style or features, keep those in its own
folder and do not overwrite WrestleTube-derived shared JS features.

## Standard on-screen overlay behavior for all owned streams

The **Now Playing** title and on-screen controls should appear when a stream starts
or switches programs, then **fade away after about 6–7 seconds of playback**.
Moving the mouse, tapping the video, or using the keyboard shows them again
temporarily. Keep them visible while the TV Guide is open or playback needs
attention, and respect the viewer's reduced-motion setting. Fading the overlay
must never dim, pause or interrupt the actual video.

Use this behavior on every new Baked TV-owned embed, with per-channel colors
and branding retained.

## Wrestling source mix

The mixed player schedules whole programs for an even one-third share of scheduled runtime from Dailymotion, YouTube, and Internet Archive, using a deterministic UTC-day lineup. If a provider has no playable programs in a tube, the available providers split runtime evenly. Dailymotion metadata is discovered from an expandable set of configured public profiles; each tube's title filter routes matching candidates to that catalog. Profile scans are candidate discovery only: a Dailymotion item is not added to a schedule until browser playback verification records `playback_verified_run`. Source videos remain hosted and played by Dailymotion. Actual playback can differ because of outages, ads, catalog availability, and day boundaries. SlamVision is separate.

## Official YouTube discovery
Set the repository Actions secret `YOUTUBE_DATA_API_KEY` to a key restricted to YouTube Data API v3. The discovery job uses official uploads and video metadata, checks public and embeddable status and duration, and skips region-restricted entries. If the key is absent, existing yt-dlp metadata discovery remains available but hosted runners may encounter anti-bot errors. Archive discovery is independent. Metadata verification does not guarantee playback on every device.
