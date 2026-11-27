import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const allowed=['Wrestling','wrestling2','wrestling3','Wrestling4','wrestling5'];
const slug=process.env.TUBE;assert.ok(allowed.includes(slug));
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const dir='motd-accordion-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);

 const group=p.locator('#motd .wts-bar>details,#motd .wt-info-bar>details');assert.equal(await group.count(),4);
 const snapshot=()=>group.evaluateAll(es=>es.map(e=>({label:e.querySelector('summary')?.textContent.trim(),name:e.getAttribute('name'),open:e.open})));
 const stored=await p.evaluate(()=>{const doc=new DOMParser().parseFromString(CHANNEL.motd,'text/html');return [...doc.querySelectorAll('.wts-bar>details,.wt-info-bar>details')].map(e=>e.getAttribute('name'))});
 async function exercise(){const a=[];for(const e of await group.all()){await e.locator('summary').click();await p.waitForTimeout(120);a.push(await group.evaluateAll(es=>es.filter(e=>e.open).length));}return a}
 const before=await snapshot();const original=await exercise();await group.evaluateAll(es=>es.forEach(e=>e.open=false));
 const helper=await fs.readFile('tubes/shared/wrestling/motd-accordion.js','utf8');new Function(helper);await p.evaluate(code=>{(0,eval)(code)},helper);const fixed=await exercise();assert.ok(fixed.every(n=>n===1));await group.last().locator('summary').click();assert.equal(await group.evaluateAll(es=>es.filter(e=>e.open).length),0);
 await p.setViewportSize({width:390,height:844});const mobile=await exercise();assert.ok(mobile.every(n=>n===1));
 console.log('WT_ACCORDION_AUDIT '+JSON.stringify({slug,stored,before,original,fixed,mobile,noWrites:true,needsFix:original.some(n=>n>1)}));
}finally{await browser.close()}
