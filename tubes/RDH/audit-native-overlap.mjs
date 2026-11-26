import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-native-overlap-review';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,250)));
const scriptRequests=[];page.on('response',r=>{if(r.request().resourceType()==='script')scriptRequests.push({url:r.url().split('?')[0],status:r.status()});});
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 await page.waitForTimeout(2500);
 const capture=()=>page.evaluate(()=>{
  const w=window,c=w.CHANNEL||{},o=c.opts||{},$=w.jQuery;
  const selectors=['#videocontrols','#playlistcontrols','#plcontrols','#plcontrol','#queuecontrols','#chatcontrols','#rightpane','#leftpane'];
  const controls=[...document.querySelectorAll('button,a.btn,[role="button"]')].filter(e=>!e.closest('#queue,#messagebuffer,#userlist,.modal')&&e.getClientRects().length).map(e=>({id:e.id,classes:String(e.className),text:e.textContent.trim().slice(0,70),title:e.title,aria:e.getAttribute('aria-label'),parent:e.parentElement?.id||String(e.parentElement?.className||''),icons:[...e.querySelectorAll('.glyphicon')].map(i=>i.className),handlers:Object.entries(($&&$._data(e,'events'))||{}).filter(([k])=>/click/.test(k)).flatMap(([k,v])=>v.map(h=>({ns:h.namespace,fn:String(h.handler).slice(0,400)})))}));
  const scroll=controls.filter(x=>/scroll|current|hand-right|hand-left|screenshot|time estimate/i.test([x.id,x.title,x.aria,x.text,x.icons.join(' ')].join(' ')));
  return {channel:c.name,rank:w.CLIENT?.rank,externalJs:o.externaljs,externalCss:o.externalcss,css:c.css||'',js:c.js||'',legacyModules:w.CLIENT?.modules?Object.keys(w.CLIENT.modules.modules||{}):[],legacyOptions:w.CLIENT?.modules?.options?.playlist||null,nativeRows:document.querySelectorAll('#queue .qe_title[role="button"]').length,tagged:document.querySelectorAll('#queue .rdh-featured').length,showClassifier:!!w.__rdhShowTagsCompat?.started,legacyScrollBtn:document.querySelectorAll('#scroll-btn').length,scroll,controls,regions:selectors.map(s=>({selector:s,exists:!!document.querySelector(s)})),approval:[...document.querySelectorAll('.modal.in')].map(e=>({title:e.querySelector('.modal-title')?.textContent?.trim(),buttons:[...e.querySelectorAll('button,a.btn')].map(b=>b.textContent.trim()).slice(0,15)})),ignoreChannelJs:!!w.USEROPTS?.ignore_channeljs};
 });
 const live=await capture();assert.equal(live.channel.toLowerCase(),'rdh');await fs.writeFile(dir+'/live.css',live.css);await fs.writeFile(dir+'/live.js',live.js);
 // The live source files are only kept in the existing restricted-duration review artifact.
 const {css,js,...summary}=live;
 console.log('RDH_OVERLAP_LIVE '+JSON.stringify({...summary,inlineBytes:js.length,inlineHasClassifier:js.includes('__rdhShowTagsCompat')}));
 if(/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/.test(live.externalJs||'')){
  const r=await page.request.get('https://baked.live'+live.externalJs,{timeout:20000});assert.ok(r.ok());const body=await r.text();await r.dispose();await fs.writeFile(dir+'/native-loader.js',body);
  const needles=['scroll-btn','scrollQueue','makeQueueEntry','addQueueButtons','playlist-thumbnail','native-playlist','rdh-featured','CLIENT.modules','pink.horse','module_playlist','getScript','rdh-modern'];
  console.log('RDH_OVERLAP_LOADER '+JSON.stringify({bytes:body.length,matches:needles.map(n=>({name:n,count:body.split(n).length-1,examples:body.includes(n)?[body.slice(Math.max(0,body.indexOf(n)-100),body.indexOf(n)+150)]:[]}))}));
 }
 // Compare the live page with the identical stored inline script executed only in this isolated diagnostic tab.
 // No browser trust setting, channel configuration, or playlist content is changed.
 if(js.trim()&&js.includes('__rdhShowTagsCompat')&&!live.showClassifier){try{new Function(js);await page.evaluate(s=>{(0,eval)(s)},js);await page.waitForTimeout(1500);const x=await capture();console.log('RDH_OVERLAP_PILOT '+JSON.stringify({scroll:x.scroll,legacyModules:x.legacyModules,legacyScrollBtn:x.legacyScrollBtn,tagged:x.tagged,showClassifier:x.showClassifier,nativeRows:x.nativeRows}));}catch(e){console.log('RDH_OVERLAP_PILOT_ERROR '+e.message);}}
 await fs.writeFile(dir+'/inventory.json',JSON.stringify({summary,scriptRequests,errors},null,2));
 console.log('RDH_OVERLAP_RESULT '+JSON.stringify({status:'read-only-audit',writes:0,scriptRequests:scriptRequests.filter(x=>/channel-loader|bakednetwork|pink.horse/i.test(x.url)),errors}));
}finally{await browser.close();}
