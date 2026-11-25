import json, os, urllib.request, urllib.parse, re
from pathlib import Path
import discover
root=Path(__file__).resolve().parent
entries=json.loads((root/'entertainment-bootstrap.json').read_text())
defaults=discover.load(discover.CONFIG)['defaults']
key=os.environ['YOUTUBE_DATA_API_KEY']
resolved={}
def resolve(source):
    if source.get('id'): return source
    handle=source['handle']
    if handle not in resolved:
        q=urllib.parse.urlencode({'part':'id,snippet','forHandle':handle,'key':key})
        with urllib.request.urlopen('https://www.googleapis.com/youtube/v3/channels?'+q,timeout=20) as r: data=json.load(r)
        items=data.get('items',[])
        if len(items)!=1: raise ValueError('Official handle not uniquely resolved: '+handle)
        resolved[handle]={'id':items[0]['id'],'name':items[0]['snippet']['title']}
    return resolved[handle]
for raw in entries:
    if raw['key'] != 'mtv': continue  # This revision targets MTV only; preserve other catalogs.
    entry={k:v for k,v in raw.items() if k not in ('sources','name')}
    try:
        entry['youtube_channels']=[]
        for s in raw['sources']:
            try: entry['youtube_channels'].append(resolve(s))
            except Exception as exc: print('Source unavailable:',s.get('handle'),type(exc).__name__)
        limits={**defaults,'min_duration_seconds':entry.get('min_duration_seconds',defaults['min_duration_seconds'])}
        archives=discover.archive(entry,limits,0)
        items=discover.youtube(entry,limits) if entry['youtube_channels'] else []
        if not archives:
            print('No qualifying archival programs; MTV remains unpublished');continue
        programs=list({p['url']:p for p in archives[:48]+items[:12]}.values())[:60]
        if len(programs)<3:
            print('Insufficient catalog:',entry['key'],len(programs));continue
        folder=root.parent/entry['directory']
        discover.write(folder/'programs.json',{'schema':1,'seed':entry['key']+'-20261125','channels':{entry['key']:{'name':'BAKED TV · '+raw['name'],'description':'Classic MTV archival programming with official YouTube supplements','programs':programs}}})
        discover.write(folder/'discovery-entry.json',entry)
        print('Validated',entry['key'],len(programs))
    except Exception as exc:
        print('Bootstrap failed:',entry['key'],type(exc).__name__)
