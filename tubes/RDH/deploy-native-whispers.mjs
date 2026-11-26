import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-native-whispers-review';await fs.mkdir(dir,{recursive:true});
const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@bab9c9d683530de1e17c4d85536fcde2c65476fb/tubes/RDH/rdh-custom-only-v1.4.js';
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@0838becbf7a3de2cc0fb9f9e8f822afb3425af2b/tubes/RDH/rdh-custom-only-v1.4.1.js';
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


async function mobileProof(){
 const row=page.locator('#queue .queue_entry.rdh-featured').filter({has:page.locator('.rdh-video-url-pill')}).first();
 await row.locator('.qe_title').scrollIntoViewIfNeeded();await row.locator('.qe_title').hover();
 const btn=row.locator('.rdh-video-url-pill');await btn.waitFor({state:'visible'});
 const placement=await btn.evaluate(el=>{const line=el.closest('.rdh-url-line'),parent=line.parentElement;const range=document.createRange();range.selectNodeContents(parent);const r=el.getBoundingClientRect();const text=[...parent.childNodes].filter(n=>n!==line);const boxes=[];for(const n of text){const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);const texts=n.nodeType===3?[n]:[];while(walker.nextNode())texts.push(walker.currentNode);for(const t of texts){if(!t.textContent.trim())continue;const q=document.createRange();q.selectNodeContents(t);boxes.push(...q.getClientRects())}}const a=boxes.filter(x=>x.width>0&&x.height>0);return {fallback:line.classList.contains('rdh-url-fallback'),parent:parent.className,attribution:parent.textContent.includes('Added by:'),gap:a.length?Math.round(r.left-Math.max(...a.map(x=>x.right))):null,vertical:a.length?Math.round(Math.abs(r.top+r.height/2-(a[0].top+a[0].height/2))):null}});
 assert.ok(!placement.fallback&&placement.attribution&&placement.gap!==null&&placement.gap>=0&&placement.gap<=22&&placement.vertical<=15,'Desktop placement failed: '+JSON.stringify(placement));
 await page.mouse.move(1,1);await btn.evaluate(e=>e.blur());
 const cdp=await context.newCDPSession(page);
 try{
  await page.setViewportSize({width:390,height:844});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await page.waitForTimeout(400);await btn.scrollIntoViewIfNeeded();
  const mobile=await btn.evaluate(el=>{const r=el.getBoundingClientRect();return {coarse:matchMedia('(pointer:coarse)').matches,noHover:matchMedia('(hover:none)').matches,height:r.height,width:r.width,shown:getComputedStyle(el.closest('.rdh-url-line')).display!=='none',url:el.title,inViewport:r.left>=0&&r.right<=innerWidth+1}});
  assert.ok(mobile.shown&&mobile.height>=44&&mobile.inViewport,'Mobile tap target failed: '+JSON.stringify(mobile));
  const bounds=await btn.boundingBox();assert.ok(bounds);
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),mobile.url,'Touch clipboard mismatch');
  return {placement,mobile,copyOnTap:true};
 }finally{await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();await page.setViewportSize({width:1440,height:1000});}
}


