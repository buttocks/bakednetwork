import fs from 'node:fs/promises';
const base='tubes/NWA-TNA/';
const moduleUrl='https://buttocks.github.io/bakednetwork/tubes/shared/modules/PlaylistTools-Standalone.js';
export async function deployNwatna({page,request,initial}){
 if(initial.rank<3||!initial.loggedIn||initial.channel.toLowerCase()!=='nwa-tna')throw Error('Admin verification failed');
 const css=(await fs.readFile(base+'skin.css','utf8')).trim(),motd=(await fs.readFile(base+'motd.html','utf8')).trim();
 const capture=()=>page.evaluate(()=>({css:window.CHANNEL.css||'',motd:window.CHANNEL.motd||'',js:window.CHANNEL.js||'',externalcss:window.CHANNEL.opts?.externalcss||'',externaljs:window.CHANNEL.opts?.externaljs||''}));
 const before=await capture();
 const dir='tubes/bridge/backup/NWA-TNA/deployment';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 if(before.externalcss||before.externaljs&&before.externaljs!==moduleUrl||before.js.trim()||before.css.trim()&&before.css.trim()!==css||before.motd.trim()&&before.motd.trim()!==motd)throw Error('Existing customization detected; review backup before deployment');
 async function change(event,payload,key,value){
  await page.evaluate(({event,payload})=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Admin disconnected');window.socket.emit(event,payload)},{event,payload});
  const end=Date.now()+15000;
  while(Date.now()<end){if((await capture())[key]===value)return;await page.waitForTimeout(250);}
  throw Error('Unconfirmed '+key);
 }
 try{
  if(before.css!==css)await change('setChannelCSS',{css},'css',css);
  if(before.motd!==motd)await change('setMotd',{motd},'motd',motd);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.nwatna-brand',{timeout:20000});
  await page.screenshot({path:dir+'/preview.png'});
  const after=await capture();
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));
  if(after.css!==css||after.motd!==motd||after.externaljs!==before.externaljs||after.js!==before.js)throw Error('Persisted settings mismatch');
  return {channel:request.channel,action:request.action,status:'deployed'};
 }catch(e){
  for(const [event,payload,key,target] of [['setMotd',{motd:before.motd},'motd',motd],['setChannelCSS',{css:before.css},'css',css]]){
   try{if((await capture())[key]===target&&before[key]!==target)await change(event,payload,key,before[key]);}catch{console.log('Rollback not confirmed: '+key);}
  }
  await fs.writeFile(dir+'/failure-state.json',JSON.stringify(await capture(),null,2));
  throw e;
 }
}
