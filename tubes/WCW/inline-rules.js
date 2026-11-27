(function(){
 if(!/^\/(?:tv|r)\/WCW\/?$/i.test(location.pathname)||window.__wcwInlineRules)return;
 window.__wcwInlineRules=true;
 let original=null,pending=false;
 function sync(){pending=false;const banner=document.querySelector('#wcw-banner'),source=document.querySelector('#motd .wcw-house-rules');if(!banner||!source)return;let menu=banner.querySelector('#wcw-inline-rules');if(menu&&source===original)return;const open=!!menu?.open;menu?.remove();menu=source.cloneNode(true);menu.id='wcw-inline-rules';menu.open=open;banner.append(menu);original=source}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync)}}
 function start(){sync();new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('#wcw-banner,#motd,.wcw-house-rules')||n.querySelector?.('#wcw-banner,#motd,.wcw-house-rules')))))schedule()}).observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();