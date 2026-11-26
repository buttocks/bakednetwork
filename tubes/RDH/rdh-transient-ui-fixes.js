
  (function(w){
   "use strict";
function installUiFixes(){
   if(w.__rdhRdhTransientUiFixes||!document.body)return;
   const body=document.body;
   const state={activeEntry:null,openTimer:null,closeTimer:null,observer:null};
   const style=document.createElement("style");
   style.id="rdh-transient-ui-fixes";
   style.textContent=[
    "#messagebuffer .chat-msg-_server_.rdh-presence-dissolve{max-height:80px;overflow:hidden!important;transition:opacity .85s ease,max-height .85s ease,margin .85s ease,padding .85s ease,transform .85s ease}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-dissolve:before{transition:opacity .85s ease}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-fading{opacity:0!important;max-height:0!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important;border-color:transparent!important;transform:translateY(-3px);pointer-events:none!important}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-fading:before{opacity:0!important}",
    "body:not(.rdh-hover-preview-open) .rdh-video-url-pill,body:not(.rdh-hover-preview-open) .native-playlist-preview{visibility:hidden!important;opacity:0!important;pointer-events:none!important}"
   ].join("\\n");
   (document.head||body).appendChild(style);
   const entryFor=node=>node&&node.closest?node.closest("#queue .queue_entry .qe_title")?.closest(".queue_entry"):null;
   const isPreview=node=>!!(node&&node.closest&&node.closest(".rdh-video-url-pill,.native-playlist-preview"));
   function hidePreview(){clearTimeout(state.openTimer);body.classList.remove("rdh-hover-preview-open");}
   function closeLater(){
    clearTimeout(state.closeTimer);
    state.closeTimer=w.setTimeout(()=>{hidePreview();state.activeEntry=null;},450);
   }
   document.addEventListener("pointerover",event=>{
    const entry=entryFor(event.target);
    if(entry){
     clearTimeout(state.closeTimer);
     if(state.activeEntry===entry)return;
     hidePreview();
     state.activeEntry=entry;
     if(!entry.classList.contains("rdh-featured"))return;
     state.openTimer=w.setTimeout(()=>{
      if(state.activeEntry===entry&&entry.matches(":hover"))body.classList.add("rdh-hover-preview-open");
     },1500);
     return;
    }
    if(isPreview(event.target)&&state.activeEntry?.classList.contains("rdh-featured"))clearTimeout(state.closeTimer);
   },true);
   document.addEventListener("pointerout",event=>{
    if(!entryFor(event.target)&&!isPreview(event.target))return;
    const next=event.relatedTarget;
    if(next&&(entryFor(next)===state.activeEntry||isPreview(next)))return;
    closeLater();
   },true);

   const presenceSelector="#messagebuffer .chat-msg-_server_";
   const presencePattern=/\\bjoined\\b|\\bdisconnected\\b|\\bleft(?:\\s+the)?\\s+(?:channel|room)\\b/i;
   function markPresence(node){
    if(!node)return;
    const rows=[];
    if(node.nodeType===1){
     if(node.matches(presenceSelector))rows.push(node);
     if(node.querySelectorAll)rows.push(...node.querySelectorAll(presenceSelector));
    }else if(node.nodeType===3){
     const row=node.parentElement?.closest(presenceSelector);
     if(row)rows.push(row);
    }
    rows.forEach(row=>{
     if(row.dataset.rdhPresenceDissolve)return;
     const text=row.querySelector(".server-whisper")?.textContent||row.textContent||"";
     if(!presencePattern.test(text))return;
     row.dataset.rdhPresenceDissolve="pending";
     w.setTimeout(()=>{
      if(!row.isConnected)return;
      row.dataset.rdhPresenceDissolve="fading";
      row.classList.add("rdh-presence-dissolve","rdh-presence-fading");
      w.setTimeout(()=>row.remove(),900);
     },7000);
    });
   }
   markPresence(body);
   state.observer=new MutationObserver(records=>{
    records.forEach(record=>{
     record.addedNodes.forEach(markPresence);
     if(record.type==="characterData")markPresence(record.target);
    });
   });
   state.observer.observe(body,{childList:true,characterData:true,subtree:true});
   w.__rdhRdhTransientUiFixes=state;
  }
   installUiFixes();
  })(window);

