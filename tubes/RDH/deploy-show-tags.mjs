import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-show-tags-review';await fs.mkdir(dir,{recursive:true});
const old='/js/channel-loaders/ac9b86cf2e985f1572e1485b32df0033cf6c74d087b67f18d38a6b2d0d81fa5d.js';
const addon="/* BEGIN RDH SHOW TAGS COMPATIBILITY */\n(function(w){\n \"use strict\";\n if(!/^\\/(tv|r)\\/rdh\\/?$/i.test(w.location.pathname)||w.__rdhShowTagsCompat)return;\n function initialize(){\n  if(!w.CHANNEL?.name||!w.jQuery||!document.body)return false;\n  if(w[w.CHANNEL.name]?.modern?.modules?.premiumPlaylist?.started)return true;\n  if(w.__rdhShowTagsCompat?.started)return true;\n  const $=w.jQuery;\n  const m={\n        observer: null,\n        timer: null,\n        interval: null,\n\n        types: [\n            { key: \"wor\",  pattern: /(?:^|[^a-z0-9])WOR(?:[^a-z0-9]|$)|wrestling\\s+observer\\s+radio/i },\n            { key: \"wol\",  pattern: /(?:^|[^a-z0-9])WOL(?:[^a-z0-9]|$)|wrestling\\s+observer(?:[^a-z0-9]+|\\s+)live/i },\n            { key: \"f4d\",  pattern: /(?:^|[^a-z0-9])F4D(?:[^a-z0-9]|$)|filthy\\s+four\\s+daily/i },\n            { key: \"ad\",   pattern: /(?:^|[^a-z0-9])AFTER\\s+DARK(?:\\s+RADIO)?(?:[^a-z0-9]|$)/i },\n            { key: \"ltbh\", pattern: /(?:^|[^a-z0-9])LTB\\s*(?:&\\s*)?[HD](?=[^a-z0-9]|$)|lions\\s*,?\\s*tigers\\s*,?\\s*bears\\s*(?:&|and)\\s*(?:head|dirt|disco)\\b/i },\n            { key: \"bvv\",  pattern: /(?:^|[^a-z0-9])BVV(?:[^a-z0-9]|$)|big\\s+vinny\\s+v/i },\n            { key: \"bv\",   pattern: /(?:^|[^a-z0-9])B\\s*&\\s*V(?:[^a-z0-9]|$)|(?:^|[^a-z0-9])BVT(?:[^a-z0-9]|$)|^\\s*bryan\\s*(?:&|and)\\s+/i },\n            { key: \"ctm\",  pattern: /castrating\\s+the\\s+marks/i }\n        ],\n\n        getType: function (title) {\n            const raw = String(title || \"\");\n            const normalized = raw\n                .replace(/[\\u200B-\\u200D\\uFEFF]/g, \"\")\n                .replace(/\\u00a0/g, \" \")\n                .replace(/[–—]/g, \"-\")\n                .replace(/\\s+/g, \" \")\n                .trim();\n            const upper = normalized.toUpperCase();\n\n            // Direct recurring-show aliases first. These intentionally avoid\n            // relying on punctuation-sensitive regexes because older playlist\n            // titles use several inconsistent naming formats.\n            if (/^WOR\\b/.test(upper) || upper.includes(\"WRESTLING OBSERVER RADIO\")) return \"wor\";\n            if (/(?:^|[^A-Z0-9])WOL(?:[^A-Z0-9]|$)/.test(upper) || /WRESTLING\\s+OBSERVER(?:[^A-Z0-9]+|\\s+)LIVE/.test(upper)) return \"wol\";\n            if (/^F4D\\b/.test(upper) || upper.includes(\"FILTHY FOUR DAILY\") || upper.includes(\"FIGURE FOUR DAILY\")) return \"f4d\";\n            if (upper.includes(\"AFTER DARK\")) return \"ad\";\n            // Lions, Tigers, Bears & Head (new name) / Dirt or Disco (older name).\n            // Group both eras under the same featured-show category.\n            if (/(?:^|[^A-Z0-9])LTB\\s*(?:&\\s*)?[HD](?=[^A-Z0-9]|$)/.test(upper) ||\n                /LIONS\\s*,?\\s*TIGERS\\s*,?\\s*BEARS\\s*(?:&|AND)\\s*(?:HEAD|DIRT|DISCO)\\b/.test(upper)) return \"ltbh\";\n            if (upper.startsWith(\"BIG VINNY V\") || /(?:^|[^A-Z0-9])BVV(?:[^A-Z0-9]|$)/.test(upper)) return \"bvv\";\n            if (/(?:^|[^A-Z0-9])BVT(?:[^A-Z0-9]|$)/.test(upper)) return \"bv\";\n            if (/^B\\s*&\\s*V\\b/.test(upper)) return \"bv\";\n            if (/^BRYAN\\s*(?:&|AND)\\s+/.test(upper) || /(?:^|\\b)BRYAN\\s*(?:&|AND)\\s+VINNY(?:\\s+SHOW)?\\b/.test(upper)) return \"bv\";\n            if (upper.includes(\"CASTRATING THE MARKS\")) return \"ctm\";\n\n            for (let i = 0; i < this.types.length; i++) {\n                if (this.types[i].pattern.test(normalized)) return this.types[i].key;\n            }\n            return \"\";\n        },\n\n        scan: function () {\n            const self = this;\n            const typeClasses = \"rdh-featured rdh-featured-wor rdh-featured-wol rdh-featured-bv rdh-featured-bvv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc\";\n\n            $(\"#queue li.queue_entry, #queue .queue_entry\").each(function () {\n                const $entry = $(this);\n                const $title = $entry.find(\".qe_title\").first();\n                const title = ($title.length ? $title.text() : $entry.text()).trim();\n                const type = self.getType(title);\n                const wantedClass = type ? \"rdh-featured-\" + type : \"\";\n\n                const hasCorrectState =\n                    (!!type === $entry.hasClass(\"rdh-featured\")) &&\n                    (!type || $entry.hasClass(wantedClass));\n\n                if (!hasCorrectState) {\n                    $entry.removeClass(typeClasses);\n                    if (type) $entry.addClass(\"rdh-featured \" + wantedClass);\n                }\n            });\n        },\n\n        scheduleScan: function () {\n            const self = this;\n            clearTimeout(self.timer);\n            self.timer = setTimeout(function () {\n                self.scan();\n            }, 80);\n        },\n\n        start: function () {\n            const self = this;\n            self.scan();\n\n            // Watch the whole page rather than one queue node. Baked can replace\n            // or virtualize playlist DOM while scrolling, which otherwise leaves\n            // newly-rendered rows untagged.\n            self.observer = new MutationObserver(function () {\n                self.scheduleScan();\n            });\n\n            self.observer.observe(document.body, {\n                childList: true,\n                subtree: true,\n                characterData: true\n            });\n\n            // Periodic safety scan catches virtualized/reused rows even if the\n            // site mutates attributes/properties without a useful DOM event.\n            self.interval = setInterval(function () {\n                self.scan();\n            }, 1000);\n        },\n\n        stop: function () {\n            clearTimeout(this.timer);\n            clearInterval(this.interval);\n            this.interval = null;\n            if (this.observer) this.observer.disconnect();\n            this.observer = null;\n            $(\"#queue .rdh-featured, #queue [class*='rdh-featured-']\")\n                .removeClass(\"rdh-featured rdh-featured-wor rdh-featured-wol rdh-featured-bv rdh-featured-bvv rdh-featured-ltbh rdh-featured-ctm rdh-featured-f4d rdh-featured-ad rdh-featured-bsc\");\n        }\n    };\n  m.start();m.started=true;w.__rdhShowTagsCompat=m;return true;\n }\n if(!initialize()){let n=0;const timer=w.setInterval(()=>{if(initialize()||++n>=120)w.clearInterval(timer);},250);}\n})(window);\n/* END RDH SHOW TAGS COMPATIBILITY */";

