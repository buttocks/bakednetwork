import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {multipartInfo,multipartBlocks} from './multipart.js';
const p=(title,url,source='YouTube',owner='Same uploader',duration=600)=>({title,url,source,source_channel:owner,duration});
const fixture=[p('Championship Final (Part 3 of 3)','c'),p('Different match','d','Internet Archive'),p('Championship Final (Part 1 of 3)','a'),p('Championship Final (Part 2 of 3)','b'),p('Other show Part 1 of 2','missing'),p('Show Episode 2','e'),p('Championship Final Part 2','foreign','YouTube','Other uploader')];
assert.equal(multipartInfo(fixture[5]),null);
const grouped=multipartBlocks(fixture);
assert.deepEqual(grouped.blocks.find(b=>b.group).parts.map(x=>x.url),['a','b','c']);
assert.equal(grouped.unresolved.length,2);
assert.equal(multipartBlocks([p('Match Part 1 of 3','a'),p('Match Part 3 of 3','c')]).blocks.length,0);
assert.equal(multipartBlocks([p('Match Part 1','a'),p('Match Part 1','b'),p('Match Part 2','c')]).blocks.length,0);
function check(order,items,label){
 const {blocks,unresolved}=multipartBlocks(items);
 const pending=new Set(unresolved.flatMap(g=>g.items.map(p=>p.url)));
 assert.ok(order.every(p=>!pending.has(p.url)),label+' scheduled unresolved part');
 const lookup=new Map(blocks.filter(b=>b.group).flatMap(b=>b.parts.map((p,i)=>[p.url,{block:b,i}])));
 for(let i=0;i<order.length;i++){
  const hit=lookup.get(order[i].url);
  if(!hit)continue;
  assert.equal(hit.i,0,label+' begins block mid-series');
  assert.deepEqual(order.slice(i,i+hit.block.parts.length).map(p=>p.url),hit.block.parts.map(p=>p.url),label+' split or reordered group');
  i+=hit.block.parts.length-1;
 }
}
const config=JSON.parse(fs.readFileSync('tubes/feeds/discovery.json'));
const mixed=new Set(['dg','dgalt','noah','indies','rizin','wid']);
const report=[];
for(const e of config.channels){
 const file=e.key==='nwa-tna-early'?'tubes/NWA-TNA/player-core-asylum.js':mixed.has(e.key)?'tubes/feeds/player-core-mixed.js':'tubes/feeds/player-core.js';
 const code=fs.readFileSync(file,'utf8');
 const start=code.indexOf('// BEGIN MULTIPART HELPERS'),end=code.indexOf('function select(');
 assert.ok(start>=0&&end>start);
 const ctx=vm.createContext({});
 vm.runInContext(code.slice(start,end)+';globalThis.lineup=weightedLineup;',ctx);
 const items=JSON.parse(fs.readFileSync('tubes/'+e.directory+'/programs.json')).channels[e.key].programs;
 for(const day of ['2026-11-25','2026-11-26','2026-12-01']){
  const key=e.key+'|'+day;
  const order=JSON.parse(JSON.stringify(ctx.lineup(items,key)));
  assert.deepEqual(order,JSON.parse(JSON.stringify(ctx.lineup(items,key))));
  check(order,items,key);
  check(JSON.parse(JSON.stringify(ctx.lineup(fixture,key))),fixture,key+' fixture');
 }
 const {blocks,unresolved}=multipartBlocks(items);
 report.push({feed:e.key,programs:items.length,groups:blocks.filter(b=>b.group).map(b=>({parts:b.parts.map(p=>p.title)})),unresolved:unresolved.map(g=>({parts:g.items.map(p=>p.title),expected:g.expected}))});
}
for(const file of ['tubes/NJPW/feed-player.js','tubes/luchatube/feed-player.js']){
 const code=fs.readFileSync(file,'utf8');
 assert.ok(code.includes('shuffle(multipartBlocks(track?.programs||[]).blocks,id).flatMap(b=>b.parts)'));
}
fs.writeFileSync('multipart-catalog-audit.json',JSON.stringify(report,null,2));
console.log('MULTIPART_CATALOG '+JSON.stringify(report.map(r=>({feed:r.feed,complete:r.groups.length,unresolved:r.unresolved.length}))));
console.log('PASS: deterministic schedules, contiguous complete multipart blocks, withheld gaps and ambiguous duplicates');
