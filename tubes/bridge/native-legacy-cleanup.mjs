/**
 * Conservative source transform for retired native feature overrides.
 * It edits only top-level properties inside the legacy loader's modules/options
 * objects. Unknown formats are returned unchanged for manual review.
 */
const RETIRED_MODULES=new Set(['chatline','chatext','chatcolor','colormap','unimoji','dectalk','layout']);
const RETIRED_QUEUE_OPTIONS=new Set(['collapse','hidePlaylist','inlineBlame','recentMedia','thumbnails','timeEstimates']);

function objectRange(source,property,from=0,to=source.length){
  const re=new RegExp('\\b'+property+'\\s*:\\s*\\{','g');
  re.lastIndex=from;
  const match=re.exec(source.slice(0,to));
  if(!match)return null;
  const open=from+match.index+match[0].lastIndexOf('{');
  let depth=0,state='code';
  for(let i=open;i<to;i++){
    const c=source[i],n=source[i+1];
    if(state==='line'){if(c==='\n')state='code';continue;}
    if(state==='block'){if(c==='*'&&n==='/'){state='code';i++;}continue;}
    if(state==='single'){if(c==='\\'){i++;continue;}if(c==="'")state='code';continue;}
    if(state==='double'){if(c==='\\'){i++;continue;}if(c==='"')state='code';continue;}
    if(state==='template'){if(c==='\\'){i++;continue;}if(c.charCodeAt(0)===96)state='code';continue;}
    if(c==='/'&&n==='/'){state='line';i++;continue;}
    if(c==='/'&&n==='*'){state='block';i++;continue;}
    if(c==="'"){state='single';continue;}
    if(c==='"'){state='double';continue;}
    if(c.charCodeAt(0)===96){state='template';continue;}
    if(c==='{')depth++;
    if(c==='}'){depth--;if(depth===0)return {open,close:i};}
  }
  return null;
}

