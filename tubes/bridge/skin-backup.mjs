/**
 * Read-only skin and channel configuration backup.
 * All files are written into a short-lived PRIVATE Actions artifact.
 * Do not publish the generated backup in the public GitHub repo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const DIR='tubes/bridge/backup';
const MAX_ASSETS=180;
const MAX_ASSET_BYTES=12*1024*1024;
const MAX_TOTAL_BYTES=95*1024*1024;

function hash(content){return createHash('sha256').update(content).digest('hex');}
function okUrl(raw){
  if(typeof raw!=='string')return null;
  try{
    const u=new URL(raw,'https://baked.live');
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname.length>255)return null;
    if(/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname))return null;
    return u.href;
  }catch{return null;}
}
function suffix(mime,url){
  const type=(mime||'').split(';')[0].toLowerCase();
  const known={'image/png':'.png','image/jpeg':'.jpg','image/gif':'.gif','image/webp':'.webp',
    'image/svg+xml':'.svg','image/avif':'.avif','image/bmp':'.bmp',
    'text/css':'.css','text/javascript':'.js','application/javascript':'.js'};
  if(known[type])return known[type];
  const ext=path.extname(new URL(url).pathname).toLowerCase();
  return /^\.(png|jpe?g|gif|webp|svg|avif|bmp|css|js)$/.test(ext)?ext:'.bin';
}
function sanitizeOptions(value){
  if(!value||typeof value!=='object')return {};
  const sensitive=/password|passphrase|token|secret|session|credential|oauth|auth|cookie|api.?key|private/i;
  return Object.fromEntries(Object.entries(value).filter(([key,val])=>
    !sensitive.test(key)&&['string','number','boolean'].includes(typeof val)).map(([k,v])=>[k,v]));
}
function discoverUrls(html,base){
  const found=[];
  if(!html)return found;
  const pattern=/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;
  let hit;
  while((hit=pattern.exec(html))!==null){try{found.push(new URL(hit[1],base).href);}catch{}}
  return found;
}
function cssUrls(css,base){
  const out=[];
  for(const match of (css||'').matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)){
    const src=match[2].trim();
    if(src.startsWith('data:'))continue;
    try{out.push(new URL(src,base).href);}catch{}
  }
  return out;
}

export async function backupCurrentSkin({page,request,initial}){
  await fs.mkdir(DIR+'/assets',{recursive:true});
  // Everything in the evaluation is READ ONLY. No emit(), admin changes,
  // public files, credential access, or playlist mutations.
  // Explicitly request the full ordered filter list from the server:
  // filters are not included in normal CHANNEL initialization.
  const filters=await page.evaluate(()=>new Promise((resolve,reject)=>{
    if(!window.socket||!window.socket.connected)return reject(Error('No channel socket for filter backup'));
    const timer=setTimeout(()=>reject(Error('Timed out requesting chat filters')),12000);
    window.socket.once('chatFilters',items=>{
      clearTimeout(timer);
      if(!Array.isArray(items))return reject(Error('Unexpected chat filters response'));
      resolve(items);
    });
    window.socket.emit('requestChatFilters');
  }));
  const state=await page.evaluate(()=>{
    const c=window.CHANNEL||{};
    const css=typeof c.css==='string'?c.css:'';
    const js=typeof c.js==='string'?c.js:'';
    const motd=typeof c.motd==='string'?c.motd:'';
    const selectors=['html','body','#wrap','#header','#motd','#motdwrap','#main',
      '#mainpage','#videowrap','#chatwrap','#messagebuffer','#userlist','#queue',
      '#chatheader','#videowrap-header','#plmeta'];
    const computed={};
    for(const sel of selectors){
      const el=document.querySelector(sel);
      if(!el)continue;
      const st=getComputedStyle(el);
      computed[sel]={backgroundImage:st.backgroundImage,backgroundColor:st.backgroundColor,
        color:st.color,borderColor:st.borderTopColor,fontFamily:st.fontFamily,
        fontSize:st.fontSize};
    }
    const domImages=[...document.querySelectorAll('img')].map(el=>({
      src:el.getAttribute('src')||'',resolvedSrc:el.currentSrc||el.src||'',
      alt:el.getAttribute('alt')||'',parent:el.parentElement?.id||'',
      className:typeof el.className==='string'?el.className:''})).slice(0,240);
    const resourceLinks=[...document.querySelectorAll('link[rel="stylesheet"],script[src]')].map(el=>({
      type:el.tagName.toLowerCase(),url:el.href||el.src||'',id:el.id||''})).slice(0,120);
    // Store a portable description of the playlist as an extra safety net.
    const playlist=[...document.querySelectorAll('#queue .queue_entry')].map((el,index)=>{
      const data=window.jQuery?window.jQuery(el).data('media')||{}:{};
      return {index,uid:window.jQuery?window.jQuery(el).data('uid'):null,
        temp:!!(window.jQuery?window.jQuery(el).data('temp'):false),
        title:data.title||el.querySelector('.qe_title')?.textContent||'',
        type:data.type||null,id:data.id||null,seconds:data.seconds||null,
        source:data.meta?.embed?.src||null};
    });
    return {
      channel:c.name||'',css,js,motd,
      options:c.opts||{},permissions:c.perms||{},
      emotes:c.emotes||null,
      macroInterface:{buttonLabel:document.querySelector('#emotelistbtn')?.textContent||'',
        macroKeys:Object.keys(c).filter(k=>/macro/i.test(k))},
      backgroundStyles:computed,
      domImages,resourceLinks,playlist,
      title:document.title,page:location.origin+location.pathname,
      capturedAt:new Date().toISOString()
    };
  });
  if(String(state.channel).toLowerCase()!==String(request.channel).toLowerCase())throw Error('Backup channel identity mismatch');
  if(!Array.isArray(state.emotes))
    throw Error('Emote list not loaded; refusing incomplete backup');
  const emoteList=state.emotes.map(e=>({name:e.name,image:e.image,source:e.source}))
    .filter(e=>typeof e.name==='string'&&typeof e.image==='string');
  if(emoteList.length!==state.emotes.length)throw Error('Emote list contains invalid entries');
  const opts=sanitizeOptions(state.options);
  const sources={
    'skin-inline.css':state.css,
    'skin-inline.js':state.js,
    'motd.html':state.motd,
    'channel-options.json':JSON.stringify(opts,null,2)+'\n',
    'channel-permissions.json':JSON.stringify(state.permissions,null,2)+'\n',
    'channel-emotes.json':JSON.stringify(state.emotes,null,2)+'\n',
    'emote-import.json':JSON.stringify(emoteList,null,2)+'\n',
    'macros-emotes.json':JSON.stringify(emoteList,null,2)+'\n',
    'macro-interface.json':JSON.stringify(state.macroInterface,null,2)+'\n',
    'chat-filters.json':JSON.stringify(filters,null,2)+'\n',
    'playlist-snapshot.json':JSON.stringify(state.playlist,null,2)+'\n',
    'page-styles.json':JSON.stringify(state.backgroundStyles,null,2)+'\n',
    'dom-images.json':JSON.stringify(state.domImages,null,2)+'\n',
    'resource-links.json':JSON.stringify(state.resourceLinks,null,2)+'\n'
  };
  for(const [name,data] of Object.entries(sources))await fs.writeFile(DIR+'/'+name,data,'utf8');
  await page.screenshot({path:DIR+'/'+request.channel.toLowerCase()+'-before.png',fullPage:true,
    animations:'disabled',timeout:30000});
  const external={
    externalCss:state.options?.externalcss||'',
    externalJs:state.options?.externaljs||''
  };
  const resources=[];
  function add(raw,group){
    const url=okUrl(raw);
    if(!url)return;
    let entry=resources.find(x=>x.url===url);
    if(entry){if(!entry.groups.includes(group))entry.groups.push(group);return;}
    resources.push({url,groups:[group],status:'not-attempted'});
  }
  for(const url of cssUrls(state.css,state.page))add(url,'inline-css');
  for(const url of cssUrls(state.motd,state.page))add(url,'motd-css');
  for(const url of discoverUrls(state.motd,state.page))add(url,'motd-html');
  for(const value of Object.values(state.backgroundStyles)){
    for(const url of cssUrls(value.backgroundImage,state.page))add(url,'computed-background');
  }
  for(const img of state.domImages)add(img.resolvedSrc||img.src,'dom-image');
  for(const [key,val] of Object.entries(external))if(val)add(val,key);
  // Resource links are documented but not downloaded: they include platform
  // libraries and are not necessarily part of the owner's skin.
  // Only CSS/MOTD/background artwork, DOM images and explicit external URLs.
  const fetchContext=await page.context().browser().newContext();
  // No authenticated cookies are carried to public image hosts.
  const client=fetchContext.request;
  let downloaded=0,totalBytes=0,nextIndex=0;
  async function worker(){
    while(true){
      const i=nextIndex++;
      if(i>=resources.length)return;
      const resource=resources[i];
      if(i>=MAX_ASSETS){resource.status='skipped-limit';continue;}
      if(totalBytes>=MAX_TOTAL_BYTES){resource.status='skipped-total-size-limit';continue;}
      try{
        const response=await client.get(resource.url,{timeout:18000,maxRedirects:3});
        const mime=(response.headers()['content-type']||'').split(';')[0].toLowerCase();
        const declared=Number(response.headers()['content-length']||0);
        if(!response.ok())throw Error('HTTP '+response.status());
        if(declared>MAX_ASSET_BYTES)throw Error('exceeds per-file limit');
        if(!/^image\/(png|jpeg|gif|webp|svg\+xml|avif|bmp)$/.test(mime)&&
           !(resource.groups.includes('externalCss')&&mime==='text/css')&&
           !(resource.groups.includes('externalJs')&&/^(text|application)\/javascript$/.test(mime)))
          throw Error('not a recognized image/style/script ('+mime+')');
        const data=await response.body();
        if(data.byteLength>MAX_ASSET_BYTES||totalBytes+data.byteLength>MAX_TOTAL_BYTES)
          throw Error('backup size limit reached');
        const filename=String(i+1).padStart(3,'0')+'-'+hash(resource.url).slice(0,12)+suffix(mime,resource.url);
        await fs.writeFile(DIR+'/assets/'+filename,data);
        resource.savedAs='assets/'+filename;
        resource.mime=mime;
        resource.bytes=data.byteLength;
        resource.sha256=hash(data);
        resource.status='saved';downloaded++;totalBytes+=data.byteLength;
      }catch(error){
        resource.status='unavailable';
        resource.reason=String(error.message||error).slice(0,140);
      }
    }
  }
  await Promise.all(Array.from({length:8},()=>worker()));
  await fetchContext.close();
  const info={
    schema:1,backupType:'Baked.live '+state.channel+' skin and channel snapshot',
    channel:state.channel,account:'buttman-gpt',capturedAt:state.capturedAt,
    page:state.page,title:state.title,
    cssBytes:Buffer.byteLength(state.css),jsBytes:Buffer.byteLength(state.js),
    motdBytes:Buffer.byteLength(state.motd),
    cssSha256:hash(state.css),jsSha256:hash(state.js),
    motdSha256:hash(state.motd),
    playlistItems:state.playlist.length,chatFilters:filters.length,emotes:emoteList.length,
    references:resources,downloadedAssets:downloaded,assetBytes:totalBytes,
    allAssetsSaved:resources.every(r=>r.status==='saved'),
    external
  };
  await fs.writeFile(DIR+'/BACKUP-MANIFEST.json',JSON.stringify(info,null,2)+'\n');
  const readme=[
    '# '+state.channel+' original skin backup',
    '',
    'Captured (UTC): '+state.capturedAt,
    'Channel: '+state.page,
    '',
    'Original inline CSS: skin-inline.css',
    'Original inline JavaScript: skin-inline.js',
    'Original MOTD HTML: motd.html',
    'Appearance/channel options: channel-options.json',
    'Original channel permissions: channel-permissions.json',
    'Original emote metadata: channel-emotes.json',
    'Restorable emote data: emote-import.json, macros-emotes.json',
    'Original ordered chat filters: chat-filters.json',
    'Macro UI configuration: macro-interface.json',
    'Original playlist metadata for reference: playlist-snapshot.json',
    'Background and stylesheet runtime values: page-styles.json',
    'Page images/stylesheet sources: dom-images.json, resource-links.json',
    'Screenshot: '+request.channel.toLowerCase()+'-before.png',
    'Downloaded artwork/resources: assets/ and BACKUP-MANIFEST.json',
    '',
    'A backup does not modify the live channel.',
    'To restore the skin, paste the backed-up CSS, JS and MOTD into',
    'the matching Baked.live channel-settings editors and restore the',
    'external CSS/JS URLs and other appearance settings as needed.',
    'Do not blindly overwrite unrelated channel settings or playlist.',
    '',
    'Some image hosts may block third-party downloads. Their original',
    'URLs and download status are preserved in BACKUP-MANIFEST.json.',
    '',
    'SECURITY: The original channel JavaScript may contain sensitive',
    'code. Keep this backup private; do not commit it to a public repo.',
    ''
  ].join('\n');
  await fs.writeFile(DIR+'/README-RESTORE.txt',readme,'utf8');
  console.log('Skin backup captured: '+state.channel+
    ', CSS='+info.cssBytes+'B, JS='+info.jsBytes+'B, MOTD='+info.motdBytes+
    'B, images='+downloaded+'/'+resources.length+
    ', playlist='+info.playlistItems);
  return {request_id:request.request_id,channel:request.channel,action:request.action,
    status:'skin-backed-up',cssBytes:info.cssBytes,jsBytes:info.jsBytes,
    filters:info.chatFilters,emotes:info.emotes,
    motdBytes:info.motdBytes,playlistItems:info.playlistItems,
    assetsFound:resources.length,assetsDownloaded:downloaded,
    missingAssets:resources.filter(r=>r.status!=='saved').map(r=>({url:r.url,reason:r.reason||r.status})),
    cssSha256:info.cssSha256,jsSha256:info.jsSha256};
}
