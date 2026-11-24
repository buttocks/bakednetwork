#!/usr/bin/env python3
"""Lightweight scheduled program discovery for all managed Baked TV channels.
Source preference: Archive direct videos, then official embeddable YouTube.
The repository stores only metadata. Every catalog is bounded and deduplicated.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import json, re, time

ROOT=Path(__file__).resolve().parent
CHANNELS=ROOT.parent
CONFIG=ROOT/"discovery.json"
STATE=ROOT/"discovery-state.json"
START=time.monotonic()
MAX_RUNTIME=240

def load(p): return json.loads(p.read_text(encoding="utf8"))
def write(p, obj):
    payload=json.dumps(obj,indent=2,ensure_ascii=False)+"\n"
    if p.exists() and p.read_text(encoding="utf8")==payload:return False
    p.write_text(payload,encoding="utf8");return True
def get_json(url):
    try:
        req=Request(url,headers={"User-Agent":"BakedTVCatalog/1.0 (public metadata only)",
                                 "Accept":"application/json"})
        with urlopen(req,timeout=13) as f:
            raw=f.read(5_000_001)
        if len(raw)>5_000_000:return None
        return json.loads(raw)
    except (OSError, ValueError, TimeoutError):return None
def approved_url(s):
    return isinstance(s,str) and (s.startswith("https://archive.org/download/") or
        bool(re.fullmatch(r"https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}",s)))
def archive(entry, defaults, cursor):
    names=entry["archive_ids"]
    chosen=[names[(cursor+i)%len(names)] for i in range(min(2,len(names)))] if names else []
    if entry.get("archive_search") and time.monotonic()-START<MAX_RUNTIME-100:
        params=urlencode({"q":entry["archive_search"],"fl[]":"identifier",
                          "rows":10,"sort[]":"publicdate desc","output":"json"})
        result=get_json("https://archive.org/advancedsearch.php?"+params)
        for resultitem in (result or {}).get("response",{}).get("docs",[]):
            name=resultitem.get("identifier","")
            if isinstance(name,str) and re.fullmatch(r"[-a-zA-Z0-9._]{4,160}",name) and name not in chosen:
                chosen.append(name)
            if len(chosen)>=5:break
    titlematch=re.compile(entry["archive_title_pattern"])
    found=[]
    for identifier in chosen:
        if time.monotonic()-START>MAX_RUNTIME:break
        meta=get_json("https://archive.org/metadata/"+quote(identifier))
        if not isinstance(meta,dict):continue
        files=meta.get("files",[])
        if not isinstance(files,list):continue
        for f in files:
            name=f.get("name","")
            if not isinstance(name,str) or not re.search(r"\.(mp4|webm|m4v)$",name,re.I):continue
            if any(s in name.lower() for s in ("thumb","sample","trailer")):continue
            if name.lower().endswith(".ia.mp4") or f.get("source") in ("derivative","metadata"):
                continue
            title=re.sub(r"\s+"," ",name.rsplit(".",1)[0].replace("_"," ")).strip()
            if len(title)<10 or not titlematch.search(title):continue
            # Mixed Archive items sometimes include unrelated wrestling. A generic
            # "vs" is not sufficient evidence that a match belongs to Lucha Tube.
            if entry["directory"]=="luchatube" and not re.search(
                    r"\b(?:CMLL|AAA|Lucha\s+Libre|Tripleman[ií]a)\b",title,re.I):
                continue
            try:seconds=int(float(f.get("length") or 0))
            except (ValueError,TypeError):continue
            if not defaults["min_duration_seconds"]<=seconds<=defaults["max_duration_seconds"]:continue
            url="https://archive.org/download/"+quote(identifier,safe="")+"/"+quote(name,safe="/")
            found.append({"title":title[:150],"episode":"Archived match",
                "url":url,"duration":seconds,"source":"Internet Archive",
                "source_channel":str(meta.get("metadata",{}).get("title") or identifier)[:90]})
            if len(found)>=60:break
        if len(found)>=60:break
    return found
def youtube(entry,defaults):
    try:from yt_dlp import YoutubeDL
    except ImportError:return []
    match=re.compile(entry["youtube_title_pattern"])
    candidates=[]
    for source in entry["youtube_channels"][:3]:
        if time.monotonic()-START>MAX_RUNTIME:break
        channel_id=source["id"]
        if not re.fullmatch(r"UC[A-Za-z0-9_-]{22}",channel_id):continue
        url="https://www.youtube.com/channel/"+channel_id+"/videos"
        options={"quiet":True,"no_warnings":True,"skip_download":True,
                 "extract_flat":"in_playlist","playlistend":65,"socket_timeout":12,
                 "retries":0,"ignoreerrors":True}
        try:
            with YoutubeDL(options) as ydl:
                listing=ydl.extract_info(url,download=False) or {}
        except Exception as e:
            print("YouTube listing inaccessible",source["name"],type(e).__name__)
            continue
        for e in (listing.get("entries") or []):
            if time.monotonic()-START>MAX_RUNTIME-20:break
            if not isinstance(e,dict):continue
            ident=e.get("id","");title=e.get("title") or ""
            if not isinstance(ident,str) or not re.fullmatch(r"[A-Za-z0-9_-]{11}",ident):continue
            if not match.search(title):continue
            candidates.append((ident,source))
            if len(candidates)>=12:break
    if not candidates:return []
    # Only a handful of videos are rechecked per refresh; no downloading.
    def detail(task):
        ident,source=task
        try:
            with YoutubeDL({"quiet":True,"no_warnings":True,"skip_download":True,
                            "noplaylist":True,"socket_timeout":12,"retries":0}) as ydl:
                video=ydl.extract_info("https://www.youtube.com/watch?v="+ident,download=False)
        except Exception:return None
        if not isinstance(video,dict):return None
        if video.get("channel_id")!=source["id"]:return None
        title=str(video.get("title") or "").strip()
        if not match.search(title):return None
        try:seconds=int(float(video.get("duration") or 0))
        except (ValueError,TypeError):return None
        if not defaults["min_duration_seconds"]<=seconds<=defaults["max_duration_seconds"]:return None
        if video.get("availability") in ("private","premium_only","subscriber_only","needs_auth"):return None
        if video.get("live_status") in ("is_live","is_upcoming"):return None
        if video.get("playable_in_embed") is False:return None
        return {"title":title[:160],"episode":source["name"]+" · official full match",
                "url":"https://www.youtube.com/watch?v="+ident,"youtube_id":ident,
                "duration":seconds,"source":"YouTube","source_channel":source["name"]}
    with ThreadPoolExecutor(max_workers=3) as pool:
        return [r for r in pool.map(detail,candidates[:9]) if r]
def refresh_one(entry,defaults,record):
    target=CHANNELS/entry["directory"]/"programs.json"
    j=load(target)
    key=entry["key"]
    items=j["channels"][key]["programs"]
    keep=int(entry.get("seed_count",0))
    if not 0<=keep<=len(items):raise ValueError("Invalid seed protection count")
    existing={p["url"] for p in items if approved_url(p.get("url"))}
    seen=record.setdefault("seen",[])
    if not isinstance(seen,list):seen=[]
    skip=set(seen)
    sources=[("Internet Archive",archive(entry,defaults,record.get("archive_cursor",0)),
              defaults["max_archive_per_run"]),
             ("YouTube",youtube(entry,defaults),defaults["max_youtube_per_run"])]
    additions=[]
    for source,candidates,limit in sources:
        n=0
        for p in candidates:
            if n>=limit or len(additions)>=defaults["max_new_per_channel_per_run"]:break
            if not approved_url(p.get("url")) or p["url"] in existing or p["url"] in skip:continue
            if source != p.get("source"):continue
            additions.append(p);existing.add(p["url"]);n+=1
    if additions:
        items.extend(additions)
        # Protect original seed entries, keep newest discovered entries, retain
        # unique URLs and evict older discovered entries when cap is reached.
        cap=defaults["max_catalog_items"]
        fixed=items[:keep]
        recent=items[keep:]
        budget=max(0,cap-len(fixed))
        updated=fixed+recent[-budget:] if budget else fixed
        j["channels"][key]["programs"]=updated
        write(target,j)
        record["last_added"]=datetime.now(timezone.utc).isoformat()
        print(entry["directory"]+"/"+key,"added",len(additions),
              "catalog",len(updated),"archive",sum(p["source"]=="Internet Archive" for p in additions),
              "youtube",sum(p["source"]=="YouTube" for p in additions))
    else:print(entry["directory"]+"/"+key,"no new verified entries")
    record["seen"]=(seen+[p["url"] for p in additions])[-800:]
    record["archive_cursor"]=(record.get("archive_cursor",0)+1)%max(1,len(entry["archive_ids"]))
    record["last_scan"]=datetime.now(timezone.utc).isoformat()
    return len(additions)
def main():
    config=load(CONFIG);state=load(STATE)
    defaults=config["defaults"]
    assert config["schema"]==1 and state["schema"]==1
    assert defaults["source_priority"]==["Internet Archive","YouTube"]
    assert 20<=defaults["max_catalog_items"]<=200
    assert 1<=defaults["max_new_per_channel_per_run"]<=5
    added=0
    for entry in config["channels"]:
        if time.monotonic()-START>MAX_RUNTIME:break
        name=entry["directory"]+"/"+entry["key"]
        record=state["channels"].setdefault(name,{"archive_cursor":0,"seen":[]})
        try:added+=refresh_one(entry,defaults,record)
        except (KeyError,ValueError,TypeError,OSError) as exc:
            print(name,"discovery error, existing catalog preserved:",type(exc).__name__)
    write(STATE,state)
    print("DISCOVERY_ADDED_TOTAL="+str(added))
if __name__=="__main__":main()