function objectSegments(source,range){
  const parts=[];let start=range.open+1,brace=1,paren=0,bracket=0,state='code';
  for(let i=start;i<range.close;i++){
    const c=source[i],n=source[i+1];
    if(state==='line'){if(c==='\n')state='code';continue;}
    if(state==='block'){if(c==='*'&&n==='/'){state='code';i++;}continue;}
    if(state==='single'){if(c==='\\'){i++;continue;}if(c==="'")state='code';continue;}
    if(state==='double'){if(c==='\\'){i++;continue;}if(c==='"')state='code';continue;}
    if(state==='template'){if(c==='\\'){i++;continue;}if(c.charCodeAt(0)===96)state='code';continue;}
    if(c==='/'&&n==='/'){state='line';i++;continue;}
    if(c==='/'&&n==='*'){state='block';i++;continue;}
    if(c==="'"){state='single';continue;}
    if(c==='"'){state='double';continue;}
    if(c.charCodeAt(0)===96){state='template';continue;}
    if(c==='{')brace++;else if(c==='}')brace--;
    else if(c==='(')paren++;else if(c===')')paren--;
    else if(c==='[')bracket++;else if(c===']')bracket--;
    else if(c===','&&brace===1&&paren===0&&bracket===0){parts.push(source.slice(start,i));start=i+1;}
  }
  if(start<range.close)parts.push(source.slice(start,range.close));
  return parts;
}
function propName(segment){
  const m=segment.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*(?:([A-Za-z_$][\w$]*)|["']([^"']+)["'])\s*:/);
  return m?(m[1]||m[2]):null;
}
function rewriteObject(source,property,transform,from=0,to=source.length){
  const range=objectRange(source,property,from,to);
  if(!range)return {source,changed:false};
  const before=source.slice(0,range.open+1),after=source.slice(range.close);
  const parts=objectSegments(source,range);
  const next=transform(parts);
  const result=before+next.join(',')+after;
  return {source:result,changed:result!==source};
}
function removeNamed(parts,names){
  return parts.filter(part=>!names.has(propName(part)));
}
function setBoolean(parts,names,value){
  return parts.map(part=>{
    if(!names.has(propName(part)))return part;
    return part.replace(/(:\s*)(?:true|false|!0|!1)(?=\s*(?:,|$))/,'$1'+value);
  });
}
function removeBoundCall(source,startPattern){
  const match=startPattern.exec(source);
  if(!match)return {source,removed:false};
  const start=match.index;let paren=0,brace=0,bracket=0,state='code';
  for(let i=start;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(state==='line'){if(c==='\n')state='code';continue;}
    if(state==='block'){if(c==='*'&&n==='/'){state='code';i++;}continue;}
    if(state==='single'){if(c==='\\'){i++;continue;}if(c==="'")state='code';continue;}
    if(state==='double'){if(c==='\\'){i++;continue;}if(c==='"')state='code';continue;}
    if(state==='template'){if(c==='\\'){i++;continue;}if(c.charCodeAt(0)===96)state='code';continue;}
    if(c==='/'&&n==='/'){state='line';i++;continue;}
    if(c==='/'&&n==='*'){state='block';i++;continue;}
    if(c==="'"){state='single';continue;}
    if(c==='"'){state='double';continue;}
    if(c.charCodeAt(0)===96){state='template';continue;}
    if(c==='(')paren++;else if(c===')')paren--;
    else if(c==='{')brace++;else if(c==='}')brace--;
    else if(c==='[')bracket++;else if(c===']')bracket--;
    else if(c===';'&&paren===0&&brace===0&&bracket===0)return {source:source.slice(0,start)+source.slice(i+1),removed:true};
  }
  return {source,removed:false};
}
export function cleanLegacyNativeFeatures(source){
  if(typeof source!=='string'||!source)return {source,changed:false,retiredModules:[],changedOptions:[]};
  let next=source;
  const retiredModules=[];
  const moduleRange=objectRange(next,'modules');
  if(moduleRange){
    const before=objectSegments(next,moduleRange);
    for(const part of before){const key=propName(part);if(RETIRED_MODULES.has(key))retiredModules.push(key);}
    next=rewriteObject(next,'modules',parts=>removeNamed(parts,RETIRED_MODULES)).source;
  }
  const removedCredits=[];
  const loaderCredit=/\/\*!\s*\n\s*\*\*\|\s*Xaekai's Sequenced Module Loader[\s\S]*?\*\/\s*/i;
  if(loaderCredit.test(next)){next=next.replace(loaderCredit,'');removedCredits.push('legacy-loader-attribution');}
  const authorLine=/^\s*\*\*\|\s*All code written by Xaekai except where otherwise noted\.\s*$/gim;
  const authorCount=(next.match(authorLine)||[]).length;
  next=next.replace(authorLine,'');
  if(authorCount)removedCredits.push('author-attribution');
  const creditLines=/^\s*(?:\/\/\s*|\*+\s*|\*\*\|\s*)[^\r\n]*\bXaekai\b[^\r\n]*$/gim;
  const creditLineCount=(next.match(creditLines)||[]).length;
  next=next.replace(creditLines,'');
  if(creditLineCount&&!removedCredits.includes('author-attribution'))removedCredits.push('author-attribution');
  const moduleLabel=(next.match(/\[XaeModule\]/g)||[]).length;
  next=next.replace(/\[XaeModule\]/g,'[Baked modules]');
  if(moduleLabel)removedCredits.push('loader-console-label');
  const changedOptions=[];
  if(objectRange(next,'options')){
    let optionSource=next;
    if(objectSegments(optionSource,objectRange(optionSource,'options')).some(part=>propName(part)==='chatext')){
      optionSource=rewriteObject(optionSource,'options',parts=>removeNamed(parts,new Set(['chatext']))).source;
      changedOptions.push('chatext');
    }
    const playlist=rewriteObject(optionSource,'playlist',parts=>setBoolean(parts,RETIRED_QUEUE_OPTIONS,'false'));
    if(playlist.changed){optionSource=playlist.source;changedOptions.push('playlist.native-overlap=false');}
    const userlist=rewriteObject(optionSource,'userlist',parts=>setBoolean(parts,new Set(['autoHider']),'false'));
    if(userlist.changed){optionSource=userlist.source;changedOptions.push('userlist.autoHider=false');}
    const vr=objectRange(optionSource,'various');
    if(vr&&objectSegments(optionSource,vr).some(part=>propName(part)==='emoteToggle')){
      optionSource=rewriteObject(optionSource,'various',parts=>removeNamed(parts,new Set(['emoteToggle']))).source;
      changedOptions.push('various.emoteToggle');
    }
    next=optionSource;
  }
  const removedInputHooks=[];
  for(const [name,pattern] of [
    ['emote-click-insert',/\$\(\s*['"]#chatwrap['"]\s*\)\.on\(\s*['"]click['"]\s*,\s*['"]\.channel-emote['"]\s*,\s*function\s*\(\s*e\s*\)\s*\{/],
    ['username-click-insert',/\$\(\s*['"]#messagebuffer['"]\s*\)\.on\(\s*['"]click['"]\s*,\s*['"]\.username['"]\s*,\s*function\s*\(\s*e\s*\)\s*\{/]
  ]){
    const result=removeBoundCall(next,pattern);
    next=result.source;
    if(result.removed)removedInputHooks.push(name);
  }
  const scrollControl=/scrollbtn\s*=\s*\$\('<button id="scroll-btn"[\s\S]*?\.on\("click",\s*function\(\)\s*\{\s*scrollQueue\(\);\s*\}\);/g;
  const scrollMatches=next.match(scrollControl)||[];
  next=next.replace(scrollControl,'');
  const removedLayoutOverride=/^\s*USEROPTS\.layout\s*=\s*["']fluid["'];?\s*$/gm;
  const layoutCount=(next.match(removedLayoutOverride)||[]).length;
  next=next.replace(removedLayoutOverride,'');
  return {source:next,changed:next!==source,retiredModules:[...new Set(retiredModules)],changedOptions,
    removedInputHooks,removedScrollControls:scrollMatches.length,removedLayoutOverrides:layoutCount,removedCredits};
}
export function legacyNativeSelfTest(){
  const input='({options:{playlist:{collapse:true,hidePlaylist:true,moveReporting:true,timeEstimates:true},chatext:{maxMessages:200},userlist:{autoHider:true,renderer:true},various:{notepad:true,emoteToggle:true}},modules:{privmsg:{active:1},userlist:{active:1},chatline:{active:1},chatext:{active:1},dectalk:{active:1},layout:{active:1},playlist:{active:1},hotkeys:{active:1}}})';
  const result=cleanLegacyNativeFeatures(input);
  if(!result.changed||result.retiredModules.join(',')!=='chatline,chatext,dectalk,layout'||
    !result.source.includes('privmsg:{active:1}')||!result.source.includes('userlist:{active:1}')||
    !result.source.includes('hotkeys:{active:1}')||!result.source.includes('moveReporting:true')||!result.source.includes('renderer:true')||result.source.includes('autoHider:true')||
    /collapse:true|hidePlaylist:true|timeEstimates:true|chatext:\{|emoteToggle:true|chatline:\{|dectalk:\{|layout:\{/.test(result.source))
    throw Error('Native legacy source transform self-test failed');
  const handlers=cleanLegacyNativeFeatures(input+"\n"+
    "scrollbtn = $('<button id=\"scroll-btn\" />').on(\"click\", function() { scrollQueue(); });\n"+
    "$('#chatwrap').on('click', '.channel-emote', function(e) { $('#chatline').val('x'); });\n"+
    "$('#messagebuffer').on('click', '.username', function(e) { $('#chatline').val('x'); });\n"+
    "USEROPTS.layout = \"fluid\";");
  if(handlers.removedScrollControls!==1||handlers.removedLayoutOverrides!==1||
    handlers.removedInputHooks.join(',')!=='emote-click-insert,username-click-insert'||
    handlers.source.includes('scroll-btn')||handlers.source.includes('.val('))
    throw Error('Native input and duplicate-scroll cleanup self-test failed');
  const attributed=['/*!',' **|  All code written by Xaekai except where otherwise noted.',' */','/*!',' **|   Xaekai\'s Sequenced Module Loader',' */','console.info("[XaeModule]");'].join("\n");
  const cleanedAttribution=cleanLegacyNativeFeatures(attributed+input);
  if(cleanedAttribution.source.includes('Xaekai')||cleanedAttribution.source.includes('[XaeModule]')||
    !cleanedAttribution.source.includes('[Baked modules]'))
    throw Error('Legacy loader attribution cleanup self-test failed');
  return true;
}