import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='roh-skin-review';await fs.mkdir(dir,{recursive:true});
const feed=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed.find(x=>x.id==='roh-baked-tv');
assert.ok(feed);
const template=await fs.readFile('tubes/ROH/skin.css','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const capture=()=>page.evaluate(()=>{
 const c=window.CHANNEL||{},o=c.opts||{};
 const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{
  const q=window.jQuery(el),m=q.data('media')||{};const t=document.createElement('textarea');t.innerHTML=String(m.meta?.embed?.src||'');return {uid:q.data('uid'),title:String(m.title||''),src:t.value};
 });
 const logo=[...document.querySelectorAll('#motdwrap img')].filter(i=>i.complete&&i.naturalWidth>0&&i.getClientRects().length).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];
 const bounds=logo?.getBoundingClientRect();
 return {name:c.name,css:c.css,js:c.js,motd:c.motd,externalCss:o.externalcss||'',externalJs:o.externaljs||'',rank:window.CLIENT?.rank,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,user:window.CLIENT?.name,entries,playing:window.PL_CURRENT,logo:logo?{src:logo.getAttribute('src'),naturalWidth:logo.naturalWidth,width:bounds.width,height:bounds.height}:null,headerHeight:document.querySelector('#motdwrap')?.getBoundingClientRect().height,marker:getComputedStyle(document.documentElement).getPropertyValue('--bn-roh-skin').trim(),visible:Object.fromEntries(['#videowrap','#messagebuffer','#queue'].map(q=>[q,!!document.querySelector(q)?.getClientRects().length]))};
});
const auth=s=>s.connected&&s.loggedIn&&s.user?.toLowerCase()==='buttman-gpt'&&s.rank>=3&&s.name?.toLowerCase()==='roh';
const hasFeed=s=>s.entries.some(e=>e.src===feed.url);
let before,target;
async function set(expected,css){
 await page.evaluate(({expected,css,prior})=>{
 const c=window.CHANNEL,o=c?.opts||{};
 if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!=='roh'||c.css!==expected||c.js!==prior.js||c.motd!==prior.motd||(o.externalcss||'')!==prior.externalCss||(o.externaljs||'')!==prior.externalJs)throw Error('Concurrent change or auth failure');
 window.socket.emit('setChannelCSS',{css});
 },{expected,css,prior:{js:before.js,motd:before.motd,externalCss:before.externalCss,externalJs:before.externalJs}});
 for(let i=0;i<80;i++){if((await capture()).css===css)return;await page.waitForTimeout(250)}
 throw Error('CSS persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/roh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='roh',{timeout:45000});
 await page.waitForTimeout(5500);
 before=await capture();assert.ok(auth(before));assert.equal(typeof before.css,'string');assert.equal(typeof before.js,'string');assert.ok(!before.externalCss,'External CSS needs separate review');assert.ok(hasFeed(before),'Permanent stream missing');assert.ok(before.logo?.src&&before.logo.naturalWidth>100,'Existing logo unavailable');
 await fs.writeFile(dir+'/before.css',before.css);await fs.writeFile(dir+'/before-motd.html',before.motd||'');await page.screenshot({path:dir+'/before.png',fullPage:true});
 const logoSelector='#motdwrap img[src='+JSON.stringify(before.logo.src)+']';
 const block=template.replaceAll('__ROH_LOGO__',logoSelector);
 const clean=before.css.replace(/\/\* BEGIN BAKED NETWORK ROH SKIN v1 \*\/[\s\S]*?\/\* END BAKED NETWORK ROH SKIN v1 \*\//g,'').trimEnd();
 target=clean+'\n\n'+block;
 assert.ok(Buffer.byteLength(target)<20000,'CSS size limit');
 assert.ok(await page.evaluate(css=>{try{const s=new CSSStyleSheet();s.replaceSync(css);return s.cssRules.length>20}catch{return false}},block));
 await fs.writeFile(dir+'/proposed.css',target);
 if(before.css!==target)await set(before.css,target);
 await page.waitForTimeout(2000);
 const after=await capture();assert.ok(auth(after));assert.equal(after.css,target);assert.equal(after.marker,'1');assert.equal(after.js,before.js);assert.equal(after.motd,before.motd);assert.equal(after.externalCss,before.externalCss);assert.equal(after.externalJs,before.externalJs);assert.ok(hasFeed(after));assert.deepEqual(after.entries.map(e=>e.uid),before.entries.map(e=>e.uid));assert.ok(Object.values(after.visible).every(Boolean));assert.ok(after.logo?.naturalWidth&&after.logo.src===before.logo.src&&after.logo.width>50&&after.logo.height<=130);assert.ok(after.headerHeight<=before.headerHeight+5);
 await page.screenshot({path:dir+'/after.png',fullPage:true});
 const report={channel:'roh',status:'skin-upgraded',logoPreserved:true,logoBefore:before.logo.height,logoAfter:after.logo.height,headerBefore:before.headerHeight,headerAfter:after.headerHeight,queueItems:after.entries.length,queuePreserved:true,streamPresent:true,jsPreserved:true,motdPreserved:true,visible:after.visible,cssBytes:Buffer.byteLength(target)};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('ROH_SKIN '+JSON.stringify(report));
}catch(e){
 if(before&&target&&target!==before.css&&(await capture()).css===target){await set(target,before.css);console.log('ROH_SKIN_ROLLBACK confirmed')}
 throw e;
}finally{await browser.close()}
