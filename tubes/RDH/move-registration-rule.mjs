import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-registration-rule-review';await fs.mkdir(dir,{recursive:true});
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
 const result=await page.evaluate(html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  const norm=s=>s.replace(/\s+/g,' ').trim();
  const links=()=>[...doc.querySelectorAll('a[href]')].map(e=>[norm(e.textContent),e.getAttribute('href')]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const originalLinks=JSON.stringify(links());
  const rules=[...doc.querySelectorAll('details')].find(d=>/^\s*House Rules\s*$/i.test(norm(d.querySelector('summary')?.textContent||'').replace(/[▾▸▼▲]/g,'')));
  if(!rules)throw Error('House Rules not found');
  const link=[...doc.querySelectorAll('a[href]')].find(e=>!rules.contains(e)&&/register an account/i.test(norm(e.textContent))&&/\/register(?:[/?#]|$)/i.test(e.getAttribute('href')||''));
  if(!link)throw Error('Registration link not found outside House Rules');
  const registration='To view the playlist, please register an account.';
  const pattern=/^To view the playlist,\s*please\s+register an account\.?$/i;
  const beforeText=norm(doc.body.textContent);
  const ruleText=norm(rules.textContent);
  const clonedLink=link.cloneNode(true);
  let wrapper=link.parentElement;
  while(wrapper&&wrapper!==doc.body&&!pattern.test(norm(wrapper.textContent)))wrapper=wrapper.parentElement;
  if(wrapper&&wrapper!==doc.body&&pattern.test(norm(wrapper.textContent))&&!wrapper.contains(rules)){
   if(wrapper.querySelectorAll('a[href]').length!==1)throw Error('Unexpected links in registration wrapper');
   wrapper.remove();
  }else{
   const parent=link.parentElement;
   const walker=doc.createTreeWalker(parent,NodeFilter.SHOW_TEXT);
   let start=null,offset=0,node;
   while((node=walker.nextNode())){
    const m=node.textContent.match(/To view the playlist,\s*please\s*$/i);
    if(m){start=node;offset=m.index;break;}
   }
   if(!start)throw Error('Registration phrase not safely isolated');
   const range=doc.createRange();range.setStart(start,offset);range.setEndAfter(link);
   const following=link.nextSibling;
   if(following?.nodeType===3&&/^\s*\./.test(following.textContent)){range.setEnd(following,following.textContent.match(/^\s*\./)[0].length);}
   const extracted=norm(range.toString());
   if(!pattern.test(extracted))throw Error('Unexpected registration range: '+extracted);
   range.deleteContents();
  }
  const list=rules.querySelector('ol');
  let body=rules.querySelector(':scope > div')||rules;
  let entry;
  if(list){entry=doc.createElement('li');list.append(entry);}
  else {
   entry=doc.createElement('div');
   const nums=[...ruleText.matchAll(/(?:^|\s)(\d+)\.\s+/g)].map(m=>Number(m[1]));
   if(nums.length)entry.append(doc.createTextNode((Math.max(...nums)+1)+'. '));
   body.append(entry);
  }
  entry.append(doc.createTextNode('To view the playlist, please '),clonedLink,doc.createTextNode('.'));
  const afterText=norm(doc.body.textContent);
  const normalizedRemove=s=>norm(s.replace(/To view the playlist,\s*please\s+register an account\.?/i,''));
  const ruleNumber=entry.textContent.match(/^\d+\.\s+/)?.[0]||'';
  const clone=doc.body.cloneNode(true);
  // Compare all unrelated visible content after removing the newly inserted rule from a clone.
  const cloneRules=[...clone.querySelectorAll('details')].find(d=>/House Rules/i.test(d.querySelector('summary')?.textContent||''));
  const cloneEntry=[...cloneRules.querySelectorAll('li,div')].find(e=>e.textContent===entry.textContent);
  if(!cloneEntry)throw Error('Rule clone not found');
  cloneEntry.remove();
  return {html:doc.body.innerHTML,checks:{linksPreserved:JSON.stringify(links())===originalLinks,registrationInRules:rules.contains(clonedLink),registrationOnlyOnce:(afterText.match(/To view the playlist,\s*please\s+register an account\./gi)||[]).length===1,otherTextPreserved:normalizedRemove(beforeText)===norm(clone.textContent),welcomeAbsent:!afterText.includes('Welcome to the Hideout!')},newRule:entry.textContent};
 },before.motd);
 next=result.html;
 assert.ok(Object.values(result.checks).every(Boolean),'MOTD content check failed: '+JSON.stringify(result.checks));
 await fs.writeFile(dir+'/after.html',next);await setMotd(before.motd,next);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.motd,next);for(const k of ['css','js','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_RULE_RESULT '+JSON.stringify({status:'saved',...result.checks,newRule:result.newRule,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_RULE_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.motd===next)await setMotd(next,before.motd)}catch(r){console.log('RDH_RULE_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
