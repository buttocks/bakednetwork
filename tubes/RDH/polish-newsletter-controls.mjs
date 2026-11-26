import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-newsletter-polish-review';await fs.mkdir(dir,{recursive:true});
const oldJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@364c972c0f75249bca4c094b02dc8104e9edff40/tubes/RDH/rdh-custom-only-v1.5.js';
const newJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9502f21f4d6d192d57535fa99e8bb7a62b411935/tubes/RDH/rdh-custom-only-v1.6.js';
const oldCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@956d6239a5de8b860ac34449168ae847676748a2/tubes/RDH/rdh-neon-native.css';
const newCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@ed9464b2f4fe1fee1880d2b1b7648ac7e0d184c3/tubes/RDH/rdh-neon-compact-motd.css';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,current,changes=[];
async function set(field,value){
 const expected=current;
 await page.evaluate(({field,value,e})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.motd!==e.motd||c.css!==e.css||c.js!==e.js||o.externalcss!==e.externalcss||o.externaljs!==e.externaljs)throw Error('Concurrent change; no write');window.socket.emit(field==='motd'?'setMotd':'setOptions',field==='motd'?{motd:value}:{[field]:value});},{field,value,e:expected});
 for(let i=0;i<100;i++){const s=await state();if(s[field]===value){current=s;return}if(field==='motd'&&s.motd!==expected.motd&&await page.evaluate(({a,b})=>{const norm=x=>{const d=new DOMParser().parseFromString(x,'text/html');return [d.body.textContent.replace(/\s+/g,' ').trim(),[...d.querySelectorAll('a[href]')].map(e=>[e.textContent,e.getAttribute('href')]),!!d.querySelector('.rdh-compact-motd'),!!d.querySelector('.rdh-newsletter-controls'),[...d.querySelectorAll('details')].map(e=>e.textContent)]};return JSON.stringify(norm(a))===JSON.stringify(norm(b));},{a:s.motd,b:value})){current=s;return}await page.waitForTimeout(250)}throw Error(field+' persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 before=current=await state();assert.ok(auth(before));assert.equal(before.externaljs,newJs);assert.equal(before.externalcss,newCss);assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));

 const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9287699e94173a2a29efbdcb603d6aa879716c62/tubes/RDH/rdh-neon-compact-motd-v1.1.css';
 const css=await page.request.get(candidate);assert.ok(css.ok());await page.addStyleTag({content:await css.text()});await css.dispose();
 const js=await page.request.get(newJs);assert.ok(js.ok());const code=await js.text();await js.dispose();new Function(code);
 const beforePilot=await page.evaluate(()=>({loaded:!!window.__rdhNewsletterCommands,buttons:document.querySelectorAll('#motd .rdh-newsletter-command').length}));
 await page.evaluate(code=>{(0,eval)(code)},code);await page.waitForTimeout(500);
 async function measure(width,height){await page.setViewportSize({width,height});await page.waitForTimeout(250);return page.evaluate(()=>{const m=document.getElementById('motd'),n=m.querySelector('.rdh-newsletter-controls'),summary=m.querySelector('details summary');return {overflow:m.scrollWidth>m.clientWidth+2,divider:getComputedStyle(n).borderLeftWidth,summaryHeight:summary.getBoundingClientRect().height,buttons:[...n.querySelectorAll('.rdh-newsletter-command')].map(b=>{const r=b.getBoundingClientRect(),c=getComputedStyle(b);return {cmd:b.dataset.command,height:r.height,left:r.left,right:r.right,border:c.borderTopWidth,display:c.display}})};});}
 const desktop=await measure(1440,1000),mobile=await measure(390,844);
 for(const [width,m] of [[1440,desktop],[390,mobile]])assert.ok(!m.overflow&&m.buttons.length===2&&m.buttons.every(b=>b.height>=32&&b.left>=0&&b.right<=width+1&&b.border==='1px'&&b.display==='inline-flex'),JSON.stringify(m));
 assert.equal(desktop.divider,'1px');assert.equal(mobile.divider,'0px');
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:dir+'/desktop.png'});
 console.log('RDH_NEWS_POLISH_PILOT '+JSON.stringify({beforePilot,desktop,mobile}));
 await set('externalcss',candidate);changes.push('externalcss');
 const after=await state();assert.ok(auth(after));assert.equal(after.externalcss,candidate);for(const k of ['js','css','motd','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_NEWS_POLISH_RESULT '+JSON.stringify({status:'saved',desktop,mobile,beforePilot,jsPreserved:true,motdPreserved:true,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_NEWS_POLISH_ERROR '+e.message);try{for(const field of changes.reverse()){const s=await state();if(!auth(s)||s[field]!==current[field])throw Error('Concurrent change prevents rollback');await set(field,before[field]);}}catch(r){console.log('RDH_NEWS_POLISH_ROLLBACK_BLOCKED '+r.message)}throw e;}finally{await browser.close();}
