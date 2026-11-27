# AcFun Wrestling Desk — pilot

A link-first discovery feed for wrestling posts on [プロレス愛Channel](https://www.acfun.cn/u/2327201).

- `feed.html` lists five current posts across NJPW, AJPW, AEW and TNA.
- Each card links to its AcFun post. The embedded AcFun player is an explicit click-to-load experiment with a direct-link fallback.
- The page stores post titles and AcFun IDs only. It does not download, proxy or rehost video.
- It is intentionally not registered in `tubes/feeds/managed.json` and is not added to any Baked.live room. AcFun playback was not confirmed in the cloud browser; the player displayed a browser compatibility notice.

## Next checks before an autoplay feed

1. Try the embedded player from a normal Chrome desktop session and compare it with opening the post directly on AcFun.
2. Identify a stable public upload-list refresh method. The current page uses a small manually seeded list; no unofficial endpoint is assumed.
3. If playback and source access are reliable, verify the destination tube's admin scope and take its private snapshot before registering anything in the shared feed manager.
