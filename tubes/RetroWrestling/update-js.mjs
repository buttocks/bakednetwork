import fs from 'node:fs/promises';
export async function updateRetro({page,request,initial}){
 if(initial.rank<3||!initial.loggedIn||initial.channel!=='RetroWrestling')throw Error('Verified admin required');
 const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js';
 const next='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9bae91ccfa4096d8d8c293776c9d71e50d208c5a/tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js';
 const capture=()=>page.evaluate(()=>({externaljs:window.CHANNEL?.opts?.externaljs||'',externalcss:window.CHANNEL?.opts?.externalcss||'',css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd}));
 const before=await capture();
 const dir='tubes/bridge/backup/RetroWrestling/js-update';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 if(![old,next].includes(before.externaljs))throw Error('Unexpected live JS URL; refusing replacement');
 const response=await page.request.get(next,{timeout:20000});
 const body=await response.text();
 if(!response.ok()||!body.includes('PlaylistTools-Standalone.js?v=1.2')||body.includes('id="bpt-open"')||body.includes('id="rw-tools"'))throw Error('New JS not verified');
 await response.dispose();
 async function set(url){
  await page.evaluate(externaljs=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setOptions',{externaljs})},url);
  const end=Date.now()+15000;
  while(Date.now()<end){if((await capture()).externaljs===url)return;await page.waitForTimeout(250);}
  throw Error('URL update not confirmed');
 }
 try{
  if(before.externaljs!==next)await set(next);
  const after=await capture();
  if(after.externaljs!==next||['externalcss','css','js','motd'].some(k=>after[k]!==before[k]))throw Error('Unexpected settings change');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));
  console.log('RetroWrestling v1.3.2 live external JS URL verified');
  return {channel:request.channel,action:request.action,status:'retro-js-updated'};
 }catch(e){if(before.externaljs!==next&&(await capture()).externaljs===next)await set(before.externaljs);throw e;}
}
