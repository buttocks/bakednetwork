/**
 * Strictly read-only emote image URL health checker.
 * Treat only confirmed 404/410 or confirmed HTTP-200 non-image HTML as broken;
 * rate limits, 403, DNS failures and transient server errors are NOT deletable.
 */
import fs from 'node:fs/promises';
const FILE='tubes/bridge/emote-url-audit.json';
const CONCURRENCY=14;
const TIMEOUT=7500;

function normalize(raw){
  if(typeof raw!=='string')return null;
  try{
    const u=new URL(raw.trim());
    if(!['http:','https:'].includes(u.protocol)||!u.hostname||u.username||u.password)return null;
    return u.href;
  }catch{return null;}
}
export function isImgurRemovedPlaceholder(raw) {
  if(typeof raw!=='string')return false;
  try{
    const u=new URL(raw);
    return u.hostname.toLowerCase()==='i.imgur.com' &&
      /^\/removed\.(?:png|jpe?g|gif|webp)$/i.test(u.pathname);
  }catch{return false;}
}
export function retiredEmoteHostReason(raw){
  if(typeof raw!=='string')return null;
  try{
    const u=new URL(raw);
    const host=u.hostname.toLowerCase();
    if(host==='lensdump.com'||host.endsWith('.lensdump.com'))return 'owner-confirmed-lensdump-retired';
    if(host==='cdn.oblivionent.com')return 'previously-rejected-oblivionent-host';
    if(host==='billing.hyperstar.host'&&u.pathname.startsWith('/images/'))
      return 'previously-rejected-hyperstar-images';
    return null;
  }catch{return null;}
}
async function probe(req,url){
  const result={url,status:'unknown',first:null,verify:null,reason:''};
  const retired=retiredEmoteHostReason(url);
  if(retired){result.status='dead';result.reason=retired;return result;}
  async function check(method){
    const opts={timeout:TIMEOUT,maxRedirects:6,failOnStatusCode:false};
    if(method==='GET')opts.headers={Range:'bytes=0-0'};
    const response=method==='HEAD'?await req.head(url,opts):await req.get(url,opts);
    const status=response.status();
    const mime=String(response.headers()['content-type']||'').split(';')[0].toLowerCase();
    const finalUrl=response.url();
    await response.dispose();
    return {status,mime,finalUrl,removed:isImgurRemovedPlaceholder(finalUrl)};
  }
  try{
    const first=await check('HEAD');result.first=first;
    // Imgur's "removed.png" is a valid HTTP-200 image. A status/MIME
    // check alone incorrectly treats deleted macros as working.
    // Confirm a redirect/placeholder with a second independent request.
    const source=new URL(url).hostname.toLowerCase();
    const imgurHost=source==='i.imgur.com'||source==='imgur.com';
    if(first.removed||imgurHost||
      !((first.status>=200&&first.status<300)&&first.mime.startsWith('image/'))){
      const second=await check('GET');result.verify=second;
      if(first.removed&&second.removed){
        result.status='dead';result.reason='confirmed-imgur-removed-placeholder';return result;
      }
      if(!first.removed&&second.removed){
        // HEAD and GET sometimes take different CDN paths.
        const third=await check('GET');
        result.recheck=third;
        if(third.removed){
          result.status='dead';result.reason='confirmed-imgur-removed-placeholder';return result;
        }
      }
      if(first.removed||second.removed){
        result.reason='unconfirmed-imgur-placeholder';return result;
      }
      if(second.status>=200&&second.status<300&&second.mime.startsWith('image/')){
        result.status='working';return result;
      }
      if([404,410].includes(first.status)&&[404,410].includes(second.status)){
        result.status='dead';result.reason='confirmed-http-404-or-410';return result;
      }
      if(first.status>=200&&first.status<300&&second.status>=200&&second.status<300&&
        /^(text\/html|application\/xhtml\+xml)$/.test(first.mime)&&
        /^(text\/html|application\/xhtml\+xml)$/.test(second.mime)){
        result.status='dead';result.reason='confirmed-html-instead-of-image';return result;
      }
      result.reason='ambiguous-response';return result;
    }
    result.status='working';return result;
  }catch(e){
    result.reason='request-failed-or-timed-out';return result;
  }
}
export async function auditEmoteUrls({page,request,initial}){
  if(initial.rank<3)throw Error('Need Admin to audit emotes');
  const emotes=await page.evaluate(()=>{
    const e=window.CHANNEL?.emotes||[];
    return e.map(x=>({name:String(x.name||''),image:String(x.image||'')}));
  });
  if(!Array.isArray(emotes)||emotes.length<1)throw Error('Emote list not loaded; refusing audit');
  const unique=new Map();
  for(const emote of emotes){
    const normalized=normalize(emote.image);
    const key=normalized??String(emote.image);
    if(!unique.has(key))unique.set(key,{url:normalized,raw:emote.image,names:[]});
    unique.get(key).names.push(emote.name);
  }
  const urls=[...unique.values()];
  const start=request.offset??0, end=Math.min(start+(request.limit??250),urls.length);
  const tasks=urls.slice(start,end);
  const tested=new Array(tasks.length);
  let next=0,done=0;
  const req=page.context().request;
  async function worker(){
    for(;;){
      const i=next++;if(i>=tasks.length)return;
      const item=tasks[i];
      tested[i]=item.url?await probe(req,item.url):
        {url:item.raw,status:'dead',reason:'invalid-image-url'};
      tested[i].names=item.names;
      tested[i].original=item.raw;
      tested[i].index=start+i;
      done++;
      if(done%100===0)console.log('Emote checks '+done+'/'+tasks.length+
        ' (no changes)');
    }
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,tasks.length)},()=>worker()));
  const count=status=>tested.filter(x=>x.status===status).length;
  const report={schema:1,action:'audit_emotes',channel:request.channel,
    username:initial.username,checkedAt:new Date().toISOString(),
    totalEmotes:emotes.length,totalUniqueUrls:urls.length,
    offset:start,limit:tasks.length,results:tested,
    statusCounts:{working:count('working'),dead:count('dead'),unknown:count('unknown')},
    noChangesMade:true};
  await fs.writeFile(FILE,JSON.stringify(report,null,2)+'\n');
  return {request_id:request.request_id,channel:request.channel,action:request.action,
    status:'emotes-audited',checked:report.limit,totalEmotes:emotes.length,
    uniqueUrls:urls.length,start,counts:report.statusCounts,
    confirmedDead:tested.filter(x=>x.status==='dead').map(x=>({names:x.names,url:x.url||x.raw,reason:x.reason})),
    noChangesMade:true};
}


