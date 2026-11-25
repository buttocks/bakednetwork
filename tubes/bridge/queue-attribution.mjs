import fs from 'node:fs/promises';
const BEGIN='/* BEGIN MANAGED QUEUE ATTRIBUTION */',END='/* END MANAGED QUEUE ATTRIBUTION */';
const rules='#queue .qe_blame{float:right!important;margin-left:12px!important;font-size:11px!important;color:inherit!important;opacity:.85;white-space:nowrap}\n#queue .queue_entry::after{content:"";display:table;clear:both}';
export async function fixQueueAttribution({page,request,initial}){
 const capture=()=>page.evaluate(()=>({channel:String(window.CHANNEL?.name||''),css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs,rank:window.CLIENT?.rank,username:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in}));
 const valid=s=>s.connected&&s.loggedIn&&s.rank>=3&&String(s.username||'').toLowerCase()==='buttman-gpt'&&s.channel.toLowerCase()===request.channel.toLowerCase();
 const before=await capture();if(!valid(before)||typeof before.css!=='string')throw Error('Verified administrator required');
 const layer=BEGIN+'\n'+rules+'\n'+END;
 const start=before.css.indexOf(BEGIN),end=before.css.indexOf(END);
 if((start<0)!==(end<0)||start>=0&&end<start)throw Error('Incomplete managed CSS marker');
 const target=start<0?before.css+'\n'+layer+'\n':before.css.slice(0,start)+layer+before.css.slice(end+END.length);
 if(target===before.css)return {channel:request.channel,status:'already-deployed'};
 if(target.length>20000)throw Error('CSS limit exceeded; existing skin preserved');
 const dir='tubes/bridge/backup/'+request.channel+'/queue-attribution';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.css',before.css);
 async function change(expected,css){
  await page.evaluate(({expected,css,channel})=>{if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||String(window.CLIENT?.name||'').toLowerCase()!=='buttman-gpt'||String(window.CHANNEL?.name||'').toLowerCase()!==channel.toLowerCase()||window.CHANNEL.css!==expected)throw Error('Live state changed');window.socket.emit('setChannelCSS',{css})},{expected,css,channel:request.channel});
  for(let i=0;i<60;i++){if((await capture()).css===css)return;await page.waitForTimeout(250)}
  throw Error('CSS persistence not confirmed');
 }
 try{
  await change(before.css,target);
  const after=await capture();for(const k of ['js','motd','externalcss','externaljs'])if(after[k]!==before[k])throw Error('Unrelated configuration changed');
  await fs.writeFile(dir+'/after.css',after.css);
  const visual=await page.evaluate(()=>{const el=document.querySelector('#queue .qe_blame');if(!el)return {sample:false};const c=getComputedStyle(el);return {sample:true,float:c.cssFloat,margin:c.marginLeft,fontSize:c.fontSize}});
  await page.screenshot({path:dir+'/preview.png'});
  return {channel:request.channel,status:'deployed',cssOnly:true,visual};
 }catch(e){if((await capture()).css===target)await change(target,before.css);throw e}
}
