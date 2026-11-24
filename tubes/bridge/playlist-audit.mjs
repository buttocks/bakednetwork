/**
 * Read-only media audit for a Baked.live playlist.
 * Tests archived YouTube/Dailymotion/direct-file media; never tests or deletes
 * custom iframes or live channels as if they were missing recordings.
 * All URLs and playlist data stay in private GitHub Actions artifacts.
 */
import fs from 'node:fs/promises';

const OUTPUT='tubes/bridge/playlist-media-audit.json';
const SNAPSHOT='tubes/bridge/playlist-before-cleanup.json';
const TIMEOUT=12000;
const CONCURRENCY=9;
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
  if(method==='GET'&&url.includes('cdn.lbryplayer'))options.headers={Range:'bytes=0-0'};
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
  console.log('Playlist audit complete: '+JSON.stringify(counts));
  return {request_id:request.request_id,channel:request.channel,action:request.action,
    status:'playlist-audited',playlistItems:report.playlistItems,
    statusCounts:counts,suspects:suspect.length,
    suspectSamples:suspect.slice(0,40).map(x=>({uid:x.uid,id:x.id,type:x.type,title:x.title})),
    noChangesMade:true};
}
