import pathlib,re,subprocess,json
root=pathlib.Path('.')
removed=["CSS_RDH_6_28_22.txt","rdh-carbon.css","rdh-emotes.js","rdh-fresh.css","rdh-internal.js","rdh-midnight-teal.css","rdh-modern.js","rdh-neon.css","rdh.css","themes/RetroWrestling/RetroWrestling-Theme.js","themes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js","themes/RetroWrestling/RetroWrestling.css","themes/RetroWrestling/RetroWrestling.js","themes/WCW/README.md","themes/WCW/emotes.json","themes/WCW/filters.json","themes/WCW/legacy-layout.js","themes/WCW/skin.css","themes/WCW/skin.js","themes/WWE-WWF/README.md","themes/WWE-WWF/WWF-WWE-WrestleTube-Port-v2.0.zip","themes/WWE-WWF/WWF-WWE-WrestleTube-Port-v2.1.zip","themes/WWE-WWF/WWF-WWE-WrestleTube-Port-v2.2.zip","themes/WWE-WWF/WWF-WWE-WrestleTube-Port-v2.3.zip","themes/WWE-WWF/WWF-WWE-WrestleTube-Port-v2.4.zip","themes/WWE-WWF/filters.json","themes/WWE-WWF/legacy-layout.js","themes/WWE-WWF/skin.css","themes/WWE-WWF/skin.js"]
removed += ["wrestletube/SELFHOST-MIGRATION-STATUS.md","wrestletube/addons/wrestling-chat-filters/README.md","wrestletube/addons/wrestling-chat-filters/channel-css-plus-filters.css","wrestletube/addons/wrestling-chat-filters/filters-effects.css","wrestletube/addons/wrestling-chat-filters/filters-merged.json","wrestletube/addons/wrestling-chat-filters/filters-new-only.json","wrestletube/backups/2026-11-22/README.md","wrestletube/backups/2026-11-22/admin-settings-observed.json","wrestletube/backups/2026-11-22/channel-emotes.json","wrestletube/backups/2026-11-22/channel-external.css","wrestletube/backups/2026-11-22/channel-internal.js","wrestletube/backups/2026-11-22/chat-filters.json","wrestletube/original-2026-11-15/README.md","wrestletube/original-2026-11-15/channel-internal.css","wrestletube/original-2026-11-15/channel-internal.js","wrestletube/original-2026-11-15/channel-motd.html","wrestletube/original-2026-11-15/chat-filters.json","wrestletube/original-2026-11-15/external-wtube-supplied.md","wrestletube/original-2026-11-15/external-wtube.css"]
removed += ['modules/PlaylistTools-Standalone.js']
removed += ["wid/original/wid-v2-internal.js","wid/original/wid-v2-motd.html","wid/original/wid-v2.css","wid/v3/wid-v3-internal.js","wid/v3/wid-v3-motd.html","wid/v3/wid-v3.css","wrestletube_plus_red_shitpost.css"]
files=subprocess.check_output(['git','ls-files','-z']).decode().split('\0')
hits=[]
for name in files:
 if not name or name in removed or name.startswith('.git/') or name in ('tubes/bridge/legacy-path-map.json','tubes/MAINTENANCE.md','tubes/bridge/check-cleanup.py'):continue
 p=root/name
 if p.suffix.lower() not in {'.md','.js','.css','.html','.yml','.yaml','.mjs','.py','.json','.txt'}:continue
 try: s=p.read_text(encoding='utf-8')
 except (UnicodeError,OSError):continue
 for n,line in enumerate(s.splitlines(),1):
  for old in removed:
   if old not in line:continue
   # Historical commit/tag links remain immutable; only classify explicitly
   # pinned 40-hex commit links as safe automatically.
   for match in re.finditer(re.escape(old),line):
    prefix=line[max(0,match.start()-200):match.start()]
    if re.search(r'(?:bakednetwork@|bakednetwork/)[0-9a-f]{40}/$',prefix):continue
    if prefix.endswith('tubes/RDH/') or prefix.endswith('tubes/WrestleTube/'):continue
    hits.append({'file':name,'line':n,'legacy':old,'context':line[max(0,match.start()-100):match.end()+40]})
print('DEPENDENCY_SCAN '+json.dumps({'tracked':len(files)-1,'candidates':len(removed),'hits':len(hits)}))
for h in hits[:150]:print('DEPENDENCY '+json.dumps(h))
pathlib.Path('dependency-report.json').write_text(json.dumps(hits,indent=2))
