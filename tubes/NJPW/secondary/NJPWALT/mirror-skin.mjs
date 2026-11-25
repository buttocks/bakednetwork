import fs from 'node:fs/promises';
export async function mirrorSkin({page,source,request,initial}){
 if(request.channel!=='NJPWALT'||initial.channel!=='NJPWALT'||initial.rank<3||!initial.loggedIn)throw Error('Verified admin required');
 const read=p=>p.evaluate(()=>({name:window.CHANNEL?.name,css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,externalcss:window.CHANNEL?.opts?.externalcss||'',externaljs:window.CHANNEL?.opts?.externaljs||''}));
 const before=await read(page),template=await read(source);
 if(before.name!=='NJPWALT'||template.name!=='NJPW'||typeof template.css!=='string'||typeof template.motd!=='string'||!template.css.includes('BEGIN NJPW COMPACT ARENA SKIN')||!template.motd.includes('New_Japan_Pro_Wrestling_Logo_2.svg'))throw Error('Main NJPW compact skin not verified');
 if(template.externalcss||before.externalcss)throw Error('Unexpected external CSS; review needed');
 const dir='tubes/bridge/backup/NJPWALT/mirror-skin';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 await fs.writeFile(dir+'/template.json',JSON.stringify(template,null,2));
 // Mirror only visual settings. Keep target JS and channel identity.
 // Preserve target-specific Rules and scheduling contents by retaining its MOTD
 // only if it already matches the main layout; otherwise use the reviewed main layout.
 const next={css:template.css,motd:template.motd};
 async function set(key,value){
  await page.evaluate(({key,value})=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit(key==='css'?'setChannelCSS':'setMotd',{[key]:value})},{key,value});
  const end=Date.now()+20000;
  while(Date.now()<end){if((await read(page))[key]===value)return;await page.waitForTimeout(250)}
  throw Error(key+' update not confirmed');
 }
 try{
  for(const key of ['css','motd'])if(before[key]!==next[key])await set(key,next[key]);
  await page.waitForFunction(()=>{const i=document.querySelector('#motdwrap #header img');return i&&i.complete&&i.naturalWidth>0},{},{timeout:20000});
  const after=await read(page);
  if(after.css!==next.css||after.motd!==next.motd||['js','externaljs','externalcss'].some(k=>after[k]!==before[k]))throw Error('Unexpected settings mismatch');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));await page.screenshot({path:dir+'/preview.png'});
  console.log('NJPWALT main NJPW CSS and MOTD verified');
  return {channel:request.channel,action:request.action,status:'skin-mirrored'};
 }catch(e){
  for(const key of ['motd','css'])if((await read(page))[key]===next[key]&&before[key]!==next[key])await set(key,before[key]);
  throw e;
 }
}
