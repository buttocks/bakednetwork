import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='ScaryTube',dir='scary-effects-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);





 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css,motd:c.motd,js:c.js,externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 before=current=await state();assert.ok(before.externalCss.includes('/tubes/ScaryTube/skin.css'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const helper=(await fs.readFile('tubes/ScaryTube/visual-effects.js','utf8')).trim(),patch=(await fs.readFile('tubes/ScaryTube/visual-effects.css','utf8')).trim();new Function(helper);
 const nextCss=before.css.replace(/\/\* BEGIN SCARY CHAT EFFECTS v2 \*\/[\s\S]*?\/\* END SCARY CHAT EFFECTS v2 \*\//g,'').trimEnd()+'\n\n'+patch;
 const nextJs=before.js.includes('window.__scaryVisualEffectsV2=true')?before.js:before.js.trimEnd()+'\n\n'+helper;assert.ok(Buffer.byteLength(nextCss)<20000&&Buffer.byteLength(nextJs)<20000);new Function(nextJs);
 await p.addStyleTag({content:patch});
 const native=await p.evaluate(()=>{const b=document.querySelector('#messagebuffer');return [...new Set([...b.children].filter(e=>!e.querySelector('.username')).map(e=>e.className))].slice(0,20)});
 // Only local test nodes; never send test chat to the channel.
 await p.evaluate(()=>{const b=document.querySelector('#messagebuffer');const t=document.createElement('div');t.id='scary-test';t.className='chat-msg-LocalDiagnostic';t.innerHTML='<span class="username">LocalDiagnostic:</span> <span class="horror-fx horror-chip horror-blood">BLOOD MOON</span> Watch out';b.append(t);for(const [id,cls,text] of [['scary-join','server-msg','[12:00:00] LocalDiagnostic joined (aliases: LocalDiagnostic)'],['scary-leave','server-msg','[12:00:00] LocalDiagnostic left'],['scary-chat','chat-msg-LocalDiagnostic','LocalDiagnostic joined the channel'],['scary-video','server-msg','Video Notification: Your video is now playing!']]){const e=document.createElement('div');e.id=id;e.className=cls;e.textContent=text;b.append(e)}});
 await p.evaluate(code=>{(0,eval)(code)},helper);
 const test=await p.evaluate(()=>{const t=document.querySelector('#scary-test'),s=t.querySelector('.scary-visual-text:not(.horror-chip)'),chip=t.querySelector('.horror-chip');return {styled:s?.textContent.trim(),color:s&&getComputedStyle(s).color,hidden:getComputedStyle(chip).display==='none',join:document.querySelector('#scary-join').classList.contains('scary-fade-presence'),leave:document.querySelector('#scary-leave').classList.contains('scary-fade-presence'),normal:!document.querySelector('#scary-chat').classList.contains('scary-fade-presence'),video:!document.querySelector('#scary-video').classList.contains('scary-fade-presence')}});
 assert.ok(test.styled==='Watch out'&&test.hidden&&test.join&&test.leave&&test.normal&&test.video&&test.color==='rgb(255, 150, 158)');
 await p.waitForTimeout(10200);assert.ok(await p.locator('#scary-join').evaluate(e=>getComputedStyle(e).display==='none'));assert.ok(await p.locator('#scary-leave').evaluate(e=>getComputedStyle(e).display==='none'));assert.ok(await p.locator('#scary-chat').evaluate(e=>getComputedStyle(e).display!=='none'));
 await p.evaluate(()=>document.querySelectorAll('#scary-test,#scary-join,#scary-leave,#scary-chat,#scary-video').forEach(e=>e.remove()));
 console.log('SCARY_EFFECTS_PREVIEW '+JSON.stringify({test,native,fadeSeconds:10,localOnly:true}));
 async function save(field,value){const expected=current;await p.evaluate(({field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='scarytube'||c.motd!==expected.motd||c.css!==expected.css||c.js!==expected.js||(o.externalcss||'')!==expected.externalCss||(o.externaljs||'')!==expected.externalJs)throw Error('Concurrent change');socket.emit(field==='css'?'setChannelCSS':'setChannelJS',{[field]:value})},{field,value,expected});await p.waitForFunction(({field,value})=>CHANNEL[field]===value,{field,value},{timeout:20000});current=await state()}
 try{if(nextCss!==before.css){await save('css',nextCss);changed.push('css')}if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}assert.equal(current.css,nextCss);assert.equal(current.js,nextJs);for(const k of ['motd','externalCss','externalJs'])assert.equal(current[k],before[k]);console.log('SCARY_EFFECTS_RESULT '+JSON.stringify({status:'saved',filterWrites:0,playlistWrites:0,externalLoaderPreserved:true,visitorApprovalMayBeRequired:true}))}catch(e){for(const f of changed.reverse())try{await save(f,before[f])}catch(err){console.log('ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
