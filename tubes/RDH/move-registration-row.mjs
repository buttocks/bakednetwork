import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-registration-row-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,next,changed=false;
async function setMotd(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.motd!==expected||c.css!==b.css||c.js!==b.js||o.externalcss!==b.externalcss||o.externaljs!==b.externaljs)throw Error('Concurrent change; no MOTD write');window.socket.emit('setMotd',{motd:value});},{expected,value,b:before});
 for(let i=0;i<100;i++){const current=(await state()).motd;if(current===value)return;if(current!==expected&&await page.evaluate(({a,b})=>{const normalize=s=>{const d=new DOMParser().parseFromString(s,'text/html');return [d.body.textContent.replace(/\s+/g,' ').trim(),[...d.querySelectorAll('a[href]')].map(e=>[e.textContent,e.getAttribute('href')]),[...d.querySelectorAll('details b')].map(e=>e.textContent)]};return JSON.stringify(normalize(a))===JSON.stringify(normalize(b));},{a:current,b:value})){next=current;return;}await page.waitForTimeout(250)}throw Error('MOTD persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 before=await state();assert.ok(auth(before));assert.equal(typeof before.motd,'string');await fs.writeFile(dir+'/before.html',before.motd);
 const result=await page.evaluate(html=>{
 const doc=new DOMParser().parseFromString(html,'text/html');
 const norm=s=>s.replace(/\s+/g,' ').trim();
 const wrapper=doc.querySelector('.rdh-compact-motd'),tools=wrapper?.querySelector('.rdh-motd-tools'),rules=tools?.querySelector('details');
 if(!wrapper||!tools||!rules)throw Error('Compact MOTD not found');
 const candidates=[...rules.querySelectorAll('div,li,p')].filter(e=>/^(?:7\.\s*)?To view the playlist, please register an account\.?$/i.test(norm(e.textContent)));
 if(candidates.length!==1)throw Error('Expected exactly one registration rule, found '+candidates.length);
 const entry=candidates[0],link=entry.querySelector('a[href]');
 if(!link||new URL(link.getAttribute('href'),'https://baked.live').href!=='https://baked.live/register')throw Error('Registration link mismatch');
 const oldText=norm(entry.textContent),oldRules=norm(rules.textContent),oldLinks=JSON.stringify([...doc.querySelectorAll('a[href]')].map(a=>[norm(a.textContent),a.getAttribute('href')]));
 const row=doc.createElement('div');row.className='rdh-registration-row';
 row.style.cssText='text-align:center;margin:8px auto 0;font-size:12px;line-height:1.5;color:#c4d5dc;';
 row.append(doc.createTextNode('To view the playlist, please '),link,doc.createTextNode('.'));
 entry.remove();wrapper.append(row);
 const checks={registrationOutsideRules:!rules.contains(link)&&row.contains(link)&&wrapper.lastElementChild===row,remainingRulesPreserved:norm(rules.textContent)===norm(oldRules.replace(oldText,'')),linksPreserved:oldLinks===JSON.stringify([...doc.querySelectorAll('a[href]')].map(a=>[norm(a.textContent),a.getAttribute('href')])),newsletterControlsPreserved:!!tools.querySelector('.rdh-newsletter-controls'),registrationOnlyOnce:(doc.body.textContent.match(/To view the playlist, please/g)||[]).length===1};
 return {html:doc.body.innerHTML,newText:row.textContent,checks};
 },before.motd);
 next=result.html;assert.ok(Object.values(result.checks).every(Boolean),'MOTD content check failed: '+JSON.stringify(result.checks));
 await fs.writeFile(dir+'/after.html',next);await setMotd(before.motd,next);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.motd,next);for(const k of ['css','js','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_REG_ROW_RESULT '+JSON.stringify({status:'saved',...result.checks,newRule:result.newText,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_REG_ROW_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.motd===next)await setMotd(next,before.motd)}catch(r){console.log('RDH_REG_ROW_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
