import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
const allow=new Set(['luchatube','njpw','retrowrestling','wwf-wwe','wcw','joshi','puro','wrestling2','indies','shoot','wrestling3','wrestling4','dgalt','dg','wrestling5','njpwalt','nwa-tna','joshi2','ddt']);
const scope=registry.channels.filter(c=>c.adminVerified&&allow.has(c.slug.toLowerCase()));
const batch=Number(process.env.BATCH);
if(!Number.isInteger(batch)||batch<0||batch>=4)throw Error('Invalid batch');
const channels=scope.filter((c,i)=>i%4===batch);
const feeds=JSON.parse(await fs.readFile('tubes/feeds/managed.json','utf8')).managed;
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
await fs.mkdir('motd-audit',{recursive:true});
try{
 for(const ch of channels){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const p=await ctx.newPage();let report={channel:ch.slug,status:'unverified',noWrites:true};
  try{
   await p.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
   const f=p.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await p.waitForLoadState('domcontentloaded');
   await p.goto('https://baked.live/tv/'+ch.slug,{waitUntil:'domcontentloaded',timeout:45000});
   await p.waitForFunction(slug=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.name?.toLowerCase()==='buttman-gpt'&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()===slug.toLowerCase(),ch.slug,{timeout:45000});
   await p.waitForTimeout(4500);
   const x=await p.evaluate(()=>{
    const root=document.querySelector('#motdwrap'),m=document.querySelector('#motd'),r=root?.getBoundingClientRect();
    const clean=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,100);
    const vis=e=>!!e.getClientRects().length&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
    const q=[...document.querySelectorAll('#queue .queue_entry')].map(e=>{const jq=window.jQuery(e),a=jq.data('media')||{},t=document.createElement('textarea');t.innerHTML=String(a.meta?.embed?.src||'');return {src:t.value}});
    if(!m||!root)throw Error('MOTD DOM unavailable');
    return {headerHeight:Math.round(r?.height||0),motdBytes:typeof window.CHANNEL.motd==='string'?window.CHANNEL.motd.length:null,
      buttons:[...m.querySelectorAll('button,a[data-toggle="modal"],summary')].filter(vis).map(e=>({label:clean(e.textContent),kind:e.tagName,modal:e.matches('[data-toggle="modal"]')})),
      modals:[...m.querySelectorAll('.modal')].map(e=>clean(e.querySelector('.modal-title')?.textContent)),
      images:[...m.querySelectorAll('img')].filter(e=>vis(e)&&!e.closest('.modal')).map(e=>({loaded:e.complete&&e.naturalWidth>0,width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height),alt:clean(e.alt)})),
      openPanels:[...m.querySelectorAll('details[open]')].length,
      rulesDropdown:[...m.querySelectorAll('summary')].some(e=>/rules/i.test(e.textContent)),
      networkBrand:/the baked network['’]s/i.test(m.textContent),
      queue:q.length,feedUrls:q.map(a=>a.src),
      visible:['#videowrap','#messagebuffer','#queue'].every(s=>!!document.querySelector(s)?.getClientRects().length)};
   });
   const {feedUrls,...rest}=x;
   report={...report,...rest,status:'audited',feeds:feeds.filter(f=>f.tube.toLowerCase()===ch.slug.toLowerCase()).map(f=>({id:f.id,present:feedUrls.includes(f.url)}))};
   report.priority=(report.buttons.some(b=>b.modal)?4:0)+(report.headerHeight>250?3:0)+(report.images.some(i=>!i.loaded)?3:0)+(!report.rulesDropdown?1:0);
   if(x.headerHeight>0)await p.locator('#motdwrap').screenshot({path:'motd-audit/'+ch.slug+'.png',timeout:10000}).catch(()=>{});
  }catch(e){report.error=String(e.message||e).split('\n')[0].slice(0,180)}
  finally{await ctx.close()}
  reports.push(report);console.log('MOTD_AUDIT '+JSON.stringify(report));
 }
}finally{await browser.close()}
await fs.writeFile('motd-audit/results.json',JSON.stringify(reports,null,2));
if(reports.some(r=>r.status!=='audited'))process.exitCode=1;
