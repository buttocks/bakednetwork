#!/usr/bin/env python3
"""Expand Lucha Libre's direct-video schedule from public Internet Archive metadata.
Only approved source identifiers and recognizable lucha match names are considered.
No third-party website scraping or download of complete video files.
"""
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json, re, os

ROOT=Path(__file__).parent
TARGET=ROOT/"programs.json"
SOURCES=("approved_match_picks_06_2025",)
MATCH=re.compile(r"(?:\bCMLL\b|\bAAA\b|lucha\s*libre)",re.I)
MEDIA=re.compile(r"\.mp4$",re.I)
MAX_ITEMS=80
def one_file(meta, identifier):
    result=[]
    for f in meta.get("files",[]):
        filename=f.get("name","")
        if not MEDIA.search(filename) or not MATCH.search(filename):
            continue
        if f.get("source") in ("derivative","metadata") or "thumb" in filename.lower():continue
        try:seconds=int(float(f.get("length") or 0))
        except(ValueError,TypeError):continue
        if not 120<=seconds<=14400:continue
        title=re.sub(r"\s+"," ",re.sub(r"\[[^]]*\]","",filename[:-4])).strip()
        if len(title)<8:continue
        result.append({
            "title":title[:140],"episode":"Archived lucha match",
            "url":"https://archive.org/download/"+quote(identifier,safe="")+"/"+quote(filename,safe="/"),
            "duration":seconds,
            "source":"Internet Archive",
            "source_channel":"Lucha Libre"
        })
    return result

def main():
    config=json.loads(TARGET.read_text(encoding="utf8"))
    items=config["channels"]["lucha"]["programs"]
    original={p["url"]:p for p in items}
    found=[]
    for identifier in SOURCES:
        try:
            req=Request("https://archive.org/metadata/"+identifier,
              headers={"User-Agent":"BakedTV-LuchaCatalog/1.0","Accept":"application/json"})
            with urlopen(req,timeout=25) as response:
                if response.status!=200:raise RuntimeError("HTTP "+str(response.status))
                data=response.read(6_000_000)
            meta=json.loads(data)
            candidates=one_file(meta,identifier)
            found.extend(candidates)
            print(identifier+": "+str(len(candidates))+" candidate match recordings")
        except (OSError,RuntimeError,ValueError) as exc:
            print(identifier+": metadata unavailable; preserving current catalog")
    # Retain existing working sources; cap expansion for performance.
    for item in found:
        if item["url"] not in original and len(original)<MAX_ITEMS:
            original[item["url"]]=item
    expanded=list(original.values())
    if len(expanded)>len(items):
        config["channels"]["lucha"]["programs"]=expanded
        TARGET.write_text(json.dumps(config,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print("LUCHA_PROGRAMS="+str(len(expanded)))

if __name__=="__main__":main()
