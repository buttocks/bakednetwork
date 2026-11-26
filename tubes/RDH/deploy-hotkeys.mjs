import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-hotkeys-review';await fs.mkdir(dir,{recursive:true});
const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@b8ca09ad308ca6ce5a304fc25b5fdf9911291bf9/tubes/RDH/rdh-custom-only-v1.7.js';
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@db4f81bf0232f0cbe6fc6c501afffa5133869863/tubes/RDH/rdh-custom-only-v1.7.1.js';
const oldCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@ed9464b2f4fe1fee1880d2b1b7648ac7e0d184c3/tubes/RDH/rdh-neon-compact-motd.css';
const newCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@758c572058774b37d96e3b0c23c19585f808c4e7/tubes/RDH/rdh-neon-clean-v1.6.1.css';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,js:c.js,css:c.css,motd:c.motd,externaljs:o.externaljs||'',externalcss:o.externalcss||'',rows:document.querySelectorAll('#queue .queue_entry').length,legacy:!!window.CLIENT?.modules,custom:!!window.__rdhCustomOnly?.ready,pill:!!window.__rdhTaggedUrl};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
const ready=()=>page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
let before,changed=false;
async function setExternal(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||o.externaljs!==expected||o.externalcss!==b.externalcss||c.css!==b.css||c.js!==b.js||c.motd!==b.motd)throw Error('Concurrent change; no write');window.socket.emit('setOptions',{externaljs:value});},{expected,value,b:before});
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


async function newsletterProof(){
 const initial=await page.evaluate(()=>{
  const rules=[...document.querySelectorAll("#motd details")].find(e=>/House Rules/i.test(e.querySelector("summary")?.textContent||""));
  if(!rules||!window.__rdhNewsletterCommands)throw Error("Newsletter module or rules missing");
  if(!document.getElementById("motd").getClientRects().length)throw Error("MOTD collapsed; test needs visible MOTD");
  rules.open=true;
  const buttons=[...document.querySelectorAll("#motd .rdh-newsletter-controls .rdh-newsletter-command")].map(b=>({command:b.dataset.command,label:b.textContent,display:getComputedStyle(b).display}));
  // Intercept the two deliberate test commands locally. Never send real chat
  // or request a real newsletter from the bot during a deployment.
  const socket=window.socket,original=socket.emit;
  const captured=[];
  window.__rdhNewsletterTest={captured,restore:()=>{socket.emit=original}};
  socket.emit=function(event,...args){if(event==="chatMsg"&&["!won","!torch"].includes(args[0]?.msg)){captured.push({event,payload:args[0]});return this}return original.apply(this,[event,...args])};
  return {buttons,draft:document.getElementById("chatline")?.value??null};
 });
 assert.equal(initial.buttons.length,2);
 assert.deepEqual(initial.buttons.map(x=>x.command).sort(),["!torch","!won"]);
 assert.ok(initial.buttons.every(x=>x.display!=="none"));
 try{
  const won=page.locator('#motd .rdh-newsletter-command[data-command="!won"]'),torch=page.locator('#motd .rdh-newsletter-command[data-command="!torch"]');
  await won.click();
  await torch.click(); // rate limit should suppress second immediate request
  await page.waitForTimeout(2600);
  await torch.click();
  const result=await page.evaluate(()=>({captured:window.__rdhNewsletterTest.captured,draft:document.getElementById("chatline")?.value??null,status:document.querySelector("#motd .rdh-newsletter-status")?.textContent,open:[...document.querySelectorAll("#motd details")].find(e=>/House Rules/i.test(e.querySelector("summary")?.textContent||""))?.open}));
  assert.deepEqual(result.captured,[{event:"chatMsg",payload:{msg:"!won",meta:{}}},{event:"chatMsg",payload:{msg:"!torch",meta:{}}}]);
  assert.equal(result.draft,initial.draft);assert.ok(result.open&&result.status?.includes("Check your private messages"));
  return {buttons:initial.buttons,commandsVerified:true,cooldownVerified:true,draftPreserved:true,realChatCommandsSent:0,botResponseNotTested:true};
 }finally{await page.evaluate(()=>{window.__rdhNewsletterTest?.restore();delete window.__rdhNewsletterTest})}
}


