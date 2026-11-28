const SITE='https://baked.live';
const USERNAME='buttman-gpt';
const TARGETS=['Gallios_Lair'];
const URLS={
 Gallios_Lair:'https://files.catbox.moe/a76opy.js',
 Trek:'https://files.catbox.moe/a76opy.js',
 Wrestling:'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@969cb185f134f7f5a059cf856a5e6b25245ea135/tubes/bridge/cleaned-loaders/wrestletube.js',
 'NWA-TNA':'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@969cb185f134f7f5a059cf856a5e6b25245ea135/tubes/bridge/cleaned-loaders/nwa-tna.js'
};
const initConsent=()=>{
 let value;
 try{
  const old=Object.getOwnPropertyDescriptor(window,'USEROPTS');
  value=old&&'value'in old?old.value:undefined;
  Object.defineProperty(window,'USEROPTS',{
   configurable:true,enumerable:true,
   get(){return value;},
   set(next){value=next&&typeof next==='object'?next:{};value.ignore_channeljs=true;}
  });
  if(value&&typeof value==='object')value.ignore_channeljs=true;
 }catch{}
};
async function verifyPage(page,slug){
 const target=SITE+'/tv/'+slug;
 if((await page.url())!==target)await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 else await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(name=>window.socket?.connected&&window.CLIENT?.logged_in&&
   String(window.CHANNEL?.name||'').toLowerCase()===name.toLowerCase(),slug,{timeout:30000});
 await page.waitForTimeout(1800);
 return page.evaluate(({expected,expectedExternal})=>{
  const w=window,b=document.querySelector('#messagebuffer');
  const controls=[...document.querySelectorAll('button,a,input,select,[role="button"]')]
   .filter(e=>e.offsetWidth||e.offsetHeight||e.getClientRects().length)
   .map(e=>({id:e.id||'',label:(e.getAttribute('aria-label')||e.title||e.innerText||e.value||'').trim().slice(0,90),type:e.tagName.toLowerCase(),inputType:e.type||''}));
  const fields=[...document.querySelectorAll('input,textarea,[contenteditable="true"]')]
   .filter(e=>e.offsetWidth||e.offsetHeight||e.getClientRects().length)
   .map(e=>({id:e.id||'',label:(e.getAttribute('aria-label')||e.getAttribute('placeholder')||e.title||'').trim().slice(0,80),type:e.tagName.toLowerCase(),inputType:e.type||''}));
  const marker='__native_acceptance_'+expected+'_'+Date.now();
  const last=w.LASTCHAT&&{...w.LASTCHAT};
  const render=[];
  if(b&&typeof w.addChatMessage==='function'){
   for(const [name,meta] of [['normal',{}],['missing-meta',undefined],['same-time',{}]]){
    try{
     w.addChatMessage({username:'LocalAcceptance',msg:marker+' '+name,time:Date.now(),...(meta?{meta}:{})});
     render.push({case:name,visible:b.textContent.includes(marker+' '+name)});
    }catch(e){render.push({case:name,visible:false,error:String(e.message||e).slice(0,120)});}
   }
   for(const node of [...b.children])if(node.textContent.includes(marker))node.remove();
   if(last&&w.LASTCHAT)Object.assign(w.LASTCHAT,last);
  }
  const related=controls.filter(x=>/chat|pm|private|inbox|message|color|palette|auto.?hide|queue|playlist|cinema|latest|scroll|recent/i.test(x.id+' '+x.label));
  const has=(id)=>!!document.getElementById(id);
  return {
   channel:w.CHANNEL?.name||'',connected:!!w.socket?.connected,rank:Number(w.CLIENT?.rank||0),
   ignoreChannelJs:!!w.USEROPTS?.ignore_channeljs,
   externaljs:w.CHANNEL?.opts?.externaljs||'',expectedExternal,
   channelModulesLoaded:!!w.CLIENT?.modules,
   chatBuffer:!!b,chatRenderer:typeof w.addChatMessage==='function',
   chatFormatter:typeof w.formatChatMessage==='function',
   visibleChatInput:fields.some(x=>/chat|message/i.test(x.id+' '+x.label)),
   localRender:render,
   controls:{
    queueHide:has('native-queue-hide'),queueCurrent:has('native-queue-current'),
    queueRecent:has('native-queue-recent'),cinema:has('cinematoggle'),
    autoHide:related.some(x=>/auto.?hide/i.test(x.id+' '+x.label)),
    pm:related.some(x=>/pm|private|inbox/i.test(x.id+' '+x.label)),
    color:related.some(x=>/color|palette/i.test(x.id+' '+x.label))
   },
   relevantControls:related.slice(0,40),visibleFields:fields
  };
 },{expected:slug,expectedExternal:URLS[slug]||''});
}
async function login(page,password){
 await page.goto(SITE+'/login',{waitUntil:'domcontentloaded',timeout:45000});
 const form=page.locator('form[action="/login"]').last();
 await form.locator('input[name="name"]',{}).fill(USERNAME);
 await form.locator('input[name="password"]',{}).fill(password);
 await form.locator('button[type="submit"]',{}).click();
 await page.waitForLoadState('domcontentloaded');
 const body=await page.locator('body').innerText();
 if(/Login Failed|Invalid username\/password/i.test(body))throw Error('Baked.live login failed in Firefox');
}
export async function verifyNativeAcceptance({page,request,password}){
 if(String(request.channel).toLowerCase()!=='gallios_lair')throw Error('Native acceptance request must be anchored to Gallios_Lair');
 const results={chromium:[],firefox:[],checks:{scriptsDisabled:true,localOnlyChat:true},status:'started'};
 await page.addInitScript(initConsent);
 try{
  for(const slug of TARGETS){
   const report=await verifyPage(page,slug);
   results.chromium.push(report);
   if(!report.ignoreChannelJs)throw Error('Could not force script opt-out in isolated Chromium context');
  }
  const {firefox}=await import('playwright');
  const browser=await firefox.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1380,height:880},acceptDownloads:false});
   const fx=await context.newPage();fx.setDefaultTimeout(20000);
   await login(fx,password);
   await fx.addInitScript(initConsent);
   for(const slug of TARGETS){
    await fx.goto(SITE+'/tv/'+slug,{waitUntil:'domcontentloaded',timeout:45000});
    await fx.waitForFunction(name=>window.socket?.connected&&window.CLIENT?.logged_in&&
      String(window.CHANNEL?.name||'').toLowerCase()===name.toLowerCase(),slug,{timeout:30000});
    await fx.waitForTimeout(1800);
    const report=await verifyPage(fx,slug);
    results.firefox.push(report);
    if(!report.ignoreChannelJs)throw Error('Could not force script opt-out in isolated Firefox context');
   }
   await context.close();
  }finally{await browser.close();}
  const failures=[];
  for(const [browser,reports] of [['chromium',results.chromium],['firefox',results.firefox]]){
   for(const report of reports)if(!report.connected||!report.ignoreChannelJs||report.channelModulesLoaded||
      !report.chatBuffer||!report.chatRenderer||!report.localRender.length||report.localRender.some(t=>!t.visible))
     failures.push({browser,channel:report.channel,connected:report.connected,ignoreChannelJs:report.ignoreChannelJs,
      channelModulesLoaded:report.channelModulesLoaded,chatBuffer:report.chatBuffer,chatRenderer:report.chatRenderer,
      rendered:report.localRender.length>0&&report.localRender.every(t=>t.visible)});
  }
  results.status=failures.length?'verification-failed':'verified';
  results.failed=failures;
  return {request_id:request.request_id,channel:request.channel,action:request.action,...results};
 }catch(error){
  results.status='verification-blocked';
  results.error=String(error.message||error).slice(0,240);
  return {request_id:request.request_id,channel:request.channel,action:request.action,...results};
 }
}
