import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='wwf-header-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await p.goto('https://baked.live/tv/WWF-WWE',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.CHANNEL?.name?.toLowerCase()==='wwf-wwe'&&document.querySelector('#videowrap'),null,{timeout:45000});
 await p.waitForTimeout(4000);
 const live=await p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};const rect=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};
 return {channel:c.name,externalJs:o.externaljs||'',externalCss:o.externalcss||'',nativeMotdBytes:String(c.motd||'').length,inlineJsBytes:String(c.js||'').length,header:rect(document.querySelector('#wwf-era-strip')),nav:rect(document.querySelector('nav.navbar,.navbar')),video:rect(document.querySelector('#videowrap')),chat:rect(document.querySelector('#chatwrap')),eraPicker:!!document.querySelector('#wwf-era-picker'),era:document.body.dataset.wwfEra,ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs,scriptPrompt:[...document.querySelectorAll('.modal.in,.modal.show,[role="dialog"]')].filter(e=>e.getClientRects().length).map(e=>e.querySelector('.modal-title')?.textContent||'').filter(x=>/script|trust|approve/i.test(x)),overflow:document.documentElement.scrollWidth>innerWidth+4}});
 const loader={};if(/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(live.externalJs)){const response=await p.request.get('https://baked.live'+live.externalJs,{timeout:20000});const text=await response.text();loader.status=response.status();loader.bytes=text.length;loader.markers=Object.fromEntries(['wwf-era-strip','wwf-restored-hero','wwf-restored-now','wwf-feature-logo','wwf-era-picker','2.4','resources.pink.horse','PlaylistTools-Standalone.js'].map(k=>[k,text.includes(k)]));await response.dispose()}
 const source=await fs.readFile('tubes/WWE-WWF/skin.js','utf8');const match=source.match(/strip\.innerHTML\s*=\s*("(?:\\.|[^"\\])*");/);assert.ok(match,'Header markup missing');const markup=JSON.parse(match[1]);
 const css=await fs.readFile('tubes/WWE-WWF/skin.css','utf8');
 const fixture=await browser.newPage({viewport:{width:1440,height:1000}});
 await fixture.setContent('<html><body data-wwf-era="attitude" data-wwf-visual-version="2.4"><nav style="height:48px">Baked Network</nav><div id="wwf-era-strip">'+markup+'</div></body></html>');await fixture.addStyleTag({content:css});
 const results=[];for(const width of [1440,390]){await fixture.setViewportSize({width,height:1000});for(const era of ['wwwf','golden','newgen','attitude','modern']){await fixture.evaluate(e=>document.body.dataset.wwfEra=e,era);results.push(await fixture.evaluate(()=>{const h=document.querySelector('#wwf-era-strip'),b=h.getBoundingClientRect(),hero=h.querySelector('.wwf-restored-hero'),r=hero.getBoundingClientRect(),logo=h.querySelector('#wwf-feature-image');return {viewport:innerWidth,era:document.body.dataset.wwfEra,height:Math.round(b.height),width:Math.round(b.width),overflow:document.documentElement.scrollWidth>innerWidth+4,heroOverflow:hero.scrollWidth>hero.clientWidth+4,logoVisible:!!logo.getClientRects().length,hasRules:!!h.querySelector('details'),wire:!!h.querySelector('.wwf-restored-wire')}}));}await fixture.locator('#wwf-era-strip').screenshot({path:dir+'/'+width+'-fixture.png'});}
 const result={live,loader,fixtures:results,noWrites:true,fixtureOnly:true};await fs.writeFile(dir+'/result.json',JSON.stringify(result,null,2));console.log('WWF_HEADER_REVIEW '+JSON.stringify(result));
}finally{await browser.close()}
