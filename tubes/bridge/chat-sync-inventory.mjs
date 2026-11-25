import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const config=JSON.parse(await fs.readFile('tubes/shared/wrestling-chat-sync.json','utf8'));
const root='tubes/bridge/backup/chat-sync';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function ordered(x){
 if(Array.isArray(x))return x.map(ordered);
 if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,ordered(x[k])]));
 return x;
}
function grouped(list,key){
 const map=new Map();
 for(const x of list){
  if(typeof x[key]!=='string')throw Error('Invalid '+key);
  if(!map.has(x[key]))map.set(x[key],[]);
  map.get(x[key]).push(x);
 }
 return map;
}
const sorted=x=>x.map(ordered).sort((a,b)=>{
 const aa=JSON.stringify(a),bb=JSON.stringify(b);return aa<bb?-1:aa>bb?1:0;
});
function duplicateSummary(list){
 const groups=grouped(list,'name');
 const duplicates=[...groups].filter(([,v])=>v.length>1);
 return {uniqueNames:groups.size,duplicateNames:duplicates.length,duplicateEntries:duplicates.reduce((n,[,v])=>n+v.length-1,0),conflictingNames:duplicates.filter(([,v])=>new Set(v.map(x=>sha(ordered(x)))).size>1).length};
}
export async function inventoryChatSync({page,request}){
 if(![config.master,...config.targets].includes(request.channel))throw Error('Outside wrestling sync scope');
 const state=await page.evaluate(()=>({channel:window.CHANNEL?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,username:window.CLIENT?.name,rank:window.CLIENT?.rank,emotes:window.CHANNEL?.emotes}));
 if(!state.connected||!state.loggedIn||state.rank<3||String(state.username).toLowerCase()!=='buttman-gpt'||String(state.channel).toLowerCase()!==request.channel.toLowerCase())throw Error('Admin identity unverified');
 if(!Array.isArray(state.emotes))throw Error('Macro list unavailable');
 const macros=state.emotes.map(e=>{if(typeof e.name!=='string'||typeof e.image!=='string')throw Error('Invalid macro entry');return {name:e.name,image:e.image,...(e.source===undefined?{}:{source:e.source})}});
 const duplicateStats=duplicateSummary(macros);
 const filters=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const socket=window.socket;
  if(!socket?.connected)return reject(Error('Disconnected'));
  const done=items=>{clearTimeout(timer);Array.isArray(items)?resolve(items):reject(Error('Invalid filter response'))};
  const timer=setTimeout(()=>{socket.off?.('chatFilters',done);reject(Error('Filter request timed out'))},15000);
  socket.once('chatFilters',done);socket.emit('requestChatFilters');
 }));
 const current={channel:request.channel,filters,macros,rawEmotes:state.emotes,duplicateStats,at:new Date().toISOString()};
 await fs.mkdir(root,{recursive:true});
 await fs.writeFile(root+'/'+request.channel+'.json',JSON.stringify(current,null,2)+'\n');
 const result={channel:request.channel,status:'inventoried',filters:filters.length,macros:macros.length,filterHash:sha(ordered(filters)),macroHash:sha(sorted(macros)),...duplicateStats};
 if(request.channel!==config.master){
  const master=JSON.parse(await fs.readFile(root+'/'+config.master+'.json','utf8'));
  const m=grouped(master.macros,'name'),d=grouped(macros,'name');
  result.macrosMissing=[...m.keys()].filter(k=>!d.has(k)).length;
  result.macrosExtra=[...d.keys()].filter(k=>!m.has(k)).length;
  result.macrosDifferent=[...m.keys()].filter(k=>d.has(k)&&sha(sorted(m.get(k)))!==sha(sorted(d.get(k)))).length;
  result.filtersExact=sha(ordered(master.filters))===result.filterHash;
 }
 console.log('CHAT_SYNC_INVENTORY '+JSON.stringify(result));
 return result;
}
