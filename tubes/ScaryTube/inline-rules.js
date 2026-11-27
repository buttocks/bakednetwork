(function(){
 if(!/^\/(?:tv|r)\/ScaryTube\/?$/i.test(location.pathname)||window.__scaryInlineRules)return;
 window.__scaryInlineRules=true;
 let original=null,pending=false;
 function sync(){pending=false;const banner=document.querySelector('#horror-banner'),source=document.querySelector('#motd .scary-house-rules');if(!banner||!source)return;let menu=banner.querySelector('#scary-inline-rules');if(menu&&source===original)return;const open=!!menu?.open;menu?.remove();menu=source.cloneNode(true);menu.id='scary-inline-rules';menu.open=open;banner.append(menu);original=source}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync)}}
 function start(){sync();new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('#horror-banner,#motd,.scary-house-rules')||n.querySelector?.('#horror-banner,#motd,.scary-house-rules')))))schedule()}).observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();