async function presenceProof(){
 const initial=await page.evaluate(()=>{
  const b=document.getElementById("messagebuffer"),state=window.__rdhPresenceDissolve;
  if(!b||!state||typeof window.addChatMessage!=="function")throw Error("Native chat renderer or presence module missing");
  const actual=[...b.children].filter(e=>/\b(?:joined|left|disconnected)(?:\s|\(|$)/i.test(e.textContent)&&([...e.classList].some(c=>c.startsWith("chat-msg-")&&c.slice(9).replace(/[^a-z]/gi,"").toLowerCase()==="server")||e.querySelector(".server-whisper,.server-msg"))).map(e=>({className:e.className,marked:e.dataset.rdhPresenceDissolve||null}));
  const fixtures=[["joined","RDH_TEST joined (aliases: RDH_TEST)"],["left","RDH_TEST left"],["disconnect","RDH_TEST disconnected"],["announcement","RDH_TEST: The channel has been updated"]];
  const rendered=[];
  for(const [id,msg] of fixtures){
   const previous=new Set(b.children);
   // Local invocation of the actual native renderer. No chat or socket emit.
   window.addChatMessage({time:Date.now(),username:"[server]",msg,msgclass:"server-whisper",meta:{shadow:false,addClass:"server-whisper",addClassToNameAndTimestamp:true}});
   const row=[...b.children].find(e=>!previous.has(e)&&e.textContent.includes(msg));
   if(!row)throw Error("Native renderer did not produce fixture "+id);
   row.id="rdh-presence-test-"+id;
   rendered.push({id,cls:row.className,whisperSpans:[...row.querySelectorAll(".server-whisper")].map(x=>x.textContent),text:row.textContent});
  }
  const chat=document.createElement("div");chat.id="rdh-presence-test-chat";chat.className="chat-msg-RDH_TEST";chat.textContent="RDH_TEST joined";b.append(chat);
  return {actual,rendered,delay:state.delay};
 });
 console.log("RDH_NATIVE_WHISPER_RENDERER "+JSON.stringify(initial));
 await page.waitForTimeout(250);
 const pending=await page.evaluate(()=>["joined","left","disconnect","announcement","chat"].map(id=>({id,marked:document.getElementById("rdh-presence-test-"+id)?.dataset.rdhPresenceDissolve||null})));
 assert.ok(pending.slice(0,3).every(x=>x.marked==="pending")&&pending.slice(3).every(x=>!x.marked),"Native whisper classification failed: "+JSON.stringify(pending));
 await page.waitForFunction(()=>["joined","left","disconnect"].every(id=>document.getElementById("rdh-presence-test-"+id)?.dataset.rdhPresenceDissolve==="fading"),null,{timeout:8500,polling:40});
 await page.waitForFunction(()=>["joined","left","disconnect"].every(id=>!document.getElementById("rdh-presence-test-"+id)),null,{timeout:2500});
 const final=await page.evaluate(()=>{const ids=["joined","left","disconnect","announcement","chat"];const remaining=ids.filter(id=>document.getElementById("rdh-presence-test-"+id));for(const id of ids)document.getElementById("rdh-presence-test-"+id)?.remove();return remaining});
 assert.deepEqual(final,["announcement","chat"]);
 return {initial,pending,removed:true,nativeRendererTested:true,ordinaryMessagesPreserved:true};
}

try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await ready();before=await state();assert.ok(auth(before));assert.equal(before.externaljs,old);assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const r=await page.request.get(candidate,{timeout:25000});assert.ok(r.ok());const code=await r.text();await r.dispose();new Function(code);assert.ok(code.includes('__rdhTaggedUrl')&&!/resources\.pink\.horse|\.getScript\(/.test(code));
 // Run candidate only in isolated test tab, not changing user trust settings.
 await page.evaluate(s=>{(0,eval)(s)},code);await page.waitForTimeout(1100);
 const presence=await presenceProof();console.log('RDH_PRESENCE_PILOT '+JSON.stringify(presence));const pilot=await proof();const flair=await flairProof();const mobile=await mobileProof();console.log('RDH_MOBILE_PILOT '+JSON.stringify(mobile));console.log('RDH_FLAIR_PILOT '+JSON.stringify(flair));console.log('RDH_URL_PILOT '+JSON.stringify(pilot));await fs.writeFile(dir+'/pilot.json',JSON.stringify(pilot,null,2));
 await setExternal(old,candidate);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,candidate);for(const k of ['js','css','motd','externalcss'])assert.equal(after[k],before[k]);assert.ok(!after.legacy&&after.rows>0);
 // No reload: avoid extra channel join. Stored setting verified on the same connection.
 console.log('RDH_NATIVE_WHISPER_RESULT '+JSON.stringify({status:'saved-candidate-passed',pilot,flair,mobile,presence,externalJs:after.externaljs,localJsEmpty:true,cssPreserved:true,rows:after.rows,reloads:0,queueWrites:0,visitorApprovalMayBeRequired:true}));
}catch(e){console.log('RDH_NATIVE_WHISPER_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.externaljs===candidate)await setExternal(candidate,old)}catch(r){console.log('RDH_NATIVE_WHISPER_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
