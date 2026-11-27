import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='njpwalt-admin-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/NJPWALT',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='njpwalt'&&document.querySelector('#videowrap'),null,{timeout:45000});
 await p.waitForTimeout(8000);
 const data=await p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,css:c.css||'',js:c.js||'',motd:c.motd||'',externalJs:o.externaljs||'',externalCss:o.externalcss||''}});
 assert.equal(data.channel.toLowerCase(),'njpwalt');
 const source={adminVerified:true,css:data.css.length,js:data.js.length,motd:data.motd.length,externalJs:data.externalJs,externalCss:data.externalCss,
  jsHeaderLines:data.js.split('\n').flatMap((line,i)=>{if(!/header|banner|motd|logo|rules|welcome|innerHTML|insertAdjacent|prepend|afterend|Xaekai|module_settings/i.test(line))return [];return [{line:i+1,excerpt:line.slice(0,1300)}]}).slice(0,60),
  cssHeaderLines:data.css.split('\n').flatMap((line,i)=>/header|banner|motd|logo|rules|navbar|mainpage/i.test(line)?[{line:i+1,excerpt:line.slice(0,500)}]:[]).slice(0,60)};
 const results=[];
 for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(250);
  results.push(await p.evaluate(()=>{const rect=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};const nav=document.querySelector('nav.navbar,.navbar'),video=document.querySelector('#videowrap'),chat=document.querySelector('#chatwrap'),bottom=Math.min(video.getBoundingClientRect().top,chat.getBoundingClientRect().top);return {width:innerWidth,nav:rect(nav),video:rect(video),chat:rect(chat),motd:rect(document.querySelector('#motd')),visible:[...document.querySelectorAll('body *')].filter(e=>{if(e.closest('nav,.navbar,script,style,#videowrap,#chatwrap,.modal'))return false;const r=e.getBoundingClientRect();return r.height>2&&r.width>2&&r.top>=nav.getBoundingClientRect().bottom-2&&r.bottom<=bottom+2&&getComputedStyle(e).visibility!=='hidden'}).filter(e=>e.id||['H1','H2','H3','IMG','DETAILS','SUMMARY','BUTTON'].includes(e.tagName)).slice(0,40).map(e=>({tag:e.tagName,id:e.id,className:String(e.className).slice(0,140),text:e.textContent.trim().slice(0,180),rect:rect(e)})),overflow:document.documentElement.scrollWidth>innerWidth+4}}));
  await p.screenshot({path:dir+'/'+width+'-viewport.png'});
 }
 // Preserve public channel source for subsequent review; do not execute it or write channel settings.
 await fs.writeFile(dir+'/inline.js',data.js);await fs.writeFile(dir+'/inline.css',data.css);await fs.writeFile(dir+'/motd.html',data.motd);
 const motdMarkup=data.motd;const report={source,results,motdMarkup,noWrites:true,customJsExecutionNotRequired:true};await fs.writeFile(dir+'/result.json',JSON.stringify(report,null,2));console.log('NJPWALT_ADMIN_REVIEW '+JSON.stringify(report));
}finally{await browser.close()}
