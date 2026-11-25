/**
 * Read-only media audit for a Baked.live playlist.
 * Tests archived YouTube/Dailymotion/direct-file media; never tests or deletes
 * custom iframes or live channels as if they were missing recordings.
 * Detailed playlist data is retained in GitHub Actions artifacts, not committed to the public repository.
 */
import fs from 'node:fs/promises';

const OUTPUT='tubes/bridge/playlist-media-audit.json';
const SNAPSHOT='tubes/bridge/playlist-before-cleanup.json';
const TIMEOUT=12000;
const CONCURRENCY=4;
const TWO_DIGITS=2;
function lower(value){return String(value||'').toLowerCase();}
function classify(item) {
  if(item.type==='cu')return 'protected-custom-iframe';
  if(item.type==='tw')return 'protected-live-twitch';
  if(item.type==='yt')return 'youtube';
  if(item.type==='dm')return 'dailymotion';
  if(item.type==='fi')return 'direct-file';
  return 'unsupported';
}
function endpoint(item){
  const id=String(item.id||'');
  if(item.type==='yt'&&/^[A-Za-z0-9_-]{11}$/.test(id))
    return 'https://www.youtube.com/oembed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id)+'&format=json';
  if(item.type==='dm'&&/^[A-Za-z0-9]{4,40}$/.test(id))
    return 'https://api.dailymotion.com/video/'+encodeURIComponent(id)+'?fields=id,title,status,private,allow_embed';
  if(item.type==='fi'&&/^https:\/\//.test(id))return id;
  return null;
}
async function fetchStatus(context,url,method='GET'){
  const options={timeout:TIMEOUT,maxRedirects:4,failOnStatusCode:false};
  if(method==='GET'&&!url.includes('youtube.com/oembed')&&!url.includes('api.dailymotion.com'))options.headers={Range:'bytes=0-0'};
  const response=method==='HEAD'?await context.head(url,options):await context.get(url,options);
  const s=response.status(),kind=String(response.headers()['content-type']||'');
  let data=null;
  if(s===200&&kind.includes('application/json')&&url.includes('api.dailymotion')){
    try{data=await response.json()}catch{}
  }
  await response.dispose();
  return {status:s,kind,hasData:!!data?.id,providerStatus:data?.status||null};
}
async function probe(item,request){
  const category=classify(item);
  const report={index:item.index,uid:item.uid,type:item.type,id:item.id,
    title:item.title,category,status:'unknown',reason:'',first:null,second:null};
  if(category.startsWith('protected-')){
    report.status='protected';report.reason=category;return report;
  }
  const url=endpoint(item);
  if(!url){
    report.reason='unrecognized-media-id';return report;
  }
  try{
    const first=await fetchStatus(request,url,item.type==='fi'?'HEAD':'GET');
    report.first=first;
    if(first.status>=200&&first.status<300){
      if(item.type==='dm'&&!first.hasData){
        report.reason='api-did-not-return-media-id';return report;
      }
      report.status='available';return report;
    }
    // A 401/403 may mean account, geo, age, embed permission, or anti-bot,
    // not deletion. Leave it alone.
    if(![404,410].includes(first.status)){
      report.reason='not-confirmed-dead-http-'+first.status;return report;
    }
    // Confirm at a second request, rather than deleting for one transient 404.
    const second=await fetchStatus(request,url,item.type==='fi'?'GET':'GET');
    report.second=second;
    if([404,410].includes(second.status)){
      report.status='not-publicly-playable';
      report.reason='two-confirmed-404-or-410-from-source';
    }else if(second.status>=200&&second.status<300){
      report.status='available';
      report.reason='recovered-on-retry';
    }else report.reason='second-request-not-confirmatory-'+second.status;
    return report;
  }catch(e){
    report.reason='network-error-or-rate-limit';
    return report;
  }
}
export async function auditPlaylistMedia({page,request,initial}){
  if(initial.rank<3||String(initial.channel).toLowerCase()!==request.channel.toLowerCase())
    throw Error('Verified channel Admin required to audit playlist');
  const state=await page.evaluate(()=>{
    const q=[...document.querySelectorAll('#queue .queue_entry')];
    return {
      playing:window.PL_CURRENT,
      entries:q.map((el,index)=>{
        const jq=window.jQuery?window.jQuery(el):null;
        const m=jq?.data('media')||{};
        return {index,uid:jq?.data('uid')??null,
          type:m.type??null,id:m.id??null,title:m.title||el.querySelector('.qe_title')?.textContent||'',
          temp:!!jq?.data('temp'),seconds:m.seconds??null,
          src:m.meta?.embed?.src||null};
      })
    };
  });
  if(state.entries.length<1||state.entries.length>1500)
    throw Error('Unexpected playlist length; refusing incomplete audit');
  const uniqueUids=new Set(state.entries.map(e=>e.uid));
  if(uniqueUids.size!==state.entries.length)throw Error('Incomplete playlist: duplicate UIDs');
  await fs.writeFile(SNAPSHOT,JSON.stringify({
    channel:request.channel,capturedAt:new Date().toISOString(),playing:state.playing,
    entries:state.entries
  },null,2)+'\n');
  const offset=request.offset??0;
  const limit=request.limit??state.entries.length;
  const tasks=state.entries.slice(offset,offset+limit);
  const results=new Array(tasks.length);
  const client=page.context().request;
  let position=0;
  async function worker(){
    for(;;){
      const n=position++;if(n>=tasks.length)return;
      results[n]=await probe(tasks[n],client);
      if((n+1)%100===0)console.log('Playlist audit processed '+(n+1)+'/'+tasks.length);
    }
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,tasks.length)},()=>worker()));
  const counts={};
  for(const x of results)counts[x.status]=(counts[x.status]||0)+1;
  const suspect=results.filter(x=>x.status==='not-publicly-playable');
  const report={
    channel:request.channel,action:request.action,requestId:request.request_id,
    capturedAt:new Date().toISOString(),playing:state.playing,
    playlistItems:state.entries.length,offset,limit:tasks.length,
    statusCounts:counts,results,noChangesMade:true
  };
  await fs.writeFile(OUTPUT,JSON.stringify(report,null,2)+'\n');
  const dir='tubes/bridge/backup/'+request.channel+'/playlist-audit';
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
  await fs.copyFile(SNAPSHOT,dir+'/before.json');
  const breakdown={};
  for(const x of suspect){const k=x.type+':'+x.first?.status+'/'+x.second?.status;breakdown[k]=(breakdown[k]||0)+1;}
  // Collect independent YouTube metadata evidence during read-only audits too.
  const yt=suspect.filter(x=>x.type==='yt');
  const key=process.env.YOUTUBE_DATA_API_KEY;
  const youtubeEvidence=[];
  if(key&&yt.length){
    for(let i=0;i<yt.length;i+=50){
      const batch=yt.slice(i,i+50);
      try{
        const u=new URL('https://www.googleapis.com/youtube/v3/videos');
        u.searchParams.set('part','status');u.searchParams.set('id',batch.map(x=>x.id).join(','));u.searchParams.set('key',key);
        const response=await fetch(u,{signal:AbortSignal.timeout(15000)});
        if(!response.ok){console.log('YouTube metadata verification HTTP '+response.status);continue;}
        const data=await response.json();
        if(!Array.isArray(data.items))continue;
        for(const x of batch){const v=data.items.find(v=>v.id===x.id);youtubeEvidence.push({uid:x.uid,id:x.id,returned:!!v,status:v?.status||null});}
      }catch{console.log('YouTube metadata verification unavailable');}
    }
  }

  const absentIds=new Set(youtubeEvidence.filter(x=>!x.returned).map(x=>x.uid));
  const review={youtubeAbsent:yt.filter(x=>absentIds.has(x.uid)).length,
    youtubeReturned:youtubeEvidence.filter(x=>x.returned).length,
    youtubeUnverified:yt.length-youtubeEvidence.length,
    direct404:suspect.filter(x=>x.type==='fi'&&x.first?.status===404&&x.second?.status===404).length,
    dailymotionReview:suspect.filter(x=>x.type==='dm').length};
  report.independentVerification={...review,youtubeEvidence};
  await fs.writeFile(OUTPUT,JSON.stringify(report,null,2)+'\n');
  await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
  console.log('Playlist independent verification '+request.channel+' '+JSON.stringify(review));
  if(request.action==='clean_dead_playlist'){
    const candidates=suspect.filter(x=>x.type==='fi'&&x.first?.status===404&&x.second?.status===404);
    const dir='tubes/bridge/backup/'+request.channel+'/playlist-cleanup';
    await fs.mkdir(dir,{recursive:true});
    await fs.copyFile(SNAPSHOT,dir+'/before.json');
    const removed=[],skipped=[];
    const absent=new Set(youtubeEvidence.filter(x=>!x.returned).map(x=>x.uid));
    candidates.push(...yt.filter(x=>absent.has(x.uid)&&x.first?.status===404&&x.second?.status===404));
    if(candidates.length>50||candidates.length>Math.ceil(state.entries.length*0.1))throw Error('Playlist cleanup exceeds safety cap');
    for(const x of candidates){
      if(!['Wrestling','luchatube','WID'].includes(request.channel))continue;
      const result=await page.evaluate(({uid,id,type})=>{
        const entries=[...document.querySelectorAll('#queue .queue_entry')];
        const el=entries.find(e=>window.jQuery(e).data('uid')===uid);
        const m=el&&window.jQuery(el).data('media');
        if(!el||m?.type!==type||!['fi','yt'].includes(type)||m.id!==id||window.PL_CURRENT==null||String(window.PL_CURRENT)===String(uid)||entries.indexOf(el)<60||!window.socket?.connected||window.CLIENT?.rank<3||!window.hasPermission('playlistdelete'))return false;
        window.socket.emit('delete',uid);return true;
      },{uid:x.uid,id:x.id,type:x.type});
      if(!result){skipped.push(x.uid);continue;}
      await page.waitForFunction(uid=>![...document.querySelectorAll('#queue .queue_entry')].some(e=>window.jQuery(e).data('uid')===uid),x.uid,{timeout:15000});
      removed.push(x.uid);
    }
    const after=await page.evaluate(()=>[...document.querySelectorAll('#queue .queue_entry')].map(e=>({uid:window.jQuery(e).data('uid'),media:window.jQuery(e).data('media')})));
    await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2)+'\n');
    await fs.writeFile(dir+'/evidence.json',JSON.stringify({removed,skipped,youtubeEvidence},null,2)+'\n');
    console.log('Playlist cleanup '+request.channel+' '+JSON.stringify({removed:removed.length,skipped:skipped.length,youtubeChecked:youtubeEvidence.length,youtubeAbsent:youtubeEvidence.filter(x=>!x.returned).length}));
    return {request_id:request.request_id,channel:request.channel,action:request.action,status:'playlist-cleaned',removed:removed.length,skipped:skipped.length,youtubeChecked:youtubeEvidence.length};
  }
  console.log('Playlist audit complete: '+JSON.stringify(counts));
  console.log('Playlist candidate breakdown '+request.channel+' '+JSON.stringify(breakdown));
  return {request_id:request.request_id,channel:request.channel,action:request.action,
    status:'playlist-audited',playlistItems:report.playlistItems,
    statusCounts:counts,suspects:suspect.length,
    suspectSamples:suspect.slice(0,40).map(x=>({uid:x.uid,id:x.id,type:x.type,title:x.title})),
    noChangesMade:true};
}
