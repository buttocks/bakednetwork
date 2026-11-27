/* Exclusive native MOTD dropdowns. Preserve existing content and layout. */
(function(){
 "use strict";
 if(!/^\/(?:tv|r)\/wrestling[2-5]?\/?$/i.test(location.pathname)||window.__wtExclusiveMotd)return;
 window.__wtExclusiveMotd=true;
 const selector="#motd .wts-bar,#motd .wt-info-bar";
 function closeOthers(detail){
  if(!detail.open||!detail.parentElement?.matches(selector))return;
  for(const sibling of detail.parentElement.children)if(sibling!==detail&&sibling.matches("details[open]"))sibling.open=false;
 }
 document.addEventListener("toggle",e=>{if(e.target instanceof HTMLDetailsElement)closeOthers(e.target)},true);
})();