async function mediaProof(){
 await page.route('https://rdh-media-test.invalid/**',route=>route.abort());
 await page.route('https://i.imgur.com/RDH_LOCAL_AUDIT*',route=>route.abort());
 const inventory=await page.evaluate(()=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Filter request timed out')),12000);socket.once('chatFilters',f=>{clearTimeout(t);resolve(f)});socket.emit('requestChatFilters')}));
 assert.ok(Array.isArray(inventory)&&inventory.some(f=>f.active&&/Media: Video/.test(f.name))&&inventory.some(f=>f.active&&/Media: Sound$/.test(f.name)));
 await page.evaluate(()=>{
  const before=new Set(document.querySelector('#messagebuffer').children);
  const msg='<span id="rdh-media-proof"><a href="https://rdh-media-test.invalid/test.mp4"><span class="glyphicon glyphicon-film"></span><img class="webm data" data-src="https://rdh-media-test.invalid/test.mp4" data-params="almc"></a><a href="https://i.imgur.com/RDH_LOCAL_AUDIT"><img class="webm imgur gifv" src="https://i.imgur.com/RDH_LOCAL_AUDIT.gifv" data-params="alm"></a><span class="sound-embed" data-proto="https://" data-path="rdh-media-test.invalid/test.mp3" style="display:none"></span><span class="sound-embed autoplay" data-proto="https://" data-path="rdh-media-test.invalid/tts.mp3"></span><img class="image-embed-small" alt="image"><img class="image-spoiler" data-spoiled="false" alt="spoiler"><img class="webm" data-src="javascript:alert(1)" alt="invalid"></span>';
  window.addChatMessage({time:Date.now(),username:'[server]',msg,meta:{shadow:false,addClass:'',addClassToNameAndTimestamp:false}});
  const root=document.getElementById('rdh-media-proof');if(!root)throw Error('Native renderer did not insert fixture');
  const row=[...document.querySelector('#messagebuffer').children].find(e=>!before.has(e)&&e.contains(root));if(!row)throw Error('Fixture row missing');row.id='rdh-media-test-row';
 });
 await page.waitForTimeout(500);
 const result=await page.evaluate(()=>{const root=document.getElementById('rdh-media-proof');const videos=[...root.querySelectorAll('video')],audio=[...root.querySelectorAll('audio')];return {videos:videos.map(v=>({src:v.getAttribute('src'),sources:[...v.querySelectorAll('source')].map(s=>s.src),controls:v.controls,muted:v.muted,autoplay:v.autoplay,loop:v.loop})),audio:audio.map(a=>({controls:a.controls,autoplay:a.autoplay,src:a.src})),ordinaryImage:!!root.querySelector('img.image-embed-small'),spoilerPreserved:!!root.querySelector('img.image-spoiler'),invalidNotConverted:!!root.querySelector('img.webm[data-src^="javascript:"]'),duplicates:root.querySelectorAll('video').length!==2||root.querySelectorAll('audio').length!==2};});
 assert.equal(result.videos.length,2);assert.equal(result.audio.length,2);
 assert.ok(result.videos.every(v=>v.controls&&v.muted&&!v.autoplay&&!v.loop));assert.ok(result.videos[1].sources.some(s=>s.endsWith('.mp4'))&&result.videos[1].sources.some(s=>s.endsWith('.webm')));
 assert.ok(result.audio.every(a=>a.controls&&!a.autoplay)&&result.ordinaryImage&&result.spoilerPreserved&&result.invalidNotConverted&&!result.duplicates,JSON.stringify(result));
 await page.evaluate(()=>document.getElementById('rdh-media-test-row')?.remove());return {filters:inventory.length,active:inventory.filter(f=>f.active).length,...result,actualPlaybackNotTested:true,actualChatSent:0};
}

async function hotkeyProof(){
 const chat=page.locator('#chatline');const original=await chat.inputValue();
 const cases=[['Control+p','https://example.invalid/a.png','https://example.invalid/a.png.pic',false],['Control+b','test','**test**',true],['Control+i','test','__test__',true],['Control+s','test','[spoiler]\u200atest\u200a[/spoiler]',true],['Control+m','test','[flop]\u200atest\u200a[/flop]',true],['Control+f','test','[flip]\u200atest\u200a[/flip]',true],['Control+Shift+b','test','[blur]\u200atest\u200a[/blur]',true],['Control+Shift+s','test','[shake]\u200atest\u200a[/shake]',true],['Control+Backquote','test','~~test~~',true],['Control+Slash','test','[tilt-forward]\u200atest\u200a[/tilt-forward]',true],['Control+Backslash','test','[tilt-reverse]\u200atest\u200a[/tilt-reverse]',true]];
 try{
 for(const [key,input,expected,select] of cases){await chat.fill(input);await chat.evaluate((e,sel)=>{e.focus();e.setSelectionRange(sel?0:e.value.length,e.value.length)},select);await page.keyboard.press(key);assert.equal(await chat.inputValue(),expected,key);}
 await chat.fill('');await chat.focus();await page.keyboard.down('Shift');
 try{const prevented=await chat.evaluate(e=>{const dt=new DataTransfer();dt.setData('text/plain','https://example.invalid/test.gif?x=1');return !e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));});assert.ok(prevented);assert.equal(await chat.inputValue(),'https://example.invalid/test.gif?x=1.pic');}finally{await page.keyboard.up('Shift')}
 await chat.fill('');const ordinary=await chat.evaluate(e=>{const dt=new DataTransfer();dt.setData('text/plain','https://example.invalid/test.png');return e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));});assert.ok(ordinary,'Ordinary paste intercepted');
 const pm=await page.evaluate(()=>{const e=document.createElement('textarea');e.className='pm-input';e.id='rdh-hotkey-pm-test';document.body.append(e);e.value='test';e.focus();e.setSelectionRange(0,4);e.dispatchEvent(new KeyboardEvent('keydown',{key:'b',ctrlKey:true,bubbles:true,cancelable:true}));const value=e.value;e.remove();return value});assert.equal(pm,'**test**');
 return {shortcuts:cases.map(c=>c[0]),shiftPaste:true,ordinaryPasteUntouched:true,pmInput:true,chatSent:0};
 }finally{await chat.fill(original)}
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await ready();before=await state();assert.ok(auth(before));assert.equal(before.externaljs,old);assert.equal(before.externalcss,newCss);assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const r=await page.request.get(candidate,{timeout:25000});assert.ok(r.ok());const code=await r.text();await r.dispose();new Function(code);assert.ok(code.includes('__rdhTaggedUrl')&&!/resources\.pink\.horse|\.getScript\(/.test(code));
 // Run candidate only in isolated test tab, not changing user trust settings.
 await page.evaluate(s=>{(0,eval)(s)},code);await page.waitForTimeout(1100);
 const audit=await page.evaluate(()=>{const modules=window[window.CHANNEL.name]?.modern?.modules;const buttons=[...document.querySelectorAll('#motd .rdh-newsletter-command')];return {retiredAbsent:!modules?.motdCollapse&&!modules?.motdDropdowns,registrationRow:!!document.querySelector('#motd .rdh-registration-row a[href]'),buttons:buttons.map(b=>({height:b.getBoundingClientRect().height,display:getComputedStyle(b).display,border:getComputedStyle(b).borderTopWidth})),divider:getComputedStyle(document.querySelector('#motd .rdh-newsletter-controls')).borderLeftWidth};});assert.ok(audit.retiredAbsent&&audit.registrationRow&&audit.divider==='1px'&&audit.buttons.length===2&&audit.buttons.every(b=>b.height>=32&&['flex','inline-flex'].includes(b.display)&&b.border==='1px'),JSON.stringify(audit));console.log('RDH_CLEANUP_AUDIT '+JSON.stringify(audit));const hotkeys=await hotkeyProof();console.log('RDH_HOTKEY_PILOT '+JSON.stringify(hotkeys));const media=await mediaProof();console.log('RDH_MEDIA_COMPAT_PILOT '+JSON.stringify(media));const newsletter=await newsletterProof();console.log('RDH_NEWS_BUTTON_PILOT '+JSON.stringify(newsletter));const presence=await presenceProof();console.log('RDH_PRESENCE_PILOT '+JSON.stringify(presence));const pilot=await proof();const flair=await flairProof();const mobile=await mobileProof();console.log('RDH_MOBILE_PILOT '+JSON.stringify(mobile));console.log('RDH_FLAIR_PILOT '+JSON.stringify(flair));console.log('RDH_URL_PILOT '+JSON.stringify(pilot));await fs.writeFile(dir+'/pilot.json',JSON.stringify(pilot,null,2));
 await setExternal(old,candidate);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,candidate);assert.equal(after.externalcss,newCss);for(const k of ['js','css','motd'])assert.equal(after[k],before[k]);assert.ok(!after.legacy&&after.rows>0);
 // No reload: avoid extra channel join. Stored setting verified on the same connection.
 console.log('RDH_HOTKEY_RESULT '+JSON.stringify({status:'saved-candidate-passed',pilot,flair,mobile,presence,newsletter,externalJs:after.externaljs,localJsEmpty:true,inlineCssPreserved:true,externalCss:after.externalcss,audit,media,hotkeys,rows:after.rows,reloads:0,queueWrites:0,visitorApprovalMayBeRequired:true}));
}catch(e){console.log('RDH_HOTKEY_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.externaljs===candidate)await setExternal(candidate,old)}catch(r){console.log('RDH_HOTKEY_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
