import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-motd-newsletter-rule-review';await fs.mkdir(dir,{recursive:true});
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
  const rules=[...doc.querySelectorAll('details')].find(d=>/House Rules/i.test(d.querySelector('summary')?.textContent||''));
  if(!rules)throw Error('House Rules missing');
  const originalRules=norm(rules.textContent);
  const originalText=norm(doc.body.textContent);
  const menu=/Latest newsletter PDFs are in the\s+Newsletters\s+menu above[.!]?/i;
  const commands=/Chat commands:\s*!won\s+or\s+!torch\s+for a private link[.!]?/i;
  if(!menu.test(originalText)||!commands.test(originalText))throw Error('Expected MOTD phrases not found');
  // Build a map from text offsets to DOM text nodes. Delete only the two
  // requested phrases, retaining all unrelated markup and links.
  function locate(re){
   const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node,full='',nodes=[];
   while((node=walker.nextNode())){if(rules.contains(node))continue;nodes.push({node,start:full.length,end:full.length+node.length});full+=node.textContent}
   const matches=[...full.matchAll(new RegExp(re.source,'gi'))];if(matches.length!==1)throw Error('Expected exactly one match for '+re.source+'; got '+matches.length);
   const m=matches[0],first=nodes.find(n=>n.start<=m.index&&n.end>m.index),last=nodes.find(n=>n.start<m.index+m[0].length&&n.end>=m.index+m[0].length);
   if(!first||!last)throw Error('Text mapping failed');
   const range=doc.createRange();range.setStart(first.node,m.index-first.start);range.setEnd(last.node,m.index+m[0].length-last.start);return {range,first:first.node.parentElement,last:last.node.parentElement};
  }
  const m=locate(menu),c=locate(commands);
  let layout=m.first;while(layout&&(!layout.contains(rules)||!layout.contains(c.first)))layout=layout.parentElement;
  // Process the second range before the first to preserve offsets.
  c.range.deleteContents();m.range.deleteContents();
  const list=rules.querySelector('ol'),body=rules.querySelector(':scope > div')||rules;
  const entry=doc.createElement(list?'li':'div');
  const nums=[...originalRules.matchAll(/(?:^|\s)(\d+)\.\s+/g)].map(x=>Number(x[1]));
  if(!list&&nums.length)entry.append(doc.createTextNode((Math.max(...nums)+1)+'. '));
  entry.append(doc.createTextNode('Newsletter PDFs: use '));
  for(const [i,cmd] of ['!won','!torch'].entries()){if(i)entry.append(doc.createTextNode(' or '));const bold=doc.createElement('b');bold.textContent=cmd;entry.append(bold)}
  entry.append(doc.createTextNode(' in chat for a private link.'));(list||body).append(entry);
  // Centre the surviving control only when the old row contains nothing
  // except House Rules and the now-deleted text.
  let centered=false;
  if(layout&&layout!==doc.body&&norm(layout.textContent)===norm(rules.textContent)&&!layout.querySelector('a[href]:not(details a[href])')){
   layout.replaceChildren(rules);layout.style.setProperty('display','flex','important');layout.style.setProperty('justify-content','center','important');layout.style.setProperty('align-items','flex-start','important');layout.style.setProperty('width','100%','important');layout.style.setProperty('margin','6px auto','important');layout.style.setProperty('text-align','center','important');rules.style.setProperty('margin','0 auto','important');centered=true;
  }else{
   // No wholesale rewrite of a mixed-content parent.
   rules.style.setProperty('margin-left','auto','important');rules.style.setProperty('margin-right','auto','important');
  }
  const afterText=norm(doc.body.textContent),afterRules=norm(rules.textContent);
  const clone=doc.body.cloneNode(true),cloneRules=[...clone.querySelectorAll('details')].find(d=>/House Rules/i.test(d.querySelector('summary')?.textContent||''));
  const cloneEntry=[...cloneRules.querySelectorAll('li,div')].find(e=>e.textContent===entry.textContent);if(!cloneEntry)throw Error('Rule clone missing');cloneEntry.remove();
  const expected=norm(originalText.replace(menu,'').replace(commands,''));
  return {html:doc.body.innerHTML,newRule:entry.textContent,centered,checks:{outdatedMenuRemoved:!menu.test(afterText),commandsMoved:afterRules.includes('!won')&&afterRules.includes('!torch')&&!commands.test(afterText),commandOnce:(afterText.match(/!won\b/gi)||[]).length===1&&(afterText.match(/!torch\b/gi)||[]).length===1,oldRulesPreserved:afterRules.startsWith(originalRules),linksPreserved:JSON.stringify(links())===originalLinks,otherTextPreserved:expected===norm(clone.textContent)}};
 },before.motd);
 next=result.html;assert.ok(Object.values(result.checks).every(Boolean),'MOTD content check failed: '+JSON.stringify(result.checks));
 await fs.writeFile(dir+'/after.html',next);await setMotd(before.motd,next);changed=true;
 const after=await state();assert.ok(auth(after));assert.equal(after.motd,next);for(const k of ['css','js','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_NEWS_RULE_RESULT '+JSON.stringify({status:'saved',...result.checks,newRule:result.newRule,centered:result.centered,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_NEWS_RULE_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.motd===next)await setMotd(next,before.motd)}catch(r){console.log('RDH_NEWS_RULE_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
