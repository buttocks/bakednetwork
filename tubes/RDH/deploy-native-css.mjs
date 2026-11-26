import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-native-css-review';await fs.mkdir(dir,{recursive:true});
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

const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/RDH/rdh-neon.css';
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@956d6239a5de8b860ac34449168ae847676748a2/tubes/RDH/rdh-neon-native.css';
let before,changed=false;
async function setExternal(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||o.externalcss!==expected||c.css!==b.css||c.js!==b.js||c.motd!==b.motd||o.externaljs!==b.externaljs)throw Error('Concurrent channel change; refusing write');window.socket.emit('setOptions',{externalcss:value});},{expected,value,b:before});
 for(let i=0;i<100;i++){if((await state()).externalcss===value)return;await page.waitForTimeout(250)}throw Error('External CSS change not confirmed');
}
async function themeProof(){return page.evaluate(()=>{
 const queue=document.querySelector('#queue'), row=document.createElement('li');row.className='queue_entry rdh-featured rdh-featured-wor queue_active';row.style.visibility='hidden';const title=document.createElement('span');title.className='qe_title';title.textContent='WOR test fixture';row.append(title);queue.append(row);
 try{return {badge:getComputedStyle(row,'::before').content,active:getComputedStyle(row,'::after').content,color:getComputedStyle(title).color,background:getComputedStyle(row).backgroundImage,nativeScroll:!!document.querySelector('#native-queue-current'),oldScroll:!!document.querySelector('#scroll-btn'),rows:queue.querySelectorAll('.queue_entry').length-1};}finally{row.remove();}
});}
async function checks(label){await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(200);const theme=await themeProof(),desktop=await inspect(label+'-1440');await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(300);const compact=await inspect(label+'-1024');console.log('RDH_CSS_CHECK '+JSON.stringify({label,theme,desktopPassed:good(desktop),compactPassed:good(compact)}));return {theme,desktop:good(desktop),compact:good(compact)};}
const pass=x=>x.desktop&&x.compact&&x.theme.badge==='"WOR"'&&x.theme.nativeScroll&&!x.theme.oldScroll&&x.theme.rows>0;
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await ready();before=await state();assert.ok(auth(before));assert.equal(before.externalcss,old,'Unexpected live stylesheet; no changes');assert.equal(before.js,'','Inline JS changed unexpectedly');assert.ok(before.externaljs.includes('rdh-custom-only.js'),'Unexpected JS');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const response=await page.request.get(candidate,{timeout:25000});assert.ok(response.ok(),'Candidate stylesheet unavailable');const css=await response.text();await response.dispose();assert.ok(css.includes('rdh-featured-wor')&&!css.includes('rdh-legacy-embiggen'),'Candidate mismatch');
 const baseline=await checks('baseline');
 // Substitute only the old external stylesheet in the diagnostic tab before touching channel configuration.
 let intercepted=0;await page.route(old,route=>{intercepted++;return route.fulfill({status:200,contentType:'text/css',body:css,headers:{'access-control-allow-origin':'*'}});});
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();assert.ok(intercepted,'Could not verify stylesheet substitution; no changes');
 const pilot=await checks('pilot');assert.ok(pass(pilot),'Pilot geometry or theme failed; no changes');for(const k of ['badge','active','color','background'])assert.equal(pilot.theme[k],baseline.theme[k],k+' theme changed');
 await page.unroute(old);await setExternal(old,candidate);changed=true;
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});await ready();const live=await checks('live');assert.ok(pass(live),'Live CSS verification failed');const after=await state();assert.ok(auth(after));assert.equal(after.externalcss,candidate);for(const k of ['js','css','motd','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_NATIVE_CSS_RESULT '+JSON.stringify({status:'verified',theme:live.theme,viewports:[1440,1024],localCssPreserved:true,jsPreserved:true,playlistWrites:0,rollback:old}));
}catch(e){console.log('RDH_NATIVE_CSS_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.externalcss===candidate)await setExternal(candidate,old)}catch(r){console.log('RDH_NATIVE_CSS_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
