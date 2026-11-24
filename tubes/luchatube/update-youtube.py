#!/usr/bin/env python3
"""Add metadata-confirmed official YouTube full matches to the mixed Lucha TV feed.
Does not download, transcode or mirror video. Any inaccessible item is skipped.
"""
import json
import pathlib
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parent
CANDIDATES = ROOT / "youtube-candidates.json"
CATALOG = ROOT / "programs.json"
MIN_SECONDS, MAX_SECONDS = 5*60, 2*60*60

def valid(info, candidate):
    if not isinstance(info, dict):
        return False
    title = (info.get("title") or "").strip()
    uploader = (info.get("channel") or info.get("uploader") or "").strip().lower()
    expected = candidate["publisher"].lower()
    duration = info.get("duration")
    if not title or not isinstance(duration, (int, float)):
        return False
    if not (MIN_SECONDS <= duration <= MAX_SECONDS):
        return False
    if expected not in uploader:
        return False
    if info.get("is_live") or info.get("live_status") in ("is_live", "is_upcoming"):
        return False
    if info.get("availability") in ("private", "premium_only", "subscriber_only"):
        return False
    if not re.search(r"\bfull\s*(?:match|fight|lucha)\b", title, re.I):
        return False
    return True

def fetch(candidate):
    from yt_dlp import YoutubeDL
    ident = candidate["id"]
    if not re.fullmatch(r"[a-zA-Z0-9_-]{11}", ident):
        return ident, None, "bad-id"
    # Extract public metadata only; do not download formats or bypass access controls.
    options = {
        "quiet": True, "no_warnings": True, "skip_download": True,
        "extract_flat": False, "socket_timeout": 18, "retries": 1,
        "ignoreerrors": True, "noplaylist": True,
    }
    try:
        with YoutubeDL(options) as ydl:
            info = ydl.extract_info("https://www.youtube.com/watch?v="+ident, download=False)
    except Exception as exc:
        return ident, None, type(exc).__name__
    if not valid(info, candidate):
        return ident, None, "metadata-not-approved"
    return ident, {
        "title": info["title"][:160],
        "episode": candidate["publisher"] + " · official full match",
        "url": "https://www.youtube.com/watch?v="+ident,
        "youtube_id": ident,
        "duration": int(round(info["duration"])),
        "source": "YouTube",
        "source_channel": candidate["publisher"],
    }, "ok"

def main():
    listing = json.loads(CANDIDATES.read_text(encoding="utf8"))
    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    candidates = listing["candidates"]
    if len(candidates)>30 or len({x["id"] for x in candidates})!=len(candidates):
        raise ValueError("Invalid candidate list")
    catalog_items = catalog["channels"]["lucha"]["programs"]
    preserved = {x["url"]:x for x in catalog_items}
    new = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(fetch,item):item for item in candidates}
        for fut in as_completed(futures):
            ident, entry, state = fut.result()
            print("YOUTUBE_METADATA", ident, state, entry["duration"] if entry else "-")
            if entry:
                new.append(entry)
    for entry in sorted(new, key=lambda x:x["youtube_id"]):
        if entry["url"] not in preserved:
            preserved[entry["url"]] = entry
    result = list(preserved.values())
    if result != catalog_items:
        catalog["channels"]["lucha"]["programs"] = result
        CATALOG.write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print("YOUTUBE_VERIFIED="+str(len(new)))
    print("LUCHA_TOTAL_PROGRAMS="+str(len(result)))

if __name__=="__main__":
    main()
