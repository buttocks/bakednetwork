import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
const feeds=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed;
const template=await fs.readFile('tubes/skin-review/starter-skin.css','utf8');
const scope=registry.channels.filter(c=>c.adminVerified);
const batch=Number(process.env.BATCH);
if(!Number.isInteger(batch)||batch<0||batch>=6)throw Error('Invalid batch');
const channels=scope.filter((c,i)=>i%6===batch);
const accent={dg:'#dbad56',dgalt:'#bd8c54',ddt:'#b682e7',joshi:'#db80ad',joshi2:'#aa95e8',puro:'#df585f',ajpw:'#c45a58',noah:'#57b992',indies:'#d2ad6b',shoot:'#c58a5d',boxing:'#e3a253',rizin:'#7cbfcf',sumo:'#cb9f6a',mtv:'#b28be0'};
const protectedChannels=new Set(['rdh','scarytube','wrestling','retrowrestling','wwf-wwe','wcw','wid','njpw','njpwalt','luchatube']);
function baseCss(css){
 const begin='/* BEGIN MANAGED QUEUE ATTRIBUTION */',end='/* END MANAGED QUEUE ATTRIBUTION */';
 const a=css.indexOf(begin),b=css.indexOf(end);
 if(a<0&&b<0)return css.trim();
 if(a<0||b<a||css.indexOf(begin,a+begin.length)>=0||css.indexOf(end,b+end.length)>=0)return css.trim();
 // Ignore only the exact known attribution patch, not arbitrary CSS in markers.
 const inside=css.slice(a+begin.length,b).trim();
 const expected='#queue .qe_blame{float:right!important;margin-left:12px!important;font-size:11px!important;color:inherit!important;opacity:.85;white-space:nowrap}\n#queue .queue_entry::after{content:"";display:table;clear:both}';
 if(inside!==expected)return css.trim();
 return (css.slice(0,a)+css.slice(b+end.length)).trim();
}
function eligible(s,c){
 return !protectedChannels.has(c.toLowerCase())&&typeof s.css==='string'&&!baseCss(s.css)&&!s.externalCss&&!s.externalJs&&!s.js.trim()&&s.rank>=3&&s.connected&&s.loggedIn&&s.username?.toLowerCase()==='buttman-gpt'&&s.channel?.toLowerCase()===c.toLowerCase()&&!s.ignoreCss;
}
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
for(const ch of channels){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const dir='skin-rollout/'+ch.slug;
 await fs.mkdir(dir,{recursive:true});
 let report={channel:ch.slug,status:'unverified',noChangesMade:true};
 const page=await context.newPage();
 const capture=()=>page.evaluate(()=>{
  const c=window.CHANNEL||{},opts=c.opts||{};
  const entries=[...document.querySelectorAll('#queue .queue_entry')].map(el=>{
   const q=window.jQuery(el),m=q.data('media')||{};
   const html=String(m.id||'');
   const src=html.match(/<iframe[^>]*\bsrc=["']([^"']+)["']/i)?.[1]||'';
   return {uid:q.data('uid'),title:String(m.title||''),src};
  });
  return {channel:String(c.name||''),css:typeof c.css==='string'?c.css:null,js:typeof c.js==='string'?c.js:null,motd:c.motd,externalCss:opts.externalcss||'',externalJs:opts.externaljs||'',rank:window.CLIENT?.rank,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,username:window.CLIENT?.name,ignoreCss:!!window.USEROPTS?.ignore_channelcss,entries,playing:window.PL_CURRENT,
    visibleBrokenImages:[...document.querySelectorAll('img')].filter(i=>i.getClientRects().length&&i.complete&&!i.naturalWidth&&i.closest('#motdwrap,nav')).length,
    background:getComputedStyle(document.body).backgroundColor};
 });
 try{
  await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
  const form=page.locator('form[action="/login"]').last();
  await form.locator('input[name="name"]').fill('buttman-gpt');
  await form.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);
  await form.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('https://baked.live/tv/'+ch.slug,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(c=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.name?.toLowerCase()==='buttman-gpt'&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===c.toLowerCase(),ch.slug,{timeout:45000});
  await page.waitForTimeout(5000);
  const before=await capture();
  if(typeof before.css!=='string'||typeof before.js!=='string')throw Error('Skin settings not available');
  const expectedFeeds=feeds.filter(f=>f.tube.toLowerCase()===ch.slug.toLowerCase());
  report={...report,status:'audited',rank:before.rank,cssBytes:Buffer.byteLength(before.css),hasExternalCss:!!before.externalCss,jsBytes:Buffer.byteLength(before.js),hasExternalJs:!!before.externalJs,blankBase:!baseCss(before.css)&&!before.externalCss,visibleBrokenImages:before.visibleBrokenImages,queueItems:before.entries.length,feeds:expectedFeeds.map(f=>({id:f.id,present:before.entries.some(e=>e.src===f.url||e.title===f.title)}))};
  await page.screenshot({path:dir+'/before.png',animations:'disabled',timeout:15000}).catch(()=>{});
  if(!eligible(before,ch.slug)){
   report.status=report.blankBase?'blank-needs-review':'existing-skin-preserved';
   if(protectedChannels.has(ch.slug.toLowerCase()))report.status='protected-existing-channel';
  }else{
   const target=before.css+'\n'+template.replace('__ACCENT__',accent[ch.slug.toLowerCase()]||'#6bbbd1');
   // Original CSS saved before any write. No JS, options or queue write.
   await fs.writeFile(dir+'/before.css',before.css);
   const parsed=await page.evaluate(css=>{try{const sheet=new CSSStyleSheet();sheet.replaceSync(css);return sheet.cssRules.length>10}catch{return false}},target);
   if(!parsed||Buffer.byteLength(target)>20000)throw Error('Starter CSS validation failed');
   const change=async(expected,css)=>{
    await page.evaluate(({expected,css,channel,js,motd,externalCss,externalJs})=>{
     const c=window.CHANNEL,opts=c?.opts||{};
     if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c?.name?.toLowerCase()!==channel.toLowerCase()||c.css!==expected||c.js!==js||c.motd!==motd||(opts.externalcss||'')!==externalCss||(opts.externaljs||'')!==externalJs)throw Error('Concurrent channel change or authentication failure');
     window.socket.emit('setChannelCSS',{css});
    },{expected,css,channel:ch.slug,js:before.js,motd:before.motd,externalCss:before.externalCss,externalJs:before.externalJs});
    for(let i=0;i<60;i++){if((await capture()).css===css)return;await page.waitForTimeout(250)}
    throw Error('CSS persistence not confirmed');
   };
   try{
    await change(before.css,target);
    report.noChangesMade=false;
    const after=await capture();
    if(after.js!==before.js||after.motd!==before.motd||after.externalCss!==before.externalCss||after.externalJs!==before.externalJs)throw Error('Unexpected unrelated skin configuration difference');
    const rendered=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--bn-starter-skin').trim()==='1');
    if(!rendered)throw Error('Starter CSS not rendered');
    await fs.writeFile(dir+'/after.css',target);
    await page.screenshot({path:dir+'/after.png',animations:'disabled',timeout:15000}).catch(()=>{});
    report.status='starter-deployed';
   }catch(e){
    if((await capture()).css===target){await change(target,before.css);report.rolledBack=true;report.noChangesMade=true}
    throw e;
   }
  }
 }catch(e){report.status='unverified';report.error=String(e.message||e).split('\n')[0].slice(0,240)}
 finally{await context.close()}
 reports.push(report);
 console.log('SKIN_ROLLOUT '+JSON.stringify(report));
}
await browser.close();
await fs.writeFile('skin-rollout/results.json',JSON.stringify(reports,null,2));
if(reports.some(r=>r.status==='unverified'))process.exitCode=1;
