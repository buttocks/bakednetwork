#!/usr/bin/env node
/* Reconcile only explicitly registered Baked TV-owned iframe entries.
   Never touch unknown embeds, currently playing items, or live JS/CSS/MOTD.
   Uncertain health is always a no-op; confirmed offline removes, recovery adds. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const SITE='https://baked.live',USER='buttman-gpt';
const CONFIG='tubes/feeds/managed.json',REPORT='tubes/feeds/last-reconcile.json';
function safeUrl(raw){
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.host!=='buttocks.github.io'||
     !url.pathname.startsWith('/bakednetwork/tubes/')||
     !url.pathname.endsWith('/feed.html')||url.username||url.password||url.hash)
    throw Error('Feed URL outside approved GitHub Pages path');
  return url.href;
}
const iframe=src=>'<iframe src="'+src+'" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
async function state(page){
  return page.evaluate(()=>{
    const permission=p=>typeof window.hasPermission==='function'&&!!window.hasPermission(p);
    const queue=[...document.querySelectorAll('#queue .queue_entry')].map((el,i)=>{
      const jq=window.jQuery?.(el),media=jq?.data('media')||{};
      let src=media.meta?.embed?.src||'';
      if(media.type==='cu'&&typeof src==='string'){
        const el=document.createElement('textarea');el.innerHTML=src;
        try{src=new URL(el.value,location.href).href}catch{src=''}
      }else src='';
      return {uid:jq?.data('uid'),index:i,title:media.title||el.textContent||'',
        type:media.type,src,temp:!!jq?.data('temp')};
    });
    return {connected:!!window.socket?.connected,username:window.CLIENT?.name,
      loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,
      channel:window.CHANNEL?.name,playing:window.PL_CURRENT,
      permissions:{add:permission('playlistadd'),custom:permission('playlistaddcustom'),
        permanent:permission('addnontemp'),remove:permission('playlistdelete')},queue};
  });
}
async function wait(page,predicate,msg,ms=20000){
  const deadline=Date.now()+ms;
  while(Date.now()<deadline){
    const s=await state(page);if(predicate(s))return s;
    await page.waitForTimeout(350);
  }
  throw Error(msg);
}
async function login(page,password){
  await page.goto(SITE+'/login',{waitUntil:'domcontentloaded',timeout:45000});
  const form=page.locator('form[action="/login"]').last();
  await form.locator('input[name="name"]').fill(USER);
  await form.locator('input[name="password"]').fill(password);
  await form.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
}
async function main(){
  const cfg=JSON.parse(await fs.readFile(CONFIG,'utf8'));
  if(cfg.schema!==1||!Array.isArray(cfg.managed)||cfg.managed.length>60)throw Error('Invalid owned-feed registry');
  const ids=new Set(),urls=new Set(),statuses=new Map();
  for(const e of cfg.managed){
    if(typeof e.id!=='string'||!/^[-a-z0-9]{4,64}$/.test(e.id)||ids.has(e.id))throw Error('Duplicate or invalid feed ID');
    ids.add(e.id); const url=safeUrl(e.url);if(urls.has(url))throw Error('Duplicate feed URL');urls.add(url);
    if(typeof e.tube!=='string'||!/^[A-Za-z0-9]{2,35}$/.test(e.tube)||
       typeof e.title!=='string'||e.title.length<8||e.title.length>95||
       typeof e.statusFile!=='string'||!/^tubes\/[A-Za-z0-9-]+\/feed-status\.json$/.test(e.statusFile)||
       typeof e.statusKey!=='string'||!/^[a-z0-9-]+$/.test(e.statusKey))
      throw Error('Invalid registered feed config');
    if(!statuses.has(e.statusFile))
      statuses.set(e.statusFile,JSON.parse(await fs.readFile(e.statusFile,'utf8')));
  }
  if(process.argv.includes('--self-test')){
    assert.equal(cfg.managed.length,ids.size);
    assert.throws(()=>safeUrl('https://example.org/feed.html'));
    assert.ok(iframe(cfg.managed[0].url).includes('allowfullscreen'));
    console.log('PASS: owned feed configuration, unique URLs and URL allowlist');
    return;
  }
  const password=process.env.BAKED_LIVE_PASSWORD;if(!password)throw Error('Missing Baked.live secret');
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const report={at:new Date().toISOString(),actions:[],channels:{}};
  try{
    const context=await browser.newContext({viewport:{width:1300,height:830}});
    const page=await context.newPage();
    await login(page,password);
    for(const tube of [...new Set(cfg.managed.map(x=>x.tube))]){
      await page.goto(SITE+'/tv/'+tube,{waitUntil:'domcontentloaded',timeout:45000});
      let initial=await wait(page,s=>s.connected&&s.loggedIn&&
        s.username?.toLowerCase()===USER&&s.channel===tube,
        'Cannot verify connected bot identity on '+tube,30000);
      await page.waitForTimeout(1800);
      initial=await state(page);
      if(initial.rank<3)initial=await wait(page,s=>s.rank>=3,'No admin rank on '+tube,8000);
      report.channels[tube]={before:initial.queue.map(e=>({uid:e.uid,title:e.title,src:e.src})),
        playing:initial.playing,rank:initial.rank};
      for(const feed of cfg.managed.filter(x=>x.tube===tube)){
        const desired=statuses.get(feed.statusFile)?.channels?.[feed.statusKey]?.available;
        const existing=initial.queue.filter(x=>x.src===safeUrl(feed.url));
        if(existing.length>1){report.actions.push({feed:feed.id,result:'duplicate-skipped'});continue}
        if(desired!==true&&desired!==false){
          report.actions.push({feed:feed.id,result:'unknown-health-preserved'});continue;
        }
        if(desired===true&&existing.length===0){
          if(!initial.permissions.add||!initial.permissions.custom||!initial.permissions.permanent){
            report.actions.push({feed:feed.id,result:'missing-add-permissions'});continue;
          }
          const response=await page.request.get(feed.url,{timeout:20000,failOnStatusCode:false});
          const ok=response.status()===200&&(await response.text()).includes('NJPW');
          await response.dispose();
          if(!ok){report.actions.push({feed:feed.id,result:'page-not-verified'});continue}
          await page.evaluate(({src,title})=>window.socket.emit('queue',{
            id:'<iframe src="'+src+'" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>',
            title,type:'cu',pos:'end',temp:false
          }),{src:safeUrl(feed.url),title:feed.title});
          initial=await wait(page,s=>s.queue.some(x=>x.src===safeUrl(feed.url)&&!x.temp),
            'Failed to verify owned iframe insertion for '+feed.id);
          report.actions.push({feed:feed.id,result:'added'});
        }else if(desired===false&&existing.length===1){
          const e=existing[0];
          if(e.uid===initial.playing){
            report.actions.push({feed:feed.id,result:'playing-protected'});continue;
          }
          if(!initial.permissions.remove){
            report.actions.push({feed:feed.id,result:'missing-remove-permissions'});continue;
          }
          // Exactly one explicitly managed URL, not an unrelated queued iframe.
          await page.evaluate(uid=>window.socket.emit('delete',uid),e.uid);
          initial=await wait(page,s=>!s.queue.some(x=>x.uid===e.uid),
            'Failed to verify owned iframe deletion for '+feed.id);
          report.actions.push({feed:feed.id,result:'removed-confirmed-offline'});
        }else{
          report.actions.push({feed:feed.id,result:desired?'already-present':'already-absent'});
        }
      }
      report.channels[tube].after=initial.queue.map(x=>({uid:x.uid,title:x.title,src:x.src}));
      report.channels[tube].unchangedNonManaged=report.channels[tube].before
        .filter(x=>!urls.has(x.src))
        .every(x=>report.channels[tube].after.some(y=>y.uid===x.uid));
      if(!report.channels[tube].unchangedNonManaged)
        throw Error('An unmanaged playlist entry disappeared during reconciliation');
    }
  }finally{await browser.close();await fs.writeFile(REPORT,JSON.stringify(report,null,2)+'\n');}
  console.log('RECONCILE_RESULTS '+JSON.stringify(report.actions));
}
main().catch(e=>{console.error('Managed feed reconciliation failed: '+String(e.message||e).slice(0,300));process.exitCode=1});
