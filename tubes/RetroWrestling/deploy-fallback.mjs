import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='RetroWrestling',dir='retro-motd-deploy';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);



 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,rank:CLIENT.rank,connected:!!socket.connected,motd:c.motd,js:c.js,css:c.css,externalJs:o.externaljs||'',externalCss:o.externalcss||''}});
 before=current=await state();assert.equal(before.channel.toLowerCase(),slug.toLowerCase());assert.ok(before.connected&&before.rank>=3);
 assert.ok(before.externalCss.includes('/tubes/RetroWrestling/RetroWrestling.css'),'Unrecognized live stylesheet');
 assert.ok(before.motd.trim()===''||before.motd.includes('rw-static-header'),'Existing MOTD changed; no overwrite');
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const html=(await fs.readFile('tubes/RetroWrestling/fallback-motd.html','utf8')).trim();
 const patch=(await fs.readFile('tubes/RetroWrestling/fallback-motd.css','utf8')).trim();
 const targetCss=before.css.replace(/\/\* BEGIN RETRO MOTD FALLBACK v1 \*\/[\s\S]*?\/\* END RETRO MOTD FALLBACK v1 \*\//g,'').trimEnd()+'\n\n'+patch;
 assert.ok(Buffer.byteLength(targetCss)<20000);
 const actualCss=await p.request.get(before.externalCss,{timeout:15000});assert.ok(actualCss.ok());const theme=await actualCss.text();await actualCss.dispose();
 const source=await fs.readFile('tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js','utf8');const match=source.match(/header\.innerHTML\s*=\s*\x60([\s\S]*?)\x60;/);assert.ok(match);
 const fixture=await browser.newPage({viewport:{width:1440,height:1000}});
 await fixture.setContent('<html><body><nav class="navbar" style="height:48px">Baked Network</nav><div id="motdwrap"><div id="motd">'+html+'</div></div><div id="videowrap" style="height:100px"></div></body></html>');
 await fixture.addStyleTag({content:theme+'\n'+targetCss});
 const test=async dynamic=>{const q=await fixture.evaluate(()=>{const visible=e=>e&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none';return {static:!!visible(document.querySelector('.rw-static-header')),dynamic:!!visible(document.querySelector('#rw-header')),rules:!!visible(document.querySelector('.rw-house-rules summary')),now:!!visible(document.querySelector('.rw-now')),shortcuts:!!visible(document.querySelector('.rw-controls')),overflow:document.documentElement.scrollWidth>innerWidth+4}});
 assert.equal(q.static,!dynamic);assert.equal(q.dynamic,dynamic);assert.equal(q.now,dynamic);assert.ok(q.rules&&!q.shortcuts&&!q.overflow);
 await fixture.locator('.rw-house-rules summary').click();assert.ok(await fixture.locator('.rw-house-rules').evaluate(e=>e.open));await fixture.locator('.rw-house-rules summary').click();return q};
 const desktop=await test(false);await fixture.screenshot({path:dir+'/fallback-desktop.png'});await fixture.setViewportSize({width:390,height:844});const mobile=await test(false);
 await fixture.evaluate(arena=>{const s=document.createElement('section');s.id='rw-header';s.innerHTML=arena;document.querySelector('#motdwrap').before(s)},match[1]);const dynamicMobile=await test(true);await fixture.setViewportSize({width:1440,height:1000});const dynamicDesktop=await test(true);await fixture.screenshot({path:dir+'/enhanced-desktop.png'});await fixture.close();
 console.log('RETRO_MOTD_PREVIEW '+JSON.stringify({desktop,mobile,dynamicMobile,dynamicDesktop}));
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return {title:d.querySelector('.rw-crown')?.textContent,rules:[...d.querySelectorAll('.rw-house-rules li')].map(x=>x.textContent),summary:d.querySelector('.rw-house-rules summary')?.textContent}},html);
 const wanted=await signature(html);
 async function save(field,value){
 const expected=current;
 await p.evaluate(({slug,field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!==slug.toLowerCase()||c.motd!==expected.motd||c.js!==expected.js||c.css!==expected.css||(o.externaljs||'')!==expected.externalJs||(o.externalcss||'')!==expected.externalCss)throw Error('Concurrent change; refusing write');socket.emit(field==='motd'?'setMotd':'setChannelCSS',{[field]:value})},{slug,field,value,expected});
 for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)
 }
 try{
 if(targetCss!==before.css){await save('css',targetCss);changed.push('css')}
 if(JSON.stringify(await signature(before.motd))!==JSON.stringify(wanted)){await save('motd',html);changed.push('motd')}
 const after=await state();assert.equal(after.js,before.js);assert.equal(after.externalJs,before.externalJs);assert.equal(after.externalCss,before.externalCss);assert.equal(after.css,targetCss);assert.deepEqual(await signature(after.motd),wanted);
 await p.waitForFunction(()=>{const a=document.querySelector('#motd .rw-static-header'),b=document.querySelector('#rw-header'),r=document.querySelector('#motd .rw-house-rules summary');return !!r?.getClientRects().length&&(!!a?.getClientRects().length||!!b?.getClientRects().length)},null,{timeout:15000});
 await p.screenshot({path:dir+'/after.png'});console.log('RETRO_MOTD_RESULT '+JSON.stringify({status:'saved',staticFallback:true,houseRules:6,enhancedFixturePassed:true,jsPreserved:true,externalSettingsPreserved:true,playlistWrites:0}));
 }catch(e){for(const field of changed.reverse())try{await save(field,before[field])}catch(err){console.log('RETRO_MOTD_ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
