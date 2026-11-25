import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync('tubes/feeds/player-core.js','utf8');
const start=code.indexOf('function shuffle('),end=code.indexOf('function select(');
assert.ok(start>=0&&end>start);
const ctx=vm.createContext({});
vm.runInContext(code.slice(start,end)+';globalThis.lineup=weightedLineup;',ctx);
const config=JSON.parse(fs.readFileSync('tubes/feeds/discovery.json'));
for(const e of config.channels){
 const p=JSON.parse(fs.readFileSync('tubes/'+e.directory+'/programs.json')).channels[e.key].programs;
 assert.ok(p.length);
 const a=ctx.lineup(p,e.key+'|2026-11-25'), b=ctx.lineup(p,e.key+'|2026-11-25');
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.ok(a.every(x=>p.some(y=>x.url===y.url)));
 const total=a.reduce((s,x)=>s+x.duration,0),yt=a.filter(x=>x.source==='YouTube').reduce((s,x)=>s+x.duration,0);
 if(p.some(x=>x.source==='YouTube')&&p.some(x=>x.source!=='YouTube')){
  const max=Math.max(...p.map(x=>x.duration));
  assert.ok(Math.abs(yt-.6*total)<=max,'airtime imbalance '+e.key);
  assert.ok(a.every((x,i)=>!i||x.url!==a[i-1].url));
 }
 console.log(e.key, p.length+' entries', Math.round(100*yt/total)+'% scheduled YouTube', Math.round(total/3600)+'h cycle');
}
console.log('Schedule tests passed; browser playback not tested.');