/**
 * Bounded, conservative removal. Check every URL again immediately before
 * removal; skip any ambiguous or unverified result. Remove one unique emote
 * name at a time and wait for the server's removeEmote event.
 */
export async function cleanDeadEmotes({page,request,initial}){
  if(initial.rank<3||!initial.loggedIn)throw Error('Verified channel Admin required');
  if(request.offset!==0||request.limit<6500)throw Error('Cleanup requires full emote URL coverage');
  await auditEmoteUrls({page,request,initial});
  const report=JSON.parse(await fs.readFile(FILE,'utf8'));
  if(report.limit<report.totalUniqueUrls)throw Error('Emote check did not cover all unique URLs');
  const dead=report.results.filter(x=>x.status==='dead');
  const entries=dead.flatMap(hit=>hit.names.map(name=>({
    name,oldUrl:hit.original,reason:hit.reason,index:hit.index
  })));
  const before=await page.evaluate(()=>(window.CHANNEL?.emotes||[]).map(e=>({
    name:e.name,image:e.image,source:e.source
  })));
  if(before.length!==report.totalEmotes)throw Error('Emote list changed during audit; refusing changes');
  await fs.writeFile('tubes/bridge/emotes-before-cleanup.json',JSON.stringify(before,null,2)+'\n');
  const byName=new Map();
  for(const e of before)byName.set(e.name,(byName.get(e.name)||0)+1);
  const eligible=entries.filter(e=>byName.get(e.name)===1&&
    before.some(old=>old.name===e.name&&old.image===e.oldUrl));
  const skipped=entries.filter(e=>!eligible.includes(e));
  if(eligible.length>500||eligible.length>Math.ceil(before.length*0.1))
    throw Error('Unexpectedly large dead-emote set; review the audit before deleting');
  const removed=[];
  const log={requestId:request.request_id,channel:request.channel,
    beforeCount:before.length,verifiedDeadURLs:dead.length,
    eligibleCount:eligible.length,removed,skipped,completed:false};
  const logPath='tubes/bridge/emote-url-cleanup.json';
  await fs.writeFile(logPath,JSON.stringify(log,null,2)+'\n');
  for(const item of eligible){
    // Do not delete by name alone when the entry was modified or duplicated.
    const receipt=await page.evaluate(({name,oldUrl})=>new Promise((resolve,reject)=>{
      const emotes=window.CHANNEL?.emotes||[];
      const matches=emotes.filter(e=>e.name===name);
      if(matches.length!==1||matches[0].image!==oldUrl)
        return reject(Error('Emote changed before deletion: '+name));
      const socket=window.socket;
      if(!socket?.connected)return reject(Error('Disconnected before emote deletion'));
      const count=emotes.length;
      let timer;
      const unbind=()=>{
        clearTimeout(timer);
        if(typeof socket.off==='function')socket.off('removeEmote',listener);
        else if(typeof socket.removeListener==='function')socket.removeListener('removeEmote',listener);
      };
      const listener=e=>{
        if(e?.name!==name)return;
        unbind();
        setTimeout(()=>{
          const newEmotes=window.CHANNEL?.emotes||[];
          if(newEmotes.some(x=>x.name===name)||newEmotes.length!==count-1)
            return reject(Error('Server removal was not reflected in emote list: '+name));
          resolve({name,countBefore:count,countAfter:newEmotes.length});
        },30);
      };
      timer=setTimeout(()=>{unbind();reject(Error('Server did not confirm emote removal: '+name));},8500);
      socket.on('removeEmote',listener);
      socket.emit('removeEmote',{name});
    }),item);
    removed.push({...item,countAfter:receipt.countAfter});
    if(removed.length%25===0)console.log('Removed '+removed.length+'/'+eligible.length+
      ' confirmed dead emote URLs');
    await fs.writeFile(logPath,JSON.stringify(log,null,2)+'\n');
    await page.waitForTimeout(160);
  }
  log.completed=true;
  log.afterCount=await page.evaluate(()=>window.CHANNEL?.emotes?.length??null);
  log.checkedAt=report.checkedAt;
  await fs.writeFile(logPath,JSON.stringify(log,null,2)+'\n');
  return {request_id:request.request_id,channel:request.channel,
    action:request.action,status:'dead-emotes-cleaned',beforeCount:before.length,
    afterCount:log.afterCount,checkedURLs:report.totalUniqueUrls,
    deadURLs:dead.length,removedCount:removed.length,skippedCount:skipped.length,
    unknownURLs:report.statusCounts.unknown};
}


