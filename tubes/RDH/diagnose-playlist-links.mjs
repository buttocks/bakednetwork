import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-playlist-links-review';await fs.mkdir(dir,{recursive:true});
const patch="/* BEGIN RDH PLAYLIST LINK HIT TARGETS */\n#queue .queue_entry::before,\n#queue .queue_entry::after,\n#queue .queue_entry .qe_time::before,\n.popover:has(.playlist-thumbnail) {\n    pointer-events: none !important;\n}\n#queue .queue_entry a.qe_title,\n#queue .queue_entry .qe_title a {\n    pointer-events: auto !important;\n    cursor: pointer !important;\n    position: relative !important;\n    z-index: 4 !important;\n}\n/* END RDH PLAYLIST LINK HIT TARGETS */";
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||'',rows:document.querySelectorAll('#queue .queue_entry').length};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
const url='https://baked.live/tv/rdh';
async function ready(p){await p.waitForFunction(()=>window.socket?.connected&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});await p.waitForTimeout(1200);}
async function inspect(p,label){
 const inventory=await p.evaluate(()=>{const q=document.querySelector('#queue'),rows=[...q.querySelectorAll('.queue_entry')];return {rows:rows.length,anchors:rows.filter(e=>e.querySelector('a.qe_title,.qe_title a')).length,hrefs:rows.filter(e=>{const a=e.querySelector('a.qe_title,.qe_title a');return a?.getAttribute('href')&&a.getAttribute('href')!=='#'}).length,example:rows.slice(0,4).map(e=>({class:e.className,title:e.querySelector('.qe_title')?.outerHTML?.slice(0,450),anchors:[...e.querySelectorAll('a')].slice(0,5).map(a=>({outer:a.outerHTML.slice(0,450)}))})),permissions:Object.keys(window.CHANNEL?.perms||{}).filter(k=>/link|queue|playlist/i.test(k)),rank:window.CLIENT?.rank};});
 const targets=p.locator('#queue .queue_entry a.qe_title,#queue .queue_entry .qe_title a');
 const results=[];
 for(let i=0;i<Math.min(8,await targets.count());i++){
  const a=targets.nth(i);if(!(await a.isVisible()))continue;
  await a.scrollIntoViewIfNeeded();await a.hover({force:true});await p.waitForTimeout(350);
  const result=await a.evaluate(e=>{
   const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);
   const tr=[...range.getClientRects()].find(x=>x.width>2&&x.height>2)||r;
   const x=Math.max(0,Math.min(innerWidth-1,tr.left+Math.min(tr.width/2,50))),y=Math.max(0,Math.min(innerHeight-1,tr.top+tr.height/2));
   const hit=document.elementFromPoint(x,y),desc=n=>n?{tag:n.tagName,id:n.id,cls:String(n.className).slice(0,180),pointer:getComputedStyle(n).pointerEvents}:null;
   return {title:e.textContent.trim().slice(0,100),href:e.getAttribute('href'),target:e.target,hit:hit===e||e.contains(hit),hitElement:desc(hit),anchor:desc(e),stack:document.elementsFromPoint(x,y).slice(0,6).map(desc),row:e.closest('.queue_entry')?.className,coords:[x,y]};
  });
  results.push(result);
 }
 await p.mouse.move(1,1);
 const out={label,inventory,results};console.log('RDH_LINKS '+JSON.stringify(out));await fs.writeFile(dir+'/'+label+'.json',JSON.stringify(out,null,2));return out;
}
const blocked=r=>r.results.filter(x=>x.href&&x.href!=='#'&&!x.hit).length;
let before,next,changed=false;
async function setCSS(expected,value){await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.css!==expected||c.js!==b.js||c.motd!==b.motd||o.externalcss!==b.externalcss||o.externaljs!==b.externaljs)throw Error('Concurrent change; refusing CSS write');window.socket.emit('setChannelCSS',{css:value});},{expected,value,b:{js:before.js,motd:before.motd,externalcss:before.externalcss,externaljs:before.externaljs}});for(let i=0;i<100;i++){if((await state()).css===value)return;await page.waitForTimeout(250);}throw Error('CSS persistence not confirmed');}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await ready(page);
 before=await state();assert.ok(auth(before));await fs.writeFile(dir+'/before.css',before.css||'');
 const a=await inspect(page,'admin-before');
 const guest=await browser.newPage({viewport:{width:1440,height:1000}});
 await guest.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await ready(guest);
 const g=await inspect(guest,'guest-before');
 const style=await page.addStyleTag({content:patch}),gs=await guest.addStyleTag({content:patch});
 const b=await inspect(page,'admin-pilot'),h=await inspect(guest,'guest-pilot');
 await style.evaluate(e=>e.remove());await gs.evaluate(e=>e.remove());
 const reproduced=blocked(a)+blocked(g),fixed=blocked(b)+blocked(h);
 // When no anchor exists, CSS is not the cause. When no click obstruction
 // reproduces, do not overwrite the channel based on speculation.
 if(reproduced===0||fixed!==0||b.results.length!==a.results.length||h.results.length!==g.results.length){
  for(const [p,label] of [[page,'admin-no-channel-css'],[guest,'guest-no-channel-css']]){
   await p.evaluate(()=>{for(const e of document.querySelectorAll('#chancss,#chanexternalcss')){if(e.sheet)e.sheet.disabled=true;else if(e.tagName==='LINK')e.disabled=true;}});
   await inspect(p,label);
  }
  console.log('RDH_LINK_RESULT '+JSON.stringify({status:reproduced?'patch-did-not-resolve':'no-css-hit-obstruction-reproduced',adminAnchors:a.inventory.anchors,guestAnchors:g.inventory.anchors,adminHrefs:a.inventory.hrefs,guestHrefs:g.inventory.hrefs,reproduced,fixed,noWrites:true}));
 }else{
  next=(before.css||'').trimEnd()+'\n\n'+patch+'\n';assert.ok(!before.css.includes('BEGIN RDH PLAYLIST LINK HIT TARGETS'),'Patch already present');
  await setCSS(before.css,next);changed=true;
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready(page);await guest.reload({waitUntil:'domcontentloaded',timeout:45000});await ready(guest);
  const x=await inspect(page,'admin-live'),y=await inspect(guest,'guest-live');assert.equal(blocked(x)+blocked(y),0);
  const after=await state();assert.ok(auth(after));assert.equal(after.css,next);for(const k of ['js','motd','externalcss','externaljs'])assert.equal(after[k],before[k]);await page.screenshot({path:dir+'/after.png'});
  console.log('RDH_LINK_RESULT '+JSON.stringify({status:'css-hit-target-repair-verified',reproduced,fixed,queueWrites:0,jsPreserved:true,externalCssPreserved:true}));
 }
}catch(e){console.log('RDH_LINK_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.css===next)await setCSS(next,before.css)}catch(r){console.log('RDH_LINK_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
