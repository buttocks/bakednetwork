import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='sumo',dir='sumo-motd-review';await fs.mkdir(dir,{recursive:true});
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
 assert.ok(before.motd.length===90||before.motd.includes('sumo-motd'),'Existing MOTD changed; no overwrite');
 assert.ok(before.js.length===7700,'Inline JS changed since audit');
 assert.ok(before.css.length===9220||before.css.includes('BEGIN SUMO MOTD v1'),'Inline CSS changed since audit');
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const legacy=await p.evaluate(()=>{const h=document.querySelector('#header');return {headerPresent:!!h,headerVisible:!!h?.getClientRects().length&&getComputedStyle(h).visibility!=='hidden',images:[...h?.querySelectorAll('img')||[]].map(e=>({src:e.getAttribute('src'),alt:e.alt})),text:h?.textContent.trim().slice(0,200)||''}});
 console.log('SUMO_EXISTING_HEADER '+JSON.stringify({legacy,cssHeader:before.css.split('\n').filter(x=>/#header|headerAnim|background-image|url\(/i.test(x)).map(x=>x.slice(0,300)).slice(0,35)}));
 // Native markup only: preserve the existing header animation, CSS, and all legacy JS.
 const patch=(await fs.readFile('tubes/Sumo/compact-motd.css','utf8')).trim();
 const template=(await fs.readFile('tubes/Sumo/compact-motd.html','utf8')).trim();
 const html=await p.evaluate(({template,old})=>{const d=new DOMParser().parseFromString(old,'text/html'),n=new DOMParser().parseFromString(template,'text/html');const img=d.querySelector('img.headimg');if(!img||!img.getAttribute('src'))throw Error('Original Sumo logo not found; no changes');const title=n.querySelector('.sumo-title');const words=n.createElement('div');while(title.firstChild)words.append(title.firstChild);const clean=n.createElement('img');clean.className='headimg';clean.setAttribute('src',img.getAttribute('src'));clean.alt=img.alt||'SumoTube';title.append(clean,words);return n.body.innerHTML},{template,old:before.motd});
 const nextCss=before.css.replace(/\/\* BEGIN SUMO MOTD v1 \*\/[\s\S]*?\/\* END SUMO MOTD v1 \*\//g,'').trimEnd()+'\n\n'+patch;assert.ok(Buffer.byteLength(nextCss)<20000);
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('.sumo-title b')?.textContent,card:d.querySelector('.sumo-card')?.textContent,logo:d.querySelector('.sumo-title img.headimg')?.getAttribute('src'),rules:[...d.querySelectorAll('.sumo-house-rules li')].map(e=>e.textContent),summary:d.querySelector('.sumo-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);assert.equal(wanted.rules.length,6);assert.ok(wanted.logo,'Original logo missing');assert.ok(wanted.card.includes('THE DOHYŌ'));
 await p.addStyleTag({content:patch});await p.locator('#motd').evaluate((e,html)=>{e.innerHTML=html;for(const id of ['motdwrap','motdrow']){const w=document.getElementById(id);if(w)w.style.display=''}},html);
 const surfaces=await p.evaluate(()=>{const read=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return {background:c.backgroundColor,image:c.backgroundImage,color:c.color}};return {body:read('body'),chat:read('#messagebuffer'),queue:read('#queue'),nav:read('nav.navbar')}});
 assert.equal(surfaces.body.background,'rgb(23, 33, 49)');assert.ok(surfaces.body.image.includes('repeating-linear-gradient'));assert.equal(surfaces.chat.background,'rgb(27, 38, 55)');assert.equal(surfaces.queue.background,'rgb(27, 38, 55)');console.log('SUMO_SURFACES_PREVIEW '+JSON.stringify(surfaces));
 const measure=()=>p.evaluate(()=>{const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};const h=document.querySelector('.sumo-motd'),t=h.querySelector('.sumo-title'),b=h.querySelector('summary'),panel=h.querySelector('ol');return {logo:rect(t.querySelector('img')),banner:rect(h),title:rect(t),button:rect(b),panel:rect(panel),overflow:h.scrollWidth>h.clientWidth+2,panelOverflow:panel.scrollWidth>panel.clientWidth+2}});
 const results=[];for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});const closed=await measure();assert.ok(closed.banner.height>0&&closed.banner.width<=width&&!closed.overflow&&closed.logo.height<=57&&closed.logo.right<=closed.banner.right,'Closed MOTD clipped');await p.locator('.sumo-house-rules summary').click();assert.ok(await p.locator('.sumo-house-rules').evaluate(e=>e.open));const open=await measure();assert.ok(!open.overflow&&!open.panelOverflow&&Math.abs(open.button.x-closed.button.x)<2&&Math.abs(open.button.y-closed.button.y)<2&&Math.abs(open.title.y-closed.title.y)<2&&open.panel.y>=open.button.bottom&&open.panel.y-open.button.bottom<=4&&open.panel.bottom<=open.banner.bottom+1,'Rules panel moved or clipped');results.push({width,closed,open});await p.locator('.sumo-motd').screenshot({path:dir+'/'+width+'-expanded.png'});await p.locator('.sumo-house-rules summary').click()}
 await p.setViewportSize({width:1440,height:1000});await p.locator('.sumo-motd').screenshot({path:dir+'/1440-closed.png'});await p.screenshot({path:dir+'/1440-full-page.png',fullPage:true});console.log('SUMO_MOTD_PREVIEW '+JSON.stringify({results,legacy,localOnly:true}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='sumo'||(c.motd||'')!==expected.motd||(c.css||'')!==expected.css||(c.js||'')!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:value})},{field,value,expected});for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}assert.equal(current.css,nextCss);assert.deepEqual(await signature(current.motd),wanted);for(const k of ['js','externalCss','externalJs'])assert.equal(current[k],before[k]);await fs.writeFile(dir+'/after.json',JSON.stringify(current,null,2));console.log('SUMO_MOTD_RESULT '+JSON.stringify({status:'saved',fourWidthsPassed:true,legacyJsPreserved:true,legacyCssPreserved:true,traditionalPalette:true,arenaBackground:true,originalLogoPreserved:true,externalSettingsPreserved:true,nativeRules:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
