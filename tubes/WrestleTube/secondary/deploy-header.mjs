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
// Retain all CSS tokens; compress only whitespace outside comments, strings and escapes.
function compactWhitespace(css){
 let out='',quote='',comment=false;
 for(let i=0;i<css.length;){
  const c=css[i],n=css[i+1];
  if(comment){out+=c;i++;if(c==='*'&&n==='/'){out+=n;i++;comment=false}continue}
  if(c==='\\'){out+=c+(n||'');i+=n?2:1;continue}
  if(quote){out+=c;i++;if(c===quote)quote='';continue}
  if(c==='/'&&n==='*'){out+='/*';i+=2;comment=true;continue}
  if(c==='"'||c==="'"){quote=c;out+=c;i++;continue}
  if(/[ \t\r\n\f]/.test(c)){let j=i+1;while(j<css.length&&/[ \t\r\n\f]/.test(css[j]))j++;out+=' ';i=j;continue}
  out+=c;i++;
 }
 return out.trim();
}
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{},m=document.querySelector('#motd');
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),a=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(a.meta?.embed?.src||'');return {uid:q.data('uid'),src:t.value}});
 const logo=m?.querySelector('.wts-logo'),h=m?.querySelector('.wts-header');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,
 logo:logo?{src:logo.getAttribute('src'),loaded:logo.complete&&logo.naturalWidth>0,width:logo.getBoundingClientRect().width,height:logo.getBoundingClientRect().height}:null,header:h?.getBoundingClientRect().height,
 rulesCount:m.querySelectorAll('.wts-house-rules ol>li').length,rulesImages:m.querySelectorAll('.wts-house-rules img,.wts-house-rules a').length,menus:[...m.querySelectorAll('.wts-bar>details')].map(e=>({label:e.querySelector('summary')?.textContent.trim(),open:e.open,hidden:!e.querySelector('.wts-panel')?.getClientRects().length})),event:!!m.querySelector('.wts-event-control')||[...m.querySelectorAll('button,a,summary')].some(e=>/schedule and events/i.test(e.textContent)),visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()===slug.toLowerCase();
