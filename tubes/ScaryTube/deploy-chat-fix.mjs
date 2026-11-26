import fs from 'node:fs/promises';
const old='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@72a28c8b075659e26dcd91d26f379b3ee460ff1b/tubes/ScaryTube/skin.js';
const next='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@0c2826b71f2dca6c0cc0a00a2e4f65351a569327/tubes/ScaryTube/skin.js';
export async function deployScaryChatFix({page,request,initial}){
  if(String(initial.channel).toLowerCase()!=='scarytube'||initial.rank<3||!initial.loggedIn)throw Error('Verified ScaryTube admin required');
  const capture=()=>page.evaluate(()=>({externaljs:window.CHANNEL?.opts?.externaljs||'',externalcss:window.CHANNEL?.opts?.externalcss||'',css:window.CHANNEL?.css,js:window.CHANNEL?.js,motd:window.CHANNEL?.motd,rank:window.CLIENT?.rank,connected:!!window.socket?.connected,channel:window.CHANNEL?.name}));
  const before=await capture();
  if(![old,next].includes(before.externaljs))throw Error('Unexpected external JS; no change');
  const dir='tubes/bridge/backup/ScaryTube/chat-fix';
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
  const response=await page.request.get(next,{timeout:25000});
  const code=await response.text();const mime=response.headers()['content-type'];
  console.log('SCARY_CHAT_CDN '+JSON.stringify({status:response.status(),mime,bytes:code.length}));
  if(!response.ok()||!code.includes('__scaryChatMetaFix'))throw Error('Candidate CDN source not available');
  new Function(code);await response.dispose();
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,250)));
  page.on('response',r=>{if(r.url().includes('/ScaryTube/skin.js'))network.push({status:r.status(),url:r.url().split('?')[0]});});
  async function proof(){
    await page.waitForTimeout(8000);
    return await page.evaluate(()=>{
      const w=window,b=document.querySelector('#messagebuffer'),fn=w.addChatMessage,cb=w.Callbacks?.chatMsg;
      const result={skinRunning:!!w.__scaryTubeRunning,patchRunning:!!w.__scaryChatCompatibility,handlerWrapped:!!fn?.__scaryChatMetaFix,callbackWrapped:!!cb?.__scaryChatMetaFix,connected:!!w.socket?.connected,tests:[]};
      if(!b||typeof fn!=='function')return result;
      const last=w.LASTCHAT&&{...w.LASTCHAT};
      const marker='Local chat proof '+Date.now();
      for(const [i,test] of ['normal','missing-meta','callback-missing-meta'].entries()){
        const time=Date.now()+10000+i*10;
        const data={username:'LocalDiagnostic',msg:marker+' '+test,time,...(test==='normal'?{meta:{}}:{})};
        try{
          if(test==='callback-missing-meta'){if(typeof cb!=='function')throw Error('Callback inaccessible');cb.call(w.Callbacks,data);}
          else fn(data);
          result.tests.push({test,rendered:b.textContent.includes(marker+' '+test)});
        }catch(e){result.tests.push({test,rendered:false,error:String(e.message).slice(0,250)});}
      }
      for(const node of [...b.children])if(node.textContent.includes(marker))node.remove();
      if(last&&w.LASTCHAT)Object.assign(w.LASTCHAT,last);
      return result;
    });
  }
  const passed=p=>p.connected&&p.patchRunning&&p.handlerWrapped&&p.tests.length===3&&p.tests.every(t=>t.rendered);
  // Substitute only the old public script response in this test browser; no live write.
  if(before.externaljs===old){
    const pattern='**/tubes/ScaryTube/skin.js*';
    await page.route(pattern,route=>route.fulfill({status:200,contentType:'application/javascript',body:code}));
    await page.reload({waitUntil:'domcontentloaded',timeout:45000});
    const pilot=await proof();
    const runtime=await page.evaluate(()=>{
      const w=window;
      return {ignoreChannelJs:w.USEROPTS?.ignore_channeljs,externalJs:w.CHANNEL?.opts?.externaljs,inlineJsBytes:typeof w.CHANNEL?.js==='string'?w.CHANNEL.js.length:null,
        scripts:[...document.scripts].map(s=>s.src).filter(Boolean).map(s=>s.split('?')[0]).slice(0,40),
        callbacks:typeof w.Callbacks?.chatMsg==='function'?String(w.Callbacks.chatMsg).slice(0,1200):null,
        nativeRenderer:typeof w.addChatMessage==='function'?String(w.addChatMessage).slice(0,900):null,
        jsControls:[...document.querySelectorAll('input,textarea,button,select')].filter(e=>/channel.?js|external.?js|ignore.?js|custom.?js/i.test(e.id+' '+e.name)).map(e=>({id:e.id,name:e.name,type:e.type,checked:e.checked}))};
    });
    console.log('SCARY_CHAT_PILOT '+JSON.stringify({pilot,network,errors,runtime}));
    if(!passed(pilot)){
      // Inspect public client loader code and official callback names, not credentials or chat history.
      const loader=[];
      for(const name of ['callbacks.js','ui.js','util.js','data.js']){
        try{
          const res=await page.request.get('https://baked.live/js/'+name,{timeout:15000});
          const src=await res.text();
          const matches=[...src.matchAll(/externaljs|ignore_channeljs|channelJS|channelJs|setChannelJS|customJS|customJs|allowChannelJS|allow_channeljs|channeljs/gi)];
          loader.push({name,status:res.status(),matches:matches.slice(0,35).map(m=>src.slice(Math.max(0,m.index-150),m.index+220))});
          await res.dispose();
        }catch(e){loader.push({name,error:String(e.message).slice(0,150)});}
      }
      const native=await page.evaluate(()=>{
        const w=window;
        return {callbackNames:Object.keys(w.Callbacks||{}).filter(k=>/css|js|script|option|chat/i.test(k)),
          callbacks:Object.fromEntries(Object.entries(w.Callbacks||{}).filter(([k,v])=>/channeljs|channelcss|channelopts|channeloptions|setoptions|chatmsg/i.test(k)&&typeof v==='function').map(([k,v])=>[k,String(v).slice(0,3500)])),
          relevantOptionNames:Object.keys(w.CHANNEL?.opts||{}).filter(k=>/js|script|custom/i.test(k)),
          relevantPreferences:Object.fromEntries(Object.entries(w.USEROPTS||{}).filter(([k,v])=>/channeljs|customjs|script/i.test(k)&&['boolean','number'].includes(typeof v)))};
      });
      console.log('SCARY_CHAT_LOADER '+JSON.stringify({loader,native}));
      await fs.writeFile(dir+'/loader.json',JSON.stringify({loader,native},null,2));
      const boundary=code.indexOf('/* ScaryTube v1.0:');
      if(boundary<1)throw Error('Compatibility patch boundary missing');
      await page.evaluate(source=>{(0,eval)(source)},code.slice(0,boundary));
      const injected=await proof();
      console.log('SCARY_CHAT_LOCAL_INJECTION '+JSON.stringify({injected,errors}));
      await fs.writeFile(dir+'/local-injection.json',JSON.stringify({injected,runtime,errors},null,2));
    }
    await fs.writeFile(dir+'/pilot.json',JSON.stringify({pilot,network,errors},null,2));
    await page.unroute(pattern);
    if(!passed(pilot))throw Error('Isolated test did not pass; live settings unchanged');
  }
  async function set(url){
    await page.evaluate(externaljs=>{if(!window.socket?.connected||window.CLIENT?.rank<3||String(window.CHANNEL?.name).toLowerCase()!=='scarytube')throw Error('Admin connection lost');window.socket.emit('setOptions',{externaljs});},url);
    for(let i=0;i<60;i++){if((await capture()).externaljs===url)return;await page.waitForTimeout(250);}
    throw Error('External script update not confirmed');
  }
  try{
    if(before.externaljs!==next)await set(next);
    await page.reload({waitUntil:'domcontentloaded',timeout:45000});
    const live=await proof(),after=await capture();
    console.log('SCARY_CHAT_LIVE '+JSON.stringify({live,network,errors}));
    await fs.writeFile(dir+'/after.json',JSON.stringify({after,live,network,errors},null,2));
    if(!passed(live)||after.externaljs!==next||['externalcss','css','js','motd'].some(k=>after[k]!==before[k]))throw Error('Live verification failed');
    return {request_id:request.request_id,channel:request.channel,action:request.action,status:'chat-fix-installed',live};
  }catch(e){if(before.externaljs!==next&&(await capture()).externaljs===next)await set(before.externaljs);throw e;}
}
