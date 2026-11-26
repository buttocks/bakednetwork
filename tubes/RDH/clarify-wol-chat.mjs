import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-wol-chat-review';await fs.mkdir(dir,{recursive:true});
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
 const beforeText=norm(doc.body.textContent);
 const old='Wrestling Observer Live',replacement='Chat along with Wrestling Observer Live';
 const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);
 const matches=[];let node;
 while((node=walker.nextNode()))if(node.textContent.includes(old)&&!node.parentElement.closest('details'))matches.push(node);
 if(matches.length!==1||beforeText.includes(replacement)||!beforeText.includes('Weekdays at 3:06 PM ET'))throw Error('Unexpected WOL text or schedule');
 const target=matches[0],anchor=target.parentElement.closest('a');
 const links=()=>[...doc.querySelectorAll('a[href]')].map(e=>[norm(e.textContent),e.getAttribute('href')]);
 const expectedLinks=links().filter(x=>!(anchor&&x[0]===norm(anchor.textContent)&&x[1]===anchor.getAttribute('href')));
 const rules=[...doc.querySelectorAll('details')].map(e=>e.outerHTML);
 target.textContent=target.textContent.replace(old,replacement);
 if(anchor){const span=doc.createElement('span');for(const attr of ['class','style'])if(anchor.hasAttribute(attr))span.setAttribute(attr,anchor.getAttribute(attr));span.append(...anchor.childNodes);anchor.replaceWith(span);}
 const checks={onlyScheduleLabelChanged:norm(doc.body.textContent)===beforeText.replace(old,replacement),houseRulesPreserved:JSON.stringify(rules)===JSON.stringify([...doc.querySelectorAll('details')].map(e=>e.outerHTML)),otherLinksPreserved:JSON.stringify(links())===JSON.stringify(expectedLinks),plainTextSchedule:!([...doc.querySelectorAll('a')].some(e=>e.textContent.includes(replacement))),newsletterButtonsPreserved:doc.body.textContent.includes('Newsletters: !won !torch')};
 return {html:doc.body.innerHTML,newText:replacement+' — Weekdays at 3:06 PM ET',checks};
 },before.motd);
 next=result.html;assert.ok(Object.values(result.checks).every(Boolean),'MOTD content check failed: '+JSON.stringify(result.checks));await fs.writeFile(dir+'/after.html',next);await setMotd(before.motd,next);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.motd,next);for(const k of ['css','js','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_WOL_CHAT_RESULT '+JSON.stringify({status:'saved',...result.checks,newRule:result.newText,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_WOL_CHAT_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.motd===next)await setMotd(next,before.motd)}catch(r){console.log('RDH_WOL_CHAT_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
