import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-native-playlist-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
const url='https://baked.live/tv/rdh';
async function ready(){await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});await page.waitForTimeout(1500);}
async function inspect(label){
 const result=await page.evaluate(()=>{
  const w=window,$=w.jQuery,c=w.CHANNEL||{},q=document.querySelector('#queue');
  const row=[...q.querySelectorAll('.queue_entry')].find(r=>r.querySelector('a.qbtn-original[href^="https:"]'));
  const title=row?.querySelector('.qe_title'),original=row?.querySelector('a.qbtn-original');
  const events=e=>Object.fromEntries(Object.entries(($&&e&&$._data(e,'events'))||{}).filter(([k])=>/click|mouse|key|pointer/.test(k)).map(([k,v])=>[k,v.slice(0,8).map(h=>({selector:h.selector||'',namespace:h.namespace||'',source:String(h.handler).slice(0,1600)}))]));
  const funcs=Object.fromEntries(['makeQueueEntry','addQueueButtons','addQueueButtonsOld','formatURL'].map(k=>[k,typeof w[k]==='function'?String(w[k]).slice(0,3500):null]));
  const modules=w.CLIENT?.modules;
  return {channel:c.name,rank:w.CLIENT?.rank,externaljs:c.opts?.externaljs,inlineBytes:c.js?.length||0,legacyLoader:!!modules,legacyPlaylist:modules?.modules?.playlist||null,legacyOptions:modules?.options?.playlist||null,legacyRows:q.querySelectorAll('.thumbed').length,modernTags:q.querySelectorAll('.rdh-featured').length,rows:q.querySelectorAll('.queue_entry').length,nativeOriginals:q.querySelectorAll('a.qbtn-original[href]').length,title:title?.outerHTML,original:original?.outerHTML,handlers:{title:events(title),row:events(row),queue:events(q),document:events(document)},funcs};
 });
 console.log('RDH_NATIVE '+JSON.stringify({label,...result}));await fs.writeFile(dir+'/'+label+'.json',JSON.stringify(result,null,2));return result;
}
async function safeClickTest(){
 const title=page.locator('#queue .queue_entry:has(a.qbtn-original[href^="https:"]) .qe_title').first();
 const row=title.locator('..');
 await title.evaluate(e=>e.scrollIntoView({block:'center'}));
 // Inspect actual site click behavior. Suppress outgoing playlist mutations in this diagnostic tab.
 await page.evaluate(()=>{const s=window.socket;if(!s||s.__rdhDiagnosticEmit)return;const original=s.emit;s.__rdhDiagnosticEmit=original;window.__rdhBlockedMutations=[];s.emit=function(event,...args){if(/^(jumpTo|queue|delete|moveMedia|setTemp|clearPlaylist|shufflePlaylist|playNext|setLeader|queueMedia)$/i.test(event)){window.__rdhBlockedMutations.push(event);return this;}return original.call(this,event,...args);};});
 const snapshot=()=>row.evaluate(e=>{const a=e.querySelector('a.qbtn-original');return {class:e.className,originalVisible:!!a?.getClientRects().length,originalHref:a?.href||null,groupVisible:!!e.querySelector('.btn-group')?.getClientRects().length};});
 const before=await snapshot();
 const opened=[];context.on('page',p=>{if(p!==page){opened.push(p);}});
 const escaped=[];
 await context.route('**/*',route=>{const req=route.request(),u=new URL(req.url());if(req.isNavigationRequest()&&u.hostname!=='baked.live'){escaped.push(u.href);return route.abort();}return route.continue();});
 const clickErrors=[];
 try{
  await title.click({timeout:2500});
 }catch(e){clickErrors.push(String(e.message).slice(0,350));}
 await page.waitForTimeout(500);
 const after=await snapshot();
 const original=row.locator('a.qbtn-original');
 if(await original.isVisible()){try{await original.click({timeout:2500});}catch(e){clickErrors.push(String(e.message).slice(0,350));}}
 await page.waitForTimeout(500);
 const result={before,after,externalNavigation:escaped,popups:opened.length,clickErrors,blockedMutations:await page.evaluate(()=>window.__rdhBlockedMutations)};
 console.log('RDH_NATIVE_CLICK '+JSON.stringify(result));await fs.writeFile(dir+'/click.json',JSON.stringify(result,null,2));
 for(const p of opened)await p.close().catch(()=>{});
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await ready();
 const r=await inspect('rdh');assert.equal(r.channel.toLowerCase(),'rdh');
 await safeClickTest();
 // Compare a second tube without making changes to that tube.
 await page.goto('https://baked.live/tv/Wrestling',{waitUntil:'domcontentloaded',timeout:45000});await ready();await inspect('wrestling');
 console.log('RDH_NATIVE_RESULT '+JSON.stringify({status:'diagnosed',liveWrites:0,errors}));
}catch(e){console.log('RDH_NATIVE_ERROR '+e.message);throw e;}finally{await browser.close();}
