import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const CANONICAL='72a28c8b075659e26dcd91d26f379b3ee460ff1b';
const map=JSON.parse(await fs.readFile(new URL('./legacy-path-map.json',import.meta.url),'utf8'));
function replacement(raw){
 let u;try{u=new URL(raw)}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 let old;
 if(u.hostname==='cdn.jsdelivr.net')old=u.pathname.match(/^\/gh\/buttocks\/bakednetwork(?:@[^/]+)?\/(.+)$/)?.[1];
 else if(u.hostname==='raw.githubusercontent.com')old=u.pathname.match(/^\/buttocks\/bakednetwork\/[^/]+\/(.+)$/)?.[1];
 else if(u.hostname==='buttocks.github.io')old=u.pathname.match(/^\/bakednetwork\/(.+)$/)?.[1];
 if(!old)return null;
 try{old=decodeURIComponent(old)}catch{return null}
 if(!Object.hasOwn(map,old))return null;
 return 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@'+CANONICAL+'/'+map[old].split('/').map(encodeURIComponent).join('/');
}
async function digest(client,url){
 const r=await client.get(url,{timeout:20000,maxRedirects:0,failOnStatusCode:false});
 try{if(!r.ok())throw Error('HTTP '+r.status());const b=await r.body();if(b.length>12000000)throw Error('Asset exceeds comparison limit');return createHash('sha256').update(b).digest('hex')}finally{await r.dispose()}
}
export async function migrateLegacyOptions({page,request,initial}){
 if(!initial.loggedIn||initial.rank<3||String(initial.channel).toLowerCase()!==request.channel.toLowerCase())throw Error('Verified channel Admin required');
 const capture=()=>page.evaluate(()=>{const c=window.CHANNEL||{};return {css:c.css,js:c.js,motd:c.motd,externalcss:c.opts?.externalcss||'',externaljs:c.opts?.externaljs||'',options:Object.fromEntries(Object.entries(c.opts||{}).filter(([k])=>!/password|token|secret|session|credential|auth|cookie|private/i.test(k))),playlist:[...document.querySelectorAll('#queue .queue_entry')].map(el=>window.jQuery(el).data('uid')),playing:window.PL_CURRENT}});
 const before=await capture(),patch={},checks=[];
 const dir='tubes/bridge/backup/'+request.channel+'/url-migration';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2)+'\n');
 const context=await page.context().browser().newContext();
 try{
  for(const key of ['externalcss','externaljs']){
   const old=before[key],next=replacement(old);
   if(!next||old===next)continue;
   const a=await digest(context.request,old),b=await digest(context.request,next);
   if(a!==b){
    const u=new URL(old);console.log('Legacy mismatch '+request.channel+' '+key+' '+u.origin+u.pathname+' oldSHA='+a+' canonicalSHA='+b);
    const response=await context.request.get(old,{timeout:20000,maxRedirects:0,failOnStatusCode:false});
    try{if(!response.ok())throw Error('Original asset fetch failed');const bytes=await response.body();if(bytes.length>12000000||createHash('sha256').update(bytes).digest('hex')!==a)throw Error('Original asset changed during capture');await fs.writeFile(dir+'/'+key+'-original.'+(key==='externalcss'?'css':'js'),bytes)}finally{await response.dispose()}
    checks.push({key,old,next,originalSha256:a,canonicalSha256:b,mismatch:true});
    continue;
   }
   patch[key]=next;checks.push({key,old,next,sha256:a});
  }
 }finally{await context.close()}
 const result={channel:request.channel,action:request.action,checks,status:'planned',changed:0};
 await fs.writeFile(dir+'/report.json',JSON.stringify(result,null,2)+'\n');
 if(checks.some(x=>x.mismatch)){result.status='asset-mismatch';await fs.writeFile(dir+'/report.json',JSON.stringify(result,null,2)+'\n');if(request.action!=='plan_legacy_options')throw Error('Asset bytes differ; original captured; no changes made');return result;}
 if(request.action==='plan_legacy_options'||!Object.keys(patch).length)return {...result,status:Object.keys(patch).length?'planned':'no-option-changes'};
 const current=await capture();
 if(current.externalcss!==before.externalcss||current.externaljs!==before.externaljs)throw Error('Options changed concurrently');
 await page.evaluate(p=>{if(!window.socket?.connected)throw Error('Socket disconnected');window.socket.emit('setOptions',p)},patch);
 const until=Date.now()+20000;
 while(Date.now()<until){
  const after=await capture();
  if(Object.entries(patch).every(([k,v])=>after[k]===v)){
   if(['css','js','motd'].some(k=>after[k]!==before[k]))throw Error('Unexpected inline setting change; review immediately');
   if(Object.keys(before.options).filter(k=>!Object.hasOwn(patch,k)).some(k=>JSON.stringify(before.options[k])!==JSON.stringify(after.options[k])))throw Error('Unexpected unrelated option change; review immediately');
   await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2)+'\n');
   result.status='migrated';result.changed=Object.keys(patch).length;
   await fs.writeFile(dir+'/report.json',JSON.stringify(result,null,2)+'\n');
   console.log('Legacy options migrated: '+request.channel+' '+result.changed);
   return result;
  }
  await page.waitForTimeout(250);
 }
 throw Error('Server did not confirm exact option changes; inspect before retry');
}
