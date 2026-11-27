/* RetroWrestling: place the native rules in the arena now-showing row. */
(function(){
 if(!/^\/(?:tv|r)\/RetroWrestling\/?$/i.test(location.pathname)||window.__rwInlineRules)return;
 window.__rwInlineRules=true;
 let original=null,pending=false;
 function sync(){
  pending=false;
  const row=document.querySelector('#rw-header .rw-now'),source=document.querySelector('#motd .rw-house-rules');
  if(!row||!source)return;
  let menu=row.querySelector('#rw-inline-rules');
  if(menu&&source===original)return;
  const wasOpen=!!menu?.open;menu?.remove();
  let title=row.querySelector('.rw-now-title');
  if(!title){const strong=row.querySelector(':scope>strong'),song=row.querySelector(':scope>#rw-song');if(!strong||!song)return;title=document.createElement('div');title.className='rw-now-title';row.prepend(title);title.append(strong,song)}
  menu=source.cloneNode(true);menu.id='rw-inline-rules';menu.open=wasOpen;row.append(menu);original=source;
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync)}}
 function start(){sync();new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('#rw-header,#motd,.rw-house-rules,.rw-house-bar,.rw-now')||n.querySelector?.('#rw-header,#motd,.rw-house-rules')))))schedule()}).observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
