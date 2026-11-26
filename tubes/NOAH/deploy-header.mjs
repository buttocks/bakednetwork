import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='noah-header-review';await fs.mkdir(dir,{recursive:true});
const template=await fs.readFile('tubes/NOAH/header.css','utf8');
const feed=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.find(x=>x.id==='noah-baked-tv');
assert.ok(feed);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{};
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{const q=window.jQuery(el),m=q.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(m.meta?.embed?.src||'');return {uid:q.data('uid'),src:t.value}});
 const logo=document.querySelector('#motd .noah-original-logo')||[...document.querySelectorAll('#motdwrap img')].filter(i=>i.complete&&i.naturalWidth>100&&i.getClientRects().length).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];
 const r=logo?.getBoundingClientRect(),h=document.querySelector('#motd .noah-masthead'),hr=h?.getBoundingClientRect(),d=document.querySelector('#motd details.noah-rules');
 const paint=r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===logo; const word=document.querySelector('#motd .noah-wordmark');
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,user:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,entries,wordmark:!!word?.getClientRects().length,logo:logo?{src:logo.getAttribute('src'),naturalWidth:logo.naturalWidth,paint,width:r.width,height:r.height}:null,header:hr?{width:hr.width,height:hr.height}:null,details:d?{open:d.open,count:d.querySelectorAll('li').length,contentHidden:!d.querySelector('.noah-rules-content')?.getClientRects().length}:null,visible:['#videowrap','#messagebuffer','#queue'].every(q=>!!document.querySelector(q)?.getClientRects().length)};
});
const auth=x=>x.connected&&x.loggedIn&&x.rank>=3&&x.user?.toLowerCase()==='buttman-gpt'&&x.name?.toLowerCase()==='noah';
const hasFeed=x=>x.entries.some(e=>e.src===feed.url);
const check=x=>(x.wordmark||(x.logo?.paint&&x.logo.naturalWidth>100&&x.logo.height>=55&&x.logo.height<=106))&&x.header?.height>=95&&x.header.height<=175&&!!x.details&&!x.details.open&&x.details.contentHidden&&x.visible&&hasFeed(x);
let before,targetCss,targetMotd,cssWritten=false,motdWritten=false;
async function write(field,expected,next,other){
 await p.evaluate(({field,expected,next,other,originalJs,externalCss,externalJs})=>{
  const c=window.CHANNEL,o=c?.opts||{};const second=field==='css'?'motd':'css';
  if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!=='noah'||c[field]!==expected||c[second]!==other||c.js!==originalJs||(o.externalcss||'')!==externalCss||(o.externaljs||'')!==externalJs)throw Error('Concurrent change; refusing '+field+' write');
  window.socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:next});
 },{field,expected,next,other,originalJs:before.js,externalCss:before.externalCss,externalJs:before.externalJs});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===next)return x;if(field==='motd'&&next===targetMotd&&x.motd!==expected&&x.motd.includes('noah-masthead')&&x.motd.includes('noah-rules'))return x;await p.waitForTimeout(250)}
 throw Error(field+' persistence not confirmed');
}
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/noah',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='noah',{timeout:45000});
 await p.waitForTimeout(5000);
 before=await state();assert.ok(auth(before)&&hasFeed(before)&&typeof before.css==='string'&&typeof before.motd==='string'&&typeof before.js==='string'&&!before.externalCss);
 if(before.motd.includes('noah-masthead')){assert.ok(check(before),'Existing NOAH masthead failed validation');console.log('NOAH_HEADER '+JSON.stringify({status:'already-verified',queue:before.entries.length,logo:before.logo,header:before.header,wordmark:before.wordmark}));}else{
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd);await p.screenshot({path:dir+'/before.png'});
 // Preserve the existing MOTD content in the collapsible panel, including any
 // existing rules, links and modal triggers. Only the old main logo is relocated.
 const legacy=await p.evaluate(({motd,src})=>{
  const doc=new DOMParser().parseFromString(motd,'text/html');
  if(src){for(const i of doc.querySelectorAll('img'))if(i.getAttribute('src')===src)i.remove()}
  return doc.body.innerHTML;
 },{motd:before.motd,src:before.logo?.src||null});
 const logo=before.logo?.src&&before.logo.naturalWidth>100?'<img class="noah-original-logo" src="'+escape(before.logo.src)+'" alt="Pro Wrestling NOAH">':'<div class="noah-wordmark">NOAH</div>';
 targetMotd='<div class="noah-masthead"><div class="noah-identity"><div class="noah-overline">BAKED NETWORK / PURORESU</div><div class="noah-brand">PRO WRESTLING NOAH</div><div class="noah-tagline">GHC CHAMPIONSHIPS &bull; CLASSIC MATCHES &bull; NOAH TV</div></div>'+logo+'<div class="noah-tv-mark">NOAH TV<small>24/7 WRESTLING</small></div></div><details class="noah-rules"><summary>Rules &amp; Links</summary><div class="noah-rules-content">'+legacy+'</div></details>';
 targetCss=before.css.replace(/\/\* BEGIN NOAH RINGSIDE MASTHEAD v2 \*\/[\s\S]*?\/\* END NOAH RINGSIDE MASTHEAD v2 \*\//g,'').trimEnd()+'\n\n'+template;
 assert.ok(Buffer.byteLength(targetCss)<24000,'CSS size limit');
 await fs.writeFile(dir+'/proposed.css',targetCss);await fs.writeFile(dir+'/proposed-motd.html',targetMotd);
 // Preview locally using original DOM node and restore it before any write.
 const previewStyle=await p.addStyleTag({content:template});
 const oldHtml=await p.locator('#motd').evaluate((el,html)=>{const prior=el.innerHTML;el.innerHTML=html;return prior},targetMotd);
 try{
  await p.waitForFunction(()=>!!document.querySelector('.noah-wordmark')||(document.querySelector('.noah-original-logo')?.complete&&document.querySelector('.noah-original-logo')?.naturalWidth>100),{timeout:15000});
  const preview=await state();console.log('NOAH_HEADER_PREVIEW '+JSON.stringify({logo:preview.logo,header:preview.header,details:preview.details,wordmark:preview.wordmark}));
  assert.ok(check(preview),'Local header layout failed');
  await p.locator('.noah-rules summary').click();assert.equal((await state()).details.open,true);await p.locator('.noah-rules summary').click();
  await p.screenshot({path:dir+'/preview.png'});
 }finally{await p.locator('#motd').evaluate((el,html)=>el.innerHTML=html,oldHtml);await previewStyle.evaluate(el=>el.remove())}
 if(targetCss!==before.css){await write('css',before.css,targetCss,before.motd);cssWritten=true}
 let applied=await write('motd',before.motd,targetMotd,targetCss);motdWritten=true;
 targetMotd=applied.motd;
 await p.waitForFunction(()=>!!document.querySelector('.noah-wordmark')||(document.querySelector('.noah-original-logo')?.complete&&document.querySelector('.noah-original-logo')?.naturalWidth>100),{timeout:15000});
 const after=await state();assert.ok(auth(after)&&check(after),'Live header failed');assert.equal(after.js,before.js);assert.equal(after.css,targetCss);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.deepEqual(after.entries,before.entries);
 await p.locator('.noah-rules summary').click();assert.equal((await state()).details.open,true);await p.screenshot({path:dir+'/rules-open.png'});await p.locator('.noah-rules summary').click();await p.screenshot({path:dir+'/after.png'});
 console.log('NOAH_HEADER '+JSON.stringify({status:'verified',logo:after.logo,header:after.header,legacyMotdPreserved:true,collapsed:true,queue:after.entries.length,streamPresent:true,jsPreserved:true,wordmark:after.wordmark}));
 }
}catch(e){
 console.log('NOAH_HEADER_ERROR '+String(e.message||e));
 try{const x=await state();if(auth(x)&&x.js===before?.js){if(motdWritten&&x.motd===targetMotd&&x.css===targetCss)await write('motd',targetMotd,before.motd,targetCss);const y=await state();if(cssWritten&&y.css===targetCss&&y.motd===before.motd)await write('css',targetCss,before.css,before.motd);console.log('NOAH_HEADER_ROLLBACK checked')}}catch(r){console.log('NOAH_HEADER_ROLLBACK_BLOCKED '+r.message)}
 throw e;
}finally{await browser.close()}