/**
 * Follow-up cleanup requested by owner on 2026-11-24:
 * remove the remaining uncertain old-host links while explicitly keeping
 * postimg.cc / i.postimg.cc entries (known host false failures).
 *
 * Exact nine URL candidates from the prior saved 6,757-URL audit.
 * Additional previously rejected URL *patterns* are included only if found.
 * Everything else (including any later new unknown URLs) is untouched.
 */
export async function removeLegacyUncertainEmotes({page,request,initial}){
  if(request.channel!=='luchatube'||initial.rank<3||!initial.loggedIn)
    throw Error('Verified Lucha Tube Admin access required');
  const known={
    'https://cdn.420chan.org/emoticons/bo.png':'legacy-unreachable-420chan',
    'https://cdn.420chan.org/emoticons/tanashiba.png':'legacy-unreachable-420chan',
    'https://cdn.420chan.org/emoticons/daniel.png':'legacy-unreachable-420chan',
    'https://4put.ru/pictures/max/293/900169.gif':'legacy-unreachable-4put',
    'https://www.doomworld.com/gbd2/misc/doomdance.gif':'legacy-blocked-403',
    'https://roleplay.gg/image/pv.png':'legacy-host-502',
    'https://images.hobbydatabase.com/processed_uploads/subject_photo/subject_photo/image/44533/1539903724-31137-9621/LWO_20logo_large.png':'legacy-host-timeout',
    'https://cdn.oblivionent.com/mjf.png':'defunct-oblivionent',
    'https://thumbs.gfycat.com/BraveAnchoredCoelacanth-size_restricted.gif':'retired-gfycat'
  };
  const previouslyRejected=url=>{
    try{
      const u=new URL(url);
      const host=u.hostname.toLowerCase();
      if(host==='lensdump.com'||host.endsWith('.lensdump.com'))return 'defunct-lensdump-host';
      return host==='cdn.oblivionent.com'?'defunct-oblivionent':
        host==='billing.hyperstar.host'&&u.pathname.startsWith('/images/')?
        'previously-rejected-hyperstar-images':null;
    }catch{return null;}
  };
  const emotes=await page.evaluate(()=>window.CHANNEL.emotes.map(e=>({
    name:e.name,image:e.image,source:e.source
  })));
  if(emotes.length<6000||emotes.length>6900)
    throw Error('Unexpected emote count; will not remove any entries');
  await fs.writeFile('tubes/bridge/emotes-before-legacy-cleanup.json',
    JSON.stringify(emotes,null,2)+'\n');
  const countByName=new Map();
  for(const e of emotes)countByName.set(e.name,(countByName.get(e.name)||0)+1);
  const planned=emotes.filter(e=>{
    if(typeof e.image!=='string'||typeof e.name!=='string')return false;
    const host=(()=>{try{return new URL(e.image).hostname}catch{return ''}})();
    if(host==='postimg.cc'||host.endsWith('.postimg.cc'))return false;
    return Object.hasOwn(known,e.image)||!!previouslyRejected(e.image);
  }).map(e=>({...e,reason:known[e.image]||previouslyRejected(e.image)}));
  if(planned.length>30)throw Error('Too many legacy candidates; refusing to mutate');
  if(planned.some(x=>countByName.get(x.name)!==1))
    throw Error('Duplicate emote names in candidate list; refusing deletion');
  const report={requestId:request.request_id,channel:request.channel,
    action:'remove_legacy_uncertain_emotes',beforeCount:emotes.length,
    selected:planned,removed:[],afterCount:null,completed:false,
    postimgPreserved:true};
  const path='tubes/bridge/legacy-emote-cleanup.json';
  await fs.writeFile(path,JSON.stringify(report,null,2)+'\n');
  for(const entry of planned){
    await page.evaluate(({name,image})=>new Promise((resolve,reject)=>{
      const current=window.CHANNEL?.emotes||[];
      const matches=current.filter(e=>e.name===name);
      if(matches.length!==1||matches[0].image!==image)
        return reject(Error('Emote changed or disappeared: '+name));
      if(!window.socket?.connected)return reject(Error('Disconnected before emote removal'));
      const previous=current.length;
      const sk=window.socket;
      let timeout;
      function detach(){
        clearTimeout(timeout);
        if(sk.off)sk.off('removeEmote',onRemove);
        else if(sk.removeListener)sk.removeListener('removeEmote',onRemove);
      }
      function onRemove(payload){
        if(payload?.name!==name)return;
        detach();
        setTimeout(()=>{
          const updated=window.CHANNEL?.emotes||[];
          if(updated.some(x=>x.name===name)||updated.length!==previous-1)
            return reject(Error('Removal acknowledgement mismatch: '+name));
          resolve();
        },40);
      }
      timeout=setTimeout(()=>{detach();reject(Error('Emote removal not acknowledged: '+name));},9000);
      sk.on('removeEmote',onRemove);
      sk.emit('removeEmote',{name});
    }),{name:entry.name,image:entry.image});
    report.removed.push(entry);
    await fs.writeFile(path,JSON.stringify(report,null,2)+'\n');
    await page.waitForTimeout(150);
  }
  const after=await page.evaluate(()=>window.CHANNEL?.emotes||[]);
  for(const x of planned)if(after.some(e=>e.name===x.name&&e.image===x.image))
    throw Error('A removed legacy entry remains: '+x.name);
  report.afterCount=after.length;
  report.completed=true;
  await fs.writeFile(path,JSON.stringify(report,null,2)+'\n');
  console.log('Legacy emotes removed: '+report.removed.length+
    ', Postimages untouched, remaining='+after.length);
  return {request_id:request.request_id,channel:request.channel,action:request.action,
    status:'legacy-emotes-cleaned',removedCount:report.removed.length,
    beforeCount:report.beforeCount,afterCount:report.afterCount,
    removed:report.removed.map(x=>({name:x.name,reason:x.reason})),
    postimgPreserved:true};
}
