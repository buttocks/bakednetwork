
  (function(w){
   "use strict";
function installUiFixes(){
   if(w.__rdhRdhTransientUiFixes||!document.body)return;
   const body=document.body;
   function removeAddedByTitle(root){
    const candidates=[];
    if(root?.nodeType===1&&root.hasAttribute("title"))candidates.push(root);
    if(root?.querySelectorAll)candidates.push(...root.querySelectorAll("[title]"));
    candidates.forEach(el=>{
     if(el.closest("#queue")&&/^added by:/i.test(el.getAttribute("title")||""))el.removeAttribute("title");
    });
   }
   const state={activeEntry:null,openTimer:null,closeTimer:null,observer:null};
   const style=document.createElement("style");
   style.id="rdh-transient-ui-fixes";
   style.textContent=[
    "#messagebuffer .chat-msg-_server_.rdh-presence-dissolve{max-height:80px;overflow:hidden!important;transition:opacity .85s ease,max-height .85s ease,margin .85s ease,padding .85s ease,transform .85s ease}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-dissolve:before{transition:opacity .85s ease}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-fading{opacity:0!important;max-height:0!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important;border-color:transparent!important;transform:translateY(-3px);pointer-events:none!important}",
    "#messagebuffer .chat-msg-_server_.rdh-presence-fading:before{opacity:0!important}",
    "body:not(.rdh-hover-preview-open) .rdh-video-url-pill,body:not(.rdh-hover-preview-open) .native-playlist-preview{visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
    "#queue .queue_entry.rdh-featured{position:relative!important;padding-left:44px!important}",
    "#queue .queue_entry.rdh-featured:before{position:absolute!important;left:6px!important;top:50%!important;transform:translateY(-50%)!important;display:inline-block!important;min-width:29px!important;padding:1px 4px!important;border-radius:3px!important;font-size:9px!important;line-height:13px!important;font-weight:900!important;letter-spacing:.25px!important;text-align:center!important;z-index:2!important}",
    "#queue .queue_entry.rdh-featured-wor:before{content:\"WOR\"!important;color:#241600!important;background:#ffc342!important}",
    "#queue .queue_entry.rdh-featured-wol:before{content:\"WOL\"!important;color:#002117!important;background:#68e6b0!important}",
    "#queue .queue_entry.rdh-featured-bv:before{content:\"B&V\"!important;color:#001d22!important;background:#55eafa!important}",
    "#queue .queue_entry.rdh-featured-bvv:before{content:\"BVV\"!important;color:#06132b!important;background:#598cff!important}",
    "#queue .queue_entry.rdh-featured-ltbh:before{content:\"LTBH\"!important;color:#211038!important;background:#c6a2ff!important}",
    "#queue .queue_entry.rdh-featured-ctm:before{content:\"CTM\"!important;color:#310c19!important;background:#ff8ab4!important}",
    "#queue .queue_entry.rdh-featured-f4d:before{content:\"F4D\"!important;color:#182600!important;background:#c4ef68!important}",
    "#queue .queue_entry.rdh-featured-ad:before{content:\"AFTER DARK\"!important;color:#351016!important;background:#ff8791!important}",
    "#queue .queue_entry.rdh-featured-bsc:before{content:\"BSC\"!important;color:#10202b!important;background:#a8c9d8!important}",
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
   removeAddedByTitle(body);
   state.observer=new MutationObserver(records=>{
    records.forEach(record=>{
     record.addedNodes.forEach(node=>{markPresence(node);removeAddedByTitle(node);});
     if(record.type==="characterData"){markPresence(record.target);removeAddedByTitle(record.target.parentElement);}
     if(record.type==="attributes"&&record.attributeName==="title")removeAddedByTitle(record.target);
    });
   });
   state.observer.observe(body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["title"]});
   w.__rdhRdhTransientUiFixes=state;
  }
   installUiFixes();
  })(window);

