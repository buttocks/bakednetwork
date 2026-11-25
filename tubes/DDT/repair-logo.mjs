import fs from 'node:fs/promises';
const OLD='https://upload.wikimedia.org/wikipedia/en/thumb/a/af/DDT-Wrestling.svg/800px-DDT-Wrestling.svg.png';
const PRIMARY='https://i.imgur.com/c2FHgiA.png';
const FALLBACK='https://upload.wikimedia.org/wikipedia/en/a/af/DDT-Wrestling.svg';
export async function repairDDT({page,request,initial}){
 if(request.channel!=='ddt'||initial.channel!=='ddt'||initial.rank<3||!initial.loggedIn)throw Error('Verified DDT admin required');
 const capture=()=>page.evaluate(()=>({name:window.CHANNEL?.name,motd:window.CHANNEL?.motd,css:window.CHANNEL?.css,js:window.CHANNEL?.js,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs}));
 const before=await capture();
 if(before.name!=='ddt'||typeof before.motd!=='string')throw Error('Missing DDT configuration');
 const dir='tubes/bridge/backup/ddt/logo-repair';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const loads=url=>page.evaluate(url=>new Promise(resolve=>{const i=new Image();const t=setTimeout(()=>resolve(false),12000);i.onload=()=>{clearTimeout(t);resolve(i.naturalWidth>0)};i.onerror=()=>{clearTimeout(t);resolve(false)};i.src=url}),url);
 const chosen=await loads(PRIMARY)?PRIMARY:await loads(FALLBACK)?FALLBACK:null;
 if(!chosen)throw Error('Neither supplied logo source loads');
 const prior=[OLD,PRIMARY,FALLBACK].filter(url=>before.motd.includes(url));
 if(prior.length!==1||before.motd.split(prior[0]).length!==2)throw Error('Expected one known logo URL');
 if(!await page.evaluate(url=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===url),prior[0]))throw Error('Known logo missing from MOTD');
 const next=before.motd.replace(/<img\b[^>]*>/gi,tag=>tag.includes(prior[0])?tag.replace(prior[0],chosen).replace(/\s(?:width|height|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/\s*\/?>$/, ' style="display:block;margin:0 auto;width:380px;max-width:100%;height:auto;max-height:180px;object-fit:contain;">'):tag);
 async function set(motd){
  await page.evaluate(motd=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Disconnected');window.socket.emit('setMotd',{motd})},motd);
  const end=Date.now()+20000;while(Date.now()<end){if((await capture()).motd===motd)return;await page.waitForTimeout(250)}throw Error('MOTD not confirmed');
 }
 try{
  if(next!==before.motd)await set(next);
  await page.waitForFunction(url=>[...document.querySelectorAll('#motdwrap img')].some(i=>i.src===url&&i.complete&&i.naturalWidth>0),chosen,{timeout:20000});
  const size=await page.evaluate(url=>{const r=[...document.querySelectorAll('#motdwrap img')].find(i=>i.src===url)?.getBoundingClientRect();return r?{width:r.width,height:r.height}:null},chosen);
  if(!size||size.width>382||size.height>182||size.width<1)throw Error('Logo size verification failed '+JSON.stringify(size));
  const after=await capture();
  if(after.motd!==next||['css','js','externalcss','externaljs'].some(k=>after[k]!==before[k]))throw Error('Unexpected settings change');
  await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));await page.screenshot({path:dir+'/preview.png'});
  console.log('DDT logo verified '+chosen+' '+JSON.stringify(size));
  return {channel:request.channel,action:request.action,status:'logo-repaired',source:chosen,size};
 }catch(e){if(next!==before.motd&&(await capture()).motd===next)await set(before.motd);throw e;}
}
