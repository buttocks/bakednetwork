import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-welcome-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,next,changed=false;
async function setMotd(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.motd!==expected||c.css!==b.css||c.js!==b.js||o.externalcss!==b.externalcss||o.externaljs!==b.externaljs)throw Error('Concurrent change; no MOTD write');window.socket.emit('setMotd',{motd:value});},{expected,value,b:before});
 for(let i=0;i<100;i++){if((await state()).motd===value)return;await page.waitForTimeout(250)}throw Error('MOTD persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 before=await state();assert.ok(auth(before));assert.equal(typeof before.motd,'string');await fs.writeFile(dir+'/before.html',before.motd);
 const phrase='Welcome to the Hideout!';assert.equal(before.motd.split(phrase).length-1,1,'Expected exactly one welcome phrase');
 // Remove a dedicated simple wrapper if present; otherwise remove only the literal text.
 const isolated=/<(strong|b|span|div|h[1-6])(?:\s[^<>]*)?>\s*Welcome to the Hideout!\s*<\/\1>/i;
 next=isolated.test(before.motd)?before.motd.replace(isolated,''):before.motd.replace(phrase,'');
 const verify=await page.evaluate(({a,b,phrase})=>{const parse=s=>new DOMParser().parseFromString(s,'text/html');const old=parse(a),now=parse(b);const links=x=>[...x.querySelectorAll('a[href]')].map(e=>[e.textContent.trim(),e.getAttribute('href')]);const details=x=>[...x.querySelectorAll('details')].map(e=>e.textContent.trim());const norm=s=>s.replace(/\s+/g,' ').trim();return {welcomeRemoved:!now.body.textContent.includes(phrase),textPreserved:norm(old.body.textContent.replace(phrase,''))===norm(now.body.textContent),linksPreserved:JSON.stringify(links(old))===JSON.stringify(links(now)),detailsPreserved:JSON.stringify(details(old))===JSON.stringify(details(now))};},{a:before.motd,b:next,phrase});
 assert.ok(Object.values(verify).every(Boolean),'MOTD content check failed');await fs.writeFile(dir+'/after.html',next);await setMotd(before.motd,next);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.motd,next);for(const k of ['css','js','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_WELCOME_RESULT '+JSON.stringify({status:'saved',...verify,removedCharacters:before.motd.length-next.length,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_WELCOME_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.motd===next)await setMotd(next,before.motd)}catch(r){console.log('RDH_WELCOME_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
