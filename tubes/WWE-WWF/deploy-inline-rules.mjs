import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='WWF-WWE',dir='wwf-motd-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);





 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css,motd:c.motd,js:c.js,externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 before=current=await state();assert.ok(!before.motd.trim()||before.motd.includes('wwf-static-header'),'Existing MOTD changed; no overwrite');assert.ok(before.externalCss.includes('/tubes/WWE-WWF/skin.css'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const helper=(await fs.readFile('tubes/WWE-WWF/inline-rules.js','utf8')).trim();new Function(helper);
 const patch=(await fs.readFile('tubes/WWE-WWF/inline-rules.css','utf8')).trim();
 const nextCss=before.css.replace(/\/\* BEGIN WWF MOTD v1 \*\/[\s\S]*?\/\* END WWF MOTD v1 \*\//g,'').trimEnd()+'\n\n'+patch;
 const nextJs=before.js.includes('window.__wwfInlineRules=true')?before.js:before.js.trimEnd()+'\n\n'+helper;
 assert.ok(Buffer.byteLength(nextCss)<20000&&Buffer.byteLength(nextJs)<20000);new Function(nextJs);
 const html=(await fs.readFile('tubes/WWE-WWF/fallback-motd.html','utf8')).trim();
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('.wwf-static-header b')?.textContent,rules:[...d.querySelectorAll('.wwf-house-rules li')].map(e=>e.textContent),summary:d.querySelector('.wwf-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);
 const source=await fs.readFile('tubes/WWE-WWF/skin.js','utf8');const match=source.match(/strip\.innerHTML\s*=\s*("(?:\\.|[^"\\])*");/);assert.ok(match);
 const style=await p.addStyleTag({content:patch});
 await p.locator('#motd').evaluate((e,html)=>{e.innerHTML=html;const w=document.querySelector('#motdwrap');w.style.display='';},html);
 const fallback=await p.locator('.wwf-static-header').evaluate(e=>e.getBoundingClientRect().height);assert.ok(fallback>0);
 await p.locator('.wwf-house-rules summary').click();assert.ok(await p.locator('.wwf-house-rules').evaluate(e=>e.open));await p.locator('.wwf-house-rules summary').click();
 const simulated=await p.evaluate(markup=>{if(document.querySelector('#wwf-era-strip'))return false;const n=document.querySelector('nav.navbar,.navbar');const s=document.createElement('div');s.id='wwf-era-strip';s.innerHTML=markup;n.after(s);document.body.dataset.wwfEra='attitude';document.body.dataset.wwfVisualVersion='2.4';return true},JSON.parse(match[1]));
 await p.evaluate(code=>{(0,eval)(code)},helper);
 await p.waitForSelector('#wwf-inline-rules summary');
 const measure=()=>p.evaluate(()=>{const h=document.querySelector('#wwf-era-strip'),r=h.querySelector('.wwf-restored-now'),m=h.querySelector('#wwf-inline-rules summary'),t=h.querySelector('.wwf-now-title'),a=r.getBoundingClientRect(),b=m.getBoundingClientRect(),c=t.getBoundingClientRect();return {centerError:Math.abs((a.left+a.right-b.left-b.right)/2),titleRight:c.right,buttonLeft:b.left,buttonTop:b.top,titleBottom:c.bottom,hiddenNative:getComputedStyle(document.querySelector('#motdrow')).display==='none',rules:[...h.querySelectorAll('#wwf-inline-rules li')].map(e=>e.textContent),now:!!h.querySelector('#wwf-restored-track'),headerWidth:h.getBoundingClientRect().width,viewport:innerWidth}});
 const desktop=await measure();assert.ok(desktop.centerError<3&&desktop.titleRight<=desktop.buttonLeft+1&&desktop.hiddenNative&&desktop.now&&desktop.rules.length===6);
 const layout=()=>p.evaluate(()=>{const rect=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {button:rect('#wwf-inline-rules summary'),title:rect('.wwf-now-title'),row:rect('#wwf-era-strip .wwf-restored-now'),panel:rect('#wwf-inline-rules ol')}});
 async function checkExpanded(){const closed=await layout();await p.locator('#wwf-inline-rules summary').click();assert.ok(await p.locator('#wwf-inline-rules').evaluate(e=>e.open));const open=await layout();const content=await p.locator('#wwf-inline-rules ol').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);const widths=[...e.querySelectorAll('li')].map(li=>{const a=document.createRange();a.selectNodeContents(li);return a.getBoundingClientRect().width});return {width:r.width,longest:Math.max(...widths),padding:parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)+parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth),overflow:e.scrollWidth>e.clientWidth+1}});assert.ok(!content.overflow&&content.width<=content.longest+content.padding+3,'Rules box wider than its contents');assert.ok(Math.abs(closed.button.x-open.button.x)<3&&Math.abs(closed.button.y-open.button.y)<2,'Rules button moved');assert.ok(Math.abs(closed.title.y-open.title.y)<2&&Math.abs(closed.title.x-open.title.x)<2,'Now Showing moved');assert.ok(open.panel.y>=open.button.bottom&&open.panel.y-open.button.bottom<=3&&open.panel.height>30&&open.panel.bottom<=open.row.bottom+1,'Rules panel gap exceeds 3px or overlaps');await p.locator('#wwf-inline-rules summary').click();return {closed,open,content}}
 const expandedDesktop=await checkExpanded();for(const era of ['wwwf','golden','newgen','modern']){await p.evaluate(era=>document.body.dataset.wwfEra=era,era);assert.ok((await measure()).centerError<3);await checkExpanded()}await p.evaluate(()=>document.body.dataset.wwfEra='attitude');await p.screenshot({path:dir+'/desktop.png'});
 await p.setViewportSize({width:390,height:844});const mobile=await measure();assert.ok(mobile.centerError<3&&mobile.buttonTop>=mobile.titleBottom-1&&mobile.headerWidth<=mobile.viewport);const expandedMobile=await checkExpanded();for(const era of ['wwwf','golden','newgen','modern']){await p.evaluate(era=>document.body.dataset.wwfEra=era,era);assert.ok((await measure()).centerError<3);await checkExpanded()}await p.screenshot({path:dir+'/mobile.png'});await p.setViewportSize({width:1440,height:1000});
 console.log('WWF_MOTD_PREVIEW '+JSON.stringify({desktop,mobile,expandedDesktop,expandedMobile,simulated}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='wwf-wwe'||c.motd!==expected.motd||c.css!==expected.css||c.js!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':field==='motd'?'setMotd':'setChannelJS',{[field]:value})},{field,value,expected});for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}assert.equal(current.css,nextCss);assert.equal(current.js,nextJs);assert.deepEqual(await signature(current.motd),wanted);for(const k of ['externalCss','externalJs'])assert.equal(current[k],before[k]);console.log('WWF_MOTD_RESULT '+JSON.stringify({status:'saved',desktopCentered:true,mobileStacked:true,nativeMotdFallback:true,allFiveEraPreviews:true,externalLoaderPreserved:true,visitorApprovalMayBeRequired:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
