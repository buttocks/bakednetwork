/* Shared Baked TV player — direct Archive files + official YouTube iframe API.
   No media is hosted or downloaded. YouTube may show ads or disallow embedding.
   Program schedule is synchronized by UTC day, independent of viewer reloads. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const video=$('video'), shell=$('youtube-shell'), status=$('status'), statusText=$('status-text');
const page=new URL(location.href), channel=page.searchParams.get('channel')||page.searchParams.get('feed')||'lucha';
if(!/^[a-z0-9-]{2,32}$/.test(channel)||!video||!shell||!status)return;
const url=new URL('./programs.json',location.href);
// Public diagnostic mode: compare the documented standard and privacy-enhanced embeds.
const embedHost=page.searchParams.get('embed')==='standard'?'https://www.youtube.com':'https://www.youtube-nocookie.com';
let dm=null,dmPromise=null,dmPlaying=false,dmTime=0,dmEpoch=0;
let track=null, yt=null,ytPromise=null,ytReady=false,ytPlaying=false,mode='archive';
let muted=true, activeUrl='', activeDay='', bad=new Set(), day='', ordered=[];
let activeProgram=null, nextTrack=null, activeIndex=-1;
let preferFallbackSource=null;
let guideOpen=false,hoveringControls=false,keyboardNavigation=false,overlayTimer=null;
let seekWanted=0,playbackStarted=false,playbackTimer=null;
let providerBlockedUntil=0,retryTimer=null,attempt=0;
function retryLater(ms){clearTimeout(retryTimer);retryTimer=setTimeout(()=>{bad.clear();providerBlockedUntil=0;tune(true)},ms)}
const firstFade=5500,revealFade=3200;
const isPlaying=()=>mode==='dailymotion'?dmPlaying:mode==='youtube'?ytPlaying:!video.paused&&!video.ended&&video.videoWidth>0;
function showStatus(message){statusText.textContent=message;status.hidden=false;reveal()}
function scheduleFade(delay=revealFade){
  clearTimeout(overlayTimer);
  if(!status.hidden||guideOpen||!isPlaying())return;
  overlayTimer=setTimeout(()=>{
    if(!status.hidden||guideOpen||!isPlaying()||hoveringControls)return;
    if(keyboardNavigation&&document.activeElement?.closest('header,#guide'))return;
    document.body.classList.add('overlay-idle');
  },delay);
}
function reveal(delay=revealFade){document.body.classList.remove('overlay-idle');scheduleFade(delay)}
const menuReveal=$('menu-reveal');
if(menuReveal){
  // The iframe owns its internal pointer events. The persistent parent button
  // must remain clickable even when the rest of the overlay is hidden.
  menuReveal.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();reveal(10000);$('guide-toggle').focus({preventScroll:true});});
}
document.addEventListener('pointermove',e=>{if(e.target===menuReveal)return;keyboardNavigation=false;reveal()},{passive:true});
document.addEventListener('pointerdown',e=>{if(e.target===menuReveal)return;keyboardNavigation=false;reveal()},{passive:true});
document.addEventListener('touchstart',e=>{if(e.target===menuReveal)return;keyboardNavigation=false;reveal()},{passive:true});
document.addEventListener('keydown',()=>{keyboardNavigation=true;reveal()});
document.addEventListener('focusin',e=>{if(e.target!==menuReveal)reveal()});
for(const selector of ['header','#hotspot-top','#hotspot-bottom']){
  const e=document.querySelector(selector);if(!e)continue;
  e.addEventListener('pointerenter',()=>{hoveringControls=selector==='header';keyboardNavigation=false;reveal()});
  e.addEventListener('pointerleave',()=>{hoveringControls=false;scheduleFade(1200)});
}
function valid(p){
  if(!p||typeof p.title!=='string'||p.title.length<3||
     !Number.isFinite(p.duration)||p.duration<60||p.duration>28800)return false;
  if(p.source==='Dailymotion')return /^[A-Za-z0-9]{2,30}$/.test(p.dailymotion_id||'')&&p.url==='https://www.dailymotion.com/video/'+p.dailymotion_id;
  if(p.source==='YouTube')
    return /^[A-Za-z0-9_-]{11}$/.test(p.youtube_id||'')&&
      p.url==='https://www.youtube.com/watch?v='+p.youtube_id;
  return /^https:\/\/archive\.org\/download\/[^\s?#]+/i.test(p.url);
}
function shuffle(list,key){
  const a=list.slice();let s=2166136261;
  for(const char of key){s^=char.charCodeAt(0);s=Math.imul(s,16777619)}
  function rnd(){s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0}
  for(let i=a.length-1;i>0;i--){const j=rnd()%(i+1);[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function weightedLineup(programs,key){
  const youtubeTarget=key.startsWith('nwa-tna-early|')?.2:key.startsWith('mtv|')?.2:.6;
  const unique=[...new Map(programs.map(p=>[p.url,p])).values()];
  const yt=shuffle(unique.filter(p=>p.source==='YouTube'),key+'|youtube');
  const archive=shuffle(unique.filter(p=>p.source!=='YouTube'),key+'|archive');
  if(!yt.length||!archive.length)return shuffle(unique,key);
  const queues=[yt,archive], used=[0,0], seconds=[0,0], result=[];
  // Build a deterministic full-program cycle long enough to cover a UTC day
  // and at least the duration of the underlying catalog. Reuse each source
  // only after its own shuffled queue has been exhausted.
  const horizon=Math.max(86400,unique.reduce((sum,p)=>sum+p.duration,0));
  while(seconds[0]+seconds[1]<horizon){
    const total=seconds[0]+seconds[1];
    const a=queues[0][used[0]%queues[0].length];
    const b=queues[1][used[1]%queues[1].length];
    // Choose the next complete program closest to the channel's YouTube airtime target.
    const errorY=Math.abs(seconds[0]+a.duration-youtubeTarget*(total+a.duration));
    const errorA=Math.abs(seconds[0]-youtubeTarget*(total+b.duration));
    let i=errorY<=errorA?0:1;
    // Avoid adjacent identical programs when another source is available.
    if(result.at(-1)?.url===queues[i][used[i]%queues[i].length].url)i=1-i;
    const p=queues[i][used[i]++%queues[i].length];
    seconds[i]+=p.duration;result.push(p);
  }
  return result;
}
function select(date=new Date()){
  const utcDay=date.toISOString().slice(0,10);
  if(utcDay!==day){
    day=utcDay;ordered=weightedLineup(track?.programs||[],channel+'|'+utcDay);
  }
  if(!ordered.length)return null;
  const start=Date.parse(utcDay+'T00:00:00Z');
  const total=ordered.reduce((sum,p)=>sum+p.duration,0);
  let t=Math.floor((date.getTime()-start)/1000)%total;
  let index=0;for(;index<ordered.length-1;index++){
    if(t<ordered[index].duration)break;
    t-=ordered[index].duration;
  }
  const original=index;
  while(bad.has(ordered[index].url)){
    index=(index+1)%ordered.length;t=0;
    if(index===original)return null;
  }
  return {p:ordered[index],index,seek:t};
}
function guide(date=new Date()){
  if(!track)return;
  let item=select(date);if(!item)return;
  if(activeUrl&&activeProgram&&ordered[activeIndex]?.url===activeUrl){
    let seek=0;try{seek=mode==='dailymotion'?dmTime:mode==='youtube'?(ytReady?yt.getCurrentTime():0):video.currentTime}catch{}
    item={p:activeProgram,index:activeIndex,seek:Number.isFinite(seek)?seek:0};
  }
  $('guide-title').textContent=track.name+' · TV Guide';
  const list=$('guide-list');list.replaceChildren();
  let when=date.getTime()-item.seek*1000;
  for(let i=0;i<Math.min(12,ordered.length);i++){
    const p=ordered[(item.index+i)%ordered.length];
    const li=document.createElement('li');if(i===0)li.classList.add('live');
    const time=document.createElement('time');
    time.textContent=i===0?'● NOW':new Date(when).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    const contents=document.createElement('div'),title=document.createElement('b'),details=document.createElement('small');
    title.textContent=p.title;details.textContent=p.episode||p.source_channel||p.source;
    contents.append(title,details);li.append(time,contents);list.append(li);
    when+=p.duration*1000;
  }
}
function setOverlay(p){
  $('channel-name').textContent=track.name+' · '+(p.source==='Dailymotion'?'DAILYMOTION':p.source==='YouTube'?'OFFICIAL YOUTUBE':'DIRECT VIDEO');
  $('program-name').textContent=p.title;
  $('program-details').textContent=(p.episode||p.source_channel||'')+' · TV Guide for up next';
  guide();
}
function updateAudio(){video.muted=muted;$('audio').textContent=muted?'🔇 Unmute':'🔊 Mute';
  if(ytReady){try{muted?yt.mute():yt.unMute()}catch{}}
  if(dm)Promise.resolve(dm.setVolume(muted?0:1)).catch(()=>{});
}
function youtubeAPI(){
  if(window.YT&&typeof window.YT.Player==='function')return Promise.resolve(window.YT);
  if(ytPromise)return ytPromise;
  ytPromise=new Promise((resolve,reject)=>{
    let settled=false;
    const old=window.onYouTubeIframeAPIReady;
    const timer=setTimeout(()=>{if(!settled){settled=true;reject(Error('YouTube API timeout'))}},13000);
    window.onYouTubeIframeAPIReady=()=>{
      if(typeof old==='function')try{old()}catch{}
      if(!settled){settled=true;clearTimeout(timer);resolve(window.YT)}
    };
    const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.async=true;
    sc.onerror=()=>{if(!settled){settled=true;clearTimeout(timer);reject(Error('YouTube API blocked'))}};
    document.head.appendChild(sc);
  });
  ytPromise=ytPromise.catch(error=>{ytPromise=null;throw error});
  return ytPromise;
}
function stopYT(){
  ytPlaying=false;ytReady=false;
  if(yt){try{yt.destroy()}catch{}yt=null}
  // The iframe API may replace the placeholder element entirely.
  if(!$('youtube-frame')){
    const placeholder=document.createElement('div');
    placeholder.id='youtube-frame';shell.replaceChildren(placeholder);
  }else $('youtube-frame').replaceChildren();
}
function dmAPI(){
 if(window.dailymotion?.createPlayer)return Promise.resolve(window.dailymotion);
 if(dmPromise)return dmPromise;
 dmPromise=new Promise((resolve,reject)=>{
  const sc=document.createElement('script');sc.src='https://geo.dailymotion.com/libs/player/x8lr5.js';sc.async=true;
  const timer=setTimeout(()=>reject(Error('Dailymotion SDK timeout')),15000);
  sc.onload=()=>{clearTimeout(timer);window.dailymotion?.createPlayer?resolve(window.dailymotion):reject(Error('Dailymotion SDK unavailable'))};
  sc.onerror=()=>{clearTimeout(timer);reject(Error('Dailymotion SDK unavailable'))};document.body.append(sc);
 }).catch(e=>{dmPromise=null;throw e});return dmPromise;
}
function stopDM(){
 dmEpoch++;dmPlaying=false;dmTime=0;
 if(dm){try{if(typeof dm.destroy==='function')dm.destroy();else dm.pause()}catch{}dm=null;}
}
async function startDM(p,seek,id){
 mode='dailymotion';video.pause();video.hidden=true;shell.hidden=false;document.body.classList.add('youtube-mode');
 // The official player remains visible, including its own controls and ads.
 showStatus('Tuning Dailymotion match…');status.hidden=true;reveal();
 const epoch=++dmEpoch;
 const current=()=>epoch===dmEpoch&&activeUrl===id;
 try{
  const api=await dmAPI();if(!current())return;
  const holder=document.createElement('div');holder.id='dm-player-'+epoch;holder.style.cssText='width:100%;height:100%';
  $('youtube-frame').replaceChildren(holder);
  playbackTimer=setTimeout(()=>{if(current()&&!dmPlaying)failCurrent('Dailymotion startup timed out')},45000);
  const player=await api.createPlayer(holder.id,{video:p.dailymotion_id,params:{startTime:Math.max(0,Math.floor(seek)),autoplay:true}});
  if(!current()){try{player.destroy()}catch{}return;}
  dm=player;const events=api.events;
  const state=s=>{if(!current()||s?.videoId!==p.dailymotion_id)return;dmTime=Number(s.videoTime)||0};
  player.on(events.VIDEO_TIMECHANGE,s=>{state(s);if(current()&&s?.videoId===p.dailymotion_id&&dmTime>0&&s.playerIsPlaying){if(!dmPlaying){dmPlaying=true;clearTimeout(playbackTimer);status.hidden=true;reveal(firstFade)}}});
  player.on(events.VIDEO_PLAYING,s=>{if(!current()||s?.videoId!==p.dailymotion_id)return;state(s);dmPlaying=true;clearTimeout(playbackTimer);status.hidden=true;reveal(firstFade)});
  player.on(events.VIDEO_PAUSE,()=>{if(current()){dmPlaying=false;reveal()}});
  player.on(events.VIDEO_END,()=>{if(current()){activeUrl='';stopDM();tune(true,true)}});
  player.on(events.PLAYER_ERROR,()=>{if(current())failCurrent('Dailymotion playback unavailable')});
  await Promise.resolve(player.setVolume(muted?0:1)).catch(()=>{});
  if(current())await Promise.resolve(player.play()).catch(()=>{});
 }catch(e){if(current())failCurrent(e.message||'Dailymotion unavailable')}
}
function failCurrent(reason='Source temporarily unavailable',providerFailure=false){
  console.warn('[Baked TV] playback failure', {channel,source:activeProgram?.source,reason,attempt,videoId:activeProgram?.youtube_id,host:embedHost});
  if(providerFailure&&activeProgram?.source==='YouTube')providerBlockedUntil=Date.now()+60000;
  const badUrl=activeUrl;if(badUrl)bad.add(badUrl);
  preferFallbackSource=activeProgram?.source==='Dailymotion'?'Internet Archive':'Dailymotion';
  stopDM();stopYT();clearTimeout(playbackTimer);video.pause();
  showStatus(reason+' — tuning another match…');
  activeUrl='';
  if(track&&track.programs.every(p=>bad.has(p.url))){
    showStatus('All program sources are temporarily unavailable. Rechecking shortly.');
    retryLater(60000);
  }else if(providerFailure&&!track?.programs.some(p=>p.source!=='YouTube'&&!bad.has(p.url))){showStatus(reason+' — retrying in 60 seconds.');retryLater(60000)}
  else setTimeout(()=>tune(true),900);
}
async function startYouTube(p,seek,id){
  mode='youtube';document.body.classList.add('youtube-mode');video.pause();video.hidden=true;shell.hidden=false;
  showStatus('Tuning official YouTube match…');
  try{
    const YT=await youtubeAPI();
    if(activeUrl!==id)return;
    stopYT();
    playbackTimer=setTimeout(()=>{if(activeUrl===id&&!ytPlaying)failCurrent('YouTube startup timed out',true)},30000);
    yt=new YT.Player('youtube-frame',{
      width:'100%',height:'100%',videoId:p.youtube_id,host:embedHost,
      playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,cc_load_policy:0,start:seek,origin:location.origin},
      events:{
        onReady:e=>{
          if(activeUrl!==id)return;
          ytReady=true;updateAudio();
          try{e.target.unloadModule('captions');e.target.unloadModule('cc')}catch{}
          try{e.target.seekTo(seek,true);e.target.playVideo()}catch{failCurrent('YouTube playback failed')}
        },
        onApiChange:e=>{
          if(activeUrl===id){try{e.target.unloadModule('captions')}catch{}}
        },
        onStateChange:e=>{
          if(activeUrl!==id)return;
          const s=YT.PlayerState;
          if(e.data===s.PLAYING){try{e.target.unloadModule('captions');e.target.unloadModule('cc')}catch{}clearTimeout(playbackTimer);ytPlaying=true;status.hidden=true;reveal(firstFade)}
          else if(e.data===s.ENDED){activeUrl='';stopYT();tune(true,true)}
          else if(e.data===s.PAUSED){ytPlaying=false;reveal()}
        },
        onError:e=>{if(activeUrl!==id)return;const code=Number(e.data);const reasons={2:'Invalid video ID',5:'HTML5 playback error',100:'Video unavailable',101:'Embedding disabled',150:'Embedding disabled',153:'Missing embed client identification'};failCurrent('YouTube '+code+': '+(reasons[code]||'Playback error'),[5,153].includes(code))},
        onAutoplayBlocked:()=>{if(activeUrl===id){console.warn('[Baked TV] autoplay blocked',channel);showStatus('Autoplay blocked. Click Unmute to start playback.')}}
      }
    });
  }catch(error){if(activeUrl===id)failCurrent(error?.message||'YouTube unavailable',true)}
}
function tune(force=false,advance=false){
  if(!track)return;
  if(!force&&activeUrl)return; // Do not interrupt active programming on catalog refresh or UTC rollover.
  if(nextTrack){track=nextTrack;nextTrack=null;day='';}
  let chosen=select();
  if(preferFallbackSource&&ordered.length){
    const start=chosen?.index??0;
    for(let i=0;i<ordered.length;i++){const index=(start+i)%ordered.length;const p=ordered[index];if(p.source===preferFallbackSource&&!bad.has(p.url)){chosen={p,index,seek:0};break;}}
    preferFallbackSource=null;
  }
  if(advance&&activeProgram&&ordered.length){
    const prev=ordered.findIndex(p=>p.url===activeProgram.url);
    for(let i=1;i<=ordered.length;i++){const index=((prev>=0?prev:activeIndex)+i+ordered.length)%ordered.length;const p=ordered[index];if(!bad.has(p.url)){chosen={p,index,seek:0};break;}}
  }
  if(providerBlockedUntil>Date.now()&&chosen?.p.source==='YouTube'){
    const index=ordered.findIndex(p=>p.source!=='YouTube'&&!bad.has(p.url));
    if(index>=0)chosen={p:ordered[index],index,seek:0};else{showStatus('YouTube temporarily unavailable. Retrying shortly.');retryLater(Math.max(1000,providerBlockedUntil-Date.now()));return;}
  }
  if(!chosen){showStatus('No available matches. Retrying automatically.');retryLater(60000);return}
  const {p,seek}=chosen;
  if(!force&&activeUrl===p.url)return;
  attempt++;activeUrl=p.url;activeProgram=p;activeIndex=chosen.index;setOverlay(p);
  clearTimeout(playbackTimer);status.hidden=false;
  stopDM();
  if(p.source==='Dailymotion'){stopYT();startDM(p,seek,p.url);return}
  if(p.source==='YouTube'){stopYT();startYouTube(p,seek,p.url);return}
  stopYT();mode='archive';document.body.classList.remove('youtube-mode');shell.hidden=true;video.hidden=false;
  video.pause();video.removeAttribute('src');video.load();video.src=p.url;video.load();
  showStatus('Tuning '+p.title+'…');
  playbackTimer=setTimeout(()=>{if(activeUrl===p.url&&!isPlaying())failCurrent('Video source timed out')},20000);
  video.onloadedmetadata=()=>{
    if(activeUrl!==p.url)return;
    if(Number.isFinite(video.duration)&&video.duration>1&&seek>0)
      try{video.currentTime=Math.min(seek,video.duration-.8)}catch{}
    video.muted=muted;
    video.play().catch(()=>showStatus('Click Unmute or Retune to start playback.'));
  };
}
video.addEventListener('playing',()=>{if(mode!=='archive'||!video.videoWidth)return;clearTimeout(playbackTimer);status.hidden=true;reveal(firstFade)});
video.addEventListener('pause',()=>{if(mode==='archive')reveal()});
video.addEventListener('error',()=>{if(mode==='archive')failCurrent('Video source unavailable')});
video.addEventListener('ended',()=>{if(mode==='archive'){activeUrl='';tune(true,true)}});
$('audio').onclick=()=>{
  muted=!muted;updateAudio();
  if(mode==='dailymotion'&&dm){Promise.resolve(dm.play()).catch(()=>{});}
  else if(mode==='youtube'&&ytReady){try{yt.playVideo()}catch{}}
  else if(mode==='archive')video.play().catch(()=>{});
};
$('retune').onclick=()=>{clearTimeout(retryTimer);providerBlockedUntil=0;bad.clear();activeUrl='';tune(true)};
$('guide-toggle').onclick=()=>{
  guideOpen=!guideOpen;$('guide').hidden=!guideOpen;
  $('guide-toggle').setAttribute('aria-expanded',String(guideOpen));
  if(guideOpen)guide();reveal();
};
async function refresh(){
  try{
    const response=await fetch(url.href+'?t='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw Error('Catalog HTTP '+response.status);
    const data=await response.json(),next=data.channels?.[channel];
    if(!next||!Array.isArray(next.programs))throw Error('No channel programs');
    const items=next.programs.filter(valid);
    if(!items.length)throw Error('No playable program entries');
    const changed=!track||JSON.stringify(items.map(p=>p.url))!==JSON.stringify(track.programs.map(p=>p.url));
    const incoming={name:next.name||channel,programs:items};
    if(activeUrl){if(changed)nextTrack=incoming;}else{track=incoming;if(changed){day='';bad.clear()}}
    tune();
  }catch{if(!track)showStatus('Feed catalog unavailable. Retrying automatically.')}
}
updateAudio();refresh();
setInterval(()=>{if(track){tune();if(guideOpen)guide()}},30000);
setInterval(()=>{refresh();bad.clear()},10*60*1000);
window.addEventListener('visibilitychange',()=>{if(!document.hidden){tune();if(mode==='archive')video.play().catch(()=>{})}});
})();
