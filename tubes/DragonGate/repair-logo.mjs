import fs from 'node:fs/promises';
const OLD='https://upload.wikimedia.org/wikipedia/en/3/3c/Dglogo3.png';
const WIKI='https://upload.wikimedia.org/wikipedia/fr/a/a6/Dragon_Gate_Logo.png';
const PRIMARY='https://i.imgur.com/dftYpyZ.png';
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
 // Check the original image in an actual browser, not only HTTP status.
 const primaryOK=await page.evaluate(async url=>{
   const image=new Image();
   return await new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),12000);image.onload=()=>{clearTimeout(timer);resolve(image.naturalWidth>0)};image.onerror=()=>{clearTimeout(timer);resolve(false)};image.src=url});
 },PRIMARY);
 const chosen=primaryOK?PRIMARY:NEW;
 const prior=[OLD,NEW,WIKI,PRIMARY].filter(url=>before.motd.includes(url));
 if(prior.length!==1||before.motd.split(prior[0]).length!==2)throw Error('Expected one known logo URL in MOTD');
 const exists=await page.evaluate(old=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===old),prior[0]);
 if(!exists)throw Error('Known logo is not an MOTD image');
 const next=before.motd.replace(/<img\b[^>]*>/gi,tag=>{
   if(!tag.includes(prior[0]))return tag;
   const updated=tag.replace(prior[0],chosen).replace(/\s(?:width|height|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'');
   return updated.replace(/\s*\/?>$/, ' style="display:block;margin:0 auto;width:380px;max-width:100%;height:auto;max-height:180px;object-fit:contain;">');
 });
 async function set(motd){
  await page.evaluate(motd=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setMotd',{motd})},motd);
  const until=Date.now()+20000;while(Date.now()<until){if((await capture()).motd===motd)return;await page.waitForTimeout(250);}
  throw Error('MOTD update not confirmed');
 }
 try{
  if(next!==before.motd)await set(next);
  await page.waitForFunction(url=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===url&&i.complete&&i.naturalWidth>0),chosen,{timeout:20000});
  const size=await page.evaluate(url=>{const i=[...document.querySelectorAll('#motdwrap img')].find(i=>i.src===url);const r=i?.getBoundingClientRect();return r?{width:r.width,height:r.height}:null},chosen);
  if(!size||size.width>382||size.height>182||size.width<1)throw Error('Logo size verification failed '+JSON.stringify(size));
  const after=await capture();
  if(after.motd!==next||['css','js','externalcss','externaljs'].some(k=>after[k]!==before[k]))throw Error('Unexpected concurrent settings change');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));await page.screenshot({path:dir+'/preview.png'});
  console.log('Dragon Gate logo verified '+request.channel+' source='+(primaryOK?'imgur':'github-fallback'));
  return {channel:request.channel,action:request.action,status:'logo-repaired',source:primaryOK?'imgur':'github-fallback'};
 }catch(e){if((await capture()).motd===next)await set(before.motd);throw e;}
}
