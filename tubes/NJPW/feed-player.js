/* Independent NJPW TV playlist player. No third-party ads, trackers or embeds.
   Direct video URLs are provided by the source archive and not proxied/hosted here. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const video=$('video'),status=$('status'),statusText=$('status-text'),now=$('now');
const params=new URLSearchParams(location.search),channel=params.get('channel')||'classics';
if(!/^[a-z0-9-]{1,32}$/.test(channel)){statusText.textContent='Invalid channel';return}
let catalog=null,track=null,muted=true,guideOpen=false,loading=false;
let activeKey='',lastStatus=null,bad=new Set();
let cachedOrder=null,cachedDay='';
// Shared tube default: show overlays for a few seconds, then fade over video.
const OVERLAY_IDLE_MS=6500;
let overlayTimer=null;
let keyboardNavigation=false;
function showOverlays(){
  document.body.classList.remove('overlay-idle');
  clearTimeout(overlayTimer);
  if(guideOpen||!status.hidden||video.paused)return;
  overlayTimer=setTimeout(()=>{
    if(guideOpen||!status.hidden||video.paused)return;
    // Keep controls visible while a keyboard user is working with them.
    if(keyboardNavigation&&document.activeElement?.closest('header,#guide'))return;
    document.body.classList.add('overlay-idle');
  },OVERLAY_IDLE_MS);
}
document.addEventListener('pointermove',()=>{keyboardNavigation=false;showOverlays()},{passive:true});
document.addEventListener('pointerdown',()=>{keyboardNavigation=false;showOverlays()},{passive:true});
document.addEventListener('touchstart',()=>{keyboardNavigation=false;showOverlays()},{passive:true});
document.addEventListener('keydown',()=>{keyboardNavigation=true;showOverlays()});
document.addEventListener('focusin',()=>showOverlays());

const pad=n=>String(n).padStart(2,'0');
function message(s){status.hidden=false;statusText.textContent=s;showOverlays()}
function dayKey(date){return date.toISOString().slice(0,10)}
function seed(x){let s=2166136261;for(const c of x){s^=c.charCodeAt(0);s=Math.imul(s,16777619)}return s>>>0}
function shuffle(items,day){
  const a=items.slice();let s=seed(channel+'|'+day);
  const next=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0};
  for(let i=a.length-1;i>0;i--){const j=next()%(i+1);[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function lineup(date){
  const id=dayKey(date);
  if(id!==cachedDay){cachedDay=id;cachedOrder=shuffle(track?.programs||[],id)}
  return cachedOrder||[];
}
function select(date,excludeBad=true){
  const programs=lineup(date);
  if(!programs.length)return null;
  const dayStart=Date.parse(dayKey(date)+'T00:00:00Z');
  const elapsed=(date.getTime()-dayStart)/1000;
  const total=programs.reduce((a,p)=>a+p.duration,0);
  if(total<1)return null;
  let offset=elapsed%total;
  for(let i=0;i<programs.length;i++){
    const p=programs[i];
    if(offset<p.duration){
      if(excludeBad&&bad.has(p.url)){
        for(let j=1;j<=programs.length;j++){
          const q=programs[(i+j)%programs.length];
          if(!bad.has(q.url))return {p:q,index:(i+j)%programs.length,seek:0,programs};
        }
        return null;
      }
      return {p,index:i,seek:Math.max(0,Math.floor(offset)),programs};
    }
    offset-=p.duration;
  }
  return {p:programs[0],index:0,seek:0,programs};
}
function scheduleGuide(date){
  const current=select(date,false);
  if(!current)return;
  $('guide-title').textContent=track.name+' · TV Guide';
  const list=$('guide-list');list.replaceChildren();
  const base=date.getTime()-current.seek*1000;
  let at=base;
  for(let k=0;k<Math.min(12,current.programs.length);k++){
    const p=current.programs[(current.index+k)%current.programs.length];
    const li=document.createElement('li');if(k===0)li.classList.add('live');
    const time=document.createElement('time');
    time.textContent=k===0?'● NOW':new Date(at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    const inner=document.createElement('div'),name=document.createElement('b'),episode=document.createElement('small');
    name.textContent=p.title;episode.textContent=p.episode||p.source_channel||'NJPW';
    inner.append(name,episode);li.append(time,inner);list.appendChild(li);
    at+=((k===0?p.duration-current.seek:p.duration)*1000);
  }
}
function renderControls(){
  $('audio').textContent=muted?'🔇 Unmute':'🔊 Mute';
  video.muted=muted;
}
function tune(force=false){
  if(!track)return;
  const selected=select(new Date());
  if(!selected){message('No working videos are currently available. Retrying automatically…');return}
  const {p,seek}=selected,key=p.url+'|'+cachedDay;
  if(!force&&key===activeKey&&!video.error)return;
  activeKey=key;loading=true;
  $('channel-name').textContent=track.name+' · CONTINUOUS PROGRAMMING';
  $('program-name').textContent=p.title;
  $('program-details').textContent=[p.episode||p.source_channel,'On now · up next from the TV Guide'].filter(Boolean).join(' · ');
  scheduleGuide(new Date());
  message('Tuning '+track.name+'…\n'+p.title);
  try{
    video.pause();video.removeAttribute('src');video.load();video.src=p.url;video.load();
  }catch{onFailure()}
  const id=key;
  video.onloadedmetadata=()=>{
    if(id!==activeKey)return;
    if(Number.isFinite(video.duration)&&video.duration>1&&seek>0){
      try{video.currentTime=Math.min(seek,video.duration-.8)}catch{}
    }
    video.play().catch(()=>message('Press Unmute or Retune to begin playback.'));
  };
}
function onFailure(){
  if(!track)return;
  if(video.currentSrc||activeKey){
    const item=select(new Date(),false);
    if(item?.p?.url)bad.add(item.p.url);
  }
  if(bad.size>=track.programs.length){
    message('Video sources are temporarily unavailable. Checking again soon…');
    setTimeout(()=>{bad.clear();tune(true)},45000);
    return;
  }
  message('This video is unavailable. Finding another program…');
  setTimeout(()=>tune(true),1500);
}
video.addEventListener('error',onFailure);
video.addEventListener('playing',()=>{status.hidden=true;loading=false;showOverlays()});
video.addEventListener('ended',()=>{bad.add(select(new Date(),false)?.p?.url);tune(true)});
$('audio').onclick=()=>{
  muted=!muted;renderControls();
  video.play().catch(()=>{});
};
$('retune').onclick=()=>{bad.clear();activeKey='';tune(true)};
$('guide-toggle').onclick=()=>{
  guideOpen=!guideOpen;$('guide').hidden=!guideOpen;
  $('guide-toggle').setAttribute('aria-expanded',String(guideOpen));
  if(guideOpen)scheduleGuide(new Date());
  showOverlays();
};
async function refresh(){
  try{
    const r=await fetch('./programs.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw Error('Program list HTTP '+r.status);
    const source=await r.json();
    const next=source.channels?.[channel];
    if(!next||!Array.isArray(next.programs))throw Error('Unknown channel');
    const good=next.programs.filter(p=>typeof p.title==='string'&&
      /^https:\/\/archive\.org\/download\/[^?#]+/i.test(p.url)&&
      Number.isFinite(p.duration)&&p.duration>=60&&p.duration<=28800);
    if(!good.length)throw Error('No approved video sources');
    track={name:next.name||channel,programs:good};
    catalog=source;
    tune();
  }catch(error){if(!track)message('Feed temporarily unavailable. Retrying automatically…')}
}
renderControls();refresh();
setInterval(()=>{if(!track)return;tune();if(guideOpen)scheduleGuide(new Date())},30000);
setInterval(()=>{bad.clear();refresh()},10*60*1000);
window.addEventListener('visibilitychange',()=>{if(!document.hidden){tune();video.play().catch(()=>{})}});
})();
