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
 const links=await p.evaluate(html=>{
  const d=new DOMParser().parseFromString(html,'text/html'),menus=[...d.querySelectorAll('.wts-bar>details,.wt-info-bar>details')];
  if(menus.length!==4)throw Error('Unexpected menu count');
  const menu=menus.find(x=>/^(Community & Help|Network Links)$/.test(x.querySelector('summary')?.textContent.trim()));
  if(!menu)throw Error('Community menu missing');
  return [...menu.querySelectorAll('a[href]')].map(a=>({label:a.textContent.trim(),url:a.getAttribute('href')}));
 },before.motd);
 const discord=[];
 for(const l of links){try{const u=new URL(l.url,'https://baked.live');const m=u.hostname==='discord.gg'?u.pathname.match(/^\/([a-zA-Z0-9-]+)\/?$/):u.hostname==='discord.com'?u.pathname.match(/^\/invite\/([a-zA-Z0-9-]+)\/?$/):null;if(!m)continue;const response=await p.request.get('https://discord.com/api/v10/invites/'+m[1],{timeout:10000});if(response.ok()){const j=await response.json();if(j.code===m[1]&&j.guild?.name)discord.push({label:'Discord',url:'https://discord.gg/'+m[1]})}await response.dispose()}catch{}}
 const proposed=await p.evaluate(({html,discord})=>{
  const d=new DOMParser().parseFromString(html,'text/html'),menus=[...d.querySelectorAll('.wts-bar>details,.wt-info-bar>details')];
  const menu=menus.find(x=>/^(Community & Help|Network Links)$/.test(x.querySelector('summary')?.textContent.trim()));
  const body=menu.querySelector('.wts-panel,.wt-info-panel');if(!body)throw Error('Community panel missing');
  menu.querySelector('summary').textContent='Network Links';
  const links=[{label:"Real Dad's Hideout",url:'https://baked.live/tv/RDH'},{label:'Register an account',url:'https://baked.live/register'},...discord.slice(0,1)];
  const ul=d.createElement('ul');ul.style.margin='0';ul.style.paddingLeft='21px';
  for(const item of links){const li=d.createElement('li'),a=d.createElement('a');a.href=item.url;a.textContent=item.label;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li)}
  body.replaceChildren(ul);return {html:d.body.innerHTML,links};
 },{html:before.motd,discord});
 const nextJs=before.js.includes('window.__wtExclusiveMotd=true')?before.js:before.js.trimEnd()+'\n\n'+helper;
 assert.ok(Buffer.byteLength(nextJs)<=20000,'Existing script too large; no write');new Function(nextJs);
 await fs.writeFile(dir+'/proposed-motd.html',proposed.html);
 await fs.writeFile(dir+'/proposed.js',nextJs);
 const signature=html=>p.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('.wts-bar>details,.wt-info-bar>details')].map(e=>({title:e.querySelector('summary')?.textContent.trim(),text:e.textContent.replace(/\s+/g,' ').trim(),links:[...e.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}))},html);
 const oldSignature=await signature(before.motd),newSignature=await signature(proposed.html);assert.deepEqual(newSignature.slice(0,3),oldSignature.slice(0,3));assert.equal(newSignature[3].title,'Network Links');
 const group=p.locator(selector);
 const original=await p.locator('#motd').evaluate((e,html)=>{const prev=e.innerHTML;e.innerHTML=html;return prev},proposed.html);
 await p.evaluate(source=>{(0,eval)(source)},helper);
 async function test(){await group.evaluateAll(es=>es.forEach(e=>e.open=false));for(const i of [0,1,2,3,0,3]){await group.nth(i).locator('summary').click();await p.waitForFunction(({selector,i})=>[...document.querySelectorAll(selector)].every((e,j)=>e.open===(i===j)),{selector,i},{timeout:3000})}await group.nth(3).locator('summary').click();await p.waitForFunction(selector=>[...document.querySelectorAll(selector)].every(e=>!e.open),selector,{timeout:3000})}
 await test();await p.setViewportSize({width:390,height:844});await test();await p.setViewportSize({width:1440,height:1000});await p.locator('#motd').evaluate((e,html)=>e.innerHTML=html,original);
 console.log('WT_MENU_PILOT '+JSON.stringify({slug,previousLinks:links,links:proposed.links,discordVerified:discord.length>0,desktop:true,mobile:true,otherPanelsPreserved:true}));
 async function save(field,value){
  const expected=current;
  await p.evaluate(({slug,field,value,expected})=>{const c=CHANNEL,o=c.opts||{};if(!socket.connected||!CLIENT.logged_in||CLIENT.rank<3||CLIENT.name?.toLowerCase()!=='buttman-gpt'||c.name.toLowerCase()!==slug.toLowerCase()||c.motd!==expected.motd||c.js!==expected.js||c.css!==expected.css||(o.externaljs||'')!==expected.externalJs||(o.externalcss||'')!==expected.externalCss)throw Error('Concurrent change; refusing write');socket.emit(field==='motd'?'setMotd':'setChannelJS',{[field]:value})},{slug,field,value,expected});
  for(let i=0;i<100;i++){const x=await state();if(x[field]===value||field==='motd'&&x.motd!==expected.motd&&JSON.stringify(await signature(x.motd))===JSON.stringify(await signature(value))){current=x;return}await p.waitForTimeout(250)}throw Error('Save not confirmed: '+field)
 }
 try{
  if(nextJs!==before.js){await save('js',nextJs);changed.push('js')}
  if(proposed.html!==before.motd){await save('motd',proposed.html);changed.push('motd')}
  const after=await state();assert.equal(after.js,nextJs);assert.deepEqual(await signature(after.motd),newSignature);assert.equal(after.css,before.css);assert.equal(after.externalJs,before.externalJs);assert.equal(after.externalCss,before.externalCss);
  console.log('WT_MENU_RESULT '+JSON.stringify({slug,status:'saved',links:proposed.links,otherPanelsPreserved:true,cssPreserved:true,existingJsPreserved:true,playlistWrites:0,reloads:0,visitorApprovalMayBeRequired:true}));
 }catch(e){for(const field of changed.reverse())try{await save(field,before[field])}catch(err){console.log('WT_MENU_ROLLBACK_BLOCKED '+err.message);break}throw e}
}finally{await browser.close()}
