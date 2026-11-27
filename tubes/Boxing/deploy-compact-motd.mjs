import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='boxing',dir='boxing-motd-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug.toLowerCase()===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);





 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css||'',motd:c.motd||'',js:c.js||'',externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 before=current=await state();
 assert.ok(!before.externalJs&&!before.externalCss,'External theme changed; no writes');
 assert.ok(before.motd.length===3469&&before.motd.includes('D50eMvS.png')&&before.motd.includes('id="rules"')||before.motd.includes('boxing-motd'),'Existing MOTD changed; no overwrite');
 assert.ok(before.js.length===7751,'Inline JS changed since audit');
 assert.ok(before.css.length===1923||before.css.includes('BEGIN BOXING MOTD v1'),'Inline CSS changed since audit');
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const legacy=await p.evaluate(()=>{const h=document.querySelector('#header');return {headerPresent:!!h,headerVisible:!!h?.getClientRects().length&&getComputedStyle(h).visibility!=='hidden',images:[...h?.querySelectorAll('img')||[]].map(e=>({src:e.getAttribute('src'),alt:e.alt})),text:h?.textContent.trim().slice(0,200)||''}});
 console.log('BOXING_EXISTING_HEADER '+JSON.stringify({legacy,cssHeader:before.css.split('\n').filter(x=>/#header|headerAnim|background-image|url\(/i.test(x)).map(x=>x.slice(0,300)).slice(0,35)}));
 // Native markup only: preserve the existing header animation, CSS, and all legacy JS.
 const patch=(await fs.readFile('tubes/Boxing/compact-motd.css','utf8')).trim();
 const html=(await fs.readFile('tubes/Boxing/compact-motd.html','utf8')).trim();
 const nextCss=before.css.replace(/\/\* BEGIN BOXING MOTD v1 \*\/[\s\S]*?\/\* END BOXING MOTD v1 \*\//g,'').trimEnd()+'\n\n'+patch;assert.ok(Buffer.byteLength(nextCss)<20000);
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('.boxing-title b')?.textContent,card:d.querySelector('.boxing-card')?.textContent,links:[...d.querySelectorAll('.boxing-card a')].map(a=>a.getAttribute('href')),credit:d.querySelector('.boxing-credit')?.textContent,images:d.querySelectorAll('.boxing-motd img').length,rules:[...d.querySelectorAll('.boxing-house-rules li')].map(e=>e.textContent),summary:d.querySelector('.boxing-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);assert.equal(wanted.rules.length,6);assert.deepEqual(wanted.links,['https://bakedsched.blogspot.com/','https://baked.live/register']);assert.equal(wanted.images,0);assert.ok(wanted.credit.includes('Xaekai'));
 await p.addStyleTag({content:patch});await p.locator('#motd').evaluate((e,html)=>{e.innerHTML=html;for(const id of ['motdwrap','motdrow']){const w=document.getElementById(id);if(w)w.style.display=''}},html);
 const surfaces=await p.evaluate(()=>{const read=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return {background:c.backgroundColor,image:c.backgroundImage,color:c.color}};return {body:read('body'),chat:read('#messagebuffer'),queue:read('#queue'),nav:read('nav.navbar')}});
 assert.equal(surfaces.body.background,'rgb(23, 23, 25)');assert.ok(surfaces.body.image.includes('repeating-linear-gradient'));assert.equal(surfaces.chat.background,'rgb(29, 27, 25)');assert.equal(surfaces.queue.background,'rgb(29, 27, 25)');console.log('BOXING_SURFACES_PREVIEW '+JSON.stringify(surfaces));
 const navLinks=await p.evaluate(()=>[...document.querySelectorAll('.navbar .navbar-nav>li>a')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),color:getComputedStyle(e).color})));assert.ok(navLinks.length>0&&navLinks.every(x=>x.color==='rgb(241, 225, 194)'));console.log('BOXING_NAV_CONTRAST '+JSON.stringify(navLinks));
 const measure=()=>p.evaluate(()=>{const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};const h=document.querySelector('.boxing-motd'),t=h.querySelector('.boxing-title'),b=h.querySelector('summary'),panel=h.querySelector('ol');return {banner:rect(h),title:rect(t),button:rect(b),panel:rect(panel),overflow:h.scrollWidth>h.clientWidth+2,panelOverflow:panel.scrollWidth>panel.clientWidth+2}});
 const results=[];for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});const closed=await measure();assert.ok(closed.banner.height>0&&closed.banner.width<=width&&!closed.overflow,'Closed MOTD clipped');await p.locator('.boxing-house-rules summary').click();assert.ok(await p.locator('.boxing-house-rules').evaluate(e=>e.open));const open=await measure();assert.ok(!open.overflow&&!open.panelOverflow&&Math.abs(open.button.x-closed.button.x)<2&&Math.abs(open.button.y-closed.button.y)<2&&Math.abs(open.title.y-closed.title.y)<2&&open.panel.y>=open.button.bottom&&open.panel.y-open.button.bottom<=4&&open.panel.bottom<=open.banner.bottom+1,'Rules panel moved or clipped');results.push({width,closed,open});await p.locator('.boxing-motd').screenshot({path:dir+'/'+width+'-expanded.png'});await p.locator('.boxing-house-rules summary').click()}
 await p.setViewportSize({width:1440,height:1000});await p.locator('.boxing-motd').screenshot({path:dir+'/1440-closed.png'});await p.screenshot({path:dir+'/1440-full-page.png',fullPage:true});console.log('BOXING_MOTD_PREVIEW '+JSON.stringify({results,legacy,localOnly:true}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='boxing'||(c.motd||'')!==expected.motd||(c.css||'')!==expected.css||(c.js||'')!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:value})},{field,value,expected});for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}assert.equal(current.css,nextCss);assert.deepEqual(await signature(current.motd),wanted);for(const k of ['js','externalCss','externalJs'])assert.equal(current[k],before[k]);await fs.writeFile(dir+'/after.json',JSON.stringify(current,null,2));console.log('BOXING_MOTD_RESULT '+JSON.stringify({status:'saved',fourWidthsPassed:true,legacyJsPreserved:true,legacyCssPreserved:true,championshipPalette:true,arenaBackground:true,registrationAndSchedulePreserved:true,legacyLinksArchived:true,externalSettingsPreserved:true,nativeRules:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
