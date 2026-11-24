import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const BEGIN='/* BEGIN LUCHATUBE ARENA POSTER — MANAGED STYLE */';
const END='/* END LUCHATUBE ARENA POSTER — MANAGED STYLE */';
const ORIGINAL_CSS_SHA='fe4c66bf1dadfe13b5f7de6556c85bed2ad1c97ea3059f29c1416ed0a9ec6ba6';
const ORIGINAL_JS_SHA='206f72fa8f6b4e6fd14714547b63605350da1e44a1f8cf0ea8b61b9c218d645b';
const MAX_CSS=20000;
const CSS_PATH='baked.live/tubes/luchatube/arena-poster.css';
const sha=x=>createHash('sha256').update(x).digest('hex');

export async function deploySkin({page,request,initial}){
  if(initial.rank<3 || initial.channel!=='luchatube')
    throw Error('Verified Lucha Tube admin rank required for CSS update');

  const before=await page.evaluate(()=>({
    name:window.CHANNEL?.name,
    css:window.CHANNEL?.css,
    js:window.CHANNEL?.js,
    motd:window.CHANNEL?.motd,
    externalCss:window.CHANNEL?.opts?.externalcss
  }));
  if(before.name!=='luchatube' || typeof before.css!=='string' ||
     typeof before.js!=='string')throw Error('Channel did not provide original CSS/JS');
  if(sha(before.js)!==ORIGINAL_JS_SHA)
    throw Error('Channel JavaScript differs from backed-up baseline; no CSS change made');

  const newLayer=(await fs.readFile(CSS_PATH,'utf8')).trim();
  if(newLayer.length<1500||newLayer.length>11500)throw Error('Invalid CSS layer length');
  if(/background-image\s*:\s*url\(/i.test(newLayer))throw Error('Managed CSS cannot replace background art');
  if(/@import/i.test(newLayer))throw Error('Managed CSS cannot add remote style imports');
  let target;
  const start=before.css.indexOf(BEGIN),end=before.css.indexOf(END);
  if(start!==-1 && end>start){
    const previous=before.css.slice(start,end+END.length);
    const candidate=BEGIN+'\n'+newLayer+'\n'+END;
    if(previous===candidate)return {request_id:request.request_id,channel:request.channel,
      action:request.action,status:'already-deployed',cssSha256:sha(before.css),
      cssBytes:Buffer.byteLength(before.css),jsPreserved:true};
    // Update an existing managed layer while protecting the original preceding CSS.
    target=before.css.slice(0,start)+candidate+before.css.slice(end+END.length);
  }else if(start<0&&end<0){
    if(sha(before.css)!==ORIGINAL_CSS_SHA)throw Error('Original CSS changed since backup; refusing unreviewed append');
    target=before.css+'\n\n'+BEGIN+'\n'+newLayer+'\n'+END+'\n';
  }else throw Error('Incomplete managed marker found; refusing automatic update');
  if(target.length>MAX_CSS)throw Error('CSS would exceed CyTube 20KB limit');
  await fs.writeFile('baked.live/tubes/bridge/skin-before-deploy.css',before.css,'utf8');
  await fs.writeFile('baked.live/tubes/bridge/skin-after-deploy.css',target,'utf8');

  await page.evaluate(css=>{
    if(!window.socket?.connected)throw Error('Not connected to Baked.live');
    window.socket.emit('setChannelCSS',{css});
  },target);
  const started=Date.now();
  while(Date.now()-started<20000){
    const state=await page.evaluate(()=>({
      css:window.CHANNEL?.css,js:window.CHANNEL?.js,
      name:window.CHANNEL?.name
    }));
    if(state.css===target){
      if(sha(state.js)!==sha(before.js))throw Error('JavaScript changed during CSS deployment');
      // Confirm rendered geometry, not only that the server stored CSS.
      const logoLayout=await page.evaluate(()=>{
        const banner=document.querySelector('#motdwrap');
        const img=document.querySelector('#motdwrap #motd img[src*="GQsScF2"]');
        const cropped=document.querySelector('#motdwrap #motd > .head2 > center:first-child');
        const welcome=document.querySelector('#motdwrap #motd > .head2 > .head2 > h4');
        const rect=el=>el?el.getBoundingClientRect():null;
        const b=rect(banner),i=rect(img),c=rect(cropped),w=rect(welcome);
        return {bannerHeight:b?Math.round(b.height):null,
          logoImageWidth:i?Math.round(i.width):null,
          logoImageHeight:i?Math.round(i.height):null,
          visibleLogoHeight:c?Math.round(c.height):null,
          welcomeGap:c&&w?Math.round(w.top-c.bottom):null,
          croppedOverflow:cropped?getComputedStyle(cropped).overflow:null};
      });
      if(logoLayout.logoImageWidth===null||logoLayout.visibleLogoHeight===null)
        throw Error('MOTD logo elements not found; CSS stored but visual verification failed');
      if(logoLayout.croppedOverflow!=='hidden')
        throw Error('Logo image overflow not clipped as expected');
      await page.screenshot({path:'baked.live/tubes/bridge/luchatube-arena-poster-preview.png',
        fullPage:false,animations:'disabled',timeout:20000});
      return {request_id:request.request_id,channel:request.channel,action:request.action,
        status:'deployed',originalCssSha256:sha(before.css),cssSha256:sha(target),
        originalJsSha256:sha(before.js),cssBytes:Buffer.byteLength(target),
        logoLayout,jsPreserved:true,motdPreserved:true,externalCssPreserved:true};
    }
    await page.waitForTimeout(250);
  }
  throw Error('Baked.live did not confirm the new CSS; inspect channel before any retry');
}
