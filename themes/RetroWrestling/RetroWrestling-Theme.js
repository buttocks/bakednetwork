/* RetroWrestling arena UI v1.0. Add separate PlaylistTools-Standalone.js for management. */
(function () {
  'use strict';
  if (window.RetroWrestlingArenaV1) return;
  window.RetroWrestlingArenaV1 = true;
  if (!/\/tv\/RetroWrestling\/?$/i.test(location.pathname)) return;
  const header = document.createElement('section');
  header.id = 'rw-header';
  header.setAttribute('aria-label','RetroWrestling arena controls');
  header.innerHTML = `
  <div class="rw-headtop"><div><div class="rw-kicker">Baked.live presents · Ringside Network</div>
  <div class="rw-crown">★ RETRO WRESTLING ★</div><div class="rw-kicker">Classic matches · Vintage promos · Main event energy</div></div>
  <div class="rw-headright"><span class="rw-live"><span class="rw-dot"></span> ON AIR</span><div id="rw-viewers" style="margin-top:5px"></div></div></div>
  <div class="rw-now"><strong>NOW SHOWING</strong><span id="rw-song">Waiting for the next match card…</span></div>
  <div class="rw-controls"><a href="#videowrap" id="rw-watch">▣ Watch</a><a href="#chatwrap" id="rw-chat">✉ Chat</a>
  <a href="#queue" id="rw-queue">☷ Playlist</a><button id="rw-share" type="button">↗ Copy Channel Link</button>
  <button id="rw-bell" type="button">◉ Ring Bell</button><button id="rw-focus" type="button">◧ Focus</button>
  <button id="rw-lights" type="button">✦ Effects</button><button id="rw-tools" type="button">⚙ Playlist Tools</button></div>
  <div id="rw-ticker">WELCOME TO THE ARENA · CLASSIC WRESTLING · THE MAIN EVENT STARTS HERE</div>`;
  document.body.insertBefore(header,document.body.firstChild);
  const button = name => header.querySelector('#rw-'+name);
  let muted=false,focus=false;
  try {muted=localStorage.getItem('rw-effects-disabled')==='yes';}catch(_e){}
  document.body.classList.toggle('rw-lights-off',muted);
  button('lights').textContent=muted?'✦ Effects Off':'✦ Effects On';
  button('lights').addEventListener('click',()=>{
    muted=!muted; document.body.classList.toggle('rw-lights-off',muted);
    button('lights').textContent=muted?'✦ Effects Off':'✦ Effects On';
    try{localStorage.setItem('rw-effects-disabled',muted?'yes':'no');}catch(_e){}
  });
  button('focus').addEventListener('click',()=>{focus=!focus;document.body.classList.toggle('rw-focus',focus);button('focus').textContent=focus?'◧ Exit Focus':'◧ Focus';});
  button('share').addEventListener('click',async()=>{
    const link=location.origin+location.pathname;
    try{await navigator.clipboard.writeText(link);button('share').textContent='✓ Link Copied';}
    catch(_e){window.prompt('Copy channel link:',link);button('share').textContent='↗ Copy Channel Link';}
    setTimeout(()=>button('share').textContent='↗ Copy Channel Link',2300);
  });
  button('tools').addEventListener('click',()=>{
    const open=document.querySelector('#bpt-open'),panel=document.querySelector('#bpt-panel');
    if (open && open.offsetParent!==null) open.click();
    else if(panel){document.querySelector('#bpt-root')?.classList.add('bpt-visible');}
    else alert('Playlist Tools not installed. Add PlaylistTools-Standalone.js or use the combined JavaScript file.');
  });
  button('bell').addEventListener('click',()=>{
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      const a=new Audio(), t=a.currentTime;
      [480,610,790].forEach((freq,index)=>{
        const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07/(index+1),t+.015);
        g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+1.7);
      });setTimeout(()=>a.close().catch(()=>{}),2000);
    }catch(_e){}
  });
  const slogans=['MAIN EVENT ENERGY • EVERY NIGHT','FROM THE TERRITORIES TO THE BIG ARENA',
    'THE BELL RINGS • THE CROWD ROARS','OLD-SCHOOL WRESTLING • NO COMMERCIAL BREAKS'];
  let ticker=0, last='';
  function update(){
    let text=document.querySelector('#currenttitle')?.textContent?.trim()||'';
    if(!text || /nothing playing/i.test(text)){
      text=document.querySelector('#queue .queue_active .qe_title')?.textContent?.trim()||'';
    }
    text=text.replace(/^currently playing\s*:?\s*/i,'').trim();
    text=text||'Waiting for the next match card…';
    button('song').textContent=text;
    last=text;
    const usercount=document.querySelector('#usercount')?.textContent?.trim();
    button('viewers').textContent=usercount ? usercount+' ringside' : 'RINGSIDE TV';
  }
  update();setInterval(update,3000);
  setInterval(()=>{button('ticker').textContent=slogans[ticker++%slogans.length]+' · '+last.toUpperCase().slice(0,110);},9000);
})();