import fs from 'node:fs/promises';
const BEGIN='/* BEGIN MANAGED QUEUE ATTRIBUTION */',END='/* END MANAGED QUEUE ATTRIBUTION */';
const rules='#queue .qe_blame{float:right!important;margin-left:12px!important;font-size:11px!important;color:inherit!important;opacity:.85;white-space:nowrap}\n#queue .queue_entry::after{content:"";display:table;clear:both}';
// Compact only when the normal append exceeds the server's CSS limit.
// Preserve quoted strings, escaped characters and all non-whitespace tokens.
// Comments are removed only outside strings; CSSOM equivalence is required
// before any live mutation. Never rewrite a stylesheet with @import.
export function compactWhitespace(css){
 let out='',quote='',i=0;
 while(i<css.length){
  const c=css[i];
  if(c==='\\'){out+=css.slice(i,i+2);i+=2;continue}
  if(quote){out+=c;if(c===quote)quote='';i++;continue}
  if(c==='"'||c==="'"){quote=c;out+=c;i++;continue}
  if(c==='/'&&css[i+1]==='*'){
   const end=css.indexOf('*/',i+2);
   if(end<0)throw Error('Unclosed CSS comment; refusing compaction');
   const comment=css.slice(i,end+2);
   if(/^\/\*!|@license|@preserve|copyright/i.test(comment))out+=comment;
   else if(out&&!/\s$/.test(out))out+=' ';
   i=end+2;continue
  }
  if(/[ \t\r\n\f]/.test(c)){
   while(i<css.length&&/[ \t\r\n\f]/.test(css[i]))i++;
   if(out&&!/[ \t\r\n\f]$/.test(out))out+=' ';
   continue
  }
  out+=c;i++;
 }
 if(quote)throw Error('Unclosed CSS string; refusing compaction');
 return out.trim();
}
async function equivalentCSS(page,original,compact){
 // @import is not supported by constructable stylesheets. Do not silently
 // drop or reinterpret it; leave these stylesheets for manual review.
 if(/@import\b/i.test(original))return false;
 return page.evaluate(({original,compact})=>{
  try{
   const parse=css=>{const sheet=new CSSStyleSheet();sheet.replaceSync(css);return Array.from(sheet.cssRules,r=>r.cssText)};
   const a=parse(original),b=parse(compact);
   return a.length>0&&JSON.stringify(a)===JSON.stringify(b);
  }catch{return false}
 },{original,compact});
}
export async function fixQueueAttribution({page,request,initial}){
 const capture=()=>page.evaluate(()=>({channel:String(window.CHANNEL?.name||''),css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,externalcss:window.CHANNEL?.opts?.externalcss,externaljs:window.CHANNEL?.opts?.externaljs,rank:window.CLIENT?.rank,username:window.CLIENT?.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in}));
 const valid=s=>s.connected&&s.loggedIn&&s.rank>=3&&String(s.username||'').toLowerCase()==='buttman-gpt'&&s.channel.toLowerCase()===request.channel.toLowerCase();
 const before=await capture();if(!valid(before)||typeof before.css!=='string')throw Error('Verified administrator required');
 const layer=BEGIN+'\n'+rules+'\n'+END;
 const start=before.css.indexOf(BEGIN),end=before.css.indexOf(END);
 if((start<0)!==(end<0)||start>=0&&end<start)throw Error('Incomplete managed CSS marker');
 const dir='tubes/bridge/backup/'+request.channel+'/queue-attribution';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.css',before.css);
 const base=start<0?before.css:before.css.slice(0,start)+before.css.slice(end+END.length);
 let target=start<0?before.css+'\n'+layer+'\n':before.css.slice(0,start)+layer+before.css.slice(end+END.length);
 if(target===before.css)return {channel:request.channel,status:'already-deployed'};
 // Wrestling 5 has a verified existing oversized stylesheet. Permit a
 // non-growing repair only, without relaxing the normal network limit.
 const originalBytes=Buffer.byteLength(before.css,'utf8');
 const limit=request.channel.toLowerCase()==='wrestling5'&&before.rank>=10
   ?Math.max(20000,originalBytes):20000;
 let compacted=false;
 if(Buffer.byteLength(target,'utf8')>limit){
  const compact=compactWhitespace(base);
  if(!(await equivalentCSS(page,base,compact)))throw Error('CSS compaction equivalence unverified; existing skin preserved');
  target=compact+'\n'+layer+'\n';
  // If whitespace compaction is insufficient, try the browser's canonical
  // rule serialization. Reject imports and custom property declarations
  // because their original tokens can matter outside the CSSOM comparison.
  if(Buffer.byteLength(target,'utf8')>limit&&!/@import\b|--[\w-]+\s*:|\/\*!|@license|@preserve|copyright/i.test(base)){
   const canonical=await page.evaluate(css=>{
    try{const sheet=new CSSStyleSheet();sheet.replaceSync(css);return Array.from(sheet.cssRules,r=>r.cssText).join('\n')}catch{return ''}
   },base);
   if(canonical&&Buffer.byteLength(canonical,'utf8')<Buffer.byteLength(compact,'utf8')&&await equivalentCSS(page,base,canonical))target=canonical+'\n'+layer+'\n';
  }
  compacted=true;
 }
 const sizes={before:originalBytes,after:Buffer.byteLength(target,'utf8'),limit,compacted};
 await fs.writeFile(dir+'/size-report.json',JSON.stringify(sizes,null,2));
 if(sizes.after>limit)throw Error('CSS still exceeds limit after safe compaction; existing skin preserved');
 async function change(expected,css){
  await page.evaluate(({expected,css,channel})=>{if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||String(window.CLIENT?.name||'').toLowerCase()!=='buttman-gpt'||String(window.CHANNEL?.name||'').toLowerCase()!==channel.toLowerCase()||window.CHANNEL.css!==expected)throw Error('Live state changed');window.socket.emit('setChannelCSS',{css})},{expected,css,channel:request.channel});
  for(let i=0;i<60;i++){if((await capture()).css===css)return;await page.waitForTimeout(250)}
  throw Error('CSS persistence not confirmed');
 }
 try{
  await change(before.css,target);
  const after=await capture();for(const k of ['js','motd','externalcss','externaljs'])if(after[k]!==before[k])throw Error('Unrelated configuration changed');
  await fs.writeFile(dir+'/after.css',after.css);
  const visual=await page.evaluate(()=>{const el=document.querySelector('#queue .qe_blame');if(!el)return {sample:false};const c=getComputedStyle(el);return {sample:true,float:c.cssFloat,margin:c.marginLeft,fontSize:c.fontSize}});
  await page.screenshot({path:dir+'/preview.png'});
  return {channel:request.channel,status:'deployed',cssOnly:true,visual,sizes};
 }catch(e){if((await capture()).css===target)await change(target,before.css);throw e}
}
