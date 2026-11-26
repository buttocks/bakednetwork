import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-show-tags-review';await fs.mkdir(dir,{recursive:true});
const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/RDH/rdh-internal.js';
const next='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@fc95c3bb7cc5dc2b53208fa6c5611002a0da49bd/tubes/RDH/rdh-bundled.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,300)));
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{},m=window[c.name]?.modern;return {name:c.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,user:window.CLIENT?.name,externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd,ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs,modern:!!m?.loaded,premium:!!m?.modules?.premiumPlaylist?.started,bundled:!!window.__rdhBundledLoader,rows:document.querySelectorAll('#queue .queue_entry').length,tagged:document.querySelectorAll('#queue .queue_entry.rdh-featured').length};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,changed=false;
async function setURL(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||o.externaljs!==expected||o.externalcss!==b.externalcss||c.css!==b.css||c.js!==b.js||c.motd!==b.motd)throw Error('Concurrent settings change; refusing write');window.socket.emit('setOptions',{externaljs:value});},{expected,value,b:{externalcss:before.externalcss,css:before.css,js:before.js,motd:before.motd}});
 for(let i=0;i<100;i++){if((await state()).externaljs===value)return;await page.waitForTimeout(250);}
 throw Error('External JS persistence not confirmed');
}
async function proof(){
 return await page.evaluate(()=>{
  const m=window[window.CHANNEL.name]?.modern?.modules?.premiumPlaylist;
  if(!m?.started) return {started:false};
  const cases=[['WOR: Wrestling Observer Radio','wor'],['WOL: Gunther Refuses Saudi Arabia Trip','wol'],['Bryan and Vinny Show 8/15/08','bv'],['Big Vinny V','bvv'],['F4D: Filthy Four Daily','f4d'],['Lions, Tigers, Bears & Head','ltbh'],['After Dark Radio','ad'],['Castrating the Marks','ctm'],['Botchamania 540','']];
  m.scan();
  const matches=[...document.querySelectorAll('#queue .queue_entry')].map(e=>({e,title:(e.querySelector('.qe_title')?.textContent||e.textContent).trim()})).map(x=>({...x,type:m.getType(x.title)})).filter(x=>x.type);
  const real=matches.map(({e,title,type})=>({title:title.slice(0,90),type,marked:e.classList.contains('rdh-featured')&&e.classList.contains('rdh-featured-'+type),badge:getComputedStyle(e,'::before').content}));
  const fixture=document.createElement('li');fixture.className='queue_entry';fixture.style.position='absolute';fixture.style.visibility='hidden';const t=document.createElement('span');t.className='qe_title';fixture.append(t);const q=document.querySelector('#queue');if(!q)throw Error('Queue absent');q.append(fixture);
  let checks;
  try{checks=cases.map(([title,type])=>{t.textContent=title;m.scan();const badge=getComputedStyle(fixture,'::before').content;return {title,type,classified:m.getType(title)===type,marked:type?fixture.classList.contains('rdh-featured-'+type):!fixture.classList.contains('rdh-featured'),badge};});}finally{fixture.remove();}
  return {started:true,realMatches:real.length,realMarked:real.filter(x=>x.marked&&x.badge!=='none'&&x.badge!=='normal').length,realSample:real.slice(0,5),checks};
 });
}
const passed=r=>r.started&&r.realMatches===r.realMarked&&r.checks?.length===9&&r.checks.every(x=>x.classified&&x.marked&&(!x.type||!['none','normal','""'].includes(x.badge)));
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 await page.waitForTimeout(3000);
 before=await state();assert.ok(auth(before));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 console.log('RDH_BEFORE '+JSON.stringify({externaljs:before.externaljs,externalcss:before.externalcss,modern:before.modern,premium:before.premium,rows:before.rows,tagged:before.tagged,ignoreChannelJs:before.ignoreChannelJs}));
 assert.ok([old,next].includes(before.externaljs),'Unexpected live external JS URL; no change');
 const response=await page.request.get(next,{timeout:25000});assert.ok(response.ok(),'Candidate CDN unavailable');const code=await response.text();await response.dispose();assert.ok(code.includes('__rdhBundledLoader')&&code.includes('premiumPlaylist'));new Function(code);
 // Local isolated browser preview only; no script trust or permission is modified.
 if(!before.premium)await page.evaluate(source=>{(0,eval)(source)},code);
 await page.waitForTimeout(2000);
 const pilot=await proof();console.log('RDH_PILOT '+JSON.stringify(pilot));await fs.writeFile(dir+'/pilot.json',JSON.stringify({pilot,errors},null,2));assert.ok(passed(pilot),'Show-class and CSS badge preview failed; live settings unchanged');
 if(before.externaljs!==next){await setURL(before.externaljs,next);changed=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 await page.waitForTimeout(3000);
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,next);for(const k of ['externalcss','css','js','motd'])assert.equal(after[k],before[k],k+' changed unexpectedly');
 let live=null;if(after.premium){live=await proof();assert.ok(passed(live),'Live show verification failed');}
 const report={status:live?'live-show-tags-verified':'saved-user-script-approval-required',isolatedBrowserTest:true,live,rows:after.rows,cssPreserved:true,inlineJsPreserved:true,motdPreserved:true,queueWrites:0};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('RDH_RESULT '+JSON.stringify(report));
}catch(e){console.log('RDH_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.externaljs===next)await setURL(next,before.externaljs)}catch(r){console.log('RDH_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
