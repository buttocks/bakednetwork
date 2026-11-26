import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-playlist-links-review';await fs.mkdir(dir,{recursive:true});
const marker='RDH NATIVE PLAYLIST PREVIEW POSITION';
const patch=(n)=>`/* BEGIN ${marker} */
.popover.native-playlist-preview,
.popover.native-playlist-preview *,
.popover:has(.playlist-thumbnail),
.popover:has(.playlist-thumbnail) * {
 pointer-events:none!important;
}
.popover.native-playlist-preview.left,
.popover.left:has(.playlist-thumbnail) {
 transform:translateX(calc(-100% - ${n}px))!important;
}
.popover.native-playlist-preview.right,
.popover.right:has(.playlist-thumbnail) {
 transform:translateX(12px)!important;
}
/* END ${marker} */`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
const url='https://baked.live/tv/rdh';
async function ready(){await page.waitForFunction(()=>window.socket?.connected&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});await page.waitForTimeout(1000);}
async function inspect(label){
 const results=[];
 const titles=page.locator('#queue .queue_entry .qe_title');
 for(let i=0;i<Math.min(5,await titles.count());i++){
  await page.mouse.move(1,1);await page.waitForTimeout(120);
  const a=titles.nth(i);
  await a.evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest'}));
  const pt=await a.evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);const r=[...range.getClientRects()].find(x=>x.width>2&&x.height>2)||e.getBoundingClientRect();return {x:r.left+Math.min(r.width/2,45),y:r.top+r.height/2};});
  const v=page.viewportSize();if(pt.y<65||pt.y>v.height-5||pt.x<5||pt.x>v.width-5)continue;
  await page.mouse.move(pt.x,pt.y);await page.waitForTimeout(500);
  const result=await a.evaluate(e=>{
   const row=e.closest('.queue_entry').getBoundingClientRect();
   const pop=[...document.querySelectorAll('.popover.native-playlist-preview.in,.popover:has(.playlist-thumbnail).in')].find(p=>p.getBoundingClientRect().width>0);
   if(!pop)return null;
   const r=pop.getBoundingClientRect();
   return {title:e.textContent.trim().slice(0,80),placement:pop.className,left:Math.round(r.left),right:Math.round(r.right),rowLeft:Math.round(row.left),rowRight:Math.round(row.right),overlap:Math.max(0,Math.min(r.right,row.right)-Math.max(r.left,row.left)),visible:Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0))/r.width,pointer:getComputedStyle(pop).pointerEvents,imagePointer:pop.querySelector('img')?getComputedStyle(pop.querySelector('img')).pointerEvents:null};
  });
  if(result)results.push(result);
 }
 await page.mouse.move(1,1);console.log('RDH_PREVIEW '+JSON.stringify({label,results}));await fs.writeFile(dir+'/'+label+'.json',JSON.stringify(results,null,2));return results;
}
const good=r=>r.length>0&&r.every(x=>x.overlap<=2&&x.visible>=.85&&x.pointer==='none'&&(!x.imagePointer||x.imagePointer==='none'));
let before,next,changed=false;
async function setCSS(expected,value){await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.css!==expected||c.js!==b.js||c.motd!==b.motd||o.externalcss!==b.externalcss||o.externaljs!==b.externaljs)throw Error('Concurrent change; refusing CSS write');window.socket.emit('setChannelCSS',{css:value});},{expected,value,b:{js:before.js,motd:before.motd,externalcss:before.externalcss,externaljs:before.externaljs}});for(let i=0;i<100;i++){if((await state()).css===value)return;await page.waitForTimeout(250);}throw Error('CSS persistence not confirmed');}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await ready();
 before=await state();assert.ok(auth(before));assert.equal(typeof before.css,'string');await fs.writeFile(dir+'/before.css',before.css);
 const baseline=await inspect('before');assert.ok(baseline.length,'No native previews reproduced');
 let winner=null;
 for(const n of [16,64,112,160,208,256,304]){
  const style=await page.addStyleTag({content:patch(n)});
  try{
   if(!good(await inspect('pilot-'+n+'-1440')))continue;
   await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(300);
   if(good(await inspect('pilot-'+n+'-1024'))){winner=patch(n);break;}
  }finally{await style.evaluate(e=>e.remove());await page.setViewportSize({width:1440,height:1000});}
 }
 if(!winner)throw Error('No tested preview offset passed both viewports; no live changes');
 const original=before.css.replace(/\/\* BEGIN RDH NATIVE PLAYLIST PREVIEW POSITION \*\/[\s\S]*?\/\* END RDH NATIVE PLAYLIST PREVIEW POSITION \*\//g,'').trimEnd();
 next=original+'\n\n'+winner+'\n';await fs.writeFile(dir+'/proposed.css',next);
 if(next!==before.css){await setCSS(before.css,next);changed=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();
 assert.ok(good(await inspect('live-1440')),'Live desktop geometry failed');
 await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(300);assert.ok(good(await inspect('live-1024')),'Live compact geometry failed');
 const after=await state();assert.ok(auth(after));assert.equal(after.css,next);for(const k of ['js','motd','externalcss','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_PREVIEW_RESULT '+JSON.stringify({status:'preview-position-verified',playlistClickBehaviorChanged:false,cssOnly:true,viewports:[1440,1024],queueWrites:0}));
}catch(e){console.log('RDH_PREVIEW_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.css===next)await setCSS(next,before.css)}catch(r){console.log('RDH_PREVIEW_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
