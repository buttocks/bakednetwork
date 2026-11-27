import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const slug='RetroWrestling',dir='retro-spacing-review';await fs.mkdir(dir,{recursive:true});
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);




 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css,motd:c.motd,js:c.js,externalCss:o.externalcss||'',externalJs:o.externaljs||''}});
 const before=await state();assert.ok(before.motd.includes('rw-static-header')&&before.css.includes('BEGIN RETRO MOTD FALLBACK v1'));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const source=await fs.readFile('tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js','utf8');const match=source.match(/header\.innerHTML\s*=\s*\x60([\s\S]*?)\x60;/);assert.ok(match);
 const geometry=()=>p.evaluate(()=>{const box=e=>{if(!e)return null;const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {top:b.top,bottom:b.bottom,height:b.height,width:b.width,x:b.x,paddingTop:s.paddingTop,marginTop:s.marginTop,marginBottom:s.marginBottom,position:s.position}};
 const header=box(document.querySelector('#rw-header')),rules=box(document.querySelector('.rw-house-bar'));return {header,rules,gap:header&&rules?Math.round(rules.top-header.bottom):null,wrap:box(document.querySelector('#wrap')),row:box(document.querySelector('#motdrow')),motdwrap:box(document.querySelector('#motdwrap')),motd:box(document.querySelector('#motd')),nav:box(document.querySelector('nav.navbar,.navbar')),video:box(document.querySelector('#videowrap')),chat:box(document.querySelector('#chatwrap')),overflow:document.documentElement.scrollWidth>innerWidth+4}});
 const staticBefore=await geometry();
 // Only insert the existing reviewed header markup for layout testing, not the channel script.
 const simulated=await p.evaluate(html=>{if(document.querySelector('#rw-header'))return false;const n=document.querySelector('nav.navbar,.navbar');if(!n)throw Error('Navbar missing');const s=document.createElement('section');s.id='rw-header';s.innerHTML=html;n.after(s);const spacer=document.createElement('div');spacer.id='rw-nav-spacer';spacer.style.cssText='display:block;height:0;flex:none;pointer-events:none';s.before(spacer);const r=s.getBoundingClientRect(),b=n.getBoundingClientRect();if(['fixed','sticky'].includes(getComputedStyle(n).position))spacer.style.height=Math.max(0,Math.ceil(b.bottom+8-r.top))+'px';return true},match[1]);
 const original=await geometry();await p.screenshot({path:dir+'/before.png'});
 const scope='body:has(#rw-header):has(#motd .rw-static-header) ';
 const candidates=[
 scope+'#wrap{padding-top:0!important}',
 scope+'#wrap{padding-top:0!important}'+scope+'#motdrow{margin-top:0!important}'+scope+'#motdwrap{margin-top:0!important}',
 scope+'#wrap{padding-top:0!important;margin-top:0!important}'+scope+'#motdrow{margin-top:0!important}'+scope+'#motdwrap{margin-top:0!important}'+scope+'#motd{margin-top:0!important}'
 ];
 let selected=null,desktop,mobile;const trials=[];
 const valid=g=>g.gap!==null&&g.gap>=0&&g.gap<=14&&!g.overflow&&g.header.top>=g.nav.bottom-2&&g.rules.bottom<=Math.min(g.video.top,g.chat.top)+2;
 for(const candidate of candidates){const style=await p.addStyleTag({content:candidate});desktop=await geometry();await p.setViewportSize({width:390,height:844});mobile=await geometry();await p.setViewportSize({width:1440,height:1000});trials.push({candidate,desktop,mobile});await style.evaluate(e=>e.remove());if(valid(desktop)&&mobile.gap!==null&&mobile.gap>=0&&mobile.gap<=14&&!mobile.overflow){selected=candidate;break}}
 console.log('RETRO_SPACING_PREVIEW '+JSON.stringify({original,staticBefore,simulated,trials,selected}));
 assert.ok(selected,'No safe spacing correction; no writes');
 const patch='/* BEGIN RETRO HEADER SPACING v1 */\n'+selected+'\n/* END RETRO HEADER SPACING v1 */';
 const target=before.css.replace(/\/\* BEGIN RETRO HEADER SPACING v1 \*\/[\s\S]*?\/\* END RETRO HEADER SPACING v1 \*\//g,'').trimEnd()+'\n\n'+patch;
 assert.ok(Buffer.byteLength(target)<20000);
 const style=await p.addStyleTag({content:patch});await p.screenshot({path:dir+'/preview.png'});await p.locator('.rw-house-rules summary').click();assert.ok(await p.locator('.rw-house-rules').evaluate(e=>e.open));await p.locator('.rw-house-rules summary').click();await style.evaluate(e=>e.remove());
 if(simulated)await p.evaluate(()=>{document.querySelector('#rw-header')?.remove();document.querySelector('#rw-nav-spacer')?.remove()});
 if(simulated){const check=await p.addStyleTag({content:patch});const g=await geometry();assert.ok(Math.abs(g.rules.top-staticBefore.rules.top)<2,'Fallback moved');await check.evaluate(e=>e.remove())}
 await p.evaluate(({before,target})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!=='retrowrestling'||c.css!==before.css||c.js!==before.js||c.motd!==before.motd||(o.externalcss||'')!==before.externalCss||(o.externaljs||'')!==before.externalJs)throw Error('Concurrent settings change');socket.emit('setChannelCSS',{css:target})},{before,target});
 await p.waitForFunction(x=>CHANNEL.css===x,target,{timeout:20000});
 const after=await state();assert.equal(after.css,target);for(const k of ['motd','js','externalCss','externalJs'])assert.equal(after[k],before[k]);
 await fs.writeFile(dir+'/after.css',target);console.log('RETRO_SPACING_RESULT '+JSON.stringify({status:'saved',beforeGap:original.gap,desktopGap:desktop.gap,mobileGap:mobile.gap,simulated,onlyCss:true,playlistWrites:0}));
}finally{await browser.close()}
