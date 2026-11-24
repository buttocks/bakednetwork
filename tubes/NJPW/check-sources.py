#!/usr/bin/env python3
"""Check direct public video sources without downloading video bodies.
Conservative: unknown/blocked/rate-limited results never cause feed removal.
Only confirmed missing sources over two scans set a channel offline.
"""
import concurrent.futures
import json
import pathlib
import urllib.error
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parent
CATALOG=ROOT/"programs.json"
STATUS=ROOT/"feed-status.json"
HEADERS={"User-Agent":"BakedTVFeedHealth/1.0 (+noncommercial source check)",
         "Range":"bytes=0-0", "Accept":"video/*,*/*;q=0.5"}
def check(url):
    if not isinstance(url,str) or not url.startswith("https://archive.org/download/"):
        return "unknown"
    req=urllib.request.Request(url,headers=HEADERS,method="GET")
    try:
        with urllib.request.urlopen(req,timeout=16) as response:
            code=response.status
            # Read just one byte, no full-video transfer.
            response.read(1)
            return "ok" if code in (200,206) else "unknown"
    except urllib.error.HTTPError as exc:
        return "missing" if exc.code in (404,410) else "unknown"
    except (OSError,TimeoutError,ValueError):
        return "unknown"

def main():
    source=json.loads(CATALOG.read_text(encoding="utf8"))
    state=json.loads(STATUS.read_text(encoding="utf8"))
    changed=False
    for ident,channel in source["channels"].items():
        urls=list(dict.fromkeys(e["url"] for e in channel["programs"]))
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results=list(pool.map(check,urls))
        ok=results.count("ok")
        missing=results.count("missing")
        unknown=results.count("unknown")
        existing=state["channels"].setdefault(
            ident,{"available":None,"goodStreak":0,"badStreak":0})
        previous=dict(existing)
        if ok>=1:
            existing["goodStreak"]=min(2,existing["goodStreak"]+1)
            existing["badStreak"]=0
            if existing["goodStreak"]>=1:
                existing["available"]=True
        elif missing==len(urls) and len(urls)>=2:
            existing["goodStreak"]=0
            existing["badStreak"]=min(2,existing["badStreak"]+1)
            if existing["badStreak"]>=2:
                existing["available"]=False
        else:
            # CDN trouble is not proof that every source is offline.
            existing["goodStreak"]=0
            existing["badStreak"]=0
        if existing!=previous:changed=True
        print(f"{ident}: ok={ok} missing={missing} unknown={unknown} -> available={existing['available']}")
    if changed:
        STATUS.write_text(json.dumps(state,indent=2,sort_keys=True)+"\n",encoding="utf8")
    print("STATUS_CHANGED="+str(changed).lower())

if __name__=="__main__":
    main()
