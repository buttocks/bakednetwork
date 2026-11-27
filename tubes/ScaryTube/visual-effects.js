(function(){
 if(!/^\/(?:tv|r)\/ScaryTube\/?$/i.test(location.pathname)||window.__scaryVisualEffectsV2)return;
 window.__scaryVisualEffectsV2=true;
 const tones={'BLOOD MOON':'blood','AFTER MIDNIGHT':'midnight','POSSESSED':'possessed','HAUNTED':'midnight','DEAD INSIDE':'midnight','SOMETHING IS WRONG':'possessed','PARANORMAL ACTIVITY':'midnight','OUIJA BOARD':'possessed','● REC VHS':'static','FOUND FOOTAGE':'static'};
 const classes={'horror-blood':'blood','horror-ghost':'possessed','horror-silver':'midnight','horror-vhs':'static','horror-toxic':'night','horror-warning':'glitch','horror-title':'blood'};
 function styleChip(chip){
  if(chip.dataset.scaryStyled)return;chip.dataset.scaryStyled='1';
  const label=chip.textContent.trim().replace(/\s+/g,' '),tone=tones[label]||Object.entries(classes).find(([c])=>chip.classList.contains(c))?.[1]||'midnight';
  chip.classList.add('scary-visual-text','scary-fx-'+tone);
  const nodes=[];for(let n=chip.nextSibling;n;n=n.nextSibling){if(n.nodeType!==Node.TEXT_NODE)break;nodes.push(n)}
  if(!nodes.some(n=>n.textContent.trim())){chip.textContent=label.toLowerCase().replace(/^./,c=>c.toUpperCase());return}
  const span=document.createElement('span');span.className='scary-visual-text scary-fx-'+tone;chip.after(span);for(const n of nodes)span.append(n);chip.classList.add('scary-fx-consumed');
 }
 const presencePattern=/^(?:\[\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\]\s*)?(?:\[server\]\s*:\s*)?[a-z0-9_-]{1,40}\s+(?:has\s+)?(?:joined|left|disconnected)(?:\s+(?:from\s+)?(?:the\s+)?(?:channel|room))?(?:\s+\(aliases:\s*[^)\r\n]*\))?[.!]?\s*$/i;
 function presence(row){
  if(!row||row.dataset.scaryPresence||row.parentElement?.id!=='messagebuffer')return;
  // RDH's proven native server identity normalization also recognizes chat-msg-_server_.
  const serverClass=[...row.classList].some(c=>c.startsWith('chat-msg-')&&c.slice(9).replace(/[^a-z]/gi,'').toLowerCase()==='server');
  const explicit='.server-msg-join,.server-msg-leave,.server-msg-part,.server-msg-userjoin,.server-msg-userleave';
  const notice=row.matches(explicit)||!!row.querySelector(explicit);
  const typed=row.matches('.server-msg,.server-whisper')||!!row.querySelector('.server-msg,.server-whisper');
  const chat=row.className.includes('chat-msg-')||row.classList.contains('baked-chat-message');
  const username=row.querySelector('.username')?.textContent.trim().replace(/:$/,'')||'';
  const serverName=/^(?:\[server\]|\$server\$|server)$/i.test(username);
  if(!notice&&!serverClass&&!(typed&&(!chat||serverName)))return;
  const text=(row.textContent||'').replace(/\s+/g,' ').trim();
  if(!notice&&!presencePattern.test(text))return;
  row.dataset.scaryPresence='1';row.classList.add('scary-fade-presence');
  setTimeout(()=>{if(row.isConnected){row.style.maxHeight=row.getBoundingClientRect().height+'px';void row.offsetHeight;row.classList.add('scary-fading')}},8000);
  setTimeout(()=>{if(row.isConnected){row.classList.add('scary-gone');row.remove()}},10000);
 }
 const options={':bloodmoon:':['Blood Moon','blood','Blood-red glowing message'],':midnight:':['After Midnight','midnight','Ghostly lettering'],':possessed:':['Possessed','possessed','Haunted shadow distortion'],'[hwhisper]...[/hwhisper]':['Whisper','whisper','Quiet, spectral lettering'],'[hglitch]...[/hglitch]':['Glitch','glitch','Chromatic distortion'],'[hblood]...[/hblood]':['Blood Letters','blood','Crimson glow'],'[hstatic]...[/hstatic]':['Static','static','Old television lettering'],'[hspoiler]...[/hspoiler]':['Hidden Spoiler',null,'Reveal on hover'],'[hnight]...[/hnight]':['Night Vision','night','Green phosphor text']};
 function menu(){
  const panel=document.querySelector('#horror-effects-dropdown');if(!panel||panel.dataset.scaryV2)return;panel.dataset.scaryV2='1';
  const intro=panel.querySelector('.horror-menu-intro');if(intro)intro.textContent='Select text in chat and choose an effect, or use a prefix before your message.';
  const headings=panel.querySelectorAll('.horror-menu-heading');if(headings[0])headings[0].textContent='MESSAGE EFFECTS (3)';if(headings[1])headings[1].textContent='TEXT EFFECTS (6)';
  for(const btn of panel.querySelectorAll('.horror-effect-option')){const key=btn.querySelector('code')?.textContent,entry=options[key];if(!entry){btn.style.display='none';continue}const title=btn.querySelector('.horror-option-meta strong'),desc=btn.querySelector('.horror-option-meta small');if(title){title.textContent=entry[0];if(entry[1])title.classList.add('scary-visual-text','scary-fx-'+entry[1])}if(desc)desc.textContent=entry[2]}
 }
 function scan(){const buffer=document.querySelector('#messagebuffer');if(buffer){for(const chip of buffer.querySelectorAll('.horror-chip:not([data-scary-styled])'))styleChip(chip);for(const row of buffer.children)presence(row)}menu()}
 let queued=false;function schedule(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;scan()})}}
 function start(){scan();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&(r.target.closest?.('#messagebuffer,#horror-effects-dropdown')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#messagebuffer,#horror-effects-dropdown')||n.querySelector?.('#messagebuffer,#horror-effects-dropdown'))))))schedule()}).observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();