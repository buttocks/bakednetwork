import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-xaekai-disabled-review';await fs.mkdir(dir,{recursive:true});
const old='/js/channel-loaders/ac9b86cf2e985f1572e1485b32df0033cf6c74d087b67f18d38a6b2d0d81fa5d.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {channel:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd,rows:document.querySelectorAll('#queue .queue_entry').length,nativeCurrent:!!document.querySelector('#native-queue-current'),legacyCurrent:!!document.querySelector('#scroll-btn'),legacyModules:!!window.CLIENT?.modules};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.channel?.toLowerCase()==='rdh'&&s.user?.toLowerCase()==='buttman-gpt';
const ready=()=>page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
let before,changed=false;
async function setExternal(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||(o.externaljs||'')!==expected||c.css!==b.css||c.js!==b.js||c.motd!==b.motd||o.externalcss!==b.externalcss)throw Error('Concurrent channel settings change; no write');window.socket.emit('setOptions',{externaljs:value});},{expected,value,b:{css:before.css,js:before.js,motd:before.motd,externalcss:before.externalcss}});
 for(let i=0;i<100;i++){if((await state()).externaljs===value)return;await page.waitForTimeout(250)}throw Error('External script change not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await ready();
 before=await state();assert.ok(auth(before));assert.ok([old,''].includes(before.externaljs),'Unexpected external script; refusing change');
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const r=await page.request.get('https://baked.live'+old,{timeout:20000});assert.ok(r.ok(),'Cannot back up exact legacy loader');const legacy=await r.text();await r.dispose();assert.ok(legacy.includes('pink.horse')&&legacy.includes('CLIENT.modules'),'Unexpected legacy loader');await fs.writeFile(dir+'/legacy-loader.js',legacy);
 assert.ok(typeof before.js==='string');let inlineSyntax='valid';try{new Function(before.js)}catch(e){inlineSyntax=e.message}
 if(before.externaljs){await setExternal(old,'');changed=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();await page.waitForTimeout(1200);
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,'');for(const k of ['css','js','motd','externalcss'])assert.equal(after[k],before[k],k+' changed');
 assert.ok(after.rows>0&&after.nativeCurrent,'Native playlist controls missing');assert.equal(after.legacyModules,false);assert.equal(after.legacyCurrent,false);
 const report={status:'legacy-external-loader-disabled',externalJs:after.externaljs,nativeCurrent:after.nativeCurrent,legacyCurrent:after.legacyCurrent,legacyModules:after.legacyModules,rows:after.rows,inlineSyntax,localJsPreserved:true,cssPreserved:true,playlistWrites:0,backupUrl:old};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('RDH_XAEKAI_RESULT '+JSON.stringify(report));
}catch(e){console.log('RDH_XAEKAI_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&!s.externaljs)await setExternal('',old)}catch(r){console.log('RDH_XAEKAI_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
