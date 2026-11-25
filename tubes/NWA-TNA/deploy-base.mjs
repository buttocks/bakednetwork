import fs from 'node:fs/promises';
export async function deployBase({page,request,initial}){
 if(initial.rank<3||!initial.loggedIn||initial.channel!=='NWA-TNA')throw Error('Verified admin required');
 const previousUrl='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9e3a1244518097e8f0ca9bb41ee2970ccbce2989/tubes/NWA-TNA/channel-internal.js';
 const url='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@abcdcf5d41845da4c36df04d857fba6c395dcf8c/tubes/NWA-TNA/channel-internal.js';
 const capture=()=>page.evaluate(()=>({externaljs:window.CHANNEL?.opts?.externaljs||'',js:window.CHANNEL?.js||'',css:window.CHANNEL?.css||'',motd:window.CHANNEL?.motd||'',externalcss:window.CHANNEL?.opts?.externalcss||''}));
 const before=await capture();
 const dir='tubes/bridge/backup/NWA-TNA/base-deployment';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 if(before.js.trim()||before.externaljs&&![url,previousUrl].includes(before.externaljs))throw Error('Unexpected existing JS; review required');
 const res=await page.request.get(url,{timeout:20000});
 if(!res.ok()||!(await res.text()).includes('BakedWrestlingBrand'))throw Error('Shared base build not accessible');
 await res.dispose();
 async function set(externaljs){
  await page.evaluate(externaljs=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setOptions',{externaljs})},externaljs);
  const end=Date.now()+15000;
  while(Date.now()<end){if((await capture()).externaljs===externaljs)return;await page.waitForTimeout(250);}
  throw Error('JS URL not confirmed');
 }
 try{
  if(before.externaljs!==url)await set(url);
  const after=await capture();
  if(['js','css','motd','externalcss'].some(k=>after[k]!==before[k]))throw Error('Unrelated settings changed');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.rank>=3,{},{timeout:20000});
  let initialized=false;
  try{await page.waitForFunction(()=>!!window.CLIENT?.modules&&!!document.querySelector('#bpt-toolbar'),{},{timeout:45000});initialized=true;}catch{}
  const state=await page.evaluate(()=>({base:!!window.CLIENT?.modules,loadedModules:window.CLIENT?.modules?.state?.pos||0,toolbar:!!document.querySelector('#bpt-toolbar'),ignoreChannelJS:window.USEROPTS?.ignore_channeljs}));
  await fs.writeFile(dir+'/after.json',JSON.stringify({settings:await capture(),state},null,2));
  await page.screenshot({path:dir+'/preview.png'});
  console.log('NWA-TNA base verification '+JSON.stringify(state));
  return {channel:request.channel,action:request.action,status:initialized?'base-live-verified':'base-configured-runtime-unverified',state};
 }catch(e){if(before.externaljs!==url&&(await capture()).externaljs===url)await set(before.externaljs);throw e;}
}
