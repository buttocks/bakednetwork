import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='wrestletube-ringside-review';await fs.mkdir(dir,{recursive:true});
const template=await fs.readFile('tubes/WrestleTube/ringside-restoration.css','utf8');
const proposed=await fs.readFile('tubes/WrestleTube/ringside-motd.html','utf8');
const feed=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.find(x=>x.id==='wrestling-baked-tv');
assert.ok(feed);
const image='https://buttocks.github.io/bakednetwork/tubes/WrestleTube/assets/rinng.jpg';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{};
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),m=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(m.meta?.embed?.src||'');return {uid:q.data('uid'),title:m.title||'',src:t.value}});
 const h=document.querySelector('#motd .wt-broadcast-header'),r=h?.getBoundingClientRect(),d=document.querySelector('#motd .wt-house-rules');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,header:r?{width:r.width,height:r.height}:null,rules:d?{open:d.open,count:d.querySelectorAll('.wt-rules-panel>ol>li').length,hidden:!d.querySelector('.wt-rules-panel')?.getClientRects().length,help:document.querySelectorAll('#motd .wt-info-bar>.wt-info-menu').length}:null,sections:document.querySelectorAll('#motd .wt-sections-v3>details').length,kicker:document.querySelector('#motd .wt-kicker')?.textContent.trim(),tagline:document.querySelector('#motd .wt-tagline')?.textContent.trim(),guideTip:document.querySelector('#motd .wt-channel-badge')?.textContent.replace(/\s+/g,' ').trim(),quickHelp:document.querySelectorAll('#motd .wt-quick-help dt').length,background:getComputedStyle(document.body).backgroundImage,wrap:getComputedStyle(document.querySelector('#wrap')).backgroundImage,visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()==='wrestling';
