import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='rdh-native-whispers-review';
await fs.mkdir(dir,{recursive:true});
const candidate='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@e408796c64721db355a6ca1af1f28efcc344c9e4/tubes/RDH/rdh-custom-only-v1.9.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
const loader=/^\/js\/channel-loaders\/[a-f0-9]{64}\.js$/;
const ownedSource=s=>/^https:\/\/cdn\.jsdelivr\.net\/gh\/buttocks\/bakednetwork@[^/]+\/tubes\/RDH\/rdh-custom-only-v\d+\.\d+(?:\.\d+)?\.js$/.test(s)||loader.test(s);
try {
  await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
  const form=page.locator('form[action="/login"]').last();
  await form.locator('input[name="name"]').fill('buttman-gpt');
  await form.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);
  await form.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CHANNEL?.name?.toLowerCase()==='rdh',null,{timeout:45000});
  const before=await state();
  if(!auth(before))throw Error('RDH admin session was not confirmed; no channel setting changed.');
  let activeCode='';
  if(before.externaljs){
    const activeUrl=before.externaljs.startsWith('/')?'https://baked.live'+before.externaljs:before.externaljs;
    try{const active=await page.request.get(activeUrl,{timeout:20000});if(active.ok())activeCode=await active.text();await active.dispose()}catch{}
  }
  const activeHasFade=activeCode.includes('__rdhPresenceDissolve')||activeCode.includes('rdh-presence-fading')||activeCode.includes('fade-server-msg');
  console.log('RDH_NO_FADE_PRECHECK '+JSON.stringify({externaljs:before.externaljs,activeBytes:activeCode.length,activeHasFade,inlineBytes:before.js.length,inlineHasFade:/__rdhPresenceDissolve|rdh-presence-fading|rdh-presence-dissolve|fade-server-msg/.test(before.js),externalCssHasFade:/fade-server-msg|rdh-presence/.test(before.externalcss),channelCssHasFade:/fade-server-msg|rdh-presence/.test(before.css),channelCssExcerpt:(()=>{const x=String(before.css||''),i=x.search(/fade-server-msg|rdh-presence/i);return i<0?'':x.slice(Math.max(0,i-100),i+220)})()}));
  if(!ownedSource(before.externaljs)&&!activeHasFade)throw Error('RDH external script does not match a known RDH build with the whisper fade; refusing to replace it.');
  const response=await page.request.get(candidate,{timeout:25000});
  if(!response.ok())throw Error('Candidate script could not be fetched.');
  const code=await response.text();
  if(code.includes('__rdhPresenceDissolve')||code.includes('rdh-presence-fading')||code.includes('rdh-presence-dissolve'))throw Error('Candidate still contains the whisper fade.');
  new Function(code);
  await page.evaluate(({value,expected})=>{
    const c=window.CHANNEL,o=c.opts||{};
    if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||(o.externaljs||'')!==expected)throw Error('RDH settings changed concurrently; no write sent.');
    window.socket.emit('setOptions',{externaljs:value});
  },{value:candidate,expected:before.externaljs});
  let after=null;
  for(let i=0;i<100;i++){
    after=await state();
    if(after.externaljs===candidate||loader.test(after.externaljs))break;
    await page.waitForTimeout(250);
  }
  if(!(after.externaljs===candidate||loader.test(after.externaljs)))throw Error('RDH did not confirm the new external script setting.');
  if(after.js!==before.js||after.css!==before.css||after.motd!==before.motd||after.externalcss!==before.externalcss)throw Error('Unexpected channel setting changed.');
  if(loader.test(after.externaljs)){
    const loaded=await page.request.get('https://baked.live'+after.externaljs,{timeout:20000});
    const loadedCode=await loaded.text();
    if(!loaded.ok()||loadedCode.includes('__rdhPresenceDissolve')||loadedCode.includes('rdh-presence-fading'))throw Error('Saved RDH loader did not resolve to the no-fade script.');
  }
  const report={status:'saved',externaljs:after.externaljs,inlineJsPreserved:true,channelCssPreserved:true,motdPreserved:true};
  await fs.writeFile(dir+'/result.json',JSON.stringify(report,null,2));
  console.log('RDH_NO_WHISPER_FADE '+JSON.stringify(report));
} finally {
  await browser.close();
}