import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='njpwalt',dir='njpwalt-motd-review';await fs.mkdir(dir,{recursive:true});
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
 assert.equal(before.externalJs,'');assert.equal(before.externalCss,'');
 assert.ok(before.motd.length===1303&&before.motd.includes('New_Japan_Pro_Wrestling_Logo_2.svg')||before.motd.includes('njpw-compact'),'Existing MOTD changed; no overwrite');
 assert.ok(before.js.length===7665,'Inline JS changed since audit');
 assert.ok(before.css.length===8685||before.css.includes('BEGIN NJPW MOTD v1'),'Inline CSS changed since audit');
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const legacy=await p.evaluate(()=>{const h=document.querySelector('#header');return {headerPresent:!!h,headerVisible:!!h?.getClientRects().length&&getComputedStyle(h).visibility!=='hidden',images:[...h?.querySelectorAll('img')||[]].map(e=>({src:e.getAttribute('src'),alt:e.alt})),text:h?.textContent.trim().slice(0,200)||''}});
 console.log('NJPWALT_EXISTING_HEADER '+JSON.stringify({legacy,cssHeader:before.css.split('\n').filter(x=>/#header|headerAnim|background-image|url\(/i.test(x)).map(x=>x.slice(0,300)).slice(0,35)}));
 // Native markup only: preserve the existing header animation, CSS, and all legacy JS.
 const patch=(await fs.readFile('tubes/NJPW/secondary/NJPWALT/compact-motd.css','utf8')).trim();
 const html=(await fs.readFile('tubes/NJPW/secondary/NJPWALT/compact-motd.html','utf8')).trim();
 const nextCss=before.css.replace(/\/\* BEGIN NJPW MOTD v1 \*\/[\s\S]*?\/\* END NJPW MOTD v1 \*\//g,'').trimEnd()+'\n\n'+patch;assert.ok(Buffer.byteLength(nextCss)<20000);
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {logo:d.querySelector('.njpw-lion')?.getAttribute('src'),title:d.querySelector('.njpw-wordmark b')?.textContent,tagline:d.querySelector('.njpw-wordmark small')?.textContent,links:d.querySelectorAll('.njpw-compact a').length,credits:/Xaekai|Powered by/i.test(html),rules:[...d.querySelectorAll('.njpw-house-rules li')].map(e=>e.textContent),summary:d.querySelector('.njpw-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);assert.equal(wanted.rules.length,6);assert.equal(wanted.logo,'https://upload.wikimedia.org/wikipedia/en/1/1c/New_Japan_Pro_Wrestling_Logo_2.svg');assert.equal(wanted.links,0);assert.equal(wanted.tagline,'KING OF SPORTS · NJPWALT TUBE');assert.equal(wanted.credits,false);assert.deepEqual(wanted.rules,["Limit off topic posts in the playlist","Respect other tubers","Don't break kayfabe","No embedding NSFW images","No advertising of any kind","Have fun!"]);
 await p.addStyleTag({content:patch});await p.locator('#motd').evaluate((e,html)=>{e.innerHTML=html;for(const id of ['motdwrap','motdrow']){const w=document.getElementById(id);if(w)w.style.display=''}},html);
 await p.locator('.njpw-lion').evaluate(async e=>{await e.decode();if(e.naturalWidth/e.naturalHeight<0.9||e.naturalWidth/e.naturalHeight>1.1)throw Error('Original lion logo not loaded correctly')});
 const measure=()=>p.evaluate(()=>{const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};const h=document.querySelector('.njpw-compact'),t=h.querySelector('.njpw-title'),b=h.querySelector('summary'),panel=h.querySelector('ol');return {banner:rect(h),title:rect(t),button:rect(b),panel:rect(panel),overflow:h.scrollWidth>h.clientWidth+2,panelOverflow:panel.scrollWidth>panel.clientWidth+2}});
 const results=[];for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});const closed=await measure();assert.ok(closed.banner.height>0&&closed.banner.width<=width&&!closed.overflow,'Closed MOTD clipped');await p.locator('.njpw-house-rules summary').click();assert.ok(await p.locator('.njpw-house-rules').evaluate(e=>e.open));const open=await measure();assert.ok(!open.overflow&&!open.panelOverflow&&Math.abs(open.button.x-closed.button.x)<2&&Math.abs(open.button.y-closed.button.y)<2&&Math.abs(open.title.y-closed.title.y)<2&&open.panel.y>=open.button.bottom&&open.panel.y-open.button.bottom<=4&&open.panel.bottom<=open.banner.bottom+1,'Rules panel moved or clipped');results.push({width,closed,open});await p.locator('.njpw-compact').screenshot({path:dir+'/'+width+'-expanded.png'});await p.locator('.njpw-house-rules summary').click()}
 await p.setViewportSize({width:1440,height:1000});await p.locator('.njpw-compact').screenshot({path:dir+'/1440-closed.png'});await p.screenshot({path:dir+'/1440-full-page.png',fullPage:true});console.log('NJPWALT_MOTD_PREVIEW '+JSON.stringify({results,legacy,localOnly:true}));
 async function save(field,value){assert.ok(['css','motd'].includes(field),'Only CSS and MOTD writes allowed');const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='njpwalt'||(c.motd||'')!==expected.motd||(c.css||'')!==expected.css||(c.js||'')!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':'setMotd',{[field]:value})},{field,value,expected});for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}assert.equal(current.css,nextCss);assert.deepEqual(await signature(current.motd),wanted);for(const k of ['js','externalCss','externalJs'])assert.equal(current[k],before[k]);await fs.writeFile(dir+'/after.json',JSON.stringify(current,null,2));console.log('NJPWALT_MOTD_RESULT '+JSON.stringify({status:'saved',fourWidthsPassed:true,legacyJsPreserved:true,legacyCssPreserved:true,originalBrandingPreserved:true,visibleCreditsRemoved:true,registrationNoticeRemoved:true,externalSettingsPreserved:true,nativeRules:true,playlistWrites:0}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
