import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug=process.env.TUBE;
assert.ok(['joshi','puro','ddt'].includes(slug));
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const feed=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.find(f=>f.tube===slug);
assert.ok(feed);
const dir='targeted-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{},m=document.querySelector('#motd'),w=document.querySelector('#motdwrap');
 const vis=e=>!!e.getClientRects().length&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
 const queue=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),a=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(a.meta?.embed?.src||'');return {uid:q.data('uid'),src:t.value,temp:!!q.data('temp'),title:a.title||''}});
 const logo=[...m.querySelectorAll('img')].filter(e=>vis(e)&&!e.closest('.modal')&&e.complete&&e.naturalWidth>100);
 const buttons=[...m.querySelectorAll('button,a[data-toggle="modal"],summary')].filter(vis).map(e=>({text:e.textContent.trim(),target:e.getAttribute('data-target')||e.getAttribute('href')||''}));
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,queue,playing:window.PL_CURRENT,canMove:!!window.hasPermission?.('playlistmove'),height:w?.getBoundingClientRect().height,logos:logo.map(e=>({src:e.getAttribute('src'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),buttons,visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()===slug;
const wait=async(fn,msg)=>{for(let i=0;i<80;i++){const x=await state();if(fn(x))return x;await p.waitForTimeout(250)}throw Error(msg)};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const settingsSame=(a,b)=>['motd','js','externalCss','externalJs'].every(k=>a[k]===b[k]);
let before,target,wrote=false;
async function cssWrite(expected,next){
 await p.evaluate(({slug,expected,next,motd,js,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{};
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==slug||c.css!==expected||c.motd!==motd||c.js!==js||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent settings change; no write');
  window.socket.emit('setChannelCSS',{css:next});
 },{slug,expected,next,motd:before.motd,js:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 return wait(x=>x.css===next,'CSS persistence not confirmed');
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug,slug,{timeout:45000});
 await p.waitForTimeout(4500);
 before=await state();assert.ok(auth(before)&&before.visible&&before.queue.some(e=>e.src===feed.url));
 await fs.writeFile(dir+'/before.json',JSON.stringify({queue:before.queue,playing:before.playing,height:before.height,logos:before.logos,buttons:before.buttons},null,2));
 await p.screenshot({path:dir+'/before.png'});
 if(slug==='joshi'){
  const hits=before.queue.filter(e=>e.src===feed.url);assert.equal(hits.length,1);const item=hits[0];assert.ok(!item.temp&&Number.isInteger(item.uid));
  if(before.queue[0].uid===item.uid){console.log('JOSHI_MOVE '+JSON.stringify({status:'already-first',uid:item.uid,queue:before.queue.length}));}
  else{
   assert.ok(before.canMove&&before.playing!=null&&item.uid!==before.playing,'Feed playing or permission/current playback uncertain; no move');
   const expected=[item,...before.queue.filter(e=>e.uid!==item.uid)].map(e=>e.uid);
   // Use the standard native CyTube move event; never emit a play, add or delete event.
   await p.evaluate(({slug,url,uid,ids,playing})=>{
    const c=window.CHANNEL;
    const q=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const j=window.jQuery(el),m=j.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(m.meta?.embed?.src||'');return {uid:j.data('uid'),src:t.value,temp:!!j.data('temp')}});
    if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==slug||!window.hasPermission('playlistmove')||window.PL_CURRENT!==playing||uid===playing||JSON.stringify(q.map(e=>e.uid))!==JSON.stringify(ids)||q.filter(e=>e.src===url&&e.uid===uid&&!e.temp).length!==1)throw Error('Queue or playback changed; no move');
    window.socket.emit('moveMedia',{from:uid,after:'prepend'});
   },{slug,url:feed.url,uid:item.uid,ids:before.queue.map(e=>e.uid),playing:before.playing});
   const after=await wait(x=>x.queue[0]?.uid===item.uid,'Native move not acknowledged; no retry');
   assert.deepEqual(after.queue.map(e=>e.uid),expected,'Unexpected playlist change');
   assert.equal(after.playing,before.playing,'Playback changed during observation');
   assert.ok(settingsSame(after,before)&&after.css===before.css);
   await p.screenshot({path:dir+'/after.png'});
   console.log('JOSHI_MOVE '+JSON.stringify({status:'verified',from:before.queue.findIndex(e=>e.uid===item.uid)+1,to:1,uid:item.uid,queue:after.queue.length,playbackUnchanged:true,otherOrderPreserved:true}));
  }
 }else{
  assert.equal(before.logos.length,1,'Expected one existing visible logo; no writes');
  assert.ok(before.buttons.length>=2,'Expected existing navigation; no writes');
  const marker='/* BEGIN COMPACT EXISTING HEADER v1 */',end='/* END COMPACT EXISTING HEADER v1 */';
  const skin=marker+'\n'+[
   '#motdwrap#motdwrap{padding:6px 10px!important;margin-top:8px!important;margin-bottom:10px!important;min-height:0!important;height:auto!important;box-sizing:border-box}',
   '#motdwrap#motdwrap #motd{padding:0!important;margin:0!important;min-height:0!important;height:auto!important;line-height:1.35!important}',
   '#motdwrap #motd img:not(.modal img){display:inline-block!important;max-height:68px!important;height:auto!important;max-width:95%!important;width:auto!important;object-fit:contain!important;margin:0 auto!important;vertical-align:middle!important}',
   '#motdwrap #motd :is(button,a[data-toggle="modal"]):not(.modal *){padding:5px 10px!important;min-height:28px!important;font-size:12px!important;line-height:1.3!important;margin:2px 3px!important}',
   '#motdwrap #motd :is(center,div,p):not(.modal,.modal *){min-height:0!important}',
   '@media(max-width:760px){#motdwrap #motd img:not(.modal img){max-height:56px!important}}'
  ].join('\n')+'\n'+end;
  target=before.css.replace(/\/\* BEGIN COMPACT EXISTING HEADER v1 \*\/[\s\S]*?\/\* END COMPACT EXISTING HEADER v1 \*\//g,'').trimEnd()+'\n'+skin;
  assert.ok(Buffer.byteLength(target)<=19980,'CSS cap exceeded; no writes');
  const valid=x=>x.visible&&x.logos.length===1&&x.logos[0].src===before.logos[0].src&&x.logos[0].height<=70&&x.logos[0].height>=25&&same(x.buttons,before.buttons)&&x.height<=Math.max(175,before.height*.80)&&settingsSame(x,before)&&same(x.queue,before.queue);
  const style=await p.addStyleTag({content:skin});
  try{await p.waitForTimeout(500);const preview=await state();console.log('HEADER_PREVIEW '+JSON.stringify({slug,from:before.height,to:preview.height,logo:preview.logos,buttons:preview.buttons}));assert.ok(valid(preview),'Preview failed; no writes');await p.screenshot({path:dir+'/preview.png'});}
  finally{await style.evaluate(e=>e.remove());}
  await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/proposed.css',target);
  if(target!==before.css){await cssWrite(before.css,target);wrote=true;}
  const after=await wait(valid,'Persisted compact header verification failed');
  await p.screenshot({path:dir+'/after.png'});
  console.log('HEADER_COMPACT '+JSON.stringify({slug,status:'verified',from:before.height,to:after.height,logo:after.logos[0].height,buttonsPreserved:true,motdPreserved:true,jsPreserved:true,queueUnchanged:true}));
 }
}catch(e){
 console.log('TARGETED_ERROR '+JSON.stringify({slug,error:e.message}));
 if(wrote){try{const x=await state();if(auth(x)&&x.css===target&&settingsSame(x,before))await cssWrite(target,before.css)}catch(r){console.log('ROLLBACK_BLOCKED '+r.message)}}
 throw e;
}finally{await browser.close()}
