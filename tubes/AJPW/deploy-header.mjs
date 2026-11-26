import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='ajpw-header-review';await fs.mkdir(dir,{recursive:true});
const template=await fs.readFile('tubes/AJPW/header.css','utf8');
const feed=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.find(x=>x.id==='ajpw-baked-tv');
assert.ok(feed);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{};
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),m=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(m.meta?.embed?.src||'');return {uid:q.data('uid'),src:t.value}});
 const logo=document.querySelector('#motd .ajpw-original-logo')||[...document.querySelectorAll('#motdwrap img')].filter(i=>i.complete&&i.naturalWidth>100&&i.getBoundingClientRect().width>20&&i.getBoundingClientRect().height>20&&!i.closest('.modal')).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];
 const r=logo?.getBoundingClientRect(),h=document.querySelector('#motd .ajpw-masthead'),hr=h?.getBoundingClientRect(),d=document.querySelector('#motd details.ajpw-rules');
 const paint=r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===logo; const word=document.querySelector('#motd .ajpw-wordmark');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,wordmark:!!word?.getClientRects().length,logo:logo?{src:logo.getAttribute('src'),naturalWidth:logo.naturalWidth,paint,width:r.width,height:r.height}:null,header:hr?{width:hr.width,height:hr.height}:null,details:d?{open:d.open,count:d.querySelectorAll('li').length,contentHidden:!d.querySelector('.ajpw-rules-content')?.getClientRects().length}:null,visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()==='ajpw';
const hasFeed=x=>x.entries.some(e=>e.src===feed.url);
const check=x=>(x.wordmark||(x.logo?.paint&&x.logo.naturalWidth>100&&x.logo.height>=55&&x.logo.height<=106))&&x.header?.height>=95&&x.header.height<=175&&!!x.details&&x.details.count===6&&!x.details.open&&x.details.contentHidden&&x.visible&&hasFeed(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({field,expected,next,other,originalJs,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{};const second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!=='ajpw'||c[field]!==expected||c[second]!==other||c.js!==originalJs||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing '+field+' write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{field,expected,next,other,originalJs:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('ajpw-masthead')&&x.motd.includes('ajpw-rules'))return x;await p.waitForTimeout(250)}
 throw Error(field+' persistence not confirmed');
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/ajpw',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='ajpw',{timeout:45000});
 await p.waitForTimeout(5000);
 before=await state();assert.ok(auth(before)&&hasFeed(before)&&typeof before.css==='string'&&typeof before.motd==='string'&&typeof before.js==='string'&&!before.externalCss);
 if(before.motd.includes('ajpw-rules-only-v22')&&before.css.includes('v2.1: eliminate legacy red')){assert.ok(check(before),'Existing AJPW masthead failed validation');console.log('AJPW_HEADER '+JSON.stringify({status:'already-verified',queue:before.entries.length,logo:before.logo,header:before.header,wordmark:before.wordmark}));}else{
 console.log('AJPW_BASELINE '+JSON.stringify({logo:before.logo,queue:before.entries.length,cssBytes:Buffer.byteLength(before.css),externalCss:!!before.externalCss}));
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd);await p.screenshot({path:dir+'/before.png'});
 // The old rules/links modals, welcome and other old MOTD markup are
 // intentionally discarded. Preserve the working masthead logo.
 const rules=['Limit off-topic posts in the playlist.','No racism or hate. Respect other tubers.',"Don't break kayfabe.",'No embedding NSFW images.','No advertising.','Have fun.'];
 const logo=before.logo?.src&&before.logo.naturalWidth>100?'<img class="ajpw-original-logo" src="'+escape(before.logo.src)+'" alt="All Japan Pro Wrestling">':'<div class="ajpw-wordmark">AJPW</div>';
 targetMotd='<div class="ajpw-masthead"><div class="ajpw-identity"><div class="ajpw-overline">BAKED NETWORK / PURORESU</div><div class="ajpw-brand">ALL JAPAN PRO WRESTLING</div><div class="ajpw-tagline">LIVE EVENTS &bull; TRIPLE CROWN &bull; CLASSIC MATCHES</div></div>'+logo+'<div class="ajpw-tv-mark">AJPW TV<small>LIVE EVENTS + 24/7</small></div></div><details class="ajpw-rules ajpw-rules-only-v22"><summary>House Rules</summary><div class="ajpw-rules-content"><ol>'+rules.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ol></div></details>';
 targetCss=before.css.replace(/\/\* BEGIN AJPW RINGSIDE MASTHEAD v2 \*\/[\s\S]*?\/\* END AJPW RINGSIDE MASTHEAD v2 \*\//g,'').trimEnd()+'\n\n'+template;
 assert.ok(Buffer.byteLength(targetCss)<24000,'CSS size limit');
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 // Preview locally using original DOM node and restore it before any write.
 const previewStyle=await p.addStyleTag({content:template});
 const oldHtml=await p.locator('#motd').evaluate((el,html)=>{const prior=el.innerHTML;el.innerHTML=html;return prior},targetMotd);
 try{
  await p.waitForFunction(()=>!!document.querySelector('.ajpw-wordmark')||(document.querySelector('.ajpw-original-logo')?.complete&&document.querySelector('.ajpw-original-logo')?.naturalWidth>100),{timeout:15000});
  const preview=await state();console.log('AJPW_HEADER_PREVIEW '+JSON.stringify({logo:preview.logo,header:preview.header,details:preview.details,wordmark:preview.wordmark}));
  assert.ok(check(preview),'Local header layout failed');
  await p.locator('.ajpw-rules summary').click();assert.equal((await state()).details.open,true);await p.locator('.ajpw-rules summary').click();
  await p.screenshot({path:dir+'/preview.png'});
 }finally{await p.locator('#motd').evaluate((el,html)=>el.innerHTML=html,oldHtml);await previewStyle.evaluate(el=>el.remove())}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 let applied=await write('motd',before.motd,targetMotd,targetCss);motdWritten=true;
 targetMotd=applied.motd;
 await p.waitForFunction(()=>!!document.querySelector('.ajpw-wordmark')||(document.querySelector('.ajpw-original-logo')?.complete&&document.querySelector('.ajpw-original-logo')?.naturalWidth>100),{timeout:15000});
 const after=await state();assert.ok(auth(after)&&check(after),'Live header failed');assert.equal(await p.locator('#motd .modal,#motd [data-toggle="modal"]').count(),0,'Legacy popup remains');assert.ok(await p.evaluate(()=>['body','#wrap','#motdwrap','#motd','#messagebuffer','#queue'].every(q=>{const el=document.querySelector(q);return !el||getComputedStyle(el).backgroundImage==='none'})),'Legacy texture remains');assert.equal(after.js,before.js);assert.equal(after.css,targetCss);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 await p.locator('.ajpw-rules summary').click();assert.equal((await state()).details.open,true);await p.screenshot({path:dir+'/rules-open.png'});await p.locator('.ajpw-rules summary').click();await p.screenshot({path:dir+'/after.png'});
 console.log('AJPW_HEADER '+JSON.stringify({status:'verified',logo:after.logo,header:after.header,legacyMotdRemoved:true,rules:6,collapsed:true,queue:after.entries.length,streamPresent:true,jsPreserved:true,wordmark:after.wordmark}));
 }
}catch(e){
 console.log('AJPW_HEADER_ERROR '+String(e.message||e));
 try{const x=await state();if(auth(x)&&x.js===before?.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd);console.log('AJPW_HEADER_ROLLBACK checked')}}catch(r){console.log('AJPW_HEADER_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
