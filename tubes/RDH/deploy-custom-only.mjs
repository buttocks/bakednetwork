import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-custom-only-review';await fs.mkdir(dir,{recursive:true});
const url='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@3ba3620a3a9326f21c0827dfffab8bd5f932aa9d/tubes/RDH/rdh-custom-only.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{},m=window[c.name]?.modern;return {channel:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd,rows:document.querySelectorAll('#queue .queue_entry').length,tagged:document.querySelectorAll('#queue .rdh-featured').length,nativeCurrent:!!document.querySelector('#native-queue-current'),legacyCurrent:!!document.querySelector('#scroll-btn'),legacyModules:!!window.CLIENT?.modules,customReady:!!window.__rdhCustomOnly?.ready,modules:m?.status?.()||{},ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.channel?.toLowerCase()==='rdh'&&s.user?.toLowerCase()==='buttman-gpt';
const ready=()=>page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
let before,expectedJs,expectedExternal,changedJs=false,changedExternal=false;
async function set(field,value,expected,other){
 await page.evaluate(({field,value,expected,other,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.css!==b.css||c.motd!==b.motd||o.externalcss!==b.externalcss||(field==='js'?(c.js!==expected||(o.externaljs||'')!==other):((o.externaljs||'')!==expected||c.js!==other)))throw Error('Concurrent settings change; refusing write');window.socket.emit(field==='js'?'setChannelJS':'setOptions',field==='js'?{js:value}:{externaljs:value});},{field,value,expected,other,b:{css:before.css,motd:before.motd,externalcss:before.externalcss}});
 for(let i=0;i<100;i++){const s=await state();if(s[field]===value)return s[field];if(field==='externaljs'&&value===url&&/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(s[field])){const r=await page.request.get('https://baked.live'+s[field],{timeout:15000});const code=await r.text();const ok=r.ok()&&code.includes('__rdhCustomOnly')&&!code.includes('resources.pink.horse');await r.dispose();if(ok)return s[field];}await page.waitForTimeout(250);}
 throw Error(field+' persistence not confirmed');
}
async function proof(){
 return page.evaluate(()=>{
  const m=window[window.CHANNEL.name]?.modern?.modules?.premiumPlaylist;
  if(!m?.started)return {started:false};
  m.scan();const cases=[['WOR: Wrestling Observer Radio','wor'],['WOL: Wrestling Observer Live','wol'],['Bryan and Vinny Show','bv'],['Big Vinny V','bvv'],['F4D: Filthy Four Daily','f4d'],['Lions, Tigers, Bears & Head','ltbh'],['After Dark Radio','ad'],['Castrating the Marks','ctm'],['Botchamania 540','']];
  const matches=[...document.querySelectorAll('#queue .queue_entry')].map(e=>({e,type:m.getType(e.querySelector('.qe_title')?.textContent||e.textContent)})).filter(x=>x.type);
  const tagged=matches.filter(({e,type})=>e.classList.contains('rdh-featured-'+type)&&!['none','normal','""'].includes(getComputedStyle(e,'::before').content)).length;
  const row=document.createElement('li');row.className='queue_entry';row.style.visibility='hidden';const title=document.createElement('span');title.className='qe_title';row.append(title);document.querySelector('#queue').append(row);
  let checks;try{checks=cases.map(([name,type])=>{title.textContent=name;m.scan();return {name,type,classified:m.getType(name)===type,marked:type?row.classList.contains('rdh-featured-'+type):!row.classList.contains('rdh-featured'),badge:getComputedStyle(row,'::before').content}})}finally{row.remove()}
  return {started:true,matched:matches.length,tagged,checks,legacyModules:!!window.CLIENT?.modules,legacyScroll:!!document.querySelector('#scroll-btn'),nativeScroll:!!document.querySelector('#native-queue-current')};
 });
}
const passed=x=>x.started&&x.matched>0&&x.tagged===x.matched&&x.checks?.length===9&&x.checks.every(y=>y.classified&&y.marked&&(!y.type||!['none','normal','""'].includes(y.badge)))&&!x.legacyModules&&!x.legacyScroll&&x.nativeScroll;
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await ready();
 before=await state();assert.ok(auth(before));assert.equal(before.externaljs,'','External field not empty; no changes made');assert.equal(typeof before.js,'string');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));await fs.writeFile(dir+'/original-inline.js',before.js);
 let syntax='valid';try{new Function(before.js)}catch(e){syntax=e.message}
 console.log('RDH_CUSTOM_BEFORE '+JSON.stringify({inlineBytes:before.js.length,syntax,hasClassifier:before.js.includes('__rdhShowTagsCompat'),rows:before.rows,externalEmpty:!before.externaljs}));
 // The user authorized replacing the malformed RDH layer; do not overwrite an unrelated valid script.
 assert.ok(!before.js.trim()||syntax!=='valid'&&before.js.includes('__rdhShowTagsCompat'),'Unexpected or valid nonempty inline JS; manual review required');
 const response=await page.request.get(url,{timeout:25000});assert.ok(response.ok(),'Candidate unavailable');const code=await response.text();await response.dispose();new Function(code);assert.ok(code.includes('__rdhCustomOnly')&&!/resources\.pink\.horse|\.getScript\(/.test(code),'Legacy dependency detected');
 // Test in the isolated browser only. Do not modify or bypass visitor approval settings.
 await page.evaluate(s=>{(0,eval)(s)},code);await page.waitForTimeout(1200);
 const pilot=await proof();console.log('RDH_CUSTOM_PILOT '+JSON.stringify(pilot));await fs.writeFile(dir+'/pilot.json',JSON.stringify(pilot,null,2));assert.ok(passed(pilot),'Custom-only show-tag pilot failed');
 expectedExternal=await set('externaljs',url,before.externaljs,before.js);changedExternal=true;
 expectedJs='';if(before.js){await set('js','',before.js,expectedExternal);changedJs=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();await page.waitForTimeout(2000);
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,expectedExternal);assert.equal(after.js,'');for(const k of ['css','motd','externalcss'])assert.equal(after[k],before[k]);assert.ok(after.nativeCurrent&&!after.legacyCurrent&&!after.legacyModules&&after.rows>0);
 let live=null;if(after.customReady){live=await proof();assert.ok(passed(live),'Live custom module verification failed');}
 const report={status:live?'custom-only-live-verified':'custom-only-saved-script-approval-required',externaljs:after.externaljs,localJsEmpty:true,legacyModules:false,legacyScroll:false,nativeScroll:true,rows:after.rows,cssPreserved:true,motdPreserved:true,pilotPassed:true,live,queueWrites:0};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('RDH_CUSTOM_RESULT '+JSON.stringify(report));
}catch(e){console.log('RDH_CUSTOM_ERROR '+e.message);try{if(changedJs){const s=await state();if(auth(s)&&s.js==='')await set('js',before.js,'',expectedExternal)}if(changedExternal){const s=await state();if(auth(s)&&s.externaljs===expectedExternal&&s.js===before.js)await set('externaljs','',expectedExternal,before.js)}}catch(r){console.log('RDH_CUSTOM_ROLLBACK_BLOCKED '+r.message)}throw e;}finally{await browser.close();}