const hasFeeds=x=>feeds.every(f=>x.entries.some(e=>e.src===f.url));
const valid=x=>x.logo?.loaded&&x.logo.width>30&&x.logo.height>30&&x.logo.height<=72&&x.header>=88&&x.header<=150&&x.rulesCount>=6&&x.rulesImages===0&&JSON.stringify(x.menus.map(m=>m.label))===JSON.stringify(['House Rules','Playlist & Playback','Chat Tools','Community & Help'])&&x.menus.every(m=>!m.open&&m.hidden)&&!x.event&&x.visible&&hasFeeds(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({slug,field,expected,next,other,js,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{},second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==slug.toLowerCase()||c[field]!==expected||c[second]!==other||c.js!==js||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{slug,field,expected,next,other,js:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('wts-header')&&x.motd.includes('wts-bar'))return x;await p.waitForTimeout(250)}
 const observed=await state();console.log('SECONDARY_SAVE_DIAGNOSTIC '+JSON.stringify({slug,field,expectedBytes:Buffer.byteLength(expected),targetBytes:Buffer.byteLength(next),observedBytes:Buffer.byteLength(observed[field]||''),unchanged:observed[field]===expected}));
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
  const prior=[...d.querySelectorAll('.wts-bar>details')];
  const rulesBody=rules?.querySelector('.modal-body')||prior.find(e=>/rules/i.test(e.querySelector('summary')?.textContent||''))?.querySelector('.wts-panel');
  const chatBody=chat?.querySelector('.modal-body')||prior.find(e=>/chat/i.test(e.querySelector('summary')?.textContent||''))?.querySelector('.wts-panel');
  if(!logo||!rulesBody||!chatBody||dialogs.some(e=>e!==rules&&e!==chat))return {error:'Unexpected header structure'};
  const image=d.createElement('img');image.className='wts-logo';image.src=logo.src;image.alt='WrestleTube '+slug.replace(/\D/g,'');
  const header=d.createElement('div');header.className='wts-header';
  const kicker=d.createElement('div');kicker.className='wts-kicker';kicker.textContent="THE BAKED NETWORK'S";header.append(kicker,image);
  const purpose=d.createElement('div');purpose.className='wts-purpose';purpose.textContent='WRESTLETUBE '+slug.replace(/\D/g,'')+' · LIVE EVENTS · 24/7 WRESTLING';header.append(purpose);
  const bar=d.createElement('div');bar.className='wts-bar wts-clean-v2';
  const add=(label,cls)=>{const details=d.createElement('details'),summary=d.createElement('summary'),body=d.createElement('div');details.className=cls;details.setAttribute('name','wts-header-menu');summary.textContent=label;body.className='wts-panel';details.append(summary,body);bar.append(details);return body};
  const oldText=rulesBody.textContent.replace(/\s+/g,' ');
  const expected=[/off.topic/i,/racism|respect other tubers/i,/kayfabe/i,/NSFW/i,/advertis/i,/have fun/i];
  if(!expected.every(r=>r.test(oldText)))return {error:'Unrecognized channel rules; review required'};
  const rulesList=['Limit off-topic posts in the playlist.','No racism or hate. Respect other tubers.',"Don't break kayfabe.",'No embedding NSFW images.','No advertising.','Have fun.'];
  // Check for additional numbered conduct rules before dropping the old block.
  const chunks=oldText.split(/\b\d+\s*[.)]\s*\)?\s*/).slice(1);
  for(const chunk of chunks){
   if(expected.some(r=>r.test(chunk))||/external javascript|xaekai/i.test(chunk))continue;
   const line=chunk.trim();
   if(line&&/no politics|no political/i.test(line))rulesList.splice(rulesList.length-1,0,'No politics.');
   else if(line)return {error:'Additional legacy rule requires review'};
  }
  const rp=add('House Rules','wts-house-rules'),ol=d.createElement('ol');ol.style.margin='0';ol.style.paddingLeft='21px';
  for(const rule of rulesList){const li=d.createElement('li');li.textContent=rule;ol.append(li)}rp.append(ol);
  const pp=add('Playlist & Playback','wts-playback');
  pp.innerHTML='<p><strong>TV Guide:</strong> Open it inside the Baked TV player for upcoming programming.</p><p><strong>Add a video:</strong> Use Add below the player and choose At End. Keep multipart uploads together in order.</p><p><strong>Playback problems:</strong> Use Refresh below the video player.</p>';
  add('Chat Tools','wts-chat-tools').innerHTML=chatBody.innerHTML;
  const cp=add('Community & Help','wts-community'),ul=d.createElement('ul');ul.style.margin='0';ul.style.paddingLeft='21px';
  for(const old of rulesBody.querySelectorAll('a[href]')){
   const href=old.getAttribute('href');if(!/^(https?:\/\/|\/[^/])/i.test(href||''))continue;
   const label=old.textContent.trim()||old.querySelector('img')?.alt?.trim();if(!label)continue;
   const li=d.createElement('li'),a=d.createElement('a');a.href=href;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li);
  }
  if(ul.children.length)cp.append(ul);else cp.textContent='Use the channel chat or moderation controls for help.';
  return {html:header.outerHTML+bar.outerHTML,logo:image.src};
 },{html:before.motd,slug});
 if(source.error){console.log('SECONDARY_HEADER '+JSON.stringify({slug,status:'skipped',reason:source.error,noWrites:true}));}
 else{
 targetMotd=source.html;
 targetCss=before.css.replace(/\/\* BEGIN SECONDARY WRESTLETUBE HEADER v1 \*\/[\s\S]*?\/\* END SECONDARY WRESTLETUBE HEADER v1 \*\//g,'').trimEnd()+'\n\n'+template;
 const existingHeader=before.header>=88&&before.header<=150&&before.logo?.loaded;
 const compactMode=!existingHeader&&['Wrestling4','wrestling5'].includes(slug);
 if(existingHeader)targetCss=before.css;
 const previousImportRule='@import url("https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@de893138778cf89aa07be032185f06837272a6fc/tubes/WrestleTube/secondary/header.css");';
 const importRule='@import url("https://buttocks.github.io/bakednetwork/tubes/WrestleTube/secondary/header.css");';
 if(compactMode){
  const response=await p.request.get("https://buttocks.github.io/bakednetwork/tubes/WrestleTube/secondary/header.css",{timeout:15000});
  assert.ok(response.ok(),'Hosted stylesheet unavailable; no writes');
  assert.equal((await response.text()).trim(),template.trim(),'Hosted stylesheet differs from approved version; no writes');
  const existing=before.css.replace(/\/\* BEGIN SECONDARY WRESTLETUBE HEADER v1 \*\/[\s\S]*?\/\* END SECONDARY WRESTLETUBE HEADER v1 \*\//g,'').split(importRule).join('').split(previousImportRule).join('');
  const compact=compactWhitespace(existing);
  const matches=await p.evaluate(({existing,compact})=>{
   const normalize=x=>{const sheet=new CSSStyleSheet();sheet.replaceSync(x);return [...sheet.cssRules].map(r=>r.cssText)};
   const a=normalize(existing),b=normalize(compact);return {same:JSON.stringify(a)===JSON.stringify(b),rules:a.length};
  },{existing,compact});
  console.log('SECONDARY_CSS_COMPACT '+JSON.stringify({slug,beforeBytes:Buffer.byteLength(existing),afterBytes:Buffer.byteLength(compact),...matches}));
  assert.ok(matches.same&&matches.rules>0,'Existing stylesheet rules changed in compact representation; no writes');
  targetCss=importRule+'\n'+compact;
  assert.ok(Buffer.byteLength(targetCss)<=19980,'Cannot fit under conservative CSS size cap without structural changes; no writes');
 }
 console.log('SECONDARY_CSS_SIZE '+JSON.stringify({slug,original:Buffer.byteLength(before.css),proposed:Buffer.byteLength(targetCss),compactMode}));
 assert.ok(Buffer.byteLength(targetCss)<30000);
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 const style=await p.addStyleTag({content:compactMode?importRule:template});const old=await p.locator('#motd').evaluate((e,html)=>{const x=e.innerHTML;e.innerHTML=html;return x},targetMotd);
 try{
  await p.waitForFunction(()=>document.querySelector('.wts-logo')?.complete&&document.querySelector('.wts-logo')?.naturalWidth>0,null,{timeout:15000});
  await p.waitForFunction(()=>getComputedStyle(document.querySelector('.wts-header')).display==='flex'&&document.querySelector('.wts-logo').getBoundingClientRect().height<=72,null,{timeout:15000});
  const v=await state();assert.ok(valid(v),'Desktop preview failed');
  for(const e of await p.locator('.wts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
  await p.screenshot({path:dir+'/preview.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert.ok(await p.locator('.wts-header').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));await p.screenshot({path:dir+'/mobile.png'});
 }finally{await p.setViewportSize({width:1440,height:1000});await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,old);await style.evaluate(e=>e.remove())}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 if(compactMode){
 const original=await p.locator('#motd').evaluate((e,html)=>{const old=e.innerHTML;e.innerHTML=html;return old},targetMotd);
 try{await p.waitForFunction(()=>document.querySelector('.wts-logo')?.naturalWidth>0&&getComputedStyle(document.querySelector('.wts-header')).display==='flex'&&document.querySelector('.wts-logo').getBoundingClientRect().height<=72,null,{timeout:15000});assert.ok(valid(await state()),'Persisted CSS preview failed');}
 finally{await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,original)}
 }
 const applied=await write('motd',before.motd,targetMotd,targetCss);targetMotd=applied.motd;motdWritten=true;
 await p.waitForFunction(()=>document.querySelector('.wts-logo')?.complete&&document.querySelector('.wts-logo')?.naturalWidth>0,null,{timeout:15000});
 const after=await state();assert.ok(auth(after)&&valid(after));assert.equal(after.js,before.js);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 for(const e of await p.locator('.wts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
 await p.screenshot({path:dir+'/after.png'});
 console.log('SECONDARY_HEADER '+JSON.stringify({slug,status:'verified',queue:after.entries.length,header:after.header,logo:after.logo.height,unusedScheduleRemoved:true,separatedRules:true,jsPreserved:true,streamPreserved:true}));
 }
 }
}catch(e){
 console.log('SECONDARY_HEADER_ERROR '+JSON.stringify({slug,error:e.message}));
 try{const x=await state();if(before&&auth(x)&&x.js===before.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd)}}catch(r){console.log('SECONDARY_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
