import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const allowed=['wrestling2','wrestling3','Wrestling4','wrestling5'];
const slug=process.env.TUBE;
assert.ok(allowed.includes(slug),'Not a secondary WrestleTube');
const dir='secondary-header-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const feeds=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.filter(f=>f.tube.toLowerCase()===slug.toLowerCase());
assert.ok(feeds.length);
const template=await fs.readFile('tubes/WrestleTube/secondary/header.css','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{},m=document.querySelector('#motd');
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),a=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(a.meta?.embed?.src||'');return {uid:q.data('uid'),src:t.value}});
 const logo=m?.querySelector('.wts-logo'),h=m?.querySelector('.wts-header');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,
 logo:logo?{src:logo.getAttribute('src'),loaded:logo.complete&&logo.naturalWidth>0,width:logo.getBoundingClientRect().width,height:logo.getBoundingClientRect().height}:null,header:h?.getBoundingClientRect().height,
 menus:[...m.querySelectorAll('.wts-bar>details')].map(e=>({open:e.open,hidden:!e.querySelector('.wts-panel')?.getClientRects().length})),event:!!m.querySelector('.wts-event-control'),visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()===slug.toLowerCase();
const hasFeeds=x=>feeds.every(f=>x.entries.some(e=>e.src===f.url));
const valid=x=>x.logo?.loaded&&x.logo.width>30&&x.logo.height>30&&x.logo.height<=72&&x.header>=88&&x.header<=150&&x.menus.length===2&&x.menus.every(m=>!m.open&&m.hidden)&&x.event&&x.visible&&hasFeeds(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({slug,field,expected,next,other,js,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{},second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==slug.toLowerCase()||c[field]!==expected||c[second]!==other||c.js!==js||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{slug,field,expected,next,other,js:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('wts-header')&&x.motd.includes('wts-bar'))return x;await p.waitForTimeout(250)}
 throw Error('Persistence not confirmed: '+field);
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);
 before=await state();assert.ok(auth(before)&&hasFeeds(before)&&typeof before.css==='string'&&typeof before.motd==='string'&&typeof before.js==='string');
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd);await p.screenshot({path:dir+'/before.png'});
 if(valid(before)){console.log('SECONDARY_HEADER '+JSON.stringify({slug,status:'already-verified',queue:before.entries.length}));}
 else{
 const source=await p.evaluate(({html,slug})=>{
  const d=new DOMParser().parseFromString(html,'text/html'),m=document.querySelector('#motd');
  const logo=[...m.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth>100&&i.getBoundingClientRect().width>40&&i.getBoundingClientRect().height>20&&!i.closest('.modal')).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];
  const dialogs=[...d.querySelectorAll('.modal')];
  const rules=dialogs.find(e=>/rules/i.test(e.querySelector('.modal-title')?.textContent||''));
  const chat=dialogs.find(e=>/effects|styles/i.test(e.querySelector('.modal-title')?.textContent||''));
  const isEvent=e=>/schedule and events/i.test(e.textContent);
  const raw=[...d.querySelectorAll('button,a')].filter(isEvent),live=[...m.querySelectorAll('button,a')].filter(isEvent);
  if(!logo||dialogs.length!==2||!rules?.querySelector('.modal-body')||!chat?.querySelector('.modal-body')||raw.length!==1||live.length!==1)return {error:'Unexpected header structure'};
  const event=raw[0],a=live[0];const href=event.getAttribute('href')||'',onclick=event.getAttribute('onclick')||'';
  // Do not replace a runtime-only event handler with an inert control.
  const direct=window.jQuery?!!window.jQuery._data?.(a,'events'):false;
  const safeLink=event.tagName==='A'&&/^(https?:\/\/|\/[^/])/.test(href);
  if(!safeLink&&!onclick)return {error:'Schedule control has no preserved navigation or inline handler',direct};
  if(direct&&!safeLink)return {error:'Schedule control has additional runtime bindings',direct};
  event.classList.add('wts-event-control');
  const image=d.createElement('img');image.className='wts-logo';image.src=logo.src;image.alt='WrestleTube '+slug.replace(/\D/g,'');
  const header=d.createElement('div');header.className='wts-header';
  const kicker=d.createElement('div');kicker.className='wts-kicker';kicker.textContent="THE BAKED NETWORK'S";header.append(kicker,image);
  const purpose=d.createElement('div');purpose.className='wts-purpose';purpose.textContent='WRESTLETUBE '+slug.replace(/\D/g,'')+' · LIVE EVENTS · 24/7 WRESTLING';header.append(purpose);
  const bar=d.createElement('div');bar.className='wts-bar';bar.append(event);
  for(const [label,modal] of [['Rules & Links',rules],['Chat Tools',chat]]){
   const details=d.createElement('details'),summary=d.createElement('summary'),body=d.createElement('div');summary.textContent=label;body.className='wts-panel';body.innerHTML=modal.querySelector('.modal-body').innerHTML;details.append(summary,body);bar.append(details);
  }
  return {html:header.outerHTML+bar.outerHTML,logo:image.src,href,onclick};
 },{html:before.motd,slug});
 if(source.error){console.log('SECONDARY_HEADER '+JSON.stringify({slug,status:'skipped',reason:source.error,noWrites:true}));}
 else{
 targetMotd=source.html;
 targetCss=before.css.replace(/\/\* BEGIN SECONDARY WRESTLETUBE HEADER v1 \*\/[\s\S]*?\/\* END SECONDARY WRESTLETUBE HEADER v1 \*\//g,'').trimEnd()+'\n\n'+template;
 assert.ok(Buffer.byteLength(targetCss)<30000);
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 const checkEvent=async()=>p.locator('.wts-event-control').evaluate((e,source)=>(e.getAttribute('href')||'')===source.href&&(e.getAttribute('onclick')||'')===source.onclick,{href:source.href,onclick:source.onclick});
 const style=await p.addStyleTag({content:template});const old=await p.locator('#motd').evaluate((e,html)=>{const x=e.innerHTML;e.innerHTML=html;return x},targetMotd);
 try{
  await p.waitForFunction(()=>document.querySelector('.wts-logo')?.complete&&document.querySelector('.wts-logo')?.naturalWidth>0,null,{timeout:15000});
  const v=await state();assert.ok(valid(v),'Desktop preview failed');assert.ok(await checkEvent());
  for(const e of await p.locator('.wts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
  await p.screenshot({path:dir+'/preview.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert.ok(await p.locator('.wts-header').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));await p.screenshot({path:dir+'/mobile.png'});
 }finally{await p.setViewportSize({width:1440,height:1000});await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,old);await style.evaluate(e=>e.remove())}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 const applied=await write('motd',before.motd,targetMotd,targetCss);targetMotd=applied.motd;motdWritten=true;
 await p.waitForFunction(()=>document.querySelector('.wts-logo')?.complete&&document.querySelector('.wts-logo')?.naturalWidth>0,null,{timeout:15000});
 const after=await state();assert.ok(auth(after)&&valid(after));assert.ok(await checkEvent());assert.equal(after.js,before.js);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 for(const e of await p.locator('.wts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
 await p.screenshot({path:dir+'/after.png'});
 console.log('SECONDARY_HEADER '+JSON.stringify({slug,status:'verified',queue:after.entries.length,header:after.header,logo:after.logo.height,eventsControlPreserved:true,jsPreserved:true,streamPreserved:true}));
 }
 }
}catch(e){
 console.log('SECONDARY_HEADER_ERROR '+JSON.stringify({slug,error:e.message}));
 try{const x=await state();if(before&&auth(x)&&x.js===before.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd)}}catch(r){console.log('SECONDARY_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
