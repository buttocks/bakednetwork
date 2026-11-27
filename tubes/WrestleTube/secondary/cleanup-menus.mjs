import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const allowed=['Wrestling','wrestling2','wrestling3','Wrestling4','wrestling5'];
const slug=process.env.TUBE;assert.ok(allowed.includes(slug));
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));assert.ok(registry.channels.some(c=>c.slug===slug&&c.adminVerified));
const dir='wt-menu-cleanup-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1440,height:1000}});
let before,current;const changed=[];
try{
 await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
 await p.goto('https://baked.live/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),slug,{timeout:45000});
 await p.waitForTimeout(4500);


 const state=()=>p.evaluate(()=>{const c=CHANNEL,o=c.opts||{};return {channel:c.name,rank:CLIENT.rank,connected:!!socket.connected,motd:c.motd,js:c.js,css:c.css,externalJs:o.externaljs||'',externalCss:o.externalcss||''}});
 before=current=await state();assert.equal(before.channel.toLowerCase(),slug.toLowerCase());assert.ok(before.connected&&before.rank>=3);
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const selector='#motd .wts-bar>details,#motd .wt-info-bar>details';
 const helper=await fs.readFile('tubes/shared/wrestling/motd-accordion.js','utf8');new Function(helper);
 const proposed=await p.evaluate(html=>{
 const d=new DOMParser().parseFromString(html,'text/html'),menus=[...d.querySelectorAll('.wts-bar>details,.wt-info-bar>details')];
 const label=e=>e.querySelector('summary')?.textContent.trim();
 const remove=menus.filter(e=>/^(Community & Help|Network Links)$/.test(label(e)));
 const keep=menus.filter(e=>!remove.includes(e));
 if(JSON.stringify(keep.map(label))!==JSON.stringify(['House Rules','Playlist & Playback','Chat Tools'])||remove.length>1)throw Error('Unexpected menu structure');
 remove.forEach(e=>e.remove());return {html:d.body.innerHTML,removed:remove.map(label)};
 },before.motd);
 const nextJs=before.js.includes('window.__wtExclusiveMotd=true')?before.js:before.js.trimEnd()+'\n\n'+helper;
 assert.ok(Buffer.byteLength(nextJs)<=20000,'Existing script too large; no write');new Function(nextJs);
 await fs.writeFile(dir+'/proposed-motd.html',proposed.html);
 await fs.writeFile(dir+'/proposed.js',nextJs);
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('.wts-bar>details,.wt-info-bar>details')].map(e=>({title:e.querySelector('summary')?.textContent.trim(),text:e.textContent.replace(/\s+/g,' ').trim(),links:[...e.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}))},html);
 const oldSignature=await signature(before.motd),newSignature=await signature(proposed.html);assert.deepEqual(newSignature,oldSignature.filter(e=>!['Community & Help','Network Links'].includes(e.title)));assert.equal(newSignature.length,3);
 const group=p.locator(selector);
 const original=await p.locator('#motd').evaluate((e,html)=>{const prev=e.innerHTML;e.innerHTML=html;return prev},proposed.html);
 await p.evaluate(source=>{(0,eval)(source)},helper);
 async function test(){await group.evaluateAll(es=>es.forEach(e=>e.open=false));for(const i of [0,1,2,0,2]){await group.nth(i).locator('summary').click();await p.waitForFunction(({selector,i})=>[...document.querySelectorAll(selector)].every((e,j)=>e.open===(i===j)),{selector,i},{timeout:3000})}await group.nth(2).locator('summary').click();await p.waitForFunction(selector=>[...document.querySelectorAll(selector)].every(e=>!e.open),selector,{timeout:3000})}
 await test();await p.setViewportSize({width:390,height:844});await test();await p.setViewportSize({width:1440,height:1000});await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,original);
 console.log('WT_MENU_PILOT '+JSON.stringify({slug,removed:proposed.removed,menuCount:3,desktop:true,mobile:true,otherPanelsPreserved:true}));
 async function save(field,value){
  const expected=current;
  await p.evaluate(({slug,field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!==slug.toLowerCase()||c.motd!==expected.motd||c.js!==expected.js||c.css!==expected.css||(o.externaljs||'')!==expected.externalJs||(o.externalcss||'')!==expected.externalCss)throw Error('Concurrent change; refusing write');socket.emit(field==='motd'?'setMotd':'setChannelJS',{[field]:value})},{slug,field,value,expected});
  for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)
 }
 try{
  if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}
  if(proposed.html!==before.motd){await save('motd',proposed.html);changed.push('motd')}
  const after=await state();assert.equal(after.js,nextJs);assert.deepEqual(await signature(after.motd),newSignature);assert.equal(after.css,before.css);assert.equal(after.externalJs,before.externalJs);assert.equal(after.externalCss,before.externalCss);
  console.log('WT_MENU_RESULT '+JSON.stringify({slug,status:'saved',removed:proposed.removed,menuCount:3,otherPanelsPreserved:true,cssPreserved:true,existingJsPreserved:true,playlistWrites:0,reloads:0,visitorApprovalMayBeRequired:true}));
 }catch(e){for(const field of changed.reverse())try{await save(field,before[field])}catch(err){console.log('WT_MENU_ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
