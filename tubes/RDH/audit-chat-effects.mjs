import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-effects-audit-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const scripts=new Map();
page.on('response',r=>{try{const u=new URL(r.url());if(r.request().resourceType()==='script'&&u.origin==='https://baked.live'&&r.ok())scripts.set(u.pathname,r);}catch{}});
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CLIENT?.name?.toLowerCase()==='buttman-gpt'&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 const filters=await page.evaluate(()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Filter request timed out')),15000);socket.once('chatFilters',x=>{clearTimeout(timer);Array.isArray(x)?resolve(x):reject(Error('Invalid filter response'))});socket.emit('requestChatFilters')}));
 await fs.writeFile(dir+'/chat-filters.json',JSON.stringify(filters,null,2));
 const inventory=await page.evaluate(filters=>filters.map(f=>{const html=String(f.replace||f.replacement||'');const doc=new DOMParser().parseFromString(html,'text/html');return {name:f.name,active:f.active,filterlinks:f.filterlinks,tags:[...new Set([...doc.body.querySelectorAll('*')].map(e=>e.tagName.toLowerCase()))],classes:[...new Set([...doc.body.querySelectorAll('[class]')].flatMap(e=>[...e.classList]))],dataAttributes:[...new Set([...doc.body.querySelectorAll('*')].flatMap(e=>[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name)))],media:/<img|<video|<audio|<iframe|webm|sound-embed|spoiler/i.test(html)};}),filters);
 console.log('RDH_FILTER_INVENTORY '+JSON.stringify(inventory));

 const cssUrl=await page.evaluate(()=>CHANNEL.opts.externalcss);
 const response=await page.request.get(cssUrl,{timeout:20000});assert.ok(response.ok());const css=await response.text();await response.dispose();
 await page.addStyleTag({content:css});
 const result=await page.evaluate(async inventory=>{
  const b=document.getElementById('messagebuffer');
  const classes=[...new Set(inventory.filter(f=>f.active).flatMap(f=>f.classes))].filter(x=>/^[a-z][a-z0-9-]+$/i.test(x));
  const props=['transform','filter','animationName','animationDuration','textShadow','color','backgroundColor','display','fontWeight','visibility','opacity'];
  const parent=d=>Object.fromEntries(props.map(k=>[k,getComputedStyle(d)[k]]));
  const pseudo=(e,which)=>{const s=getComputedStyle(e,which);return {content:s.content,backgroundImage:s.backgroundImage,animation:s.animationName}};
  const rows=document.createElement('div');rows.id='rdh-effect-audit';rows.style.cssText='position:absolute;left:-10000px;top:0;pointer-events:none;';b.append(rows);
  const mk=cls=>{const el=document.createElement('span');el.className=cls;el.textContent='Sample';const img=document.createElement('img');img.className='channel-emote';img.alt='test';img.width=32;img.height=32;el.append(img);rows.append(el);return {el,img}};
  const plain=mk('');const baseline={wrap:parent(plain.el),image:parent(plain.img)};
  const out=[];
  for(const cls of classes){const {el,img}=mk(cls);const styles={wrap:parent(el),image:parent(img)};const changed={};for(const part of ['wrap','image'])for(const k of props)if(styles[part][k]!==baseline[part][k])changed[part+'.'+k]=styles[part][k];out.push({cls,changed,before:pseudo(el,'::before'),after:pseudo(el,'::after')});el.remove();}
  rows.remove();
  const controls=['#cinematoggle','#skinnytoggle','#chatline','.pm-input'].map(s=>({selector:s,exists:!!document.querySelector(s)}));
  return {effects:out,controls,rank:CLIENT.rank,customLoaded:!!window.__rdhCustomOnly?.ready,legacyActive:!!CLIENT.modules,inlineCssLength:CHANNEL.css?.length||0,externalCss:CHANNEL.opts.externalcss,externalJs:CHANNEL.opts.externaljs};
 },inventory);
 await fs.writeFile(dir+'/effects.json',JSON.stringify(result,null,2));
 console.log('RDH_EFFECTS_AUDIT '+JSON.stringify(result));
 console.log('RDH_EFFECTS_RESULT '+JSON.stringify({filters:inventory.length,active:inventory.filter(f=>f.active).length,effects:result.effects.length,configWrites:0,chatSent:0,playlistWrites:0,reloads:0,note:'Computed-style fixtures; nested variants and actual animations not fully proven'}));
}finally{await browser.close();}
