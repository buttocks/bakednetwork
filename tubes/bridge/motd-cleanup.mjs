import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const ORIGINAL_MOTD_SHA='400bf34f85927b3d0ba89538add6a3019cfab0acd3925f3c7c12ced2984aaaab';
const LINK_BUTTON='        <button class="btn btn-default" data-toggle="modal" data-target="#links">Links</button>\n';
const LINK_OPEN='    <div id="links" class="modal fade" role="dialog">';
const RULES_OPEN='    <div id="rules" class="modal fade" role="dialog">';
const CREDIT='External Javascript is provided by Xaekai support them on <a href="https://www.patreon.com/Xaekai">Patreon</a><br />';
const sha=s=>createHash('sha256').update(s).digest('hex');

function exactlyOnce(s,pattern,label){
  const first=s.indexOf(pattern);
  if(first<0||s.indexOf(pattern,first+pattern.length)>=0)throw Error('Expected exactly one '+label);
  return first;
}

export function cleanLuchaMotd(motd){
  if(typeof motd!=='string')throw Error('MOTD not available');
  const start=exactlyOnce(motd,LINK_OPEN,'Links popup');
  const end=exactlyOnce(motd,RULES_OPEN,'Rules popup');
  if(start>=end)throw Error('Unexpected modal order; refusing cleanup');
  exactlyOnce(motd,LINK_BUTTON,'Links button');
  exactlyOnce(motd,CREDIT,'Xaekai Patreon credit');
  const next=(motd.slice(0,start)+motd.slice(end))
    .replace(LINK_BUTTON,'')
    .replace(CREDIT,'');
  if(next.length>=motd.length)throw Error('Nothing was removed');
  if(next.includes('id="links"')||next.includes('data-target="#links"')||
     /External Javascript is provided by Xaekai/i.test(next))
    throw Error('Unwanted MOTD content survived cleanup');
  if(!next.includes('data-target="#rules"')||
     !next.includes('id="rules"')||
     !next.includes('Welcome to Lucha Tube!')||
     !next.includes('https://i.imgur.com/GQsScF2.png')||
     !next.includes('All times are Pacific standard time PST'))
    throw Error('Required MOTD artwork, welcome or rules missing');
  return next;
}

export async function cleanLuchaMotdLive({page,request,initial}){
  if(request.channel!=='luchatube'||initial.rank<3||!initial.loggedIn)
    throw Error('Verified Lucha Tube Admin access required');
  const state=await page.evaluate(()=>({
    name:window.CHANNEL?.name,
    motd:window.CHANNEL?.motd,
    css:window.CHANNEL?.css,
    js:window.CHANNEL?.js
  }));
  if(state.name!=='luchatube'||typeof state.css!=='string'||
     typeof state.js!=='string')throw Error('Missing channel configuration');
  if(typeof state.motd!=='string')throw Error('No channel MOTD loaded');
  if(!state.motd.includes('data-target="#links"') &&
     !state.motd.includes('External Javascript is provided by Xaekai')){
    return {request_id:request.request_id,channel:request.channel,
      action:request.action,status:'already-cleaned',motdSha256:sha(state.motd)};
  }
  if(sha(state.motd)!==ORIGINAL_MOTD_SHA)
    throw Error('Live MOTD differs from original saved backup; not replacing unreviewed content');
  const cleaned=cleanLuchaMotd(state.motd);
  await fs.writeFile('tubes/bridge/motd-before-cleanup.html',state.motd,'utf8');
  await fs.writeFile('tubes/bridge/motd-after-cleanup.html',cleaned,'utf8');
  // Server-side permission check and HTML sanitization happen in Baked.live.
  await page.evaluate(motd=>{
    if(!window.socket?.connected)throw Error('Not connected to Baked.live');
    window.socket.emit('setMotd',{motd});
  },cleaned);
  const started=Date.now();
  while(Date.now()-started<20000){
    const current=await page.evaluate(()=>({
      motd:window.CHANNEL?.motd,css:window.CHANNEL?.css,js:window.CHANNEL?.js
    }));
    const body=current.motd||'';
    if(body.includes('id="rules"') &&
       body.includes('Welcome to Lucha Tube!') &&
       !body.includes('id="links"') &&
       !body.includes('data-target="#links"') &&
       !body.includes('External Javascript is provided by Xaekai')){
      if(current.js!==state.js||current.css!==state.css)
        throw Error('CSS or JavaScript changed concurrently; review live channel');
      return {request_id:request.request_id,channel:request.channel,
        action:request.action,status:'motd-cleaned',
        previousLength:state.motd.length,currentLength:body.length,
        removed:['Links button and modal','Xaekai external-Javascript / Patreon line'],
        cssPreserved:true,jsPreserved:true,originalMotdSha256:sha(state.motd),
        newMotdSha256:sha(body)};
    }
    await page.waitForTimeout(300);
  }
  throw Error('Baked.live did not confirm MOTD cleanup; inspect channel before retrying');
}
