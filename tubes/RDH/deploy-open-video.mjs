import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const source='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@1ab56ce685b620076f59f745a35f5818d2bc4749/tubes/RDH/rdh-custom-only-v1.8.2.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>({
 channel:window.CHANNEL?.name,
 user:window.CLIENT?.name,
 rank:window.CLIENT?.rank,
 globalRank:window.CLIENT?.global_rank??null,
 channelOwner:window.CHANNEL?.owner??null,
 connected:!!window.socket?.connected,
 loggedIn:!!window.CLIENT?.logged_in,
 externaljs:window.CHANNEL?.opts?.externaljs||'',
 externalcss:window.CHANNEL?.opts?.externalcss||'',
 css:window.CHANNEL?.css,
 js:window.CHANNEL?.js,
 motd:window.CHANNEL?.motd,
 rows:document.querySelectorAll('#queue .queue_entry').length,
 openButtons:document.querySelectorAll('#queue .rdh-open-video-pill').length,
 customReady:!!window.__rdhCustomOnly?.ready
}));
const auth=s=>s.connected&&s.loggedIn&&Number(s.rank)>=3&&
 s.channel?.toLowerCase()==='rdh'&&s.user?.toLowerCase()==='buttman-gpt';
async function ready(){
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&
  window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),
  null,{timeout:45000});
 await page.waitForTimeout(2500);
 await page.waitForFunction(()=>Number(window.CLIENT?.rank)>=3,null,{timeout:15000});
}
let before;
async function setExternal(expected,value,b){
 await page.evaluate(({expected,value,b})=>{
  const c=window.CHANNEL||{},o=c.opts||{};
  if(!window.socket?.connected||!window.CLIENT?.logged_in||Number(window.CLIENT?.rank)<3||
     window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||
     (o.externaljs||'')!==expected||c.js!==b.js||c.css!==b.css||c.motd!==b.motd||
     (o.externalcss||'')!==b.externalcss)
    throw Error('Concurrent RDH setting change; refusing external-JS write');
  window.__rdhOpenVideoEvidence=[];
  for(const name of ['validationPassed','validationError'])
   window.socket.on(name,data=>window.__rdhOpenVideoEvidence.push({name,data}));
  window.socket.emit('setOptions',{externaljs:value});
 },{expected,value,b:{js:b.js,css:b.css,motd:b.motd,externalcss:b.externalcss}});
 await page.waitForTimeout(900);
 const evidence=await page.evaluate(()=>window.__rdhOpenVideoEvidence||[]);
 console.log('RDH_OPEN_VIDEO_SAVE_RESPONSE '+JSON.stringify(evidence));
 const rejected=evidence.find(e=>e.name==='validationError');
 if(rejected)throw Error('Baked.live rejected external-JS save: '+String(rejected.data?.message||'validation error'));
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await ready();
 const observed=await state();
 if(observed.externaljs===value)return observed;
 if(/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(observed.externaljs)){
  const loaded=await page.request.get('https://baked.live'+observed.externaljs,{timeout:15000});
  const code=await loaded.text();
  await loaded.dispose();
  if(loaded.ok()&&code.includes('rdh-open-video-pill')&&code.includes('Open video'))return observed;
 }
 const detail=await page.evaluate(()=>({events:window.__rdhOpenVideoEvidence||[],connected:!!window.socket?.connected,rank:window.CLIENT?.rank,channel:window.CHANNEL?.name,externaljs:window.CHANNEL?.opts?.externaljs||''}));
 console.log('RDH_OPEN_VIDEO_SETTINGS_EVIDENCE '+JSON.stringify(detail));
 throw Error('RDH external JavaScript change was not confirmed after reconnect');
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
 console.log('RDH_OPEN_VIDEO_BEFORE '+JSON.stringify({...before,jsBytes:String(before.js||'').length}));
 assert.ok(auth(before),'RDH admin session not confirmed');
 assert.equal(typeof before.js,'string');
 assert.equal(before.js,'','Refusing to overwrite inline channel JavaScript');
 assert.ok(/rdh-custom-only-v1\.8\.js(?:$|[?#])/.test(before.externaljs),
  'Unexpected current external script; refusing to replace');
 const response=await page.request.get(source,{timeout:25000});
 assert.ok(response.ok(),'Candidate external script is unavailable');
 const code=await response.text();
 await response.dispose();
 new Function(code);
 assert.ok(code.includes('__rdhCustomOnly')&&code.includes('rdh-open-video-pill')&&code.includes('Open video'),
  'Candidate script does not contain the expected RDH player and button');
 await setExternal(before.externaljs,source,before);
 await page.waitForFunction(()=>document.querySelector('#queue .rdh-open-video-pill'),null,{timeout:20000});
 const after=await state();
 assert.ok(auth(after));
 assert.ok(after.externaljs===source||/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(after.externaljs));
 assert.equal(after.js,before.js);
 for(const k of ['css','motd','externalcss'])assert.equal(after[k],before[k]);
 assert.ok(after.openButtons>0,'Open video button was not added to tagged queue rows');
 console.log('RDH_OPEN_VIDEO_RESULT '+JSON.stringify({
  status:'deployed-and-verified',
  rank:after.rank,
  openButtons:after.openButtons,
  channelJsUnchanged:true,
  externalCssPreserved:true,
  cssPreserved:true,
  motdPreserved:true,
  queueWrites:0
 }));
}catch(e){
 console.log('RDH_OPEN_VIDEO_ERROR '+e.message);
 throw e;
}finally{await browser.close()}
