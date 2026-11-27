import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='wcw-header-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await p.goto('https://baked.live/tv/WCW',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.CHANNEL?.name?.toLowerCase()==='wcw'&&document.querySelector('#videowrap'),null,{timeout:45000});
 await p.waitForTimeout(4000);
 const live=await p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};const rect=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};return {channel:c.name,externalJs:o.externaljs||'',externalCss:o.externalcss||'',nativeMotdBytes:String(c.motd||'').length,inlineJsBytes:String(c.js||'').length,header:rect(document.querySelector('#wcw-banner')),nav:rect(document.querySelector('nav.navbar,.navbar')),video:rect(document.querySelector('#videowrap')),chat:rect(document.querySelector('#chatwrap')),scriptPrompt:[...document.querySelectorAll('.modal.in,.modal.show,[role="dialog"]')].filter(e=>e.getClientRects().length).map(e=>e.querySelector('.modal-title')?.textContent||'').filter(x=>/script|trust|approve/i.test(x)),overflow:document.documentElement.scrollWidth>innerWidth+4}});
 const loader={};if(/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(live.externalJs)){const response=await p.request.get('https://baked.live'+live.externalJs,{timeout:20000});const text=await response.text();loader.status=response.status();loader.bytes=text.length;loader.markers=Object.fromEntries(['wcw-banner','wcw-mark','wcw-broadcast-text','wcw-watermark','margin-top','WORLD CHAMPIONSHIP WRESTLING'].map(k=>[k,text.includes(k)]));await response.dispose()}
 const source=await fs.readFile('tubes/WCW/skin.js','utf8');const match=source.match(/banner\.innerHTML\s*=\s*("(?:\\.|[^"\\])*");/);assert.ok(match,'Header markup missing');const markup=JSON.parse(match[1]);
 const css=await fs.readFile('tubes/WCW/skin.css','utf8');
 const fixture=await browser.newPage({viewport:{width:1440,height:1000}});
 await fixture.setContent('<html><body><nav style="height:52px">Baked Network</nav><div id="wcw-banner">'+markup+'</div></body></html>');await fixture.addStyleTag({content:css});
 const results=[];for(const width of [1440,768,390,320]){await fixture.setViewportSize({width,height:1000});results.push(await fixture.evaluate(()=>{const h=document.querySelector('#wcw-banner'),b=h.getBoundingClientRect(),t=h.querySelector('strong'),r=t.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(t);const txt=range.getBoundingClientRect(),logo=h.querySelector('.wcw-mark');return {viewport:innerWidth,height:Math.round(b.height),width:Math.round(b.width),overflow:document.documentElement.scrollWidth>innerWidth+4,bannerOverflow:h.scrollWidth>h.clientWidth+4,titleClipped:txt.right>b.right-4,logoLoaded:logo.complete&&logo.naturalWidth>0,hasRules:!!h.querySelector('details')}}));await fixture.locator('#wcw-banner').screenshot({path:dir+'/'+width+'-fixture.png'});}
 const result={live,loader,fixtures:results,noWrites:true,fixtureOnly:true};await fs.writeFile(dir+'/result.json',JSON.stringify(result,null,2));console.log('WCW_HEADER_REVIEW '+JSON.stringify(result));
}finally{await browser.close()}
