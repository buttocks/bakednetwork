import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const dir='rdh-open-video-review';
await fs.mkdir(dir,{recursive:true});
const patch=await fs.readFile('tubes/RDH/rdh-open-video-inline.js','utf8');
new Function(patch);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>({
 channel:window.CHANNEL?.name,
 user:window.CLIENT?.name,
 rank:window.CLIENT?.rank,
 connected:!!window.socket?.connected,
 loggedIn:!!window.CLIENT?.logged_in,
 externaljs:window.CHANNEL?.opts?.externaljs||'',
 externalcss:window.CHANNEL?.opts?.externalcss||'',
 css:window.CHANNEL?.css,
 js:window.CHANNEL?.js,
 motd:window.CHANNEL?.motd,
 rows:document.querySelectorAll('#queue .queue_entry').length,
 openButtons:document.querySelectorAll('#queue .rdh-open-video-pill').length,
 patchLoaded:window.__rdhOpenVideoPatch?.version||null
}));
const auth=s=>s.connected&&s.loggedIn&&Number(s.rank)>=3&&
 s.channel?.toLowerCase()==='rdh'&&s.user?.toLowerCase()==='buttman-gpt';
const ready=async()=>{
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&
  window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),
  null,{timeout:45000});
 // Allow the logged-in account's rank to populate before reading settings or writing.
 await page.waitForTimeout(2500);
 await page.waitForFunction(()=>Number(window.CLIENT?.rank)>=3,null,{timeout:15000});
};
let before,changed=false;
async function setInline(expected,value,b){
 await page.evaluate(({expected,value,b})=>{
  const c=window.CHANNEL||{};
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||
     window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||
     c.js!==expected||c.css!==b.css||c.motd!==b.motd||
     (c.opts?.externaljs||'')!==b.externaljs||
     (c.opts?.externalcss||'')!==b.externalcss)
    throw Error('Concurrent RDH setting change; refusing inline-JS write');
  window.__rdhOpenVideoEvidence=[];
  for(const name of ['validationPassed','validationError'])
   window.socket.on(name,data=>{window.__rdhOpenVideoEvidence.push({name,data})});
  window.socket.emit('setChannelJS',{js:value});
 },{expected,value,b:{css:b.css,motd:b.motd,externaljs:b.externaljs,externalcss:b.externalcss}});
 // Baked.live may close the socket after a successful channel-JS save.
 // Reopen RDH and verify the persisted value instead of reading stale page memory.
 await page.waitForTimeout(800);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await ready();
 const observed=await state();
 if(observed.js===value)return observed;
 const detail=await page.evaluate(()=>({events:window.__rdhOpenVideoEvidence||[],connected:!!window.socket?.connected,rank:window.CLIENT?.rank,channel:window.CHANNEL?.name,jsBytes:String(window.CHANNEL?.js||'').length}));
 console.log('RDH_OPEN_VIDEO_INLINE_EVIDENCE '+JSON.stringify(detail));
 throw Error('Inline RDH JavaScript write was not confirmed after reconnect');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const form=page.locator('form[action="/login"]').last();
 await form.locator('input[name="name"]').fill('buttman-gpt');
 await form.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD||'');
 await form.locator('button[type="submit"]').click();
 await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await ready();
 before=await state();
 console.log('RDH_OPEN_VIDEO_INLINE_BEFORE '+JSON.stringify({...before,jsBytes:String(before.js||'').length}));
 await fs.writeFile(dir+'/before.json',JSON.stringify({...before,jsBytes:String(before.js||'').length},null,2));
 assert.ok(auth(before),'RDH admin session not confirmed');
 assert.equal(typeof before.js,'string');
 if(before.js!==patch)assert.equal(before.js,'','Refusing to overwrite unrelated inline JavaScript');
 assert.ok(before.externaljs&&/rdh-custom-only-v1[.]8(?:[.]\d+)?[.]js(?:$|[?#])/.test(before.externaljs),
  'Unexpected external JavaScript; refusing write');
 if(before.js!==patch){await setInline(before.js,patch,before);changed=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await ready();
 await page.waitForFunction(()=>document.querySelector('#queue .rdh-open-video-pill'),null,{timeout:15000});
 const after=await state();
 assert.ok(auth(after));
 assert.equal(after.js,patch);
 assert.equal(after.externaljs,before.externaljs);
 for(const k of ['css','motd','externalcss'])assert.equal(after[k],before[k]);
 assert.ok(after.openButtons>0,'Open video button was not added to queue rows');
 await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));
 console.log('RDH_OPEN_VIDEO_INLINE_RESULT '+JSON.stringify({
  status:'deployed-and-verified',rank:after.rank,openButtons:after.openButtons,
  inlinePatch:true,externalJsPreserved:true,cssPreserved:true,motdPreserved:true,
  queueWrites:0
 }));
}catch(e){
 console.log('RDH_OPEN_VIDEO_INLINE_ERROR '+e.message);
 if(changed){
  try{
   const current=await state();
   if(auth(current)&&current.js===patch)
    await setInline(patch,before.js,current);
  }catch(rollback){console.log('RDH_OPEN_VIDEO_INLINE_ROLLBACK_BLOCKED '+rollback.message)}
 }
 throw e;
}finally{await browser.close()}
