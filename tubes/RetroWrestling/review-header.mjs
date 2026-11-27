import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='retro-header-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e.message).slice(0,180)));
try{
 await p.goto('https://baked.live/tv/RetroWrestling',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.CHANNEL?.name?.toLowerCase()==='retrowrestling'&&document.querySelector('#videowrap'),null,{timeout:45000});
 await p.waitForTimeout(4000);
 const capture=()=>p.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{};
 const rect=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};
 const h=document.getElementById('rw-header'),n=document.querySelector('nav.navbar,.navbar');
 return {channel:c.name,externalJs:o.externaljs||'',externalCss:o.externalcss||'',nativeMotdBytes:String(c.motd||'').length,inlineJsBytes:String(c.js||'').length,header:rect(h),nav:rect(n),video:rect(document.querySelector('#videowrap')),chat:rect(document.querySelector('#chatwrap')),controls:[...h?.querySelectorAll('a,button')||[]].map(e=>e.textContent.trim()),title:h?.querySelector('.rw-crown')?.textContent,nowPlaying:h?.querySelector('#rw-song')?.textContent,arenaInitialized:!!window.RetroWrestlingArenaV1,ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs,scriptPrompt:[...document.querySelectorAll('.modal.in,.modal.show,[role="dialog"]')].filter(e=>e.getClientRects().length).map(e=>e.querySelector('.modal-title')?.textContent||'').filter(x=>/script|trust|approve/i.test(x)),overflow:document.documentElement.scrollWidth>innerWidth+4};
 });
 const live=await capture();assert.equal(live.channel.toLowerCase(),'retrowrestling');
 const loader={};
 if(/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(live.externalJs)){
  const response=await p.request.get('https://baked.live'+live.externalJs,{timeout:20000});const source=await response.text();loader.status=response.status();loader.bytes=source.length;loader.markers=Object.fromEntries(['rw-header','rw-nav-spacer','rw-tools','rw-focus','rw-lights','PlaylistTools-Standalone.js','resources.pink.horse','v1.3.5','RetroWrestling-WrestleTube-Merged.js'].map(k=>[k,source.includes(k)]));loader.references=[...new Set(source.match(/https:\/\/(?:cdn\.jsdelivr\.net\/gh\/buttocks\/bakednetwork|buttocks\.github\.io\/bakednetwork)\/[^"' \x60<>]+/g)||[])].slice(0,12);await response.dispose();
 }
 if(live.header?.height>0)await p.locator('#rw-header').screenshot({path:dir+'/live-header.png'}).catch(()=>{});
 // Isolated local fixture: render only the reviewed arena HTML, never execute the channel's legacy loader or change script approvals.
 const source=await fs.readFile('tubes/RetroWrestling/RetroWrestling-WrestleTube-Merged.js','utf8');
 const match=source.match(/header\.innerHTML\s*=\s*\x60([\s\S]*?)\x60;/);assert.ok(match,'Arena template missing');
 const css=await fs.readFile('tubes/RetroWrestling/RetroWrestling.css','utf8');
 const fixture=await context.newPage();await fixture.setContent('<html><head></head><body><nav class="navbar" style="height:48px;margin:0">Baked Network</nav><section id="rw-header">'+match[1]+'</section><div id="videowrap" style="height:200px"></div></body></html>');await fixture.addStyleTag({content:css});
 const inspect=()=>fixture.evaluate(()=>{const h=document.getElementById('rw-header'),b=h.getBoundingClientRect();return {height:Math.round(b.height),width:Math.round(b.width),overflow:document.documentElement.scrollWidth>innerWidth+4,controls:[...h.querySelectorAll('a,button')].map(e=>e.textContent.trim()),rules:!!h.querySelector('details,[data-target*="rules"]')};});
 const desktop=await inspect();await fixture.locator('#rw-header').screenshot({path:dir+'/desktop-fixture.png'});await fixture.setViewportSize({width:390,height:844});const mobile=await inspect();await fixture.locator('#rw-header').screenshot({path:dir+'/mobile-fixture.png'});
 const result={live,loader,desktop,mobile,errors:errors.slice(0,10),noWrites:true,fixtureOnly:true};await fs.writeFile(dir+'/result.json',JSON.stringify(result,null,2));console.log('RETRO_HEADER_REVIEW '+JSON.stringify(result));
}finally{await browser.close()}
