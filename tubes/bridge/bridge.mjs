#!/usr/bin/env node
/**
 * Baked.live channel playlist bridge.
 * Runs only in a GitHub Actions runner with BAKED_LIVE_PASSWORD secret.
 * A commit to tubes/bridge/request.json is the command transport.
 * Only authorized channels/players are allowed. Default operation: audit.
 */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {cleanLegacyNativeFeatures,legacyNativeSelfTest} from './native-legacy-cleanup.mjs';

const SITE='https://baked.live';
const USERNAME='buttman-gpt';
const REGISTRY=JSON.parse(await fs.readFile(new URL('../channels.json',import.meta.url),'utf8')).channels;
const CHANNELS=new Set(REGISTRY.map(c=>c.slug));
const ONBOARDING=new Set(REGISTRY.filter(c=>c.stage==='onboarding').map(c=>c.slug));
const ORIGINAL_CHANNELS=new Set(['luchatube','NJPW']);
const IFRAME_WRITE_CHANNELS=new Set(['WWF-WWE','puro','joshi','RetroWrestling','indies']);
const PLAYER_ORIGIN='https://buttocks.github.io';
const PLAYER_ROOT='/suplex-baked-player/';
const REQUEST_PATH=process.env.BAKED_BRIDGE_REQUEST || 'tubes/bridge/request.json';
const OUTPUT_PATH='tubes/bridge/result.json';
const CLEAN_LOADER_COMMIT='969cb185f134f7f5a059cf856a5e6b25245ea135';
const PREVIOUS_CLEAN_LOADER_COMMIT='cfda63ca19d17281a744256e8af88742c06c4690';
const EXTERNAL_NATIVE_LOADERS=new Map([
  ['/js/channel-loaders/54a161ff3e9e926276646d75648cf9000be038a6ebfb782e1b5f3f396e2a1244.js','wrestletube.js'],
  ['/js/channel-loaders/ebd708a4686b9ebf5a59b922c6982bdf4a830c12ce49cf7930c253beb2692894.js','retrowrestling.js'],
  ['/js/channel-loaders/e5eae62effac20c1674e3f9997c3908c7941f65e55745887e1eb40d17468a11d.js','wwf-wwe.js'],
  ['/js/channel-loaders/64cac0e7e4c1bc465108df98cdf8650cc03ccb1692d4ec0aeef45fef7e5dad8b.js','scarytube.js'],
  ['/js/channel-loaders/4bfc0df88c58dbc6c9a2d01ff203c4507b658b569aa820779c117c82de3bb231.js','wid.js'],
  ['/js/channel-loaders/509930e8eb22b405fa45ac2baacde61b02c1c0d8d3107796f7ebf953a2f2b1fb.js','wcw.js'],
  ['/js/channel-loaders/597a3f8a9130b227837eee147f046cfbbcfb725f1961b83039533d5d27a4b951.js','nwa-tna.js']
]);
function cleanLoaderUrl(filename){
  return 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@'+CLEAN_LOADER_COMMIT+
    '/tubes/bridge/cleaned-loaders/'+filename;
}

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
  const allowed=['schema','request_id','channel','action','title','src','old_src','offset','limit','items'];

  for(const key of Object.keys(raw))if(!allowed.includes(key))throw Error('Unknown request key: '+key);
  if(raw.schema!==1||!CHANNELS.has(raw.channel))throw Error('Unsupported schema or unauthorized channel');
  if(raw.items!==undefined&&raw.action!=='add_iframes_batch')throw Error('Items only allowed for iframe batches');
  if(raw.action==='retire_legacy_native'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))
      throw Error('Invalid native legacy cleanup request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action};
  }
  if(raw.action==='verify_native_acceptance'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified)||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))
      throw Error('Invalid native acceptance request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action};
  }
  if(raw.action==='inventory_legacy_native'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified)||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))
      throw Error('Invalid native legacy inventory request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action};
  }
  if(['verify_scarytube_playback','diagnose_scarytube_chat','deploy_scarytube_chat_fix'].includes(raw.action)){
    if(raw.channel!=='ScaryTube'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid ScaryTube verification request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action};
  }
  if(raw.action==='sync_wrestletube_chat'){
    if(!['wrestling2','wrestling3','Wrestling4','wrestling5'].includes(raw.channel)||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid WrestleTube sync request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='pilot_chat_sync'){
    if(raw.channel!=='wrestling2'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid chat sync pilot request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='inventory_chat_sync'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid chat sync inventory request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='fix_queue_attribution'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid queue attribution request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='mirror_njpw_skin'){
    if(raw.channel!=='NJPWALT'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid NJPW skin mirror request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='repair_njpwalt_logo'){
    if(raw.channel!=='NJPWALT'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid NJPWALT logo request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='repair_ddt_logo'){
    if(raw.channel!=='ddt'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid DDT repair request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='repair_dg_logo'){
    if(!['DG','DGalt'].includes(raw.channel)||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid Dragon Gate repair request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(raw.action==='update_retro_js'){
    if(raw.channel!=='RetroWrestling'||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid Retro deployment request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(['deploy_nwatna','install_nwatna_tools','deploy_nwatna_base','fix_nwatna_queue_blame'].includes(raw.action)){
    if(raw.channel!=='NWA-TNA'||!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||Object.keys(raw).some(k=>!['schema','request_id','channel','action'].includes(k)))throw Error('Invalid NWA-TNA deployment request');
    return {schema:1,channel:raw.channel,action:raw.action,request_id:raw.request_id};
  }
  if(!['audit','audit_skin','audit_legacy_paths','plan_legacy_options','migrate_legacy_options','backup_skin','audit_emotes','clean_dead_emotes','deploy_skin','clean_motd_lucha','refresh_njpw_skin_motd','remove_legacy_uncertain_emotes','audit_playlist_media','clean_dead_playlist','inventory_legacy_native','retire_legacy_native','add_iframe','add_iframes_batch','remove_iframe','replace_iframe'].includes(raw.action))throw Error('Unsupported bridge action');
  // ScaryTube is authorized only for its exact public viewer endpoint.
  if(raw.action==='add_iframes_batch'){
    const verified=channel=>IFRAME_WRITE_CHANNELS.has(channel)&&
      REGISTRY.some(c=>c.slug===channel&&c.adminVerified&&c.backupVerified);
    if(!verified(raw.channel)||typeof raw.request_id!=='string'||
       !/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       raw.title!==undefined||raw.src!==undefined||raw.old_src!==undefined||
       raw.offset!==undefined||raw.limit!==undefined||
       !Array.isArray(raw.items)||raw.items.length<1||raw.items.length>30)
      throw Error('Invalid approved tube iframe batch');
    const urls=new Set();
    const items=raw.items.map(item=>{
      if(!item||typeof item!=='object'||Array.isArray(item)||
         Object.keys(item).some(k=>!['channel','title','src'].includes(k))||
         !verified(item.channel)||typeof item.title!=='string'||
         item.title.trim().length<4||item.title.length>100)
        throw Error('Invalid iframe batch item');
      const src=safeUrl(item.src);
      if(urls.has(src))throw Error('Duplicate iframe URL in batch');
      urls.add(src);
      return {channel:item.channel,title:item.title.trim(),src};
    });
    if(items[0].channel!==raw.channel)
      throw Error('Batch must start in its first destination tube');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,
      action:raw.action,items};
  }
  if(raw.action==='remove_iframe'&&IFRAME_WRITE_CHANNELS.has(raw.channel)){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||
       raw.title!==undefined||raw.old_src!==undefined||raw.offset!==undefined||raw.limit!==undefined||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id))
      throw Error('Invalid approved tube iframe removal request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,
      action:raw.action,src:safeUrl(raw.src)};
  }
  if(raw.action==='add_iframe'&&IFRAME_WRITE_CHANNELS.has(raw.channel)){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.adminVerified&&c.backupVerified)||
       raw.old_src!==undefined||raw.offset!==undefined||raw.limit!==undefined||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id)||
       typeof raw.title!=='string'||raw.title.trim().length<4||raw.title.length>100)
      throw Error('Invalid approved tube iframe request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action,
      title:raw.title.trim(),src:safeUrl(raw.src)};
  }
  if(raw.channel==='ScaryTube'&&raw.action==='add_iframe'){
    if(!REGISTRY.some(c=>c.slug===raw.channel&&c.stage==='established'&&c.adminVerified&&c.backupVerified)||
       raw.src!=='https://pc-mint.tail7c671f.ts.net:10000/'||
       raw.old_src!==undefined||raw.offset!==undefined||raw.limit!==undefined||
       typeof raw.title!=='string'||raw.title.trim().length<4||raw.title.length>100||
       typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id))
      throw Error('Invalid ScaryTube public embed request');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action,title:raw.title.trim(),src:raw.src};
  }
  const approvedIframeWrite=['add_iframe','add_iframes_batch','remove_iframe'].includes(raw.action)&&IFRAME_WRITE_CHANNELS.has(raw.channel);
  if(!ORIGINAL_CHANNELS.has(raw.channel)&&!approvedIframeWrite&&!['audit','audit_skin','backup_skin','audit_legacy_paths','plan_legacy_options','migrate_legacy_options','audit_emotes','clean_dead_emotes','audit_playlist_media','clean_dead_playlist','inventory_legacy_native'].includes(raw.action))throw Error('New channel is read-only until verified');
  if(ONBOARDING.has(raw.channel)&&!approvedIframeWrite&&!['audit','audit_skin','backup_skin','audit_legacy_paths','audit_emotes','audit_playlist_media','inventory_legacy_native'].includes(raw.action))throw Error('New channel onboarding is read-only');
  if(typeof raw.request_id!=='string'||!/^[a-zA-Z0-9_-]{6,80}$/.test(raw.request_id))throw Error('Invalid request_id');
  if(['audit_playlist_media','clean_dead_playlist'].includes(raw.action)){
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
       !Number.isInteger(limit)||limit<1||limit>20000)throw Error('Invalid emote audit range');
    return {schema:1,request_id:raw.request_id,channel:raw.channel,action:raw.action,offset,limit};
  }
  if(raw.offset!==undefined||raw.limit!==undefined)throw Error('Audit range on non-emote operation');
  if(['audit','audit_skin','audit_legacy_paths','plan_legacy_options','migrate_legacy_options','backup_skin','deploy_skin','clean_motd_lucha','refresh_njpw_skin_motd','remove_legacy_uncertain_emotes','inventory_legacy_native'].includes(raw.action)){
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
  if(action==='remove_iframe'){
    if(!state.permissions.remove)throw Error('Admin lacks permission to remove playlist entries');
    return;
  }
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
async function run(request,session=null){
  const password=process.env.BAKED_LIVE_PASSWORD;
  if(!password)throw Error('Missing GitHub Actions secret BAKED_LIVE_PASSWORD; see tubes/bridge/README.md');
  const ownsBrowser=!session;
  const {chromium}=await import('playwright');
  const scaryVerify=request.action==='verify_scarytube_playback';
  // GitHub's Ubuntu hosted image includes Google Chrome, which supports AVC/AAC.
  // Keep all other bridge operations on their existing browser.
  const browser=session?.browser??await chromium.launch({headless:true,args:['--no-sandbox'],...(scaryVerify?{channel:'chrome'}:{})});
  if(scaryVerify)console.log('ScaryTube verification using Google Chrome '+browser.version());
  let page;
  try{
    const context=session?.context??await browser.newContext({viewport:{width:1380,height:880},acceptDownloads:false});
    page=session?.page??await context.newPage();
    const scaryNet={embedded:{},direct:{}};
    function observeScaryNetwork(target,bucket){
      const classify=raw=>{
        try{
          const u=new URL(raw);
          if(u.origin==='https://pc-mint.tail7c671f.ts.net:10000'){
            if(u.pathname==='/')return 'page';
            if(u.pathname==='/live.m3u8')return 'manifest';
            if(u.pathname==='/status.json')return 'status';
            if(/^\/segment_[0-9]{1,20}\.ts$/.test(u.pathname))return 'segment';
          }
          if(u.origin==='https://cdn.jsdelivr.net'&&u.pathname.startsWith('/npm/hls.js@'))return 'hls-script';
        }catch{}
        return null;
      };
      const record=(raw,key)=>{const kind=classify(raw);if(kind){const b=bucket[kind]??={};b[key]=(b[key]??0)+1;}};
      target.on('response',r=>record(r.url(),String(r.status())));
      target.on('requestfailed',r=>record(r.url(),String(r.failure()?.errorText||'failed').match(/^net::ERR_[A-Z0-9_]+$/)?.[0]||'failed'));
    }
    if(request.action==='verify_scarytube_playback')observeScaryNetwork(page,scaryNet.embedded);
    page.setDefaultTimeout(20000);
    if(!session)await login(page,password);
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
    if(request.action==='deploy_scarytube_chat_fix'){
      const {deployScaryChatFix}=await import('../ScaryTube/deploy-chat-fix.mjs');
      return await deployScaryChatFix({page,request,initial});
    }
    if(request.action==='diagnose_scarytube_chat'){
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e.message).slice(0,250)));
      await page.waitForTimeout(6000);
      const diagnostic=await page.evaluate(()=>{
        const w=window,b=document.querySelector('#messagebuffer');
        const fn=w.addChatMessage;
        const result={connected:!!w.socket?.connected,skinRunning:!!w.__scaryTubeRunning,externalJs:w.CHANNEL?.opts?.externaljs||'',customHandler:typeof fn==='function'&&String(fn).includes('increscentStore'),formatter:typeof w.formatChatMessage,smartScroll:!!w.CLIENT?.smartScroll,scrollChat:w.SCROLLCHAT,ignoreChannelJs:!!w.USEROPTS?.ignore_channeljs,jquery:w.jQuery?.fn?.jquery,chatListeners:typeof w.socket?.listeners==='function'?w.socket.listeners('chatMsg').map(f=>String(f).slice(0,450)):[],lastTime:typeof w.LASTCHAT==='object'?w.LASTCHAT.time:null,tests:[]};
        if(!b||typeof fn!=='function')return result;
        // Local synthetic messages only: no socket emit or real chat post.
        const last=w.LASTCHAT&&{...w.LASTCHAT};
        const marker='Local diagnostic '+Date.now();
        for(const [name,meta] of [['normal',{}],['missing-meta',undefined],['same-timestamp',{}]]){
          const time=name==='same-timestamp'?(w.LASTCHAT?.time||Date.now()):Date.now()+1000;
          const data={username:'LocalDiagnostic',msg:marker+' '+name,time,...(meta?{meta}:{})};
          try{
            fn(data);
            result.tests.push({name,rendered:b.textContent.includes(marker+' '+name)});
          }catch(e){result.tests.push({name,rendered:false,error:String(e.message).slice(0,250)});}
        }
        for(const node of [...b.children])if(node.textContent.includes(marker))node.remove();
        if(last&&w.LASTCHAT)Object.assign(w.LASTCHAT,last);
        result.scroll={height:b.scrollHeight,client:b.clientHeight,top:b.scrollTop};
        return result;
      });
      console.log('SCARY_CHAT_DIAGNOSTIC '+JSON.stringify({diagnostic,errors}));
      return {request_id:request.request_id,channel:request.channel,action:request.action,status:'chat-diagnosed',diagnostic,errors};
    }
    if(request.action==='verify_scarytube_playback'){
      const src='https://pc-mint.tail7c671f.ts.net:10000/';
      const hits=exactMatches(initial,src);
      if(hits.length!==1||hits[0].temp)throw Error('Expected exactly one permanent ScaryTube public iframe');
      const result={request_id:request.request_id,channel:request.channel,action:request.action,items:initial.queue.length,embed_present:true,src};
      // Observe only. Never queue, jump, unmute, or change shared playback.
      const deadline=Date.now()+30000;
      let observed=false,previous=null,last=null;
      const sampleVideo=()=>{
        const v=document.querySelector('video');
        if(!v)return null;
        return {time:v.currentTime,paused:v.paused,ready:v.readyState,width:v.videoWidth,height:v.videoHeight,
          frames:v.getVideoPlaybackQuality?.().totalVideoFrames??null,error:v.error?.code??null,
          hlsLoaded:typeof window.Hls==='function',hlsSupported:window.Hls?.isSupported?.()??false,
          nativeHls:v.canPlayType('application/vnd.apple.mpegurl'),
          avc:window.MediaSource?.isTypeSupported('video/mp4; codecs="avc1.640028"')??false,
          aac:window.MediaSource?.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')??false,
          center:document.getElementById('center')?.textContent?.slice(0,120)??null};
      };
      while(Date.now()<deadline){
        for(const frame of page.frames()){
          if(frame.url()!==src)continue;
          observed=true;
          try{
            const element=await frame.frameElement();
            if(!await element.isVisible())continue;
            const sample=await frame.evaluate(sampleVideo);
            if(!sample)continue;
            last=sample;
            if(previous&&previous.frame===frame&&!sample.paused&&sample.ready>=2&&sample.width>0&&sample.height>0&&
               sample.time-previous.sample.time>=1&&
               (sample.frames===null||previous.sample.frames===null||sample.frames>previous.sample.frames)){
              console.log('ScaryTube embedded playback verified: '+sample.width+'x'+sample.height+'; media advanced '+(sample.time-previous.sample.time).toFixed(2)+'s');
              return {...result,status:'playback-verified',video:sample};
            }
            if(!sample.paused&&sample.ready>=2&&sample.width>0){
              if(!previous||previous.frame!==frame||sample.time<previous.sample.time)previous={frame,sample};
            }else previous=null;
          }catch{previous=null;}
        }
        await page.waitForTimeout(1500);
      }
      const state=await snapshot(page);
      const active=String(state.playing)===String(hits[0].uid);
      console.log('ScaryTube playback not confirmed; iframe observed='+observed+'; active playlist item='+active+'; video='+JSON.stringify(last));
      const direct=await context.newPage();
      observeScaryNetwork(direct,scaryNet.direct);
      let directVideo=null,directFirst=null,directPlaying=false,directError=null;
      try{
        await direct.goto(src,{waitUntil:'domcontentloaded',timeout:20000});
        const until=Date.now()+20000;
        while(Date.now()<until){
          directVideo=await direct.evaluate(sampleVideo);
          if(directVideo&&!directVideo.paused&&directVideo.ready>=2&&directVideo.width>0){
            if(directFirst===null||directVideo.time<directFirst)directFirst=directVideo.time;
            if(directVideo.time-directFirst>=1){directPlaying=true;break;}
          }
          await direct.waitForTimeout(1500);
        }
      }catch{directError='direct navigation or evaluation failed';}
      finally{await direct.close();}
      console.log('ScaryTube comparison: '+JSON.stringify({network:scaryNet,directPlaying,directVideo,directError}));
      return {...result,status:observed?'playback-unverified':active?'iframe-not-loaded':'embed-not-active',active,iframe_observed:observed,video:last,network:scaryNet,direct_playing:directPlaying,direct_video:directVideo,direct_error:directError};
    }
    if(['audit_playlist_media','clean_dead_playlist'].includes(request.action)){
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
    if(request.action==='update_retro_js'){
      const {updateRetro}=await import('../RetroWrestling/update-js.mjs');
      return await updateRetro({page,request,initial});
    }
    if(request.action==='pilot_chat_sync'||request.action==='sync_wrestletube_chat'){
      const {pilotChatSync}=await import('./chat-sync-pilot.mjs');
      return await pilotChatSync({page,request,initial});
    }
    if(request.action==='inventory_chat_sync'){
      const {inventoryChatSync}=await import('./chat-sync-inventory.mjs');
      return await inventoryChatSync({page,request,initial});
    }
    if(request.action==='fix_queue_attribution'){
      const {fixQueueAttribution}=await import('./queue-attribution.mjs');
      return await fixQueueAttribution({page,request,initial});
    }
    if(request.action==='fix_nwatna_queue_blame'){
      const {fixQueueBlame}=await import('../NWA-TNA/fix-queue-blame.mjs');
      return await fixQueueBlame({page,request,initial});
    }
    if(request.action==='deploy_nwatna_base'){
      const {deployBase}=await import('../NWA-TNA/deploy-base.mjs');
      return await deployBase({page,request,initial});
    }
    if(request.action==='install_nwatna_tools'){
      const {installTools}=await import('../NWA-TNA/install-tools.mjs');
      return await installTools({page,request,initial});
    }
    if(request.action==='deploy_nwatna'){
      const {deployNwatna}=await import('../NWA-TNA/deploy.mjs');
      return await deployNwatna({page,request,initial});
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
    if(['plan_legacy_options','migrate_legacy_options'].includes(request.action)){
      const {migrateLegacyOptions}=await import('./legacy-options.mjs');
      return await migrateLegacyOptions({page,request,initial});
    }
    if(request.action==='verify_native_acceptance'){
      const {verifyNativeAcceptance}=await import('./native-acceptance.mjs');
      return await verifyNativeAcceptance({page,request,initial,password});
    }
    if(request.action==='inventory_legacy_native'){
      if(!Number.isFinite(initial.rank)||initial.rank<3)throw Error('Verified channel admin required for native legacy inventory');
      const live=await page.evaluate(()=>{
        const c=window.CHANNEL||{},js=typeof c.js==='string'?c.js:'';
        const names=['chatline','chatext','chatcolor','colormap','unimoji','dectalk','layout'];
        const moduleHits=names.filter(name=>new RegExp('\\b'+name+'\\s*:\\s*\\{').test(js));
        const legacyOptions={};
        for(const name of names)if(new RegExp('\\b'+name+'\\s*:').test(js))legacyOptions[name]=true;
        const retiredQueue=['collapse','hidePlaylist','inlineBlame','recentMedia','thumbnails','timeEstimates'];
        const queueOptions=Object.fromEntries(retiredQueue.map(key=>[key,new RegExp('\\b'+key+'\\s*:\\s*true\\b').test(js)]).filter(([,v])=>v));
        return {channel:c.name,js,jsBytes:js.length,externaljs:c.opts?.externaljs||'',
          externalcss:c.opts?.externalcss||'',scriptConsentIgnored:!!window.USEROPTS?.ignore_channeljs,
          moduleHits,legacyOptions,queueOptions};
      });
      let externalJsSource='',externalJsError=null;
      let externalModuleHits=[],externalQueueOptions={};
      if(typeof live.externaljs==='string'&&live.externaljs){
        try{
          const externalUrl=new URL(live.externaljs,SITE);
          const approvedPublicReviewSource=externalUrl.href==='https://files.catbox.moe/a76opy.js';
          if((externalUrl.origin===SITE&&/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/i.test(externalUrl.pathname))||approvedPublicReviewSource){
            const response=await page.request.get(externalUrl.href,{timeout:20000});
            if(response.ok()){
              externalJsSource=await response.text();
              const retired=['chatline','chatext','chatcolor','colormap','unimoji','dectalk','layout'];
              externalModuleHits=retired.filter(name=>new RegExp('\\b'+name+'\\s*:\\s*\\{').test(externalJsSource));
              externalQueueOptions=Object.fromEntries(['collapse','hidePlaylist','inlineBlame','recentMedia','thumbnails','timeEstimates']
                .map(key=>[key,new RegExp('\\b'+key+'\\s*:\\s*true\\b').test(externalJsSource)]).filter(([,v])=>v));
            }else externalJsError='HTTP '+response.status();
            await response.dispose();
          }else externalJsError='External script is outside the approved review source list';
        }catch(error){externalJsError=String(error.message||error).slice(0,160);}
      }
      live.externalJsSource=externalJsSource;
      live.externalJsError=externalJsError;
      live.externalModuleHits=externalModuleHits;
      live.externalQueueOptions=externalQueueOptions;
      const dir='tubes/bridge/backup/'+request.channel+'/native-legacy-inventory';
      await fs.mkdir(dir,{recursive:true});
      await fs.writeFile(dir+'/channel-before.json',JSON.stringify(live,null,2)+'\n','utf8');
      const {js,externalJsSource:discardedExternal,...summary}=live;
      console.log('Native legacy inventory '+request.channel+' '+JSON.stringify(summary));
      return {request_id:request.request_id,channel:request.channel,action:request.action,
        status:'inventoried',rank:initial.rank,admin_verified:true,...summary};
    }
    if(request.action==='retire_legacy_native'){
      if(!Number.isFinite(initial.rank)||initial.rank<3)throw Error('Verified channel admin required for native legacy cleanup');
      const capture=()=>page.evaluate(()=>{const c=window.CHANNEL||{};return {channel:c.name,js:typeof c.js==='string'?c.js:'',css:c.css,externaljs:c.opts?.externaljs||'',externalcss:c.opts?.externalcss||'',motd:JSON.stringify(c.motd??null)};});
      const before=await capture();
      if(String(before.channel).toLowerCase()!==request.channel.toLowerCase())throw Error('Channel identity changed before cleanup');
      const cleaned=cleanLegacyNativeFeatures(before.js);
      let externalChange=null,externalSource='';
      if(before.externaljs){
        let externalUrl;
        try{externalUrl=new URL(before.externaljs,SITE);}catch{throw Error('Invalid external JS URL; cleanup stopped without changes');}
        const sameOriginMatch=externalUrl.origin===SITE&&/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/i.test(externalUrl.pathname);
        const cdnMatch=externalUrl.origin==='https://cdn.jsdelivr.net'&&
          /^\/gh\/buttocks\/bakednetwork@([a-f0-9]{40})\/tubes\/bridge\/cleaned-loaders\/([a-z0-9-]+\.js)$/i.exec(externalUrl.pathname);
        const cdnAllowed=cdnMatch&&[PREVIOUS_CLEAN_LOADER_COMMIT,CLEAN_LOADER_COMMIT].includes(cdnMatch[1])&&
          [...EXTERNAL_NATIVE_LOADERS.values()].includes(cdnMatch[2]);
        if(sameOriginMatch||cdnAllowed){
          const assetName=sameOriginMatch?EXTERNAL_NATIVE_LOADERS.get(externalUrl.pathname):cdnMatch[2];
          if(!assetName)throw Error('Unmapped same-origin loader; cleanup stopped for review');
          let response;
          try{response=await page.request.get(externalUrl.href,{timeout:20000});if(!response.ok())throw Error('External loader fetch returned HTTP '+response.status());externalSource=await response.text();}
          finally{await response?.dispose();}
          const cleanExternal=cleanLegacyNativeFeatures(externalSource);
          const committedAsset=await fs.readFile(new URL('./cleaned-loaders/'+assetName,import.meta.url),'utf8');
          if(cleanExternal.source!==committedAsset)throw Error('External loader does not match the reviewed Git cleanup asset');
          const newUrl=cleanLoaderUrl(assetName);
          if(externalUrl.href!==newUrl)externalChange={oldUrl:before.externaljs,newUrl,asset:assetName,
            retiredModules:cleanExternal.retiredModules,changedOptions:cleanExternal.changedOptions,
            removedInputHooks:cleanExternal.removedInputHooks,removedUnimojiControls:cleanExternal.removedUnimojiControls,removedScrollControls:cleanExternal.removedScrollControls,
            removedLayoutOverrides:cleanExternal.removedLayoutOverrides,removedCredits:cleanExternal.removedCredits};
        }else if(externalUrl.origin===SITE&&/^\/js\/channel-loaders\//i.test(externalUrl.pathname)){
          throw Error('Unrecognized same-origin loader; cleanup stopped for review');
        }else if(externalUrl.origin==='https://cdn.jsdelivr.net'&&
          /^\/gh\/buttocks\/bakednetwork@[^/]+\/tubes\/bridge\/cleaned-loaders\//i.test(externalUrl.pathname)){
          throw Error('Unapproved cleaned-loader CDN reference; cleanup stopped for review');
        }
      }
      const nextExternal=externalChange?.newUrl??before.externaljs;
      const dir='tubes/bridge/backup/'+request.channel+'/native-legacy-cleanup';
      await fs.mkdir(dir,{recursive:true});
      await fs.writeFile(dir+'/channel-before.json',JSON.stringify({...before,externalJsSource:externalSource},null,2)+'\n','utf8');
      await fs.writeFile(dir+'/channel-after.js',cleaned.source,'utf8');
      if(externalChange)await fs.writeFile(dir+'/external-before.js',externalSource,'utf8');
      const anyChange=cleaned.changed||!!externalChange;
      if(!anyChange)return {request_id:request.request_id,channel:request.channel,action:request.action,status:'no-legacy-overrides',rank:initial.rank,retired_modules:cleaned.retiredModules,changed_options:cleaned.changedOptions,external_loader:null};
      const fresh=await capture();
      if(fresh.js!==before.js||fresh.css!==before.css||fresh.externaljs!==before.externaljs||fresh.externalcss!==before.externalcss||fresh.motd!==before.motd)
        throw Error('Channel settings changed during review; no cleanup applied');
      await page.evaluate(({js,externaljs,setJs,setExternal})=>{if(!window.socket?.connected||window.CLIENT?.rank<3)throw Error('Admin connection lost');if(setJs)window.socket.emit('setChannelJS',{js});if(setExternal)window.socket.emit('setOptions',{externaljs});},{js:cleaned.source,externaljs:nextExternal,setJs:cleaned.changed,setExternal:!!externalChange});
      let after=null;
      for(let i=0;i<80;i++){after=await capture();if(after.js===cleaned.source&&after.externaljs===nextExternal)break;await page.waitForTimeout(250);}
      if(after?.js!==cleaned.source||after.externaljs!==nextExternal)throw Error('Channel JS update was not confirmed; original retained');
      await page.reload({waitUntil:'domcontentloaded',timeout:45000});
      await waitFor(page,state=>state.connected&&state.loggedIn&&String(state.username||'').toLowerCase()===USERNAME&&String(state.channel||'').toLowerCase()===request.channel.toLowerCase(),
        'Could not reconnect after native legacy cleanup',30000);
      after=null;
      let verified=false;
      for(let i=0;i<100;i++){
        after=await capture();
        verified=after.js===cleaned.source&&after.externaljs===nextExternal&&after.css===before.css&&after.externalcss===before.externalcss&&after.motd===before.motd;
        if(verified)break;
        await page.waitForTimeout(250);
      }
      if(!verified){
        const mismatch={js:after.js===cleaned.source,externaljs:after.externaljs===nextExternal,css:after.css===before.css,
          externalcss:after.externalcss===before.externalcss,motd:after.motd===before.motd,
          observedJsBytes:after.js?.length??null,expectedJsBytes:cleaned.source.length,
          observedExternaljs:after.externaljs,expectedExternaljs:nextExternal};
        await fs.writeFile(dir+'/channel-after-failure.json',JSON.stringify(after,null,2)+'\n','utf8');
        const unchangedAsideFromTarget=after.css===before.css&&after.externalcss===before.externalcss&&after.motd===before.motd;
        if(unchangedAsideFromTarget&&after.js===cleaned.source&&after.externaljs===nextExternal){
          await page.evaluate(({js,externaljs,setJs,setExternal})=>{if(setJs)window.socket.emit('setChannelJS',{js});if(setExternal)window.socket.emit('setOptions',{externaljs});},{js:before.js,externaljs:before.externaljs,setJs:cleaned.changed,setExternal:!!externalChange});
          for(let i=0;i<40;i++){const restored=await capture();if(restored.js===before.js&&restored.externaljs===before.externaljs)break;await page.waitForTimeout(250);}
        }
        throw Error('Post-reload verification failed: '+JSON.stringify(mismatch));
      }
      const result={request_id:request.request_id,channel:request.channel,action:request.action,status:'cleaned-and-reconnected',rank:initial.rank,
        retired_modules:cleaned.retiredModules,changed_options:cleaned.changedOptions,removed_input_hooks:cleaned.removedInputHooks,removed_unimoji_controls:cleaned.removedUnimojiControls,
        removed_scroll_controls:cleaned.removedScrollControls,removed_layout_overrides:cleaned.removedLayoutOverrides,
        removed_credits:cleaned.removedCredits,external_loader:externalChange,script_consent_ignored:!!(await page.evaluate(()=>window.USEROPTS?.ignore_channeljs))};
      console.log('Native legacy cleanup '+request.channel+' '+JSON.stringify(result));
      return result;
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
      const dir='tubes/bridge/backup/'+request.channel+'/legacy-audit';
      await fs.mkdir(dir,{recursive:true});
      await fs.writeFile(dir+'/references.json',JSON.stringify(refs,null,2)+'\n');
      console.log('Legacy reference breakdown '+request.channel+' '+JSON.stringify(Object.fromEntries(Object.entries(refs.legacy).map(([k,v])=>[k,v.length]))));
      for(const key of ['css','js','options'])for(const url of refs.legacy[key]||[]){try{const u=new URL(url);if(['cdn.jsdelivr.net','raw.githubusercontent.com','buttocks.github.io'].includes(u.hostname)&&!u.username&&!u.password)console.log('Legacy asset '+request.channel+' '+key+' '+u.origin+u.pathname)}catch{}}
      return {request_id:request.request_id,channel:request.channel,action:request.action,status:'audited',rank:initial.rank,admin_verified:Number.isFinite(initial.rank)&&initial.rank>=3,permissions:initial.permissions,items:before.length,...refs};
    }
    if(request.action==='mirror_njpw_skin'){
      const source=await context.newPage();
      try{
        await source.goto(SITE+'/tv/NJPW',{waitUntil:'domcontentloaded',timeout:45000});
        await source.waitForFunction(()=>window.CHANNEL?.name==='NJPW'&&document.querySelector('#motdwrap #header img'),{},{timeout:30000});
        const {mirrorSkin}=await import('../NJPW/secondary/NJPWALT/mirror-skin.mjs');
        return await mirrorSkin({page,source,request,initial});
      }finally{await source.close()}
    }
    if(request.action==='repair_njpwalt_logo'){
      const source=await context.newPage();
      try{
        await source.goto(SITE+'/tv/NJPW',{waitUntil:'domcontentloaded',timeout:45000});
        await source.waitForFunction(()=>window.CHANNEL?.name==='NJPW'&&document.querySelector('#motdwrap #header img'),{},{timeout:30000});
        const logo=await source.evaluate(()=>[...document.querySelectorAll('#motdwrap #header img')].map(i=>i.src).filter(s=>s.includes('New_Japan_Pro_Wrestling_Logo_2.svg')));
        if(logo.length!==1)throw Error('Could not identify unique current NJPW lion logo');
        const {repairLogo}=await import('../NJPW/secondary/NJPWALT/repair-logo.mjs');
        return await repairLogo({page,request,initial,logo:logo[0]});
      }finally{await source.close()}
    }
    if(request.action==='repair_ddt_logo'){
      const {repairDDT}=await import('../DDT/repair-logo.mjs');
      return await repairDDT({page,request,initial});
    }
    if(request.action==='repair_dg_logo'){
      const {repairDragonGate}=await import('../DragonGate/repair-logo.mjs');
      return await repairDragonGate({page,request,initial});
    }
    if(request.action==='audit_skin'){
      await page.waitForTimeout(1800);
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
          .map(img=>({src:img.currentSrc||img.src,alt:img.alt||'',location:img.closest('#motdwrap')?'motd':img.closest('#messagebuffer')?'chat':img.closest('#queue')?'playlist':img.closest('nav')?'navbar':'other',broken:img.complete&&!img.naturalWidth,visible:!!img.getClientRects().length}));
        const rect=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width}};
        const nav=rect('nav.navbar,.navbar'),header=rect('#rw-header'),users=rect('#userlist'),messages=rect('#messagebuffer');
        const health={brokenVisibleImages:images.filter(i=>i.broken&&i.visible).length,headerOverlap:!!(nav&&header&&nav.bottom>header.top&&nav.top<header.bottom),chatBottomGap:users&&messages?Math.round(messages.bottom-users.bottom):null,customScriptsIgnored:!!window.USEROPTS?.ignore_channeljs,baseInitialized:!!window.CLIENT?.modules,toolsMounted:!!document.querySelector('#bpt-toolbar')};
        return {health,css,cssLength:css.length,jsLength:js.length,
          externalCss:channel.opts?.externalcss||'',
          externalJs:channel.opts?.externaljs||'',
          pageTitle:channel.opts?.pagetitle||document.title,
          backgroundReferences:[...new Set(references)],
          computed,images};
      });
      // Exact CSS backup stays in a short-lived workflow artifact, not Git.
      await fs.writeFile('tubes/bridge/skin-css-backup.css',skin.css,'utf8');
      const reviewDir='tubes/bridge/backup/'+request.channel+'/skin-review';
      await fs.mkdir(reviewDir,{recursive:true});
      await fs.writeFile(reviewDir+'/review.json',JSON.stringify(skin,null,2)+'\n');
      await page.screenshot({path:reviewDir+'/preview.png',fullPage:false,
        animations:'disabled',timeout:20000});
      const broken=skin.images.filter(i=>i.broken&&i.visible).map(i=>({src:i.src,alt:i.alt,location:i.location}));
      console.log('Broken image review '+request.channel+' '+JSON.stringify(broken));
      console.log('Skin health '+request.channel+' '+JSON.stringify({cssLength:skin.cssLength,jsLength:skin.jsLength,hasExternalCSS:!!skin.externalCss,hasExternalJS:!!skin.externalJs,...skin.health}));
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
    if(request.action==='remove_iframe'){
      const matches=exactMatches(initial,request.src);
      if(matches.length>1)throw Error('Multiple matching iframes; refusing ambiguous removal');
      if(matches.length===0)return {request_id:request.request_id,channel:request.channel,
        action:request.action,status:'already-absent',src:request.src};
      const target=matches[0];
      if(String(target.uid)===String(initial.playing))
        throw Error('Target iframe is currently playing; removal cancelled');
      if(!Number.isFinite(initial.rank)||initial.rank<3||!initial.permissions.remove)
        throw Error('Verified Admin removal permission is required');
      await page.evaluate(uid=>window.socket.emit('delete',uid),target.uid);
      const after=await waitFor(page,state=>exactMatches(state,request.src).length===0,
        'Baked.live did not confirm iframe removal');
      console.log('Verified iframe removed from '+request.channel+': '+request.src);
      return {request_id:request.request_id,channel:request.channel,action:request.action,
        status:'removed',src:request.src,items_before:initial.queue.length,items_after:after.queue.length};
    }
    if(request.action==='add_iframes_batch'){
      const outcomes=[];
      const groups=[];
      for(const item of request.items){
        let group=groups.find(g=>g.channel===item.channel);
        if(!group){group={channel:item.channel,items:[]};groups.push(group);}
        group.items.push(item);
      }
      let state=initial;
      for(const group of groups){
        if(String(state.channel||'').toLowerCase()!==group.channel.toLowerCase()){
          await page.goto(SITE+'/tv/'+group.channel,{waitUntil:'domcontentloaded',timeout:45000});
          state=await waitFor(page,s=>s.connected&&s.loggedIn&&
            String(s.username||'').toLowerCase()===USERNAME&&
            String(s.channel||'').toLowerCase()===group.channel.toLowerCase(),
            'Could not confirm authenticated account and channel connection on '+group.channel,30000);
          await page.waitForTimeout(2200);
          state=await snapshot(page);
        }
        if(!Number.isFinite(state.rank)||state.rank<3)
          state=await waitFor(page,s=>s.rank>=3&&s.loggedIn&&
            String(s.username||'').toLowerCase()===USERNAME&&
            String(s.channel||'').toLowerCase()===group.channel.toLowerCase(),
            'Channel Admin rank not observed on '+group.channel,8000);
        mutationAllowed(state,'add_iframe');
        for(const item of group.items){
          try{
            const matches=exactMatches(state,item.src);
            if(matches.length>1)throw Error('Multiple existing copies; refusing duplicate actions');
            if(matches.length===1){
              outcomes.push({channel:group.channel,title:item.title,status:matches[0].temp?'already-present-temporary':'already-present',src:item.src});
              continue;
            }
            await page.evaluate(({markup,title})=>{
              window.socket.emit('queue',{id:markup,title,type:'cu',pos:'end',temp:false});
            },{markup:embedHtml(item.src),title:item.title});
            const after=await waitFor(page,s=>exactMatches(s,item.src).length===1,
              'Baked.live did not confirm iframe in '+group.channel);
            const added=exactMatches(after,item.src)[0];
            if(added.temp)throw Error('New iframe was only added temporarily');
            outcomes.push({channel:group.channel,title:item.title,status:'added',src:item.src});
            console.log('Verified permanent iframe added in '+group.channel+': '+item.src);
            state=after;
          }catch(error){
            outcomes.push({channel:group.channel,title:item.title,status:'failed',error:String(error.message||error).slice(0,180),src:item.src});
            console.log('Iframe batch item failed in '+group.channel+': '+String(error.message||error).slice(0,180));
          }
        }
      }
      const failed=outcomes.some(x=>x.status==='failed');
      return {request_id:request.request_id,channel:'multiple',action:request.action,
        status:failed?'partial':'completed',items:outcomes};
    }
    const already=exactMatches(initial,request.src);
    if(already.length>1)throw Error('Multiple existing copies of target iframe; refusing duplicate actions');
    if(request.channel==='ScaryTube'&&already.some(x=>x.temp))throw Error('Existing ScaryTube iframe is temporary; refusing duplicate');
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
    if(request.channel==='ScaryTube'){
      if(!initial.permissions.permanent)throw Error('ScaryTube permanent queue permission missing');
      const {backupCurrentSkin}=await import('./skin-backup.mjs');
      await backupCurrentSkin({page,request:{...request,action:'backup_skin'},initial});
      initial=await snapshot(page);
      if(!initial.connected||!initial.loggedIn||String(initial.username||'').toLowerCase()!==USERNAME||
         String(initial.channel||'').toLowerCase()!=='scarytube'||!Number.isFinite(initial.rank)||initial.rank<3||!initial.permissions.permanent)
        throw Error('ScaryTube authorization changed after backup');
      mutationAllowed(initial,request.action);
      const existing=exactMatches(initial,request.src);
      if(existing.length>1||existing.some(x=>x.temp))throw Error('Ambiguous or temporary ScaryTube entry; refusing duplicate');
      if(existing.length===1)return {request_id:request.request_id,channel:request.channel,action:request.action,status:'already-present',src:request.src};
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
  }finally{if(ownsBrowser)await browser.close();}
}
function selfTest(){
  legacyNativeSelfTest();
  assert.equal(validate({schema:1,request_id:'test_queue_attribution',channel:'MTV',action:'fix_queue_attribution'}).action,'fix_queue_attribution');
  const nativeInventory=validate({schema:1,request_id:'native_inventory_test',channel:'MTV',action:'inventory_legacy_native'});
  assert.equal(nativeInventory.action,'inventory_legacy_native');
  assert.throws(()=>validate({schema:1,request_id:'native_inventory_bad',channel:'ROH',action:'inventory_legacy_native'}));
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
  const removeUrl='https://buttocks.github.io/suplex-baked-player/slamvision-feed.html?id=p-tv';
  assert.equal(validate({schema:1,request_id:'test_remove_01',channel:'RetroWrestling',
    action:'remove_iframe',src:removeUrl}).src,removeUrl);
  const scary={schema:1,request_id:'scarytube_public_test',channel:'ScaryTube',action:'add_iframe',title:'ScaryTube — 24/7 Horror Movies',src:'https://pc-mint.tail7c671f.ts.net:10000/'};
  assert.equal(validate(scary).src,scary.src);
  const verifyScary={schema:1,request_id:'scarytube_verify_test',channel:'ScaryTube',action:'verify_scarytube_playback'};
  assert.equal(validate(verifyScary).action,verifyScary.action);
  assert.throws(()=>validate({...verifyScary,channel:'RDH'}));
  assert.throws(()=>validate({...verifyScary,src:scary.src}));
  for(const candidate of [
    {...scary,src:'https://pc-mint.tail7c671f.ts.net/'},
    {...scary,src:'https://pc-mint.tail7c671f.ts.net:10000/admin'},
    {...scary,channel:'RDH'},
    {...scary,channel:'luchatube'},
    {...scary,action:'replace_iframe',old_src:url},
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
      if(!raw.length||raw.length>(raw.every(r=>r?.action==='fix_queue_attribution'||r?.action==='inventory_chat_sync'||r?.action==='inventory_legacy_native'||r?.action==='retire_legacy_native'||r?.action==='add_iframe')?30:10))throw Error('Invalid audit batch size');
      const requests=raw.map(validate);
      if(requests.some(r=>r.action==='sync_wrestletube_chat')){
        const targets=requests.slice(1);
        if(requests[0].action!=='inventory_chat_sync'||requests[0].channel!=='Wrestling'||targets.length<1||targets.length>4||targets.some(r=>r.action!=='sync_wrestletube_chat')||new Set(targets.map(r=>r.channel)).size!==targets.length)throw Error('Sync requires fresh master followed by unique approved mirrors');
      }
      if(requests.some(r=>r.action==='pilot_chat_sync')&&!(requests.length===2&&requests[0].action==='inventory_chat_sync'&&requests[0].channel==='Wrestling'&&requests[1].action==='pilot_chat_sync'&&requests[1].channel==='wrestling2'))throw Error('Pilot requires fresh master inventory followed by Wrestling 2 only');
      if(requests.some(r=>!['audit_legacy_paths','backup_skin','audit_skin','audit_emotes','audit_playlist_media','clean_dead_playlist','plan_legacy_options','migrate_legacy_options','clean_dead_emotes','repair_dg_logo','fix_queue_attribution','inventory_chat_sync','inventory_legacy_native','retire_legacy_native','pilot_chat_sync','sync_wrestletube_chat','add_iframe'].includes(r.action)))throw Error('Unsupported batch operation');
      const results=[];
      const canReuseSession=requests.every(r=>['inventory_legacy_native','retire_legacy_native'].includes(r.action));
      let session=null;
      if(canReuseSession){
        const {chromium}=await import('playwright');
        const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
        const context=await browser.newContext({viewport:{width:1380,height:880},acceptDownloads:false});
        const page=await context.newPage();page.setDefaultTimeout(20000);
        try{await login(page,process.env.BAKED_LIVE_PASSWORD);session={browser,context,page};}
        catch(error){await browser.close();throw error;}
      }
      try{
        for(const request of requests){
          try{const result=await run(request,session);results.push(result);console.log('Batch '+request.channel+' '+result.status+(result.legacy?' admin='+result.admin_verified+' rank='+result.rank+' legacy='+Object.values(result.legacy).flat().length:''));}
          catch(error){results.push({channel:request.channel,status:'failed',error:String(error.message||error).slice(0,200)});console.log('Batch '+request.channel+' '+request.action+' failed: '+String(error.message||error).slice(0,200));if(requests.some(r=>r.action==='sync_wrestletube_chat'))break;}
          await fs.writeFile(OUTPUT_PATH,JSON.stringify({results},null,2)+'\n');
        }
      }finally{if(session)await session.browser.close();}
      if(results.some(r=>r.status==='failed'))process.exitCode=1;
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
