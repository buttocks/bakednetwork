import fs from 'node:fs/promises';
import {inventoryChatSync} from './chat-sync-inventory.mjs';

const root='tubes/bridge/backup/chat-sync';
const config=JSON.parse(await fs.readFile('tubes/shared/wrestling-chat-sync.json','utf8'));
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const macroView=x=>x.map(e=>({name:e.name,image:e.image,...(e.source===undefined?{}:{source:e.source})}));
const payload=(kind,x)=>kind==='macros'?x.map(e=>({name:e.name,image:e.image})):x;
const events={macros:{send:'importEmotes',receive:'emoteList'},filters:{send:'importFilters',receive:'chatFilters'}};
function validateSnapshot(s,channel){
 if(s.channel!==channel||!Array.isArray(s.filters)||!s.filters.length||!Array.isArray(s.macros)||!s.macros.length)throw Error('Incomplete snapshot: '+channel);
 if(!s.macros.every(e=>typeof e.name==='string'&&e.name.length&&typeof e.image==='string'&&e.image.length))throw Error('Invalid macro export: '+channel);
 if(!s.filters.every(f=>typeof f.name==='string'&&typeof f.source==='string'&&typeof f.flags==='string'&&typeof f.replace==='string'&&typeof f.active==='boolean'&&typeof f.filterlinks==='boolean'))throw Error('Invalid filter export: '+channel);
 for(const [id,event] of [['cs-emotes-import','importEmotes'],['cs-chatfilters-import','importFilters']]){
  const found=s.protocol?.find(e=>e.id===id);
  if(!found||![...found.handlers,found.inline||''].some(h=>h.includes(event)))throw Error('Native import protocol not confirmed: '+channel);
 }
}
export async function pilotChatSync({page,request,initial}){
 if(!['wrestling2','wrestling3','Wrestling4','wrestling5'].includes(request.channel)||!config.targets.includes(request.channel)||config.master!=='Wrestling'||config.mode!=='exact-one-way')throw Error('Outside approved WrestleTube scope');
 const master=JSON.parse(await fs.readFile(root+'/'+config.master+'.json','utf8'));
 validateSnapshot(master,config.master);
 if(Date.now()-Date.parse(master.at)>10*60*1000)throw Error('Master snapshot expired');
 await inventoryChatSync({page,request,initial});
 const before=JSON.parse(await fs.readFile(root+'/'+request.channel+'.json','utf8'));
 validateSnapshot(before,request.channel);
 const dir=root+'/'+request.channel+'-pilot';
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const report={channel:request.channel,master:config.master,steps:[],status:'started'};
 const save=()=>fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));
 const read=kind=>page.evaluate(async ({channel,kind})=>{
  const guard=()=>{if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT.rank<10||String(window.CLIENT.name).toLowerCase()!=='buttman-gpt'||String(window.CHANNEL?.name).toLowerCase()!==channel.toLowerCase())throw Error('Verified global administrator required')};
  guard();
  if(kind==='macros'){
   if(!Array.isArray(window.CHANNEL.emotes))throw Error('Macro list unavailable');
   return window.CHANNEL.emotes.map(e=>({name:e.name,image:e.image,...(e.source===undefined?{}:{source:e.source})}));
  }
  return new Promise((resolve,reject)=>{
   const sk=window.socket;
   const done=x=>{clearTimeout(timer);try{guard();if(!Array.isArray(x))throw Error('Invalid filter list');resolve(x)}catch(e){reject(e)}};
   const timer=setTimeout(()=>{sk.off?.('chatFilters',done);reject(Error('Filter read timed out'))},15000);
   sk.once('chatFilters',done);sk.emit('requestChatFilters');
  });
 },{channel:request.channel,kind});
 const emit=async(kind,items)=>page.evaluate(({channel,kind,items,event})=>new Promise((resolve,reject)=>{
  const sk=window.socket;
  if(!sk?.connected||!window.CLIENT?.logged_in||window.CLIENT.rank<10||String(window.CLIENT.name).toLowerCase()!=='buttman-gpt'||String(window.CHANNEL?.name).toLowerCase()!==channel.toLowerCase())return reject(Error('Global admin identity changed'));
  const unbind=()=>{clearTimeout(timer);sk.off?.(event.receive,onList)};
  const onList=x=>{unbind();resolve({ack:Array.isArray(x)})};
  const timer=setTimeout(()=>{unbind();resolve({ack:false})},30000);
  sk.on(event.receive,onList);
  try{sk.emit(event.send,items)}catch(e){unbind();reject(e)}
 }),{channel:request.channel,kind,items:payload(kind,items),event:events[kind]});
 const state=async()=>page.evaluate(()=>({css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs,permissions:window.CHANNEL?.perms}));
 const unchanged=await state(),attempts=[];
 try{
  for(const kind of ['macros','filters']){
   const original=kind==='macros'?macroView(before.macros):before.filters;
   const desired=kind==='macros'?macroView(master.macros):master.filters;
   const current=await read(kind);
   if(!equal(current,original))throw Error(kind+' changed after backup; refusing import');
   if(equal(current,desired)){report.steps.push({kind,status:'already-exact',count:desired.length});continue}
   const attempt={kind,original,desired,ack:false,observed:null};
   attempts.push(attempt);
   const sent=await emit(kind,desired);
   attempt.ack=sent.ack;
   await page.waitForTimeout(300);
   attempt.observed=await read(kind);
   report.steps.push({kind,ack:attempt.ack,before:original.length,expected:desired.length,after:attempt.observed.length,exact:equal(attempt.observed,desired)});
   await fs.writeFile(dir+'/'+kind+'-observed.json',JSON.stringify(attempt.observed,null,2));
   await save();
   if(!equal(attempt.observed,desired))throw Error(kind+' import did not match master exactly');
  }
  if(!equal(await state(),unchanged))throw Error('Unrelated channel configuration changed');
  if(!equal(await read('macros'),macroView(master.macros))||!equal(await read('filters'),master.filters))throw Error('Final comparison failed');
  report.status=request.action==='pilot_chat_sync'?'pilot-synced':'chat-synced';
  await save();
  console.log('CHAT_SYNC_PILOT '+JSON.stringify(report));
  return {channel:request.channel,status:report.status,steps:report.steps};
 }catch(error){
  report.status='failed';
  report.error=String(error.message||error);
  report.rollback=[];
  for(const a of attempts.reverse()){
   try{
    const now=await read(a.kind);
    if(equal(now,a.original)){report.rollback.push({kind:a.kind,status:'original-intact'});continue}
    if(!equal(now,a.desired)&&!(a.ack&&a.observed&&equal(now,a.observed))){
     report.rollback.push({kind:a.kind,status:'uncertain-live-state-manual-review'});continue;
    }
    await emit(a.kind,a.original);
    await page.waitForTimeout(300);
    report.rollback.push({kind:a.kind,status:equal(await read(a.kind),a.original)?'restored':'restore-not-exact'});
   }catch(e){report.rollback.push({kind:a.kind,status:'restore-unverified',error:String(e.message||e)})}
  }
  await save();
  console.log('CHAT_SYNC_PILOT '+JSON.stringify(report));
  throw error;
 }
}
