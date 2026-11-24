#!/usr/bin/env node
/**
 * Baked.live channel playlist bridge.
 * Runs only in a GitHub Actions runner with BAKED_LIVE_PASSWORD secret.
 * A commit to tubes/bridge/request.json is the command transport.
 * Only authorized channels/players are allowed. Default operation: audit.
 */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const SITE='https://baked.live';
const USERNAME='buttman-gpt';
const CHANNELS=new Set(["luchatube","NJPW","WrestleTube","RetroWrestling","WWE-WWF","RDH","ScaryTube","WID","WCW"]);
const ORIGINAL_CHANNELS=new Set(['luchatube','NJPW']);
const PLAYER_ORIGIN='https://buttocks.github.io';
const PLAYER_ROOT='/suplex-baked-player/';
const REQUEST_PATH=process.env.BAKED_BRIDGE_REQUEST || 'tubes/bridge/request.json';
const OUTPUT_PATH='tubes/bridge/result.json';

function safeUrl(value){
  if(typeof value!=='string' || value.length>600)throw Error('Invalid player URL');
  let url;
  try{url=new URL(value);}catch{throw Error('Player URL must be absolute HTTPS');}
  if(url.origin!==PLAYER_ORIGIN||!url.pathname.startsWith(PLAYER_ROOT)||
     !/^[a-zA-Z0-9/_-]+\.html$/.test(url.pathname.slice(PLAYER_ROOT.length))||
     url.username||url.password||url.hash)throw Error('Player URL is not in the approved GitHub Pages directory');
  return url.href;
}
function validate(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Request must be an object');
  const allowed=['schema','request_id','channel','action','title','src','old_src','offset','limit'];
  for(const key of Object.keys(raw))if(!allowed.includes(key))throw Error('Unknown request key: '+key);
  if(raw.schema!==1||!CHANNELS.has(raw.channel))throw Error('Unsupported schema or unauthorized channel');
  if(!['audit','audit_skin','audit_legacy_paths','backup_skin','audit_emotes','clean_dead_emotes','deploy_skin','clean_motd_lucha','refresh_njpw_skin_motd','remove_legacy_uncertain_emotes','audit_playlist_media','add_iframe','replace_iframe'].includes(raw.action))throw Error('Unsupported bridge action');
  if(!ORIGINAL_CHANNELS.has(raw.channel)&&!['audit','audit_skin','backup_skin','audit_legacy_paths'].includes(raw.action))throw Error('New channel is read-only until verified');
  if(typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id))throw Error('Invalid request_id');
  if(raw.action==='audit_playlist_media'){
    if(raw.src||raw.old_src||raw.title)throw Error('Playlist audit cannot mutate');
    const offset=raw.offset??0,limit=raw.limit??1500;
    if(!Number.isInteger(offset)||offset<0||offset>1400||
       !Number.isInteger(limit)||limit<1||limit>1500)
      throw Error('Invalid playlist audit range');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,
      action:raw.action,offset,limit};
  }
  if(raw.action==='audit_emotes'||raw.action==='clean_dead_emotes'){
    if(raw.src||raw.old_src||raw.title)throw Error('Emote audit cannot mutate');
    const offset=raw.offset??0,limit=raw.limit??250;
    if(raw.action==='clean_dead_emotes'&&(offset!==0||limit<6500))
      throw Error('Cleanup must check the full emote list');
    if(!Number.isInteger(offset)||offset<0||offset>15000||
       !Number.isInteger(limit)||limit<1||limit>8000)throw Error('Invalid emote audit range');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action,offset,limit};
  }
  if(raw.offset!==undefined||raw.limit!==undefined)throw Error('Audit range on non-emote operation');
  if(['audit','audit_skin','audit_legacy_paths','backup_skin','deploy_skin','clean_motd_lucha','refresh_njpw_skin_motd','remove_legacy_uncertain_emotes'].includes(raw.action)){
    if(raw.src||raw.old_src||raw.title)throw Error('Audit requests cannot contain mutations');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action};
  }
  if(typeof raw.title!=='string'||raw.title.trim().length<4||raw.title.length>100)throw Error('Missing or invalid title');
  const request={schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action,title:raw.title.trim(),src:safeUrl(raw.src)};
  if(raw.action==='replace_iframe'){
    request.old_src=safeUrl(raw.old_src);
    if(request.old_src===request.src)throw Error('Old and new iframe URLs are identical');
  }else if(raw.old_src)throw Error('Old URL only allowed for replacement');
  return request;
}
function embedHtml(src){
  return '<iframe src="'+src+'" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
}
async function writeResult(result){
  await fs.writeFile(OUTPUT_PATH,JSON.stringify(result,null,2)+'\n','utf8');
  console.log('Bridge result: '+result.status+' / '+result.channel+' / '+result.action);
}
async function snapshot(page){
  return page.evaluate(()=>{
    function fromMedia(media){
      if(media?.type!=='cu')return null;
      // CyTube hashes custom embed HTML into a cu:... media ID. The actual
      // iframe URL is sent to clients as media.meta.embed.src, not media.id.
      let raw=media.meta?.embed?.src;
      if(typeof raw!=='string'&&typeof media.id==='string'){
        const match=media.id.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
        raw=match?.[1];
      }
      if(typeof raw!=='string')return null;
      try{
        const element=document.createElement('textarea');
        element.innerHTML=raw;
        return new URL(element.value,location.href).href;
      }catch{return null;}
    }
    const queue=[...document.querySelectorAll('#queue .queue_entry')].map((el,idx)=>{
      const media=window.jQuery?window.jQuery(el).data('media')||{}:{};
      const uid=window.jQuery?window.jQuery(el).data('uid'):null;
      const temp=window.jQuery?window.jQuery(el).data('temp'):null;
      return {index:idx,uid,src:fromMedia(media),type:media.type||null,title:media.title||el.querySelector('.qe_title')?.textContent||'',temp:!!temp};
    });
    const client=window.CLIENT||{};
    const permission=name=>typeof window.hasPermission==='function'&&!!window.hasPermission(name);
    return {connected:!!window.socket?.connected,channel:window.CHANNEL?.name,
      username:client.name,rank:client.rank,loggedIn:!!client.logged_in,playing:window.PL_CURRENT,
      permissions:{add:permission('playlistadd'),custom:permission('playlistaddcustom'),
        permanent:permission('addnontemp'),move:permission('playlistmove'),remove:permission('playlistdelete')},
      queue};
  });
}
async function waitFor(page,check,message,timeout=20000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    const state=await snapshot(page);
    if(check(state))return state;
    await page.waitForTimeout(350);
  }
  throw Error(message);
}
function exactMatches(state,src){return state.queue.filter(entry=>entry.src===src);}
function mutationAllowed(state,action){
  if(!state.permissions.add||!state.permissions.custom)throw Error('Admin lacks permission to add custom iframes');
  if(action==='replace_iframe'&&(!state.permissions.move||!state.permissions.remove))
    throw Error('Admin lacks permission to move/delete existing entries');
}
async function login(page,password){
  await page.goto(SITE+'/login',{waitUntil:'domcontentloaded',timeout:45000});
  // Baked.live serves a header login form as well as the main login form.
  // Scope all fields and submit to one form to avoid strict-selector collisions.
  const form=page.locator('form[action="/login"]').last();
  const user=form.locator('input[name="name"]');
  const pass=form.locator('input[name="password"]');
  await user.waitFor({state:'visible',timeout:20000});
  await user.fill(USERNAME);
  await pass.fill(password);
  await form.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
  const body=await page.locator('body').innerText();
  if(/Login Failed|Invalid username\/password/i.test(body))throw Error('Baked.live login failed');
  // The channel's CLIENT state below provides the authoritative login/rank check.
}
async function run(request){
  const password=process.env.BAKED_LIVE_PASSWORD;
  if(!password)throw Error('Missing GitHub Actions secret BAKED_LIVE_PASSWORD; see tubes/bridge/README.md');
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  let page;
  try{
    const context=await browser.newContext({viewport:{width:1380,height:880},acceptDownloads:false});
    page=await context.newPage();
    page.setDefaultTimeout(20000);
    await login(page,password);
    await page.goto(SITE+'/tv/'+request.channel,{waitUntil:'domcontentloaded',timeout:45000});
    let initial=await waitFor(page,state=>state.connected&&state.loggedIn&&
      String(state.username||'').toLowerCase()===USERNAME&&String(state.channel||'').toLowerCase()===request.channel.toLowerCase(),
      'Could not confirm authenticated account and channel connection',30000);
    // Channel rank and playlist events can arrive after the login identity event.
    // Allow them to settle. Read-only audits also work when rank is insufficient;
    // all mutations continue to require verified Admin rank.
    await page.waitForTimeout(2200);
    initial=await snapshot(page);
    if(initial.rank<3){
      try{
        initial=await waitFor(page,state=>state.rank>=3,
          'Channel Admin rank not observed before timeout',8000);
      }catch{initial=await snapshot(page);}
    }
    const before=initial.queue.map(entry=>({index:entry.index,title:entry.title,src:entry.src,temp:entry.temp}));
    console.log('Authenticated '+USERNAME+' on '+request.channel+
      '; rank='+initial.rank+'; items='+before.length);
    if(request.action==='audit_playlist_media'){
      const {auditPlaylistMedia}=await import('./playlist-audit.mjs');
      return await auditPlaylistMedia({page,request,initial});
    }
    if(request.action==='refresh_njpw_skin_motd'){
      const {refreshNJPWMotdSkin}=await import('../NJPW/refresh.mjs');
      return await refreshNJPWMotdSkin({page,request,initial});
    }
    if(request.action==='clean_motd_lucha'){
      const {cleanLuchaMotdLive}=await import('./motd-cleanup.mjs');
      return await cleanLuchaMotdLive({page,request,initial});
    }
    if(request.action==='deploy_skin'){
      const {deploySkin}=await import('./skin-apply.mjs');
      return await deploySkin({page,request,initial});
    }
    if(request.action==='remove_legacy_uncertain_emotes'){
      const {removeLegacyUncertainEmotes}=await import('./emote-cleanup.mjs');
      return await removeLegacyUncertainEmotes({page,request,initial});
    }
    if(request.action==='clean_dead_emotes'){
      const {cleanDeadEmotes}=await import('./emote-cleanup.mjs');
      return await cleanDeadEmotes({page,request,initial});
    }
    if(request.action==='audit_emotes'){
      const {auditEmoteUrls}=await import('./emote-cleanup.mjs');
      return await auditEmoteUrls({page,request,initial});
    }
    if(request.action==='backup_skin'){
      const {backupCurrentSkin}=await import('./skin-backup.mjs');
      return await backupCurrentSkin({page,request,initial});
    }
    if(request.action==='audit_legacy_paths'){
      const refs=await page.evaluate(()=>{
        const c=window.CHANNEL||{};
        const sources={css:c.css||'',js:c.js||'',motd:c.motd||'',options:c.opts||{},emotes:c.emotes||[],resources:[...document.querySelectorAll('script[src],link[href],img[src]')].map(e=>e.src||e.href||'')};
        const found={};
        for(const [key,value] of Object.entries(sources)){
          const str=typeof value==='string'?value:JSON.stringify(value);
          const matches=str.match(/https?:[^\s"'<>\\]+/g)||[];
          found[key]=[...new Set(matches.filter(u=>/bakednetwork/i.test(u)&&/\/(?:themes|wid|wrestletube|modules)\/|\/rdh[^/]*\.(?:js|css)|\/CSS_RDH_6_28_22\.txt|\/wrestletube_plus_red_shitpost\.css/i.test(u)&&!u.includes('/tubes/')))];
        }
        return {legacy:found,emotesLoaded:Array.isArray(c.emotes)};
      });
      return {request_id:request.request_id,channel:request.channel,action:request.action,status:'audited',rank:initial.rank,admin_verified:Number.isFinite(initial.rank)&&initial.rank>=3,permissions:initial.permissions,items:before.length,...refs};
    }
    if(request.action==='audit_skin'){
      const skin=await page.evaluate(()=>{
        const channel=window.CHANNEL||{};
        const css=typeof channel.css==='string'?channel.css:'';
        const js=typeof channel.js==='string'?channel.js:'';
        const selectors=['body','html','#wrap','#motdwrap','#main','#mainpage',
          '#videowrap','#chatwrap','#messagebuffer','#queue'];
        const computed=Object.fromEntries(selectors.map(sel=>{
          const element=document.querySelector(sel);
          if(!element)return [sel,null];
          const st=getComputedStyle(element);
          return [sel,{backgroundImage:st.backgroundImage,backgroundColor:st.backgroundColor,
            color:st.color,fontFamily:st.fontFamily,borderColor:st.borderTopColor}];
        }));
        const references=[...css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)]
          .map(match=>match[2].trim()).filter(Boolean);
        const images=[...document.querySelectorAll('img')].slice(0,30)
          .map(img=>({src:img.currentSrc||img.src,alt:img.alt||''}));
        return {css,cssLength:css.length,jsLength:js.length,
          externalCss:channel.opts?.externalcss||'',
          externalJs:channel.opts?.externaljs||'',
          pageTitle:channel.opts?.pagetitle||document.title,
          backgroundReferences:[...new Set(references)],
          computed,images};
      });
      // Exact CSS backup stays in a short-lived workflow artifact, not Git.
      await fs.writeFile('tubes/bridge/skin-css-backup.css',skin.css,'utf8');
      await page.screenshot({path:'tubes/bridge/skin-preview.png',fullPage:false,
        animations:'disabled',timeout:20000});
      delete skin.css;
      return {request_id:request.request_id,channel:request.channel,action:request.action,
        status:'skin-audited',rank:initial.rank,skin};
    }
    if(request.action==='audit'){
      return {request_id:request.request_id,channel:request.channel,action:request.action,
        status:'audited',authenticated_user:initial.username,rank:initial.rank,
        admin_verified:Number.isFinite(initial.rank)&&initial.rank>=3,
        permissions:initial.permissions,items:before.length,
        iframes:before.filter(x=>x.src)};
    }
    if(!Number.isFinite(initial.rank)||initial.rank<3)
      throw Error('buttman-gpt does not have verified Admin rank on '+request.channel);
    mutationAllowed(initial,request.action);
    const already=exactMatches(initial,request.src);
    if(already.length>1)throw Error('Multiple existing copies of target iframe; refusing duplicate actions');
    if(request.action==='add_iframe'&&already.length===1){
      return {request_id:request.request_id,channel:request.channel,action:request.action,status:'already-present',src:request.src};
    }
    let old=null,predecessor=null;
    if(request.action==='replace_iframe'){
      const hits=exactMatches(initial,request.old_src);
      if(hits.length!==1)throw Error('Replacement requires exactly one matching old iframe in playlist');
      old=hits[0];
      if(old.uid===initial.playing)throw Error('Old iframe is currently playing; replacement cancelled');
      predecessor=old.index>0?initial.queue[old.index-1].uid:'prepend';
      if(already.length)throw Error('New iframe already exists elsewhere; refusing ambiguous replacement');
    }
    // Queue as permanent media; never advance live playback.
    await page.evaluate(({markup,title})=>{
      window.socket.emit('queue',{id:markup,title,type:'cu',pos:'end',temp:false});
    },{markup:embedHtml(request.src),title:request.title});
    let after=await waitFor(page,s=>exactMatches(s,request.src).length===1,
      'Baked.live did not confirm new iframe in playlist');
    const added=exactMatches(after,request.src)[0];
    if(added.temp)throw Error('New iframe was only added temporarily; review channel permissions');
    console.log('Verified permanent iframe added: '+request.src);
    if(request.action==='replace_iframe'){
      await page.evaluate(({uid,after})=>window.socket.emit('moveMedia',{from:uid,after}),
        {uid:added.uid,after:predecessor});
      after=await waitFor(page,s=>{
        const now=exactMatches(s,request.src)[0];
        if(!now)return false;
        const wanted=predecessor==='prepend'?0:s.queue.findIndex(x=>x.uid===predecessor)+1;
        return now.index===wanted;
      },'New iframe queued but position could not be verified; old entry left unchanged');
      await page.evaluate(uid=>window.socket.emit('delete',uid),old.uid);
      after=await waitFor(page,s=>!s.queue.some(x=>x.uid===old.uid),
        'Old iframe was not removed; review playlist manually');
      console.log('Old iframe replaced at original playlist position.');
    }
    return {request_id:request.request_id,channel:request.channel,action:request.action,
      status:request.action==='replace_iframe'?'replaced':'added',src:request.src,
      old_src:request.old_src||undefined,items_before:initial.queue.length,items_after:after.queue.length};
  }finally{await browser.close();}
}
function selfTest(){
  const audit=validate({schema:1,request_id:'test_audit_01',channel:'luchatube',action:'audit'});
  assert.equal(audit.action,'audit');
  assert.equal(validate({schema:1,request_id:'njpw_audit_01',channel:'NJPW',action:'audit'}).channel,'NJPW');
  assert.equal(validate({schema:1,request_id:'njpw_backup_01',channel:'NJPW',action:'backup_skin'}).action,'backup_skin');
  assert.equal(validate({schema:1,request_id:'njpw_refresh_01',channel:'NJPW',action:'refresh_njpw_skin_motd'}).action,'refresh_njpw_skin_motd');
  assert.equal(validate({schema:1,request_id:'test_skin_01',channel:'luchatube',action:'audit_skin'}).action,'audit_skin');
  assert.equal(validate({schema:1,request_id:'test_backup_01',channel:'luchatube',action:'backup_skin'}).action,'backup_skin');
  assert.equal(validate({schema:1,request_id:'test_skin_deploy_01',channel:'luchatube',action:'deploy_skin'}).action,'deploy_skin');
  assert.equal(validate({schema:1,request_id:'test_motd_01',channel:'luchatube',action:'clean_motd_lucha'}).action,'clean_motd_lucha');
  assert.equal(validate({schema:1,request_id:'test_legacy_cleanup_01',channel:'luchatube',action:'remove_legacy_uncertain_emotes'}).action,'remove_legacy_uncertain_emotes');
  assert.equal(validate({schema:1,request_id:'test_playlist_01',channel:'luchatube',action:'audit_playlist_media',offset:0,limit:1500}).limit,1500);
  assert.equal(validate({schema:1,request_id:'test_emotes_01',channel:'luchatube',action:'audit_emotes',offset:0,limit:25}).limit,25);
  assert.throws(()=>validate({schema:1,request_id:'test_cleanup_bad_01',channel:'luchatube',action:'clean_dead_emotes',limit:20}));
  assert.equal(validate({schema:1,request_id:'test_cleanup_ok_01',channel:'luchatube',action:'clean_dead_emotes',limit:7000}).limit,7000);
  const url='https://buttocks.github.io/suplex-baked-player/lucha-slamvision.html';
  assert.equal(validate({schema:1,request_id:'test_add_01',channel:'luchatube',
    action:'add_iframe',title:'Lucha',src:url}).src,url);
  for(const candidate of [
    {schema:1,request_id:'test_bad_01',channel:'other',action:'audit'},
    {schema:1,request_id:'test_bad_02',channel:'luchatube',action:'add_iframe',
      title:'Test',src:'https://example.com/attack.html'},
    {schema:1,request_id:'test_bad_03',channel:'luchatube',action:'add_iframe',
      title:'Test',src:'https://buttocks.github.io/suplex-baked-player/../attack.html'}
  ])assert.throws(()=>validate(candidate));
  assert.equal(embedHtml(url).includes('type="cu"'),false);
  console.log('PASS: request validation, channel allowlist, URL allowlist and embed format');
}
if(process.argv.includes('--self-test'))selfTest();
else{
  try{
    const raw=JSON.parse(await fs.readFile(REQUEST_PATH,'utf8'));
    if(Array.isArray(raw)){
      if(!raw.length||raw.length>10)throw Error('Invalid audit batch size');
      const requests=raw.map(validate);
      if(requests.some(r=>!['audit_legacy_paths','backup_skin'].includes(r.action)))throw Error('Batch limited to read-only audit and backup');
      const results=[];
      for(const request of requests){
        try{const result=await run(request);results.push(result);console.log('Read-only '+request.channel+' '+result.status+(result.legacy?' admin='+result.admin_verified+' rank='+result.rank+' legacy='+Object.values(result.legacy).flat().length:''));}
        catch(error){results.push({channel:request.channel,status:'failed',error:String(error.message||error).slice(0,200)});console.log('Audit '+request.channel+' failed');}
        await fs.writeFile(OUTPUT_PATH,JSON.stringify({results},null,2)+'\n');
      }
    }else{
      const request=validate(raw);
      const result=await run(request);
      await writeResult(result);
    }
  }catch(error){
    // Never log environment variables, browser cookies, page HTML or login fields.
    console.error('Bridge failed: '+String(error.message||error).slice(0,400));
    process.exitCode=1;
  }
}
