import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='WCW',dir='wcw-motd-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);





 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css,motd:c.motd,js:c.js,externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 before=current=await state();assert.ok(!before.motd.trim()||before.motd.includes('wcw-static-header'),'Existing MOTD changed; no overwrite');assert.ok(before.externalCss.includes('/tubes/WCW/skin.css'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const helper=(await fs.readFile('tubes/WCW/inline-rules.js','utf8')).trim();new Function(helper);
 const patch=(await fs.readFile('tubes/WCW/inline-rules.css','utf8')).trim();
 const nextCss=before.css.replace(/\/\* BEGIN WCW MOTD v1 \*\/[\s\S]*?\/\* END WCW MOTD v1 \*\//g,'').trimEnd()+'\n\n'+patch;
 const nextJs=before.js.includes('window.__wcwInlineRules=true')?before.js:before.js.trimEnd()+'\n\n'+helper;
 assert.ok(Buffer.byteLength(nextCss)<20000&&Buffer.byteLength(nextJs)<20000);new Function(nextJs);
 const html=(await fs.readFile('tubes/WCW/fallback-motd.html','utf8')).trim();
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('.wcw-static-header b')?.textContent,rules:[...d.querySelectorAll('.wcw-house-rules li')].map(e=>e.textContent),summary:d.querySelector('.wcw-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);
 const source=await fs.readFile('tubes/WCW/skin.js','utf8');const match=source.match(/banner\.innerHTML\s*=\s*("(?:\\.|[^"\\])*");/);assert.ok(match);
 const style=await p.addStyleTag({content:patch});
 await p.locator('#motd').evaluate((e,html)=>{e.innerHTML=html;const w=document.querySelector('#motdwrap');w.style.display='';},html);
 const fallback=await p.locator('.wcw-static-header').evaluate(e=>e.getBoundingClientRect().height);assert.ok(fallback>0);
 await p.locator('.wcw-house-rules summary').click();assert.ok(await p.locator('.wcw-house-rules').evaluate(e=>e.open));await p.locator('.wcw-house-rules summary').click();
 const simulated=await p.evaluate(markup=>{if(document.querySelector('#wcw-banner'))return false;const n=document.querySelector('nav.navbar,.navbar');const s=document.createElement('div');s.id='wcw-banner';s.innerHTML=markup;n.after(s);const gap=n.getBoundingClientRect().bottom+4-s.getBoundingClientRect().top;if(gap>0)s.style.marginTop=(parseFloat(getComputedStyle(s).marginTop)+gap)+'px';return true},JSON.parse(match[1]));
 await p.evaluate(code=>{(0,eval)(code)},helper);
 await p.waitForSelector('#wcw-inline-rules summary');
 const measure=()=>p.evaluate(()=>{const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};const h=document.querySelector('#wcw-banner'),t=h.querySelector('strong'),range=document.createRange();range.selectNodeContents(t);const b=rect(h),txt=range.getBoundingClientRect(),panel=h.querySelector('#wcw-inline-rules ol');return {banner:b,title:rect(t),button:rect(h.querySelector('#wcw-inline-rules summary')),panel:rect(panel),nav:rect(document.querySelector('nav.navbar,.navbar')),hiddenNative:getComputedStyle(document.querySelector('#motdrow')).display==='none',titleFits:txt.right<=b.right-3&&txt.left>=b.x,overflow:h.scrollWidth>h.clientWidth+2,ruleCount:panel.querySelectorAll('li').length,panelOverflow:panel.scrollWidth>panel.clientWidth+1,viewport:innerWidth}});
 const results=[];for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});const closed=await measure();assert.ok(closed.titleFits&&!closed.overflow&&closed.hiddenNative&&closed.ruleCount===6&&closed.banner.width<=width,'Closed banner clipped');await p.locator('#wcw-inline-rules summary').click();assert.ok(await p.locator('#wcw-inline-rules').evaluate(e=>e.open));const open=await measure();assert.ok(open.titleFits&&!open.overflow&&!open.panelOverflow&&Math.abs(open.button.x-closed.button.x)<2&&Math.abs(open.button.y-closed.button.y)<2&&Math.abs(open.title.y-closed.title.y)<2&&open.panel.y>=open.button.bottom&&open.panel.bottom<=open.banner.bottom+1,'Expanded panel clipped or moved');results.push({width,closed,open});await p.locator('#wcw-banner').screenshot({path:dir+'/'+width+'-expanded.png'});await p.locator('#wcw-inline-rules summary').click()}
 await p.setViewportSize({width:1440,height:1000});console.log('WCW_MOTD_PREVIEW '+JSON.stringify({results,simulated}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='wcw'||c.motd!==expected.motd||c.css!==expected.css||c.js!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':field==='motd'?'setMotd':'setChannelJS',{[field]:value})},{field,value,expected});for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}assert.equal(current.css,nextCss);assert.equal(current.js,nextJs);assert.deepEqual(await signature(current.motd),wanted);for(const k of ['externalCss','externalJs'])assert.equal(current[k],before[k]);console.log('WCW_MOTD_RESULT '+JSON.stringify({status:'saved',desktopInline:true,mobileStacked:true,nativeMotdFallback:true,fourWidthsPassed:true,externalLoaderPreserved:true,visitorApprovalMayBeRequired:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
