import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const dir='rdh-open-video-review';
await fs.mkdir(dir,{recursive:true});
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@c585dca216772ff8062986ede621b081baf082aa/tubes/RDH/rdh-custom-only-v1.8.1.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return{
 channel:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,
 connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,
 externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd,
 rows:document.querySelectorAll('#queue .queue_entry').length,
 customVersion:window.__rdhCustomOnly?.version||null,taggedUrl:!!window.__rdhTaggedUrl
}});
const auth=s=>s.connected&&s.loggedIn&&Number(s.rank)>=3&&
 s.channel?.toLowerCase()==='rdh'&&s.user?.toLowerCase()==='buttman-gpt';
const ready=()=>page.waitForFunction(()=>window.socket?.connected&&
 window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&
 window.CHANNEL?.name?.toLowerCase()==='rdh'&&
 document.querySelector('#queue .queue_entry'),null,{timeout:45000});
let before,changed=false;
async function setExternal(expected,value){
 await page.evaluate(({expected,value,b})=>{
  const c=window.CHANNEL,o=c.opts||{};
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||
     window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||
     o.externaljs!==expected||c.css!==b.css||c.js!==b.js||c.motd!==b.motd||
     o.externalcss!==b.externalcss)throw Error('Concurrent channel change; refusing write');
  window.__rdhOpenVideoEvidence=[];
  for(const name of ['validationPassed','validationError'])window.socket.once(name,data=>{if(data?.target==='#cs-externaljs')window.__rdhOpenVideoEvidence.push({name,data})});
  window.socket.once('channelOpts',opts=>window.__rdhOpenVideoEvidence.push({name:'channelOpts',externaljs:opts?.externaljs||''}));
  window.socket.emit('setOptions',{externaljs:value});
 },{expected,value,b:before});
 for(let i=0;i<20;i++){
  if((await state()).externaljs===value)return;
  await page.waitForTimeout(250);
 }
 const immediate=await state();
 const evidence=await page.evaluate(()=>({events:window.__rdhOpenVideoEvidence||[],connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,channel:window.CHANNEL?.name,validationErrors:[...document.querySelectorAll('#chatlog .chat-msg, #messagebuffer .chat-msg')].slice(-5).map(e=>e.textContent).filter(x=>/external|option|permission/i.test(x))}));
 console.log('RDH_OPEN_VIDEO_SETTINGS_EVIDENCE '+JSON.stringify({current:immediate.externaljs,evidence}));
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();
 if((await state()).externaljs===value)return;
 throw Error('External JS change not confirmed after reconnect');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const form=page.locator('form[action="/login"]').last();
 await form.locator('input[name="name"]').fill('buttman-gpt');
 await form.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD||'');
 await form.locator('button[type="submit"]').click();
 await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await ready();before=await state();console.log('RDH_OPEN_VIDEO_BEFORE '+JSON.stringify(before));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));assert.ok(auth(before),'RDH Admin session not confirmed');
 if(before.externaljs!==candidate){
  assert.ok(/rdh-custom-only-v1[.]8[.]js(?:$|[?#])/.test(before.externaljs),
   'Unexpected active custom layer; refusing to replace');
 }
 assert.equal(before.js,'','Unexpected inline channel JS; refusing to replace');
 const response=await page.request.get(candidate,{timeout:25000});
 assert.ok(response.ok(),'Could not retrieve candidate script');
 const code=await response.text();await response.dispose();new Function(code);
 for(const token of ['rdh-open-video-pill','target="_blank"','rel="noopener noreferrer"','line.append(btn,open)'])
  assert.ok(code.includes(token),'Candidate is missing '+token);
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 if(before.externaljs!==candidate){await setExternal(before.externaljs,candidate);changed=true;}
 else{await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();}
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,candidate);
 for(const k of ['js','css','motd','externalcss'])assert.equal(after[k],before[k]);
 await fs.writeFile(dir+'/after.json',JSON.stringify(after,null,2));
 console.log('RDH_OPEN_VIDEO_RESULT '+JSON.stringify({status:'saved',candidate,externalJs:after.externaljs,
  inlineJsPreserved:true,cssPreserved:true,motdPreserved:true,queueWrites:0}));
}catch(e){
 console.log('RDH_OPEN_VIDEO_ERROR '+e.message);
 if(changed){try{const current=await state();if(auth(current)&&current.externaljs===candidate)
  await setExternal(candidate,before.externaljs)}catch(rollback){console.log('RDH_OPEN_VIDEO_ROLLBACK_BLOCKED '+rollback.message)}}
 throw e;
}finally{await browser.close()}