const uiAddon=`
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
   ].join("\n");
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
     },1000);
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
   const presencePattern=/\bjoined\b|\bdisconnected\b|\bleft(?:\s+the)?\s+(?:channel|room)\b/i;
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
`;
const completeAddon=addon.replace("/* END RDH SHOW TAGS COMPATIBILITY */",uiAddon+"\\n/* END RDH SHOW TAGS COMPATIBILITY */");
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,300)));
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{},m=window[c.name]?.modern;return {name:c.name,connected:!!window.socket?.connected,loggedIn:!!window.CLIENT?.logged_in,rank:window.CLIENT?.rank,user:window.CLIENT?.name,externaljs:o.externaljs||'',externalcss:o.externalcss||'',css:c.css,js:c.js,motd:c.motd,ignoreChannelJs:!!window.USEROPTS?.ignore_channeljs,modern:!!m?.loaded,premium:!!(m?.modules?.premiumPlaylist?.started||window.__rdhShowTagsCompat?.started),bundled:!!window.__rdhBundledLoader,rows:document.querySelectorAll('#queue .queue_entry').length,tagged:document.querySelectorAll('#queue .queue_entry.rdh-featured').length};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,changed=false,next="";
async function setJS(expected,value){
 await page.evaluate(({expected,value,b})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.js!==expected||o.externaljs!==b.externaljs||o.externalcss!==b.externalcss||c.css!==b.css||c.motd!==b.motd)throw Error('Concurrent settings change; refusing write');window.socket.emit('setChannelJS',{js:value});},{expected,value,b:{externaljs:before.externaljs,externalcss:before.externalcss,css:before.css,motd:before.motd}});
 for(let i=0;i<100;i++){if((await state()).js===value)return;await page.waitForTimeout(250);}
 throw Error('Inline JS persistence not confirmed');
}
async function proof(){
 return await page.evaluate(()=>{
  const m=window[window.CHANNEL.name]?.modern?.modules?.premiumPlaylist?.started?window[window.CHANNEL.name].modern.modules.premiumPlaylist:window.__rdhShowTagsCompat;
  if(!m?.started) return {started:false};
  const cases=[['WOR: Wrestling Observer Radio','wor'],['WOL: Gunther Refuses Saudi Arabia Trip','wol'],['Bryan and Vinny Show 8/15/08','bv'],['Big Vinny V','bvv'],['F4D: Filthy Four Daily','f4d'],['Lions, Tigers, Bears & Head','ltbh'],['After Dark Radio','ad'],['Castrating the Marks','ctm'],['Botchamania 540','']];
  m.scan();
  const matches=[...document.querySelectorAll('#queue .queue_entry')].map(e=>({e,title:(e.querySelector('.qe_title')?.textContent||e.textContent).trim()})).map(x=>({...x,type:m.getType(x.title)})).filter(x=>x.type);
  const real=matches.map(({e,title,type})=>({title:title.slice(0,90),type,marked:e.classList.contains('rdh-featured')&&e.classList.contains('rdh-featured-'+type),badge:getComputedStyle(e,'::before').content}));
  const fixture=document.createElement('li');fixture.className='queue_entry';fixture.style.position='absolute';fixture.style.visibility='hidden';const t=document.createElement('span');t.className='qe_title';fixture.append(t);const q=document.querySelector('#queue');if(!q)throw Error('Queue absent');q.append(fixture);
  let checks;
  try{checks=cases.map(([title,type])=>{t.textContent=title;m.scan();const badge=getComputedStyle(fixture,'::before').content;return {title,type,classified:m.getType(title)===type,marked:type?fixture.classList.contains('rdh-featured-'+type):!fixture.classList.contains('rdh-featured'),badge};});}finally{fixture.remove();}
  return {started:true,realMatches:real.length,realMarked:real.filter(x=>x.marked&&x.badge!=='none'&&x.badge!=='normal').length,realSample:real.slice(0,5),checks};
 });
}
const passed=r=>r.started&&r.realMatches>0&&r.realMatches===r.realMarked&&r.checks?.length===9&&r.checks.every(x=>x.classified&&x.marked&&(!x.type||!['none','normal','""'].includes(x.badge)));
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 await page.waitForTimeout(3000);
 before=await state();assert.ok(auth(before));await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 console.log('RDH_BEFORE '+JSON.stringify({externaljs:before.externaljs,externalcss:before.externalcss,modern:before.modern,premium:before.premium,rows:before.rows,tagged:before.tagged,ignoreChannelJs:before.ignoreChannelJs}));
 assert.equal(before.externaljs,old,'Unexpected live native loader; no change');
 const loader=await page.request.get('https://baked.live'+old,{timeout:25000});
 const body=await loader.text();console.log('RDH_NATIVE_LOADER '+JSON.stringify({status:loader.status(),bytes:body.length,contentType:loader.headers()['content-type'],references:[...new Set(body.match(/https?:[^"'\s<>]+/g)||[])].filter(x=>/bakednetwork|rdh/i.test(x)).slice(0,10),mentionsRDH:/rdh/i.test(body)}));await loader.dispose();
 assert.equal(typeof before.js,'string');new Function(completeAddon);
 const startMarker='/* BEGIN RDH SHOW TAGS COMPATIBILITY */';const endMarker='/* END RDH SHOW TAGS COMPATIBILITY */';const start=before.js.indexOf(startMarker);const end=start<0?-1:before.js.indexOf(endMarker,start);next=start>=0&&end>=start?before.js.slice(0,start)+completeAddon+before.js.slice(end+endMarker.length):before.js.trimEnd()+'\\n\\n'+completeAddon+'\\n';if(before.js!==next){await setJS(before.js,next);changed=true;}
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 await page.waitForTimeout(3000);
 const after=await state();assert.ok(auth(after));assert.equal(after.js,next);for(const k of ['externaljs','externalcss','css','motd'])assert.equal(after[k],before[k],k+' changed unexpectedly');
 let live=null;if(after.premium){live=await proof();assert.ok(passed(live),'Live show verification failed');}
 const report={status:live?'live-show-tags-verified':'saved-user-script-approval-required',isolatedBrowserTest:true,live,rows:after.rows,cssPreserved:true,existingInlineJsPreserved:true,nativeLoaderPreserved:true,motdPreserved:true,queueWrites:0};
 await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));console.log('RDH_RESULT '+JSON.stringify(report));
}catch(e){console.log('RDH_ERROR '+e.message);if(changed){try{const s=await state();if(auth(s)&&s.js===next)await setJS(s.js,before.js)}catch(r){console.log('RDH_ROLLBACK_BLOCKED '+r.message)}}throw e;}finally{await browser.close();}
