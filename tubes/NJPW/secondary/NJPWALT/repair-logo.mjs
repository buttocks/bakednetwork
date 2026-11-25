import fs from 'node:fs/promises';
const OLD='https://i.gyazo.com/b5535b8eb4fe4e70f1d07d81e14ab5f9.png';
const OTHER='https://cdn.discordapp.com/attachments/810262767822831636/920816671411818566/baked-removebg-preview.png';
export async function repairLogo({page,request,initial,logo}){
 if(initial.rank<3||!initial.loggedIn||initial.channel!=='NJPWALT'||request.channel!=='NJPWALT')throw Error('Verified admin required');
 if(!logo.startsWith('https://')||!logo.includes('New_Japan_Pro_Wrestling_Logo_2.svg'))throw Error('Unexpected source logo');
 const capture=()=>page.evaluate(()=>({motd:window.CHANNEL?.motd,css:window.CHANNEL?.css,js:window.CHANNEL?.js,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs}));
 const before=await capture();
 const dir='tubes/bridge/backup/NJPWALT/logo-repair';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 if(before.motd.split(OLD).length!==2)throw Error('Expected one reviewed Gyazo MOTD image');
 const match=await page.evaluate(old=>[...document.querySelectorAll('#motdwrap img')].filter(i=>i.src===old).length,OLD);
 if(match!==1)throw Error('Reviewed image not uniquely present in MOTD');
 const response=await page.request.get(logo,{timeout:20000});
 if(!response.ok()||!response.headers()['content-type']?.includes('image/'))throw Error('Source logo unavailable');
 await response.dispose();
 const next=before.motd.replace(OLD,logo);
 async function set(motd){
  await page.evaluate(motd=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setMotd',{motd})},motd);
  const end=Date.now()+20000;while(Date.now()<end){if((await capture()).motd===motd)return;await page.waitForTimeout(250);}
  throw Error('MOTD update not confirmed');
 }
 try{
  await set(next);
  await page.waitForFunction(url=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===url&&i.complete&&i.naturalWidth>0),logo,{timeout:20000});
  const after=await capture();
  if(after.motd!==next||['css','js','externalcss','externaljs'].some(k=>after[k]!==before[k]))throw Error('Unexpected settings change');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));await page.screenshot({path:dir+'/preview.png'});
  console.log('NJPWALT primary NJPW logo verified '+logo);
  return {channel:request.channel,action:request.action,status:'logo-repaired',remainingBrokenBakedArtwork:next.includes(OTHER)};
 }catch(e){if((await capture()).motd===next)await set(before.motd);throw e;}
}