const hasFeed=x=>x.entries.some(e=>e.src===feed.url);
const valid=x=>x.header?.height>=95&&x.header.height<=185&&x.rules?.count===7&&x.rules.help===3&&x.sections===4&&x.kicker==='BAKED NETWORK'&&x.tagline==='LIVE EVENTS · 24/7 WRESTLING · COMMUNITY PLAYLIST'&&x.guideTip?.includes('Inside the Baked TV player')&&x.quickHelp===4&&!x.rules.open&&x.rules.hidden&&x.background.includes('/assets/rinng.jpg')&&x.wrap==='none'&&x.visible&&hasFeed(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({field,expected,next,other,originalJs,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{},second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!=='wrestling'||c[field]!==expected||c[second]!==other||c.js!==originalJs||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing '+field+' write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{field,expected,next,other,originalJs:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('wt-broadcast-header')&&x.motd.includes('wt-house-rules'))return x;await p.waitForTimeout(250)}
 throw Error(field+' persistence not confirmed');
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/Wrestling',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='wrestling',{timeout:45000});
 await p.waitForTimeout(5000);
 before=await state();assert.ok(auth(before)&&hasFeed(before)&&typeof before.css==='string'&&typeof before.motd==='string'&&typeof before.js==='string');
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd);await p.screenshot({path:dir+'/before.png'});
 const dimensions=await p.evaluate(url=>new Promise(resolve=>{const i=new Image(),t=setTimeout(()=>resolve(null),15000);i.onload=()=>{clearTimeout(t);resolve([i.naturalWidth,i.naturalHeight])};i.onerror=()=>{clearTimeout(t);resolve(null)};i.src=url}),image);
 assert.deepEqual(dimensions,[2048,1536],'Exact hosted ring image not available; no changes made');
 if(valid(before)){console.log('WRESTLETUBE_RINGSIDE '+JSON.stringify({status:'already-verified',image:dimensions,queue:before.entries.length,noWrites:true}));}
 else{
 // Use the latest live chat guide, not a stale archived copy, if present.
 const guide=await p.evaluate(m=>{const d=new DOMParser().parseFromString(m,'text/html');return d.querySelector('.wt-chat-guide')?.innerHTML||d.querySelector('#StyleEffects .modal-body')?.innerHTML||[...d.querySelectorAll('.wt-help-details')].find(e=>e.querySelector('summary')?.textContent.includes('Chat shortcuts'))?.innerHTML.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i,'')||null},before.motd);
 const legacyModals=await p.evaluate(m=>[...new DOMParser().parseFromString(m,'text/html').querySelectorAll('.modal')].map(x=>x.id),before.motd);
 assert.ok(legacyModals.every(x=>['about','StyleEffects'].includes(x)),'Unexpected live MOTD popup; manual review required');
 targetMotd=proposed;
 if(guide){targetMotd=await p.evaluate(({html,guide})=>{const d=new DOMParser().parseFromString(html,'text/html');const e=d.querySelector('.wt-chat-guide');e.innerHTML=guide;return d.body.innerHTML},{html:proposed,guide});}
 targetCss=before.css.replace(/\/\* BEGIN WRESTLETUBE RINGSIDE RESTORATION v1[^*]*\*\/[\s\S]*?\/\* END WRESTLETUBE RINGSIDE RESTORATION v1 \*\//g,'').trimEnd()+'\n\n'+template;
 assert.ok(Buffer.byteLength(targetCss)<30000,'CSS length review required');
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 const style=await p.addStyleTag({content:template});
 const oldHtml=await p.locator('#motd').evaluate((el,html)=>{const old=el.innerHTML;el.innerHTML=html;return old},targetMotd);
 try{
  await p.waitForTimeout(400);
  const v=await state();console.log('WRESTLETUBE_PREVIEW '+JSON.stringify({header:v.header,rules:v.rules,background:v.background,wrap:v.wrap,visible:v.visible,image:dimensions,cssBytes:Buffer.byteLength(targetCss)}));
  assert.ok(valid(v),'Desktop preview failed');
  await p.locator('.wt-house-rules>summary').click();assert.ok((await state()).rules.open);
  await p.locator('.wt-house-rules>summary').click();assert.ok(!(await state()).rules.open);
  await p.locator('.wt-chat-menu>summary').click();assert.ok(await p.locator('.wt-chat-menu').evaluate(e=>e.open));
  await p.screenshot({path:dir+'/preview-help.png'});
  await p.locator('.wt-chat-menu>summary').click();
  for(const menu of ['.wt-playlist-menu','.wt-community-menu']){await p.locator(menu+'>summary').click();assert.ok(await p.locator(menu).evaluate(e=>e.open));await p.locator(menu+'>summary').click()}
  await p.screenshot({path:dir+'/preview.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
  assert.ok(await p.locator('.wt-broadcast-header').evaluate(e=>{const r=e.getBoundingClientRect();return r.width<=innerWidth&&r.width>100&&r.height<220}));
  await p.screenshot({path:dir+'/preview-mobile.png'});
  await p.setViewportSize({width:1440,height:1000});
 }finally{await p.locator('#motd').evaluate((el,html)=>el.innerHTML=html,oldHtml);await style.evaluate(e=>e.remove());await p.setViewportSize({width:1440,height:1000})}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 const applied=await write('motd',before.motd,targetMotd,targetCss);motdWritten=true;targetMotd=applied.motd;
 await p.waitForTimeout(500);const after=await state();assert.ok(auth(after)&&valid(after),'Live layout validation failed');
 assert.equal(after.css,targetCss);assert.equal(after.js,before.js);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 for(const menu of ['.wt-house-rules','.wt-playlist-menu','.wt-chat-menu','.wt-community-menu']){await p.locator(menu+'>summary').click();assert.ok(await p.locator(menu).evaluate(e=>e.open));await p.locator(menu+'>summary').click()}
 await p.screenshot({path:dir+'/after.png'});
 const report={status:'verified',image:dimensions,header:after.header,rules:after.rules,queue:after.entries.length,streamPreserved:true,jsPreserved:true,externalSettingsPreserved:true,liveChatGuidePreserved:!!guide};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('WRESTLETUBE_RINGSIDE '+JSON.stringify(report));
 }
}catch(e){
 console.log('WRESTLETUBE_RINGSIDE_ERROR '+String(e.message||e));
 try{const x=await state();if(auth(x)&&x.js===before?.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd);console.log('WRESTLETUBE_ROLLBACK checked')}}catch(r){console.log('WRESTLETUBE_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
