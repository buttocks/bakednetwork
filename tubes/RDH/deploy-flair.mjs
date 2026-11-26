import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-flair-review';await fs.mkdir(dir,{recursive:true});
const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@28dc59c660533c379e1a4d819e2bf3f2f4a14c1d/tubes/RDH/rdh-custom-only-v1.1.js';
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@3f2bc46691159372ed4b65483c110bb88aedab58/tubes/RDH/rdh-custom-only-v1.2.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,js:c.js,css:c.css,motd:c.motd,externaljs:o.externaljs||'',externalcss:o.externalcss||'',rows:document.querySelectorAll('#queue .queue_entry').length,legacy:!!window.CLIENT?.modules,custom:!!window.__rdhCustomOnly?.ready,pill:!!window.__rdhTaggedUrl};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
const ready=()=>page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
let before,changed=false;
async function setExternal(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||o.externaljs!==expected||c.css!==b.css||c.js!==b.js||c.motd!==b.motd||o.externalcss!==b.externalcss)throw Error('Concurrent channel change; no write');window.socket.emit('setOptions',{externaljs:value});},{expected,value,b:before});
 for(let i=0;i<100;i++){if((await state()).externaljs===value)return;await page.waitForTimeout(250)}throw Error('External JS change not confirmed');
}
async function proof(){
 const info=await page.evaluate(()=>{const m=window[window.CHANNEL.name]?.modern?.modules?.premiumPlaylist;if(!m?.started||!window.__rdhTaggedUrl)throw Error('Custom layer inactive');m.scan();const rows=[...document.querySelectorAll('#queue .queue_entry.rdh-featured')];const row=rows.find(e=>window.jQuery(e).data('media')?.type==='yt');if(!row)throw Error('No tagged YouTube row');const uid=window.jQuery(row).data('uid'),media=window.jQuery(row).data('media'),url=window.formatURL(media);return {uid,url:new URL(url).href,tagged:rows.length,legacy:!!window.CLIENT?.modules,oldScroll:!!document.querySelector('#scroll-btn'),nativeScroll:!!document.querySelector('#native-queue-current')};});
 const row=page.locator('#queue .queue_entry.pluid-'+info.uid).first();
 // Temporarily detach only the native link in the isolated browser to verify the ordinary-viewer path.
 await row.evaluate(e=>{const link=e.querySelector('a.qbtn-original');if(link){e.__rdhTestOriginal=link;link.remove()}});
 try{
  await row.locator('.qe_title').scrollIntoViewIfNeeded();await row.locator('.qe_title').hover();
  const btn=row.locator('.rdh-video-url-pill');await btn.waitFor({state:'visible',timeout:5000});
  assert.equal(await btn.getAttribute('title'),info.url);
  await btn.click({timeout:5000});await page.waitForTimeout(200);
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.equal(copied,info.url,'Clipboard mismatch');
  await page.mouse.move(1,1);await btn.evaluate(e=>e.blur());await page.waitForTimeout(200);assert.equal(await btn.isVisible(),false,'Hover pill did not hide');
  const untagged=page.locator('#queue .queue_entry:not(.rdh-featured) .qe_title').first();await untagged.scrollIntoViewIfNeeded();await untagged.hover();assert.equal(await untagged.locator('..').locator('.rdh-video-url-pill').count(),0);
  assert.ok(info.tagged>0&&!info.legacy&&!info.oldScroll&&info.nativeScroll);
  return {tagged:info.tagged,clipboard:true,worksWithoutNativeOriginalButton:true,untaggedExcluded:true,hideOnLeave:true,nativeScroll:true,legacy:false};
 }finally{await row.evaluate(e=>{if(e.__rdhTestOriginal){e.querySelector('.btn-group')?.append(e.__rdhTestOriginal);delete e.__rdhTestOriginal}})}
}

async function flairProof(){
 const live=await page.evaluate(()=>{
  const $=window.jQuery;const rows=[...document.querySelectorAll("#userlist .userlist_item")].map(row=>{const name=$(row).data("name");const label=[...row.children].find(el=>el.textContent.trim()===name);return {name,hook:!!label?.classList.contains("userlist-"+name),rowId:row.id,icon:label?getComputedStyle(label,"::before").content:null}});
  const queue=document.querySelector("#queue");const row=queue.querySelector(".queue_entry");const fixture=document.createElement("span");fixture.className="rdh-test-addedby";fixture.title="Added by: RDH_TEST";fixture.setAttribute("data-original-title","Added by: RDH_TEST");fixture.textContent="Added by: RDH_TEST";row.append(fixture);
  const keep=document.createElement("span");keep.className="rdh-test-keep";keep.title="Open original";row.append(keep);
  return {rows,attribution:queue.textContent.includes("Added by:")||!!queue.querySelector(".qe_blame"),legacy:!!window.CLIENT?.modules};
 });
 await page.waitForTimeout(350);
 const checked=await page.evaluate(()=>{const a=document.querySelector(".rdh-test-addedby"),b=document.querySelector(".rdh-test-keep");const result={removed:!!a&&!a.hasAttribute("title")&&!a.hasAttribute("data-original-title"),textPreserved:a?.textContent==="Added by: RDH_TEST",otherTitlePreserved:b?.title==="Open original",remaining:[...document.querySelectorAll("#queue [title],#queue [data-original-title]")].filter(e=>/^\s*added\s+by\s*:/i.test(e.title||"")||/^\s*added\s+by\s*:/i.test(e.getAttribute("data-original-title")||"")).length};a?.remove();b?.remove();return result});
 assert.ok(live.rows.length>0&&live.rows.every(r=>r.hook),"Native userlist hooks missing: "+JSON.stringify(live.rows));
 assert.ok(live.rows.some(r=>r.name==="RDH_BOT9000"&&r.icon.includes("🤖")),"Bot flair not rendered");
 assert.ok(!live.legacy&&checked.removed&&checked.textPreserved&&checked.otherTitlePreserved&&checked.remaining===0,"Tooltip cleanup failed");
 return {...live,...checked};
}

try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await ready();before=await state();assert.ok(auth(before));assert.equal(before.externaljs,old);assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const r=await page.request.get(candidate,{timeout:25000});assert.ok(r.ok());const code=await r.text();await r.dispose();new Function(code);assert.ok(code.includes('__rdhTaggedUrl')&&!/resources\.pink\.horse|\.getScript\(/.test(code));
 // Run candidate only in isolated test tab, not changing user trust settings.
 await page.evaluate(s=>{(0,eval)(s)},code);await page.waitForTimeout(1100);
 const pilot=await proof();const flair=await flairProof();console.log('RDH_FLAIR_PILOT '+JSON.stringify(flair));console.log('RDH_URL_PILOT '+JSON.stringify(pilot));await fs.writeFile(dir+'/pilot.json',JSON.stringify(pilot,null,2));
 await setExternal(old,candidate);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,candidate);for(const k of ['js','css','motd','externalcss'])assert.equal(after[k],before[k]);assert.ok(!after.legacy&&after.rows>0);
 // No reload: avoid extra channel join. Stored setting verified on the same connection.
 console.log('RDH_FLAIR_RESULT '+JSON.stringify({status:'saved-candidate-passed',pilot,flair,externalJs:after.externaljs,localJsEmpty:true,cssPreserved:true,rows:after.rows,reloads:0,queueWrites:0,visitorApprovalMayBeRequired:true}));
}catch(e){console.log('RDH_FLAIR_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.externaljs===candidate)await setExternal(candidate,old)}catch(r){console.log('RDH_FLAIR_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
