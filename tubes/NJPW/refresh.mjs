import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const FILE='tubes/NJPW/arena-skin.css';
const DIR='tubes/bridge';
const BEGIN='/* BEGIN NJPW COMPACT ARENA SKIN — MANAGED */';
const END='/* END NJPW COMPACT ARENA SKIN — MANAGED */';
const BASE_MOTD='fe1771c2590c554794f995325b6870d36a5a9454a7d55bd0c230b8a60b0812b4';
const BASE_CSS='1bb726ab73c4234e94a1f57b501d72812a0d24083177e44bcb31efcd53468e4d';
const hash=s=>createHash('sha256').update(s).digest('hex');

function once(s,needle,name){
  const p=s.indexOf(needle);
  if(p<0||s.indexOf(needle,p+needle.length)>=0)
    throw Error('Expected exactly one '+name+'; not modifying MOTD');
  return p;
}
export function removeNJPWLinks(motd){
  if(typeof motd!=='string')throw Error('NJPW MOTD missing');
  const start=once(motd,'    <div id="links" class="modal fade" role="dialog">','Links modal');
  const end=once(motd,'    <div id="rules" class="modal fade" role="dialog">','Rules modal');
  if(start>=end)throw Error('Unexpected NJPW modal order');
  const button='        <button class="btn btn-default" data-toggle="modal" data-target="#links">Links</button>\n';
  once(motd,button,'Links button');
  const updated=(motd.slice(0,start)+motd.slice(end)).replace(button,'');
  if(updated.includes('data-target="#links"')||updated.includes('id="links"')||
     !updated.includes('data-target="#rules"')||!updated.includes('id="rules"')||
     !updated.includes('New_Japan_Pro_Wrestling_Logo_2.svg')||
     !updated.includes("Don't break kayfabe"))
    throw Error('MOTD preservation/cleanup check failed');
  return updated;
}
async function read(page){
  return page.evaluate(()=>({
    name:window.CHANNEL?.name,
    css:window.CHANNEL?.css,
    js:window.CHANNEL?.js,
    motd:window.CHANNEL?.motd,
    externalCss:window.CHANNEL?.opts?.externalcss||'',
    externalJs:window.CHANNEL?.opts?.externaljs||''
  }));
}
async function confirmed(page,predicate,message){
  for(let i=0;i<65;i++){
    const state=await read(page);
    if(predicate(state))return state;
    await page.waitForTimeout(250);
  }
  throw Error(message);
}
export async function refreshNJPWMotdSkin({page,request,initial}){
  if(request.channel!=='NJPW'||String(initial.channel)!=='NJPW'||
     initial.rank<3||!initial.loggedIn)
    throw Error('Verified NJPW admin required');
  const before=await read(page);
  if(before.name!=='NJPW'||typeof before.motd!=='string'||
     typeof before.css!=='string'||typeof before.js!=='string')
    throw Error('NJPW channel state incomplete');
  const managed=(await fs.readFile(FILE,'utf8')).trim();
  if(managed.length<2000||managed.length>12000||
     managed.includes('@import')||/background-image\s*:\s*url\(/i.test(managed))
    throw Error('Unsafe or unexpectedly sized NJPW CSS');
  const editedMotd=before.motd.includes('data-target="#links"')
    ?removeNJPWLinks(before.motd):before.motd;
  const motdChange=editedMotd!==before.motd;
  if(motdChange && hash(before.motd)!==BASE_MOTD)
    throw Error('NJPW MOTD differs from approved original; no changes deployed');
  if(!editedMotd.includes('id="rules"')||editedMotd.includes('data-target="#links"'))
    throw Error('MOTD missing Rules or still contains Links');
  const marker=BEGIN+'\n'+managed+'\n'+END;
  let editedCss;
  const start=before.css.indexOf(BEGIN),end=before.css.indexOf(END);
  if(start<0&&end<0){
    if(hash(before.css)!==BASE_CSS)
      throw Error('NJPW CSS differs from original; refuse to overwrite unknown changes');
    editedCss=before.css+'\n\n'+marker+'\n';
  }else if(start>=0&&end>start){
    editedCss=before.css.slice(0,start)+marker+before.css.slice(end+END.length);
  }else throw Error('Invalid managed NJPW CSS markers');
  if(editedCss.length>20000)throw Error('NJPW inline CSS would exceed 20KB cap');
  await fs.writeFile(DIR+'/njpw-before-motd.html',before.motd,'utf8');
  await fs.writeFile(DIR+'/njpw-after-motd.html',editedMotd,'utf8');
  await fs.writeFile(DIR+'/njpw-before-css.css',before.css,'utf8');
  await fs.writeFile(DIR+'/njpw-after-css.css',editedCss,'utf8');
  if(motdChange){
    await page.evaluate(motd=>{
      if(!window.socket?.connected)throw Error('Disconnected before MOTD update');
      window.socket.emit('setMotd',{motd});
    },editedMotd);
    await confirmed(page,s=>s.motd?.includes('id="rules"')&&
      !s.motd.includes('id="links"')&&!s.motd.includes('data-target="#links"'),
      'Baked.live did not acknowledge NJPW Links dropdown removal');
  }
  if(editedCss!==before.css){
    await page.evaluate(css=>{
      if(!window.socket?.connected)throw Error('Disconnected before CSS update');
      window.socket.emit('setChannelCSS',{css});
    },editedCss);
    await confirmed(page,s=>s.css===editedCss,
      'Baked.live did not acknowledge NJPW CSS update');
  }
  await page.waitForTimeout(650);
  const after=await read(page);
  if(after.js!==before.js||after.externalCss!==before.externalCss||
     after.externalJs!==before.externalJs)
    throw Error('Unexpected channel JavaScript or external assets change detected');
  if(after.motd.includes('data-target="#links"')||after.motd.includes('id="links"'))
    throw Error('Links still visible after update');
  const metrics=await page.evaluate(()=>{
    const r=sel=>{const e=document.querySelector(sel);const b=e?.getBoundingClientRect();return b?{width:Math.round(b.width),height:Math.round(b.height)}:null;};
    const banner=document.querySelector('#motdwrap')?.getBoundingClientRect();
    const logo=document.querySelector('#motdwrap #header img')?.getBoundingClientRect();
    const logoCenterOffsetPx=banner&&logo?
      Math.round((logo.left+logo.width/2)-(banner.left+banner.width/2)):null;
    return {motd:r('#motdwrap'),logo:r('#motdwrap #header img'),
      logoCenterOffsetPx,
      rules:r('#motdwrap [data-target="#rules"]'),
      linksCount:document.querySelectorAll('#motdwrap [data-target="#links"],#motdwrap #links').length};
  });
  if(metrics.linksCount!==0||!metrics.logo||!metrics.rules ||
     metrics.logoCenterOffsetPx===null || Math.abs(metrics.logoCenterOffsetPx)>3)
    throw Error('Visual verification failed: NJPW lion logo must be centered to within 3px');
  await page.screenshot({path:DIR+'/njpw-compact-skin-preview.png',fullPage:false,animations:'disabled'});
  return {
    request_id:request.request_id,channel:request.channel,action:request.action,
    status:editedMotd===before.motd&&editedCss===before.css?'already-current':'deployed',
    removedLinks:motdChange,skinApplied:editedCss===after.css,
    cssBytes:Buffer.byteLength(after.css),metrics,
    originalMotdSha256:hash(before.motd),newMotdSha256:hash(after.motd),
    originalCssSha256:hash(before.css),newCssSha256:hash(after.css),
    jsPreserved:true,externalAssetsPreserved:true
  };
}
