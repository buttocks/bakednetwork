import json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/"feeds"))
import discover
root=Path(__file__).resolve().parent
entry=json.loads((root/"discovery-entry.json").read_text())
defaults=discover.load(discover.CONFIG)["defaults"]
if not os.environ.get("YOUTUBE_DATA_API_KEY"): raise SystemExit("YouTube API key unavailable")
items=discover.youtube(entry,defaults)
unique={p["url"]:p for p in items}
programs=list(unique.values())[:60]
if len(programs)<3: raise SystemExit("Insufficient validated DDT programming; no catalog published")
out={"schema":1,"seed":"ddt-20261125","channels":{"ddt":{"name":"BAKED TV · DDT","description":"Official DDT Pro-Wrestling matches and events","programs":programs}}}
discover.write(root/"programs.json",out)
print("Validated DDT programs:",len(programs))
