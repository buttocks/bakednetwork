import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,next,changed=false;
async function setCSS(expected,value){await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.css!==expected||c.js!==b.js||c.motd!==b.motd||o.externalcss!==b.externalcss||o.externaljs!==b.externaljs)throw Error('Concurrent change; no CSS write');window.socket.emit('setChannelCSS',{css:value});},{expected,value,b:before});for(let i=0;i<100;i++){if((await state()).css===value)return;await page.waitForTimeout(250)}throw Error('CSS persistence not confirmed')}
async function capture(label){
 const v=await page.evaluate(()=>{
 const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,tag:e.tagName,cls:typeof e.className==='string'?e.className:'',x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),display:s.display,position:s.position,top:s.top,margin:s.margin,padding:s.padding,overflow:s.overflow,animation:s.animationName,visibility:s.visibility,z:s.zIndex,before:getComputedStyle(e,'::before').content,after:getComputedStyle(e,'::after').content,parent:e.parentElement?.id||e.parentElement?.className||'',children:[...e.children].slice(0,12).map(x=>({tag:x.tagName,id:x.id,cls:x.className,txt:x.textContent.trim().slice(0,100)}))}};
 const motd=document.getElementById('motd'),nav=document.querySelector('.navbar'),toggle=document.getElementById('togglemotd');
 return {viewport:[innerWidth,innerHeight],scrollY,nav:box(nav),motd:box(motd),toggle:box(toggle),header:box(document.getElementById('header')),wrap:box(document.getElementById('wrap')),main:box(document.getElementById('mainpage')),body:box(document.body),top:[...document.querySelectorAll('body > *,#wrap > *,#mainpage > *')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().top<280).slice(0,25).map(box),images:[...document.querySelectorAll('img')].filter(e=>e.getBoundingClientRect().top<280&&e.getBoundingClientRect().height>0).slice(0,12).map(e=>({...box(e),src:e.getAttribute('src')})),motdHtml:motd?.innerHTML.slice(0,14000),links:[...motd?.querySelectorAll('a[href]')||[]].map(x=>({text:x.textContent.trim(),href:x.getAttribute('href')})),details:[...motd?.querySelectorAll('details')||[]].map(x=>({text:x.querySelector('summary')?.textContent,open:x.open,box:box(x)})),rows:document.querySelectorAll('#queue .queue_entry').length};
 });
 await fs.writeFile(dir+'/'+label+'.json',JSON.stringify(v,null,2));await page.screenshot({path:dir+'/'+label+'.png'});const {motdHtml,...summary}=v;console.log('RDH_MOTD_'+label.toUpperCase()+' '+JSON.stringify(summary));return v;
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});await page.waitForTimeout(1000);
 before=await state();assert.ok(auth(before));assert.ok(before.externaljs.includes('rdh-custom-only-v1.4.js'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 console.log('RDH_MOTD_LOCAL_RULES '+JSON.stringify(before.css.split('\n').map((line,i)=>({i,line})).filter(x=>/motd|navbar|header|banner/i.test(x.line)).slice(0,100)));
 const native=await capture('native');
 // Execute the current approved-candidate script solely inside the isolated test tab.
 const resp=await page.request.get(before.externaljs,{timeout:20000});assert.ok(resp.ok());const code=await resp.text();await resp.dispose();new Function(code);
 await page.evaluate(s=>{(0,eval)(s)},code);await page.waitForTimeout(1000);
 let open=await capture('custom');
 // Test native toggle only in this diagnostic tab; never save a user's layout preference.
 if(open.motd&&open.motd.h<35&&open.toggle){await page.locator('#togglemotd').click();await page.waitForTimeout(500);open=await capture('expanded')}
 // Determine whether old theme CSS clips the actual navbar/header. Only commit an
 // unambiguous, measured repair. Preserve all content and unrelated theme settings.
 const patch='/* BEGIN RDH NATIVE MOTD LAYOUT */\n#motd {overflow:visible!important;max-height:none!important;}\n#motd #rdh-motd-actions {position:relative!important;clear:both!important;}\n#motd #rdh-motd-actions summary {white-space:normal!important;}\n#motd #rdh-motd-actions br {display:revert!important;}\n/* END RDH NATIVE MOTD LAYOUT */';
 const style=await page.addStyleTag({content:patch});const pilot=await capture('pilot');
 const sameLinks=JSON.stringify(open.links)===JSON.stringify(pilot.links);
 const rectGood=v=>v.nav&&v.motd&&v.nav.w>0&&v.motd.w>0&&v.rows>0&&v.links.length>0;
 const improved=rectGood(pilot)&&sameLinks&&open.motd.overflow==='hidden'&&pilot.motd.overflow==='visible'&&pilot.motd.h>open.motd.h+5;
 if(improved){next=before.css.trimEnd()+'\n\n'+patch+'\n';await setCSS(before.css,next);changed=true;const after=await state();assert.equal(after.css,next);for(const k of ['js','motd','externaljs','externalcss'])assert.equal(after[k],before[k]);}
 await style.evaluate(e=>e.remove());
 console.log('RDH_MOTD_RESULT '+JSON.stringify({status:changed?'measured-motd-css-repair-saved':'diagnostic-only-no-proven-improvement',linksPreserved:sameLinks,rows:pilot.rows,reloads:0,playlistWrites:0,motdPreserved:true,cssChanged:changed}));
}catch(e){console.log('RDH_MOTD_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.css===next)await setCSS(next,before.css)}catch(r){console.log('RDH_MOTD_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
