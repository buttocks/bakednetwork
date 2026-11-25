import fs from 'node:fs/promises';
export async function installTools({page,request,initial}){
 if(initial.rank<3||!initial.loggedIn||initial.channel!=='NWA-TNA')throw Error('Verified admin required');
 const js=(await fs.readFile('tubes/shared/modules/PlaylistTools-Standalone.js','utf8')).trim();
 if(Buffer.byteLength(js)>20000)throw Error('Module exceeds inline limit');
 const capture=()=>page.evaluate(()=>({js:window.CHANNEL?.js||'',css:window.CHANNEL?.css||'',motd:window.CHANNEL?.motd||'',externaljs:window.CHANNEL?.opts?.externaljs||''}));
 const before=await capture();
 if(before.js.trim()&&before.js!==js||before.externaljs)throw Error('Unexpected existing JS; no changes');
 const dir='tubes/bridge/backup/NWA-TNA/tools';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 async function set(value){
  await page.evaluate(js=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setChannelJS',{js})},value);
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){if((await capture()).js===value)return;await page.waitForTimeout(250);}
  throw Error('JS update not confirmed');
 }
 try{
  if(before.js!==js)await set(js);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.rank>=3,{},{timeout:20000});
  await page.waitForSelector('#bpt-root',{state:'attached',timeout:20000});
  const after=await capture();
  if(after.js!==js||after.css!==before.css||after.motd!==before.motd)throw Error('Settings mismatch');
  await page.screenshot({path:dir+'/preview.png'});
  console.log('Playlist Tools direct JS mount verified');
  return {channel:request.channel,action:request.action,status:'tools-installed'};
 }catch(e){
  try{if((await capture()).js===js&&before.js!==js)await set(before.js)}catch{console.log('Rollback not confirmed')}
  throw e;
 }
}
