import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const allowed=['joshi','joshi2'];
const slug=process.env.TUBE;
assert.ok(allowed.includes(slug),'Not an approved Joshi tube');
const dir='joshi-header-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const feeds=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.filter(f=>f.tube.toLowerCase()===slug.toLowerCase());
assert.ok(feeds.length);
const template=await fs.readFile('tubes/Joshi/header.css','utf8');
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
 const logo=m?.querySelector('.jts-logo'),h=m?.querySelector('.jts-header');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,
 logo:logo?{src:logo.getAttribute('src'),loaded:logo.complete&&logo.naturalWidth>0,width:logo.getBoundingClientRect().width,height:logo.getBoundingClientRect().height}:null,header:h?.getBoundingClientRect().height,
 menus:[...m.querySelectorAll('.jts-bar>details')].map(e=>({open:e.open,hidden:!e.querySelector('.jts-panel')?.getClientRects().length})),event:!!m.querySelector('.modal,[data-toggle="modal"]'),visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()===slug.toLowerCase();
const hasFeeds=x=>feeds.every(f=>x.entries.some(e=>e.src===f.url));
const valid=x=>x.logo?.loaded&&x.logo.width>30&&x.logo.height>30&&x.logo.height<=72&&x.header>=88&&x.header<=150&&x.menus.length===1&&x.menus.every(m=>!m.open&&m.hidden)&&!x.event&&x.visible&&hasFeeds(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({slug,field,expected,next,other,js,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{},second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==slug.toLowerCase()||c[field]!==expected||c[second]!==other||c.js!==js||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{slug,field,expected,next,other,js:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('jts-header')&&x.motd.includes('jts-bar'))return x;await p.waitForTimeout(250)}
 const observed=await state();console.log('JOSHI_SAVE_DIAGNOSTIC '+JSON.stringify({slug,field,expectedBytes:Buffer.byteLength(expected),targetBytes:Buffer.byteLength(next),observedBytes:Buffer.byteLength(observed[field]||''),unchanged:observed[field]===expected}));
 throw Error('Persistence not confirmed: '+field);
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);
 before=await state();assert.ok(auth(before)&&hasFeeds(before)&&typeof before.css==='string'&&typeof before.motd==='string'&&typeof before.js==='string');
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd);await p.screenshot({path:dir+'/before.png'});
 if(valid(before)){
  // Existing Joshi header: change only the banner palette. Joshi2 remains unchanged.
  if(slug==='joshi'){
   const originalGradient='linear-gradient(110deg,#101014,#32223f,#101014)';
   const lighterGradient='linear-gradient(110deg,#896bb3,#a68bcb,#896bb3)';
   const override='#motdwrap .jts-header{background:'+lighterGradient+'!important}';
   const colorMarker='/* JOSHI LOGO CONTRAST */';
   const verifyColor=()=>p.locator('#motdwrap .jts-header').evaluate(e=>getComputedStyle(e).backgroundImage.includes('rgb(166, 139, 203)'));
   targetMotd=before.motd;
   if(before.css.includes(originalGradient)){
    targetCss=before.css.replace(originalGradient,lighterGradient);
   }else if(before.css.includes(lighterGradient)){
    targetCss=before.css;
   }else{
    assert.ok(before.css.includes('tubes/Joshi/header.css'),'Expected hosted or inline Joshi header CSS; no writes');
    targetCss=before.css.trimEnd()+'\n'+colorMarker+'\n'+override;
    if(Buffer.byteLength(targetCss)>19980){
     const compact=compactWhitespace(before.css);
     const same=await p.evaluate(({a,b})=>{const parse=x=>{const s=document.createElement('style');s.media='not all';s.textContent=x;document.head.append(s);try{return [...s.sheet.cssRules].map(r=>r.cssText)}finally{s.remove()}};return JSON.stringify(parse(a))===JSON.stringify(parse(b))},{a:before.css,b:compact});
     assert.ok(same,'Existing CSS rules changed by compaction; no writes');
     targetCss=compact+'\n'+colorMarker+'\n'+override;
    }
   }
   assert.ok(Buffer.byteLength(targetCss)<=19980,'Updated CSS exceeds size cap; no writes');
   await fs.writeFile(dir+'/proposed.css',targetCss);
   const style=await p.addStyleTag({content:override});
   try{assert.ok(await verifyColor(),'Lighter banner preview failed');assert.ok(valid(await state()),'Header preview validation failed');await p.screenshot({path:dir+'/preview.png'})}
   finally{await style.evaluate(e=>e.remove())}
   if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('#motdwrap .jts-header')).backgroundImage.includes('rgb(166, 139, 203)'),null,{timeout:15000});
   const after=await state();assert.ok(auth(after)&&valid(after));assert.equal(after.motd,before.motd);assert.equal(after.js,before.js);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
   await p.screenshot({path:dir+'/after.png'});
   console.log('JOSHI_HEADER '+JSON.stringify({slug,status:'lighter-logo-verified',queue:after.entries.length,cssChanged:targetCss!==before.css,logoPreserved:true,motdPreserved:true,jsPreserved:true}));
  }else{console.log('JOSHI_HEADER '+JSON.stringify({slug,status:'already-verified',queue:before.entries.length}));}
 }
 else{
 const source=await p.evaluate(({html,slug})=>{
  const d=new DOMParser().parseFromString(html,'text/html'),m=document.querySelector('#motd');
  const logo=[...m.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth>100&&i.getBoundingClientRect().width>40&&i.getBoundingClientRect().height>20&&!i.closest('.modal')).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];
  const dialogs=[...d.querySelectorAll('.modal')];
  const rules=dialogs.find(e=>/rules/i.test(e.querySelector('.modal-title')?.textContent||''));
  const links=dialogs.find(e=>/links/i.test(e.querySelector('.modal-title')?.textContent||''));
  const rulesBody=rules?.querySelector('.modal-body'),linksBody=links?.querySelector('.modal-body');
  if(!logo||!rulesBody||!linksBody||dialogs.length!==2||rules===links)return {error:'Unexpected legacy MOTD; manual review required'};
  if([...rulesBody.querySelectorAll('script,iframe,form'),...linksBody.querySelectorAll('script,iframe,form')].length)return {error:'Interactive content requires manual review'};
  const image=d.createElement('img');image.className='jts-logo';image.src=logo.src;image.alt=slug==='joshi2'?'Joshi 2':'Joshi';
  const header=d.createElement('div');header.className='jts-header';
  const kicker=d.createElement('div');kicker.className='jts-kicker';kicker.textContent="THE BAKED NETWORK'S";header.append(kicker,image);
  const purpose=d.createElement('div');purpose.className='jts-purpose';purpose.textContent=(slug==='joshi2'?'JOSHI 2':'JOSHI')+' · WOMEN’S WRESTLING · 24/7 MATCHES';header.append(purpose);
  const bar=d.createElement('div');bar.className='jts-bar';
  const details=d.createElement('details'),summary=d.createElement('summary'),body=d.createElement('div');
  summary.textContent='Rules & Links';body.className='jts-panel';body.innerHTML=rulesBody.innerHTML;
  const heading=d.createElement('div');heading.className='jts-links-heading';heading.textContent='Useful Links';body.append(heading);
  const linksSection=d.createElement('div');linksSection.innerHTML=linksBody.innerHTML;body.append(linksSection);
  details.append(summary,body);bar.append(details);
  return {html:header.outerHTML+bar.outerHTML,logo:image.src};
 },{html:before.motd,slug});
 if(source.error){console.log('JOSHI_HEADER '+JSON.stringify({slug,status:'skipped',reason:source.error,noWrites:true}));throw Error(source.error);}
 else{
 targetMotd=source.html;
 targetCss=before.css.replace(/\/\* BEGIN JOSHI FAMILY HEADER v1 \*\/[\s\S]*?\/\* END JOSHI FAMILY HEADER v1 \*\//g,'').trimEnd()+'\n\n'+template;
 const compactMode=Buffer.byteLength(targetCss)>19980;
 const importRule='@import url("https://buttocks.github.io/bakednetwork/tubes/Joshi/header.css");';
 if(compactMode){
  const response=await p.request.get("https://buttocks.github.io/bakednetwork/tubes/Joshi/header.css",{timeout:15000});
  assert.ok(response.ok(),'Hosted stylesheet unavailable; no writes');
  assert.equal((await response.text()).trim(),template.trim(),'Hosted stylesheet differs from approved version; no writes');
  const existing=before.css.replace(/\/\* BEGIN JOSHI FAMILY HEADER v1 \*\/[\s\S]*?\/\* END JOSHI FAMILY HEADER v1 \*\//g,'').split(importRule).join('');
  const compact=compactWhitespace(existing);
  const matches=await p.evaluate(({existing,compact})=>{
   const normalize=x=>{const sheet=new CSSStyleSheet();sheet.replaceSync(x);return [...sheet.cssRules].map(r=>r.cssText)};
   const a=normalize(existing),b=normalize(compact);return {same:JSON.stringify(a)===JSON.stringify(b),rules:a.length};
  },{existing,compact});
  console.log('JOSHI_CSS_COMPACT '+JSON.stringify({slug,beforeBytes:Buffer.byteLength(existing),afterBytes:Buffer.byteLength(compact),...matches}));
  assert.ok(matches.same&&matches.rules>0,'Existing stylesheet rules changed in compact representation; no writes');
  targetCss=importRule+'\n'+compact;
  assert.ok(Buffer.byteLength(targetCss)<=19980,'Cannot fit under conservative CSS size cap without structural changes; no writes');
 }
 console.log('JOSHI_CSS_SIZE '+JSON.stringify({slug,original:Buffer.byteLength(before.css),proposed:Buffer.byteLength(targetCss),compactMode}));
 assert.ok(Buffer.byteLength(targetCss)<=19980);
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 const style=await p.addStyleTag({content:compactMode?importRule:template});const old=await p.locator('#motd').evaluate((e,html)=>{const x=e.innerHTML;e.innerHTML=html;return x},targetMotd);
 try{
  await p.waitForFunction(()=>document.querySelector('.jts-logo')?.complete&&document.querySelector('.jts-logo')?.naturalWidth>0,null,{timeout:15000});
  await p.waitForFunction(()=>getComputedStyle(document.querySelector('.jts-header')).display==='flex'&&document.querySelector('.jts-logo').getBoundingClientRect().height<=72,null,{timeout:15000});
  const v=await state();assert.ok(valid(v),'Desktop preview failed');
  for(const e of await p.locator('.jts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
  await p.screenshot({path:dir+'/preview.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert.ok(await p.locator('.jts-header').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));await p.screenshot({path:dir+'/mobile.png'});
 }finally{await p.setViewportSize({width:1440,height:1000});await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,old);await style.evaluate(e=>e.remove())}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 if(compactMode){
 const original=await p.locator('#motd').evaluate((e,html)=>{const old=e.innerHTML;e.innerHTML=html;return old},targetMotd);
 try{await p.waitForFunction(()=>document.querySelector('.jts-logo')?.naturalWidth>0&&getComputedStyle(document.querySelector('.jts-header')).display==='flex'&&document.querySelector('.jts-logo').getBoundingClientRect().height<=72,null,{timeout:15000});assert.ok(valid(await state()),'Persisted CSS preview failed');}
 finally{await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,original)}
 }
 const applied=await write('motd',before.motd,targetMotd,targetCss);targetMotd=applied.motd;motdWritten=true;
 await p.waitForFunction(()=>document.querySelector('.jts-logo')?.complete&&document.querySelector('.jts-logo')?.naturalWidth>0,null,{timeout:15000});
 const after=await state();assert.ok(auth(after)&&valid(after));assert.equal(after.js,before.js);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 for(const e of await p.locator('.jts-bar>details').all()){await e.locator('summary').click();assert.ok(await e.evaluate(x=>x.open));await e.locator('summary').click()}
 await p.screenshot({path:dir+'/after.png'});
 console.log('JOSHI_HEADER '+JSON.stringify({slug,status:'verified',queue:after.entries.length,header:after.header,logo:after.logo.height,legacyPopupsRemoved:true,jsPreserved:true,streamPreserved:true}));
 }
 }
}catch(e){
 console.log('JOSHI_HEADER_ERROR '+JSON.stringify({slug,error:e.message}));
 try{const x=await state();if(before&&auth(x)&&x.js===before.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd)}}catch(r){console.log('JOSHI_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
