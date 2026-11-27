import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='RetroWrestling',dir='retro-inline-rules-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);





 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css,motd:c.motd,js:c.js,externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 before=current=await state();assert.ok(before.motd.includes('rw-static-header')&&before.css.includes('BEGIN RETRO MOTD FALLBACK v1'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const helper=(await fs.readFile('tubes/RetroWrestling/inline-rules.js','utf8')).trim();new Function(helper);
 const patch=(await fs.readFile('tubes/RetroWrestling/inline-rules.css','utf8')).trim();
 const nextCss=before.css.replace(/\/\* BEGIN RETRO INLINE RULES v1 \*\/[\s\S]*?\/\* END RETRO INLINE RULES v1 \*\//g,'').trimEnd()+'\n\n'+patch;
 const nextJs=before.js.includes('window.__rwInlineRules=true')?before.js:before.js.trimEnd()+'\n\n'+helper;
 assert.ok(Buffer.byteLength(nextCss)<20000&&Buffer.byteLength(nextJs)<20000);new Function(nextJs);
 const source=await fs.readFile('tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js','utf8');const match=source.match(/header\.innerHTML\s*=\s*\x60([\s\S]*?)\x60;/);assert.ok(match);
 const style=await p.addStyleTag({content:patch});
 const simulated=await p.evaluate(html=>{if(document.querySelector('#rw-header'))return false;const n=document.querySelector('nav.navbar,.navbar');const s=document.createElement('section');s.id='rw-header';s.innerHTML=html;n.after(s);const spacer=document.createElement('div');spacer.id='rw-nav-spacer';spacer.style.height='50px';s.before(spacer);return true},match[1]);
 await p.evaluate(code=>{(0,eval)(code)},helper);
 await p.waitForSelector('#rw-inline-rules summary');
 const measure=()=>p.evaluate(()=>{const h=document.querySelector('#rw-header'),r=h.querySelector('.rw-now'),m=h.querySelector('#rw-inline-rules summary'),t=h.querySelector('.rw-now-title'),a=r.getBoundingClientRect(),b=m.getBoundingClientRect(),c=t.getBoundingClientRect();return {centerError:Math.abs((a.left+a.right-b.left-b.right)/2),titleRight:c.right,buttonLeft:b.left,buttonTop:b.top,titleBottom:c.bottom,hiddenNative:getComputedStyle(document.querySelector('#motdrow')).display==='none',rules:[...h.querySelectorAll('#rw-inline-rules li')].map(e=>e.textContent),now:!!h.querySelector('#rw-song'),headerWidth:h.getBoundingClientRect().width,viewport:innerWidth}});
 const desktop=await measure();assert.ok(desktop.centerError<3&&desktop.titleRight<=desktop.buttonLeft+1&&desktop.hiddenNative&&desktop.now&&desktop.rules.length===6);
 const layout=()=>p.evaluate(()=>{const rect=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {button:rect('#rw-inline-rules summary'),title:rect('.rw-now-title'),row:rect('#rw-header .rw-now'),panel:rect('#rw-inline-rules ol')}});
 async function checkExpanded(){const closed=await layout();await p.locator('#rw-inline-rules summary').click();assert.ok(await p.locator('#rw-inline-rules').evaluate(e=>e.open));const open=await layout();const content=await p.locator('#rw-inline-rules ol').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);const widths=[...e.querySelectorAll('li')].map(li=>{const a=document.createRange();a.selectNodeContents(li);return a.getBoundingClientRect().width});return {width:r.width,longest:Math.max(...widths),padding:parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)+parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth),overflow:e.scrollWidth>e.clientWidth+1}});assert.ok(!content.overflow&&content.width<=content.longest+content.padding+3,'Rules box wider than its contents');assert.ok(Math.abs(closed.button.x-open.button.x)<3&&Math.abs(closed.button.y-open.button.y)<2,'Rules button moved');assert.ok(Math.abs(closed.title.y-open.title.y)<2&&Math.abs(closed.title.x-open.title.x)<2,'Now Showing moved');assert.ok(open.panel.y>=open.button.bottom&&open.panel.y-open.button.bottom<=3&&open.panel.height>30&&open.panel.bottom<=open.row.bottom+1,'Rules panel gap exceeds 3px or overlaps');await p.locator('#rw-inline-rules summary').click();return {closed,open,content}}
 const expandedDesktop=await checkExpanded();await p.screenshot({path:dir+'/desktop.png'});
 await p.setViewportSize({width:390,height:844});const mobile=await measure();assert.ok(mobile.centerError<3&&mobile.buttonTop>=mobile.titleBottom-1&&mobile.headerWidth<=mobile.viewport);const expandedMobile=await checkExpanded();await p.screenshot({path:dir+'/mobile.png'});await p.setViewportSize({width:1440,height:1000});
 console.log('RETRO_INLINE_PREVIEW '+JSON.stringify({desktop,mobile,expandedDesktop,expandedMobile,simulated}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='retrowrestling'||c.motd!==expected.motd||c.css!==expected.css||c.js!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':'setChannelJS',{[field]:value})},{field,value,expected});await p.waitForFunction(({field,value})=>CHANNEL[field]===value,{field,value},{timeout:20000});current=await state()}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}assert.equal(current.css,nextCss);assert.equal(current.js,nextJs);for(const k of ['motd','externalCss','externalJs'])assert.equal(current[k],before[k]);console.log('RETRO_INLINE_RESULT '+JSON.stringify({status:'saved',desktopCentered:true,mobileStacked:true,nativeMotdPreserved:true,externalLoaderPreserved:true,visitorApprovalMayBeRequired:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
