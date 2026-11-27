import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const registry=JSON.parse(await fs.readFile('tubes/channels.json','utf8'));
const scope=registry.channels.filter(c=>c.adminVerified&&c.slug.toLowerCase()!=='rdh');
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
    const rect=e=>{const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height),bottom:Math.round(b.bottom)}};
    const onscreen=e=>vis(e)&&e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).opacity!=='0';
    const navs=[...document.querySelectorAll('nav.navbar,.navbar,#navbar')].filter(onscreen).map(rect).filter(b=>b.y<150&&b.height<200);
    const tops=['#videowrap','#chatwrap','#chatbox','#videobox'].map(selector=>{const e=document.querySelector(selector);return e&&onscreen(e)?{selector,...rect(e)}:null}).filter(Boolean);
    const top=navs.length?Math.max(...navs.map(b=>b.bottom)):null;
    const bottom=top!==null&&tops.length?Math.min(...tops.map(b=>b.y)):null;
    const valid=top!==null&&bottom!==null&&bottom>=top;
    const inside=e=>{if(!valid||!onscreen(e))return false;const b=e.getBoundingClientRect();return b.top>=top-3&&b.bottom<=bottom+3&&b.height>0&&b.width>0};
    const elements=valid?[...document.body.querySelectorAll('*')].filter(e=>inside(e)&&!e.closest('.modal,[role="dialog"],script,style')):[];
    const roots=elements.filter(e=>!elements.includes(e.parentElement));
    const textNodes=elements.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>clean([...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' '))).filter(Boolean);
    const graphics=[];
    for(const e of elements){
      const st=getComputedStyle(e);
      for(const pseudo of ['', '::before','::after']){
        const a=pseudo?getComputedStyle(e,pseudo):st;
        if(pseudo&&(a.content==='none'||a.content==='normal'||a.display==='none'))continue;
        if(/url\(/.test(a.backgroundImage)||pseudo&&/url\(/.test(a.content)||!pseudo&&e.matches('img,svg,canvas,picture')){
          graphics.push({element:e.id?'#'+e.id:e.tagName.toLowerCase(),pseudo,box:rect(e),kind:e.tagName.toLowerCase(),background:a.backgroundImage.slice(0,220),content:pseudo?a.content.slice(0,120):'',loaded:e.tagName==='IMG'?e.complete&&e.naturalWidth>0:null});
        }
      }
    }
    const approval=[...document.querySelectorAll('.modal.in,.modal.show,[role="dialog"]')].filter(onscreen).map(e=>clean(e.querySelector('.modal-title')?.textContent||e.textContent)).filter(t=>/script|javascript|trust|approve/i.test(t));
    const controls=elements.filter(e=>e.matches('button,a,summary,[role="button"]')).map(e=>({label:clean(e.textContent||e.getAttribute('aria-label')||e.title),kind:e.tagName})).filter(e=>e.label);
    const header={definition:'navbar bottom to earliest visible video/chatbox top',boundsVerified:valid,top,bottom,height:valid?bottom-top:null,videoChat:tops,roots:roots.map(e=>({tag:e.tagName,id:e.id,classes:String(e.className||'').slice(0,150),box:rect(e)})).slice(0,25),text:[...new Set(textNodes)].slice(0,45),graphics:graphics.slice(0,30),controls:controls.slice(0,40),approval,ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs};

    return {header,headerHeight:header.height,nativeMotdHeight:Math.round(r?.height||0),motdBytes:typeof window.CHANNEL.motd==='string'?window.CHANNEL.motd.length:null,
      motdTextPresent:!!m.textContent.trim(),motdImageCount:m.querySelectorAll('img').length,
      registrationLink:!!m.querySelector('a[href*="/register"]'),
      externalCss:window.CHANNEL.opts?.externalcss||'',externalJs:window.CHANNEL.opts?.externaljs||'',
      inlineCssBytes:String(window.CHANNEL.css||'').length,inlineJsBytes:String(window.CHANNEL.js||'').length,
      layoutOverflow:document.documentElement.scrollWidth>innerWidth+4,
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
   report.reviewStatus=!x.header.boundsVerified?'geometry-unverified':x.header.approval.length?'script-approval-pending':'visual-review-required';
   if(x.header.boundsVerified&&x.header.height>0&&x.header.bottom<=1000)await p.screenshot({path:'motd-audit/'+ch.slug+'-header.png',clip:{x:0,y:x.header.top,width:1440,height:x.header.height},timeout:10000}).catch(()=>{});
   await p.screenshot({path:'motd-audit/'+ch.slug+'-viewport.png',timeout:10000}).catch(()=>{});
  }catch(e){report.error=String(e.message||e).split('\n')[0].slice(0,180)}
  finally{await ctx.close()}
  reports.push(report);console.log('MOTD_AUDIT '+JSON.stringify(report));
 }
}finally{await browser.close()}
await fs.writeFile('motd-audit/results.json',JSON.stringify(reports,null,2));
if(reports.some(r=>r.status!=='audited'))process.exitCode=1;
