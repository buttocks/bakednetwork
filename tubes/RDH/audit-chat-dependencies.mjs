import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-chat-dependencies-review';await fs.mkdir(dir,{recursive:true});
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
 const needles=['sound-embed','image-spoiler','image-embed-small','image-embed-medium','image-embed-large','img.webm','parse_VideoEmbeds','parse_SoundEmbeds','data-spoiled','data-params','media-embed','addChatMessage','formatChatMessage','server-whisper'];
 const native=[];
 for(const [path,response] of scripts){if(/channel-loaders|jquery|bootstrap/i.test(path))continue;try{const code=await response.text();if(code.length>6000000)continue;const matches=needles.filter(n=>code.includes(n));if(matches.length)native.push({path,bytes:code.length,matches});}catch{}}
 const runtime=await page.evaluate(()=>({channel:CHANNEL.name,externaljs:CHANNEL.opts.externaljs,externalcss:CHANNEL.opts.externalcss,inlineJsBytes:CHANNEL.js?.length||0,legacyActive:!!CLIENT.modules,renderer:typeof addChatMessage,existingMedia:[...document.querySelectorAll('#messagebuffer img.webm,#messagebuffer video,#messagebuffer audio,#messagebuffer .sound-embed,#messagebuffer .image-spoiler,#messagebuffer .image-embed-small')].map(e=>({tag:e.tagName,classes:e.className,controls:e.controls??null})).slice(0,30),nativeFunctions:Object.keys(window).filter(k=>/embed|spoiler|chatmessage|filter/i.test(k)&&typeof window[k]==='function').slice(0,100)}));
 console.log('RDH_NATIVE_MEDIA_SOURCE '+JSON.stringify(native));console.log('RDH_MEDIA_RUNTIME '+JSON.stringify(runtime));
 // Local renderer-only probes. No messages are sent, no remote media URLs
 // are requested, and no channel configuration is changed.
 const probes=await page.evaluate(async()=>{
  const b=document.getElementById('messagebuffer');const before=new Set(b.children);const key='RDH_LOCAL_AUDIT';
  const sample='<span id="rdh-audit-image"><img class="image-embed-small" alt="test"></span><span id="rdh-audit-video"><img class="webm" data-params="" alt="test"></span><span id="rdh-audit-sound" class="sound-embed" data-path="" data-proto=""></span><span id="rdh-audit-spoiler"><img class="image-spoiler" data-spoiled="false" alt="test"></span>';
  window.addChatMessage({time:Date.now(),username:'[server]',msg:sample,meta:{shadow:false,addClass:'',addClassToNameAndTimestamp:false}});
  await new Promise(r=>setTimeout(r,800));
  const inserted=[...b.children].filter(e=>!before.has(e)&&e.querySelector('[id^="rdh-audit-"]'));
  const out={image:!!b.querySelector('#rdh-audit-image img'),video:!!b.querySelector('#rdh-audit-video video')||inserted.some(e=>e.querySelector('video.webm')),videoPlaceholder:!!b.querySelector('#rdh-audit-video img.webm'),sound:!!b.querySelector('#rdh-audit-sound audio'),soundButton:!!b.querySelector('#rdh-audit-sound button'),spoiler:!!b.querySelector('#rdh-audit-spoiler img.image-spoiler'),note:'Markup-only local probe; socket-event-driven renderers and actual playback not proven'};
  for(const e of inserted)e.remove();return out;
 });
 await fs.writeFile(dir+'/inventory.json',JSON.stringify({inventory,native,runtime,probes},null,2));
 console.log('RDH_CHAT_DEPENDENCY_RESULT '+JSON.stringify({filters:inventory.length,active:inventory.filter(f=>f.active).length,media:inventory.filter(f=>f.media).length,probes,configurationWrites:0,chatSent:0,playlistWrites:0,reloads:0}));
}finally{await browser.close();}
