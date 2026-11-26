import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-effects-repair-review';await fs.mkdir(dir,{recursive:true});
const oldJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@364c972c0f75249bca4c094b02dc8104e9edff40/tubes/RDH/rdh-custom-only-v1.5.js';
const newJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9502f21f4d6d192d57535fa99e8bb7a62b411935/tubes/RDH/rdh-custom-only-v1.6.js';
const oldCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@956d6239a5de8b860ac34449168ae847676748a2/tubes/RDH/rdh-neon-native.css';
const newCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@ed9464b2f4fe1fee1880d2b1b7648ac7e0d184c3/tubes/RDH/rdh-neon-compact-motd.css';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,current,changes=[];
async function set(field,value){
 const expected=current;
 await page.evaluate(({field,value,e})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.motd!==e.motd||c.css!==e.css||c.js!==e.js||o.externalcss!==e.externalcss||o.externaljs!==e.externaljs)throw Error('Concurrent change; no write');window.socket.emit(field==='motd'?'setMotd':'setOptions',field==='motd'?{motd:value}:{[field]:value});},{field,value,e:expected});
 for(let i=0;i<100;i++){const s=await state();if(s[field]===value){current=s;return}if(field==='motd'&&s.motd!==expected.motd&&await page.evaluate(({a,b})=>{const norm=x=>{const d=new DOMParser().parseFromString(x,'text/html');return [d.body.textContent.replace(/\s+/g,' ').trim(),[...d.querySelectorAll('a[href]')].map(e=>[e.textContent,e.getAttribute('href')]),!!d.querySelector('.rdh-compact-motd'),!!d.querySelector('.rdh-newsletter-controls'),[...d.querySelectorAll('details')].map(e=>e.textContent)]};return JSON.stringify(norm(a))===JSON.stringify(norm(b));},{a:s.motd,b:value})){current=s;return}await page.waitForTimeout(250)}throw Error(field+' persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 before=current=await state();assert.ok(auth(before));assert.equal(before.externaljs,'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@b8779e6d7b6e88fbb0f1d5449ca535cef52160a7/tubes/RDH/rdh-custom-only-v1.7.2.js');assert.equal(before.externalcss,'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@758c572058774b37d96e3b0c23c19585f808c4e7/tubes/RDH/rdh-neon-clean-v1.6.1.css');assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));

 const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@8020d85596366ed686c5ffb55197d1d5c504e99d/tubes/RDH/rdh-neon-effects-v1.7.2.css';
 const response=await page.request.get(candidate);assert.ok(response.ok());await page.addStyleTag({content:await response.text()});await response.dispose();
 const proof=await page.evaluate(()=>{
  const b=document.getElementById('messagebuffer'),fixture=document.createElement('div');fixture.style.cssText='position:absolute;left:-10000px;top:0;pointer-events:none;';b.append(fixture);
  function sample(cls,childClass='channel-emote',first=true){const row=document.createElement('div');fixture.append(row);if(!first)row.append(document.createElement('span'));const wrap=document.createElement('div');wrap.className=cls;wrap.textContent='Test';const img=document.createElement('img');img.className=childClass;img.alt='test';wrap.append(img);row.append(wrap);return {row,wrap,img};}
  const out={};for(const cls of ['spun','d3d','mirror-x','mirror-y','tilt-f','tilt-r','image-blur','image-shake','spin','rainbow','marquee','bounce','spoiler']){const {wrap,img}=sample(cls);const a=getComputedStyle(wrap),c=getComputedStyle(img);out[cls]={animation:a.animationName,imageAnimation:c.animationName,transform:c.transform,filter:a.filter,textShadow:a.textShadow,color:a.color};}
  const m=sample('morph');for(const cls of ['morph-1','morph-2']){const span=document.createElement('span');span.className=cls;m.wrap.append(span);out[cls]=getComputedStyle(span).animationName;}
  fixture.remove();return out;
 });
 assert.equal(proof.spun.imageAnimation,'spunning');assert.notEqual(proof.d3d.textShadow,'none');assert.notEqual(proof['mirror-x'].transform,'none');assert.notEqual(proof['mirror-y'].transform,'none');assert.notEqual(proof['tilt-f'].transform,'none');assert.notEqual(proof['tilt-r'].transform,'none');assert.equal(proof['image-blur'].filter,'blur(5px)');assert.equal(proof['image-shake'].animation,'anim-shake');assert.equal(proof.spin.imageAnimation,'rotate');assert.equal(proof.rainbow.animation,'rainbow');assert.equal(proof.marquee.animation,'marquee');assert.equal(proof.bounce.animation,'bounce');assert.equal(proof['morph-1'],'morph-1');assert.equal(proof['morph-2'],'morph-2');assert.equal(proof.spoiler.color,'rgba(0, 0, 0, 0)');
 console.log('RDH_EFFECTS_REPAIR_PILOT '+JSON.stringify(proof));
 await set('externalcss',candidate);changes.push('externalcss');
 const after=await state();assert.ok(auth(after));assert.equal(after.externalcss,candidate);for(const k of ['js','css','motd','externaljs'])assert.equal(after[k],before[k]);
 console.log('RDH_EFFECTS_REPAIR_RESULT '+JSON.stringify({status:'saved',proof,jsPreserved:true,motdPreserved:true,filtersUntouched:true,reloads:0,playlistWrites:0}));
}catch(e){console.log('RDH_EFFECTS_REPAIR_ERROR '+e.message);try{for(const field of changes.reverse()){const s=await state();if(!auth(s)||s[field]!==current[field])throw Error('Concurrent change prevents rollback');await set(field,before[field]);}}catch(r){console.log('RDH_EFFECTS_REPAIR_ROLLBACK_BLOCKED '+r.message)}throw e;}finally{await browser.close();}
