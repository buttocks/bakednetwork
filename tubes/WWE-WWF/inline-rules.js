/* WWF-WWE: place the native rules in the arena now-showing row. */
(function(){
 if(!/^\/(?:tv|r)\/WWF-WWE\/?$/i.test(location.pathname)||window.__wwfInlineRules)return;
 window.__wwfInlineRules=true;
 let original=null,pending=false;
 function sync(){
  pending=false;
  const row=document.querySelector('#wwf-era-strip .wwf-restored-now'),source=document.querySelector('#motd .wwf-house-rules');
  if(!row||!source)return;
  let menu=row.querySelector('#wwf-inline-rules');
  if(menu&&source===original)return;
  const wasOpen=!!menu?.open;menu?.remove();
  let title=row.querySelector('.wwf-now-title');
  if(!title){const strong=row.querySelector(':scope>strong'),song=row.querySelector(':scope>#wwf-restored-track');if(!strong||!song)return;title=document.createElement('div');title.className='wwf-now-title';row.prepend(title);title.append(strong,song)}
  menu=source.cloneNode(true);menu.id='wwf-inline-rules';menu.open=wasOpen;row.append(menu);original=source;
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync)}}
 function start(){sync();new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('#wwf-era-strip,#motd,.wwf-house-rules,.wwf-house-bar,.wwf-restored-now')||n.querySelector?.('#wwf-era-strip,#motd,.wwf-house-rules')))))schedule()}).observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
