#!/usr/bin/env python3
"""Lightweight scheduled program discovery for all managed Baked TV channels.
Source preference: official embeddable YouTube, then Archive direct videos.
The repository stores only metadata. Every catalog is bounded and deduplicated.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor
import json, re, time, os

ROOT=Path(__file__).resolve().parent
CHANNELS=ROOT.parent
CONFIG=ROOT/"discovery.json"
STATE=ROOT/"discovery-state.json"
START=time.monotonic()
MAX_RUNTIME=420
SEARCH_BLOCKED=False
SEARCH_USED=0
API_CACHE={}

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
                          "rows":entry.get("archive_search_rows",10),"sort[]":"publicdate desc","output":"json"})
        result=get_json("https://archive.org/advancedsearch.php?"+params)
        for resultitem in (result or {}).get("response",{}).get("docs",[]):
            name=resultitem.get("identifier","")
            if isinstance(name,str) and re.fullmatch(r"[-a-zA-Z0-9._]{4,160}",name) and name not in chosen:
                chosen.append(name)
            if len(chosen)>=entry.get("archive_candidate_limit",5):break
    titlematch=re.compile(entry["archive_title_pattern"])
    found=[]
    for identifier in chosen:
        if time.monotonic()-START>MAX_RUNTIME:break
        if identifier in defaults.get("archive_blocked_ids",[]) or re.search(defaults.get("archive_blocked_identifier_pattern",r"(?!)"),identifier):
            print("Archive excluded suspect simulation",identifier)
            continue
        meta=get_json("https://archive.org/metadata/"+quote(identifier))
        if not isinstance(meta,dict):continue
        metadata=meta.get("metadata",{})
        context=" ".join(str(metadata.get(field,"")) for field in ("title","description","subject","collection","creator","uploader"))
        if re.search(r"\b(?:WWE\s*2K\d*|WWE\s*2K|AEW Fight Forever|gameplay|video[ -]?games?|gaming|fantasy booking|e-fed|efed|Wrestling Empire|Fire Pro Wrestling World|virtual wrestling|simulation|simulated wrestling|watchalong|watch along)\b",context,re.I):
            print("Archive excluded gaming metadata",identifier)
            continue
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
            if re.search(r"\b(?:WWE\s*2K\d*|AEW Fight Forever|gameplay|video game|watchalong|watch along|simulation)\b",title,re.I):continue
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
def youtube_api(entry,defaults,key):
    """Use official YouTube Data API metadata; no cookies or media downloads."""
    match=re.compile(entry["youtube_title_pattern"])
    found=[]
    excluded=re.compile("(?i)(?:\\bWWE\\s*2K\\d*\\b|\\bAEW Fight Forever\\b|\\bgameplay\\b|\\bvideo game\\b|\\bwatchalong\\b|\\bwatch along\\b|\\breaction\\b|\\bsimulation\\b)")
    def call(resource,params):
        global SEARCH_BLOCKED, SEARCH_USED
        cache_key=(resource,json.dumps(params,sort_keys=True))
        if cache_key in API_CACHE:return API_CACHE[cache_key]
        if resource=="search":
            if SEARCH_BLOCKED or SEARCH_USED>=defaults.get("max_search_calls_per_run",8):return {}
            SEARCH_USED+=1
        url="https://www.googleapis.com/youtube/v3/"+resource+"?"+urlencode(dict(params,key=key))
        try:
            req=Request(url,headers={"Accept":"application/json","User-Agent":"BakedTVCatalog/1.0"})
            with urlopen(req,timeout=15) as response:
                data=json.loads(response.read(5_000_000))
            print("YouTube API",resource,"HTTP 200 items",len(data.get("items",[])))
            API_CACHE[cache_key]=data
            return data
        except HTTPError as exc:
            reason="unknown"
            try:
                obj=json.loads(exc.read(100000))
                reason=str(obj.get("error",{}).get("errors",[{}])[0].get("reason","unknown"))
            except Exception:pass
            print("YouTube API",resource,"HTTP",exc.code,"reason",re.sub(r"[^A-Za-z0-9_-]","",reason)[:80])
            if exc.code==429 or reason in ("quotaExceeded","dailyLimitExceeded","rateLimitExceeded","userRateLimitExceeded"):
                SEARCH_BLOCKED=True
        except Exception as exc:
            print("YouTube API",resource,"request failed",type(exc).__name__)
        return {}
    sources=entry["youtube_channels"]
    if len(sources)>3:
        offset=(datetime.now(timezone.utc).toordinal()*2+datetime.now(timezone.utc).hour//12)%len(sources)
        sources=(sources[offset:]+sources[:offset])[:3]
    for source in sources:
        if time.monotonic()-START>MAX_RUNTIME-30:break
        channel=source["id"]
        if not re.fullmatch(r"UC[A-Za-z0-9_-]{22}",channel):continue
        listing=call("channels",{"part":"contentDetails","id":channel})
        uploads=next((c.get("contentDetails",{}).get("relatedPlaylists",{}).get("uploads") for c in listing.get("items",[]) if c.get("id")==channel),None)
        if not uploads:
            print("YouTube official channel unavailable",source["name"])
            continue
        ids=[]
        token=None
        for _ in range(4):
            params={"part":"snippet,contentDetails","playlistId":uploads,"maxResults":50}
            if token:params["pageToken"]=token
            page=call("playlistItems",params)
            ids.extend(x.get("contentDetails",{}).get("videoId","") for x in page.get("items",[]) if match.search(x.get("snippet",{}).get("title","")))
            token=page.get("nextPageToken")
            if not token or len(ids)>=20:break
        # Search older uploads by topic, rather than relying on recent uploads.
        # One channel-scoped search costs 100 quota units per configured query.
        for query in entry.get("youtube_search_queries",[])[:1]:
            results=call("search",{"part":"snippet","channelId":channel,"type":"video","q":query,"maxResults":25,"videoEmbeddable":"true","order":"relevance"})
            ids.extend(x.get("id",{}).get("videoId","") for x in results.get("items",[]) if match.search(x.get("snippet",{}).get("title","")))
        ids=list(dict.fromkeys(v for v in ids if re.fullmatch(r"[A-Za-z0-9_-]{11}",v)))
        print("YouTube title candidates",source["name"],len(ids))
        if not ids:continue
        videos={"items":[]}
        for offset in range(0,min(len(ids),150),50):
            videos["items"].extend(call("videos",{"part":"snippet,contentDetails,status","id":",".join(ids[offset:offset+50])}).get("items",[]))
        for v in videos.get("items",[]):
            sn=v.get("snippet",{});status=v.get("status",{});ident=v.get("id","")
            if ident not in ids or sn.get("channelId")!=channel or not match.search(sn.get("title","")) or excluded.search(sn.get("title","")):continue
            if status.get("privacyStatus")!="public" or status.get("embeddable") is not True or sn.get("liveBroadcastContent") in ("live","upcoming"):
                print("YouTube candidate rejected",ident,"not public/embeddable or live")
                continue
            duration=re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?",v.get("contentDetails",{}).get("duration",""))
            if not duration:continue
            h,m,s=(int(x or 0) for x in duration.groups());seconds=3600*h+60*m+s
            if not defaults["min_duration_seconds"]<=seconds<=defaults["max_duration_seconds"]:
                print("YouTube candidate rejected",ident,"duration",seconds)
                continue
            if v.get("contentDetails",{}).get("regionRestriction"):
                print("YouTube candidate rejected",ident,"region restriction")
                continue
            found.append({"title":sn["title"][:160],"episode":source["name"]+" · official programming","url":"https://www.youtube.com/watch?v="+ident,"youtube_id":ident,"duration":seconds,"source":"YouTube","source_channel":source["name"]})
    return found

def youtube(entry,defaults):
    api_key=os.environ.get('YOUTUBE_DATA_API_KEY','').strip()
    if api_key:
        print("YouTube API secret configured:",entry["directory"]+"/"+entry["key"])
        return youtube_api(entry,defaults,api_key)
    print("YouTube API secret absent; using fallback")
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
    sources=[("YouTube",youtube(entry,defaults),defaults["max_youtube_per_run"]),
             ("Internet Archive",archive(entry,defaults,record.get("archive_cursor",0)),
              defaults["max_archive_per_run"])]
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
    assert defaults["source_priority"]==["YouTube","Internet Archive"]
    assert 20<=defaults["max_catalog_items"]<=200
    assert 1<=defaults["max_new_per_channel_per_run"]<=8
    added=0
    entries=config["channels"]
    # Rotate discovery order so additional feeds are not starved by the budget.
    start=int(state.get('next_channel',0))%len(entries)
    ordered=entries[start:]+entries[:start]
    # Give the sole Archive-only feed first access to the limited search budget.
    ordered.sort(key=lambda e: e['key']!='wwf-wwe')
    for i,entry in enumerate(ordered):
        if time.monotonic()-START>MAX_RUNTIME:break
        state['next_channel']=(start+i+1)%len(entries)
        name=entry["directory"]+"/"+entry["key"]
        record=state["channels"].setdefault(name,{"archive_cursor":0,"seen":[]})
        try:added+=refresh_one(entry,defaults,record)
        except (KeyError,ValueError,TypeError,OSError) as exc:
            print(name,"discovery error, existing catalog preserved:",type(exc).__name__)
    write(STATE,state)
    print("DISCOVERY_ADDED_TOTAL="+str(added))
if __name__=="__main__":main()
