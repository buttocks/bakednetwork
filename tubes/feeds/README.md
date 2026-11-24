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
