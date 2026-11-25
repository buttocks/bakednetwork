import fs from 'node:fs/promises';
const marker='/* NWA-TNA playlist attribution spacing */';
export async function fixQueueBlame({page,request,initial}){
 const capture=()=>page.evaluate(()=>({channel:String(window.CHANNEL?.name||''),css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in}));
 const before=await capture();
 if(!before.connected||!before.loggedIn||before.rank<3||before.channel.toLowerCase()!=='nwa-tna'||typeof before.css!=='string')throw Error('NWA-TNA admin verification failed');
 const source=await fs.readFile('tubes/NWA-TNA/skin.css','utf8');
 const patch=source.slice(source.indexOf(marker)).trim();
 if(!patch.startsWith(marker)||!patch.includes('.qe_blame')||patch.length>500)throw Error('Invalid CSS patch');
 if(before.css.includes(patch))return {status:'already-deployed',channel:request.channel};
 if(before.css.includes(marker))throw Error('Existing different managed patch; review required');
 const target=before.css.trimEnd()+'\n'+patch+'\n';
 if(target.length>20000)throw Error('CSS limit exceeded');
 const dir='tubes/bridge/backup/NWA-TNA/queue-blame';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.css',before.css);
 async function change(expected,css){
  await page.evaluate(({expected,css})=>{if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||String(window.CHANNEL?.name).toLowerCase()!=='nwa-tna'||window.CHANNEL.css!==expected)throw Error('Live state changed');window.socket.emit('setChannelCSS',{css})},{expected,css});
  for(let i=0;i<60;i++){if((await capture()).css===css)return;await page.waitForTimeout(250)}
  throw Error('CSS persistence not confirmed');
 }
 try{
  await change(before.css,target);
  const after=await capture();
  for(const k of ['js','motd','externalcss','externaljs'])if(after[k]!==before[k])throw Error('Unrelated configuration changed');
  await fs.writeFile(dir+'/after.css',after.css);
  await page.screenshot({path:dir+'/preview.png'});
  return {status:'deployed',channel:request.channel,cssOnly:true};
 }catch(e){if((await capture()).css===target)await change(target,before.css);throw e}
}
