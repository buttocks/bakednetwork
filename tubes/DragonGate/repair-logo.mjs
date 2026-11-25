import fs from 'node:fs/promises';
const OLD='https://upload.wikimedia.org/wikipedia/en/3/3c/Dglogo3.png';
const NEW='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@236c682c37d547c6d6d534148b199e1d503bb1f0/tubes/DragonGate/assets/dragon-gate-wordmark.svg';
export async function repairDragonGate({page,request,initial}){
 if(!['DG','DGalt'].includes(request.channel)||initial.rank<3||!initial.loggedIn||initial.channel!==request.channel)throw Error('Verified Dragon Gate admin required');
 const capture=()=>page.evaluate(()=>({name:window.CHANNEL?.name,motd:window.CHANNEL?.motd,css:window.CHANNEL?.css,js:window.CHANNEL?.js,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs}));
 const before=await capture();
 if(before.name!==request.channel||typeof before.motd!=='string')throw Error('Missing channel configuration');
 const dir='tubes/bridge/backup/'+request.channel+'/logo-repair';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const res=await page.request.get(NEW,{timeout:20000});
 if(!res.ok()||!(await res.text()).includes('DRAGON GATE'))throw Error('Replacement artwork inaccessible');
 await res.dispose();
 const count=before.motd.split(OLD).length-1;
 if(count===0&&before.motd.includes(NEW))return {channel:request.channel,action:request.action,status:'already-repaired'};
 if(count!==1)throw Error('Expected exactly one old logo URL in live MOTD');
 const exists=await page.evaluate(old=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===old),OLD);
 if(!exists)throw Error('Old URL is not an MOTD image');
 const next=before.motd.replace(OLD,NEW);
 async function set(motd){
  await page.evaluate(motd=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setMotd',{motd})},motd);
  const until=Date.now()+20000;while(Date.now()<until){if((await capture()).motd===motd)return;await page.waitForTimeout(250);}
  throw Error('MOTD update not confirmed');
 }
 try{
  await set(next);
  await page.waitForFunction(url=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===url&&i.complete&&i.naturalWidth>0),NEW,{timeout:20000});
  const after=await capture();
  if(after.motd!==next||['css','js','externalcss','externaljs'].some(k=>after[k]!==before[k]))throw Error('Unexpected concurrent settings change');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));await page.screenshot({path:dir+'/preview.png'});
  console.log('Dragon Gate logo verified '+request.channel);
  return {channel:request.channel,action:request.action,status:'logo-repaired'};
 }catch(e){if((await capture()).motd===next)await set(before.motd);throw e;}
}
