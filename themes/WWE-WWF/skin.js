/* WWF / WWE v2.3 — WrestleTube engine port, adapted for this channel.
 * Original Xaekai module loader and chat/playlist implementations preserved.
 */
(function(win,doc){
 if(!(win.location.pathname.startsWith('/tv/')||win.location.pathname.startsWith('/r/')))return;
 // The WrestleTube engine must only start once, but a previously loaded
 // compact WWF/WWE version must not block an updated visual header.
 if(win.__wwfWweVisualVersion==='2.3')return;
 win.__wwfWweEnginePortStarted=true;
 const eraKey='wwf-wwe-era:'+win.location.pathname.toLowerCase();
 const logosKey='wwf-wwe-logos:'+win.location.pathname.toLowerCase();
 const eras={"wwwf":{"label":"WWWF · CLASSIC","years":"1963–1979"},"golden":{"label":"WWF · GOLDEN","years":"1982–1993"},"newgen":{"label":"WWF · NEW GENERATION","years":"1993–1997"},"attitude":{"label":"WWF · ATTITUDE","years":"1997–2002"},"modern":{"label":"WWE · MODERN","years":"2002–NOW"}};
 function mountEra(){
  if(win.__wwfWweVisualVersion==='2.3')return;
  const nav=doc.querySelector('nav.navbar');if(!nav)return;
  // Replace earlier compact or misplaced header without rerunning the
  // original WrestleTube module loader, chat or cinema code.
  doc.querySelectorAll('#wwf-era-strip, #wwf-era-picker').forEach(node=>node.remove());
  const item=doc.createElement('li');item.id='wwf-era-picker';
  item.innerHTML='<label for="wwf-era-select">ERA</label><select id="wwf-era-select" aria-label="Wrestling era theme"><option value="wwwf">WWWF · CLASSIC</option><option value="golden">WWF · GOLDEN</option><option value="newgen">WWF · NEW GENERATION</option><option value="attitude">WWF · ATTITUDE</option><option value="modern">WWE · MODERN</option></select><button type="button" id="wwf-logo-switch" title="Toggle background logos">★ LOGOS</button>';
  const navList=nav.querySelector('ul.navbar-nav')||nav.querySelector('ul.nav');
  if(navList)navList.appendChild(item);else nav.appendChild(item);
  const strip=doc.createElement('div');strip.id='wwf-era-strip';
  strip.innerHTML="\n<section class=\"wwf-restored-hero\" aria-label=\"WWF and WWE Ringside broadcast\">\n  <div class=\"wwf-restored-marks\" aria-hidden=\"true\">\n    <img class=\"wwf-restored-mark-classic\" src=\"https://upload.wikimedia.org/wikipedia/commons/6/68/World_Wrestling_Federation_block_logo.svg\" alt=\"\" decoding=\"async\">\n    <img class=\"wwf-restored-mark-modern\" src=\"https://upload.wikimedia.org/wikipedia/commons/d/df/WWE_white_logo.svg\" alt=\"\" decoding=\"async\">\n  </div>\n  <div class=\"wwf-restored-identity\">\n    <div class=\"wwf-restored-overline\">BAKED.LIVE // RINGSIDE BROADCAST</div>\n    <div class=\"wwf-restored-brand\"><span class=\"wwf-restored-wwf\">WWF</span><span class=\"wwf-restored-slash\">/</span><span class=\"wwf-restored-wwe\">WWE</span><span class=\"wwf-restored-tv\">TV</span></div>\n    <div class=\"wwf-restored-tagline\">THE GOLDEN ERA. THE ATTITUDE ERA. THE NEW ERA.</div>\n  </div>\n  <div class=\"wwf-restored-onair\" role=\"status\"><span class=\"wwf-live-dot\"></span><span id=\"wwf-live-state\">STANDBY</span><small id=\"wwf-live-users\">RINGSIDE</small></div>\n</section>\n<div class=\"wwf-restored-now\"><strong>NOW SHOWING</strong><span id=\"wwf-restored-track\">The next main event is being lined up…</span></div>\n<div class=\"wwf-restored-wire\"><strong>RINGSIDE WIRE</strong><span>THEN · NOW · FOREVER · TOGETHER</span><b id=\"wwf-era-title\">WWF · ATTITUDE</b><small id=\"wwf-era-years\">1997–2002</small><span id=\"wwf-build-label\" class=\"wwf-build-label\" title=\"WWF/WWE theme build\">v2.3</span></div>\n<div class=\"wwf-logo-gallery\" aria-label=\"WWWF WWF and WWE logo eras\"><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"wwwf\" aria-pressed=\"false\" title=\"Show WWWF 1963 theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wide-Wrestling-Federation-WWWF-Logo-1963-1971.png\" loading=\"eager\" decoding=\"async\" alt=\"Original WWWF 1963 logo\"></span><span class=\"wwf-era-card-name\">WWWF 1963</span><small>EARLY YEARS</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"wwwf\" aria-pressed=\"false\" title=\"Show WWWF 1971 theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wide-Wrestling-Federation-WWWF-Logo-1971-1979.png\" loading=\"eager\" decoding=\"async\" alt=\"WWWF 1971 globe logo\"></span><span class=\"wwf-era-card-name\">WWWF 1971</span><small>THE GLOBE</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"golden\" aria-pressed=\"false\" title=\"Show WWF GOLDEN theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://loodibee.com/wp-content/uploads/World-Wrestling-Federation-WWF-Logo-1985-1998-3D.png\" loading=\"eager\" decoding=\"async\" alt=\"Classic 1980s WWF gold blue 3D logo\"></span><span class=\"wwf-era-card-name\">WWF GOLDEN</span><small>1980s CLASSICS</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"newgen\" aria-pressed=\"false\" title=\"Show NEW GENERATION theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://upload.wikimedia.org/wikipedia/commons/7/7f/WWF_New_Gen_Logo.svg\" loading=\"eager\" decoding=\"async\" alt=\"WWF New Generation logo\"></span><span class=\"wwf-era-card-name\">NEW GENERATION</span><small>1993–1997</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"attitude\" aria-pressed=\"false\" title=\"Show ATTITUDE ERA theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWF</span><img src=\"https://prowrestlingstories.com/wp-content/uploads/2019/09/WWF-Attitude-Era-Scratch-Logo.jpg\" loading=\"eager\" decoding=\"async\" alt=\"WWF Attitude Era scratch logo\"></span><span class=\"wwf-era-card-name\">ATTITUDE ERA</span><small>1997–2002</small></button><button type=\"button\" class=\"wwf-era-card\" data-wwf-card=\"modern\" aria-pressed=\"false\" title=\"Show WWE MODERN theme\"><span class=\"wwf-era-art\"><span class=\"wwf-logo-backup\" aria-hidden=\"true\">WWE</span><img src=\"https://upload.wikimedia.org/wikipedia/commons/d/df/WWE_white_logo.svg\" loading=\"eager\" decoding=\"async\" alt=\"Modern white WWE logo\"></span><span class=\"wwf-era-card-name\">WWE MODERN</span><small>2002–NOW</small></button></div>";
  // Insert AFTER the actual navbar. The old #main-first approach can
  // insert above the navbar because some Baked layouts wrap the navbar in #main.
  nav.insertAdjacentElement('afterend',strip);
  doc.body.dataset.wwfVisualVersion='2.3';
  win.__wwfWweVisualVersion='2.3';
  // When old External CSS is cached, enforce the restored hero and logo
  // gallery styles so a CSS/JS version mismatch cannot collapse them.
  const visualHero=strip.querySelector('.wwf-restored-hero');
  const visualGallery=strip.querySelector('.wwf-logo-gallery');
  const cssReady=visualHero && visualGallery &&
    win.getComputedStyle(visualHero).display==='flex' &&
    win.getComputedStyle(visualGallery).display==='grid' &&
    parseFloat(win.getComputedStyle(visualHero).minHeight)>=90;
  if(!cssReady && !doc.getElementById('wwf-v23-visual-fallback')){
    const patch=doc.createElement('style');
    patch.id='wwf-v23-visual-fallback';
    patch.textContent="/* v2.1 — A REAL, VISIBLE LOGO GALLERY, not wallpaper hidden behind #wrap.\n   Standalone banner above the native main/player row. No interference with\n   Xaekai layout, playlist, video, chat or Cinema geometry. */\nbody[data-wwf-era]:not(.cinemachat) #wwf-era-strip {\n  display:block!important;position:relative!important;z-index:2!important;\n  visibility:visible!important;opacity:1!important;\n  float:none!important;clear:both!important;isolation:isolate!important;\n  width:calc(100% - 22px)!important;max-width:none!important;\n  margin:4px auto 12px!important;padding:0!important;\n  background:#09090b!important;border:2px solid var(--ww-accent)!important;\n  border-radius:6px!important;box-shadow:0 4px 18px rgba(0,0,0,.7)!important;\n  overflow:visible!important;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-banner-heading {\n  display:flex;align-items:center;gap:14px;min-height:36px;\n  padding:5px 14px;color:var(--ww-text);background:var(--ww-panel2);\n  border-bottom:2px solid var(--ww-accent);font:bold 13px/1.3 system-ui,Arial,sans-serif;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-name {\n  color:var(--ww-text);font:1000 22px/1.1 Impact,\"Arial Black\",sans-serif;\n  letter-spacing:.08em;text-shadow:2px 2px #000;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-name b {color:var(--ww-accent);}\nbody[data-wwf-era] #wwf-era-strip #wwf-era-title {\n  font:900 15px/1.2 Impact,\"Arial Black\",sans-serif;\n  letter-spacing:.11em;color:var(--ww-highlight);text-shadow:none;\n}\nbody[data-wwf-era] #wwf-era-strip #wwf-era-years {color:var(--ww-muted);font-size:10px;}\nbody[data-wwf-era] #wwf-era-strip .wwf-banner-hint {\n  margin-left:auto;font-size:10px;color:var(--ww-muted);letter-spacing:.16em;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-logo-gallery {\n  display:grid;grid-template-columns:repeat(6,minmax(0,1fr));\n  gap:8px;padding:9px 12px 10px;\n  background:repeating-linear-gradient(116deg,#080809 0 32px,#111012 33px 60px);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card {\n  display:flex;flex-direction:column;align-items:center;justify-content:center;\n  min-width:0;min-height:112px;padding:5px 5px 7px;\n  background:linear-gradient(180deg,#181719,#0a0a0c);\n  border:1px solid #535058;border-radius:5px;box-shadow:inset 0 1px #ffffff17;\n  cursor:pointer;color:#eae7e7;appearance:none;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card:hover,\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card:focus-visible {\n  border-color:var(--ww-highlight);outline:2px solid var(--ww-accent);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card[aria-pressed=\"true\"] {\n  border:2px solid var(--ww-accent);background:var(--ww-panel2);\n  box-shadow:inset 0 0 0 1px var(--ww-highlight),0 0 14px color-mix(in srgb,var(--ww-accent) 45%,transparent);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-art {\n  position:relative;display:flex;align-items:center;justify-content:center;\n  width:100%;height:72px;min-height:72px;overflow:hidden;background:#050507;\n  border-radius:3px;margin:0 0 4px;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-art img {\n  display:block;position:relative;z-index:2;\n  width:100%;height:100%;max-width:100%;max-height:100%;\n  object-fit:contain;object-position:center;\n  opacity:1!important;filter:none!important;\n  pointer-events:none;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-logo-backup {\n  display:block;position:absolute;inset:0;z-index:1;\n  text-align:center;align-content:center;font:1000 32px/1 Impact,\"Arial Black\",sans-serif;\n  letter-spacing:-.035em;color:#f2f2f2;text-shadow:2px 2px var(--ww-accent);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card.wwf-logo-failed img {display:none!important;}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card-name {\n  font:900 11px/1.25 system-ui,Arial,sans-serif;text-align:center;\n  letter-spacing:.035em;color:#f4f1f1;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-era-card small {\n  color:#bdb7b7;font:700 9px/1.2 system-ui,Arial,sans-serif;\n  letter-spacing:.035em;margin-top:2px;\n}\nbody[data-wwf-era].wwf-logos-off #wwf-era-strip .wwf-logo-gallery {\n  display:none!important;\n}\n/* The era switch remains available in the navbar when logos are hidden. */\nbody[data-wwf-era=wwwf] #wwf-era-strip .wwf-logo-gallery {\n  background:repeating-linear-gradient(90deg,#292015 0 38px,#1a130e 38px 70px);\n}\nbody[data-wwf-era=golden] #wwf-era-strip .wwf-logo-gallery {\n  background:repeating-linear-gradient(115deg,#250b0b 0 42px,#481512 43px 74px);\n}\nbody[data-wwf-era=newgen] #wwf-era-strip .wwf-logo-gallery {\n  background:repeating-linear-gradient(115deg,#141951 0 30px,#30275f 31px 57px);\n}\nbody[data-wwf-era=attitude] #wwf-era-strip .wwf-logo-gallery {\n  background:repeating-linear-gradient(135deg,#060606 0 31px,#181013 32px 61px);\n}\nbody[data-wwf-era=modern] #wwf-era-strip .wwf-logo-gallery {\n  background:repeating-linear-gradient(115deg,#10151d 0 32px,#19202c 33px 65px);\n}\nbody[data-wwf-era].cinemachat #wwf-era-strip {display:none!important;}\n@media(max-width:1000px) {\n body[data-wwf-era] #wwf-era-strip .wwf-logo-gallery {\n   grid-template-columns:repeat(3,minmax(0,1fr));\n }\n}\n@media(max-width:540px) {\n body[data-wwf-era] #wwf-era-strip .wwf-logo-gallery {\n   display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:6px;\n   padding:8px;\n }\n body[data-wwf-era] #wwf-era-strip .wwf-era-card {\n   flex:0 0 140px;scroll-snap-align:start;\n }\n body[data-wwf-era] #wwf-era-strip .wwf-banner-hint {display:none;}\n body[data-wwf-era] #wwf-era-strip .wwf-banner-heading {gap:7px;padding:6px 8px;}\n body[data-wwf-era] #wwf-era-strip #wwf-era-title {font-size:11px;}\n body[data-wwf-era] #wwf-era-strip .wwf-name {font-size:17px;}\n}\n\n\n/* v2.2 — Restored classic Ringside header from the earlier WWF/WWE skin.\n   This is visual only: the real WrestleTube JS and cinema layout are unchanged. */\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-hero {\n  display:flex;align-items:center;justify-content:space-between;\n  min-height:116px;gap:16px;padding:17px 24px 15px;\n  position:relative;isolation:isolate;overflow:hidden;\n  background:linear-gradient(112deg,var(--ww-bg) 0%,var(--ww-panel2) 52%,var(--ww-bg) 100%);\n  color:var(--ww-text);border-bottom:3px solid var(--ww-accent);\n}\nbody[data-wwf-era=attitude] #wwf-era-strip .wwf-restored-hero {\n  background:linear-gradient(111deg,#070708 0%,#3f0a11 48%,#0b090a 100%);\n}\nbody[data-wwf-era=wwwf] #wwf-era-strip .wwf-restored-hero {\n  background:linear-gradient(112deg,#20160e,#5a412a 53%,#1c140b);\n}\nbody[data-wwf-era=golden] #wwf-era-strip .wwf-restored-hero {\n  background:linear-gradient(112deg,#1f0808,#74211a 54%,#240d0b);\n}\nbody[data-wwf-era=newgen] #wwf-era-strip .wwf-restored-hero {\n  background:linear-gradient(112deg,#09143e,#33358a 53%,#111342);\n}\nbody[data-wwf-era=modern] #wwf-era-strip .wwf-restored-hero {\n  background:linear-gradient(112deg,#0c111a,#52202b 52%,#111926);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-marks {\n  position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-marks img {\n  position:absolute;top:-20%;height:146%;width:auto;max-width:38%;object-fit:contain;\n  opacity:.13;filter:grayscale(1) brightness(2.2);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-mark-classic {left:22%;transform:rotate(-12deg);}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-mark-modern {right:4%;transform:rotate(10deg);}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-identity,\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-onair {position:relative;z-index:1;}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-overline {\n  font:900 10px/1.35 system-ui,Arial,sans-serif;letter-spacing:.25em;\n  color:var(--ww-highlight);margin-bottom:5px;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-brand {\n  display:flex;align-items:baseline;white-space:nowrap;\n  font:1000 clamp(38px,6vw,72px)/.98 Impact,\"Arial Black\",system-ui,sans-serif;\n  letter-spacing:-.055em;transform:skewX(-5deg);\n  text-shadow:3px 3px #000,0 0 16px #0008;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wwf {color:var(--ww-highlight);}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wwe {color:#f9f9fa;}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-slash {margin:0 .18em;color:var(--ww-accent);}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-tv {\n  margin-left:.28em;font:1000 .31em/1 Impact,\"Arial Black\",sans-serif;\n  letter-spacing:.1em;color:var(--ww-accent);\n  border:2px solid var(--ww-accent);padding:.14em .24em;\n  transform:skewX(5deg);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-tagline {\n  margin-top:8px;font:850 10px/1.4 system-ui,Arial,sans-serif;\n  letter-spacing:.14em;color:var(--ww-muted);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-onair {\n  flex:0 0 auto;padding:12px 16px 10px;min-width:130px;\n  text-align:center;border:1px solid var(--ww-accent);border-radius:4px;\n  background:#080809c7;box-shadow:inset 0 0 14px #0008;\n  color:var(--ww-text);font:950 13px/1.3 system-ui,Arial,sans-serif;\n  letter-spacing:.11em;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-live-dot {\n  display:inline-block;width:8px;height:8px;border-radius:50%;\n  background:#787878;margin-right:7px;vertical-align:middle;\n}\nbody[data-wwf-era] #wwf-era-strip.wwf-is-live .wwf-live-dot {\n  background:#ef3544;box-shadow:0 0 8px #ef354475;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-onair small {\n  display:block;margin-top:5px;color:var(--ww-muted);\n  letter-spacing:.07em;font:750 10px system-ui,Arial,sans-serif;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-now {\n  display:flex;align-items:center;gap:16px;padding:9px 20px;\n  background:linear-gradient(90deg,var(--ww-panel2),var(--ww-bg));\n  color:var(--ww-text);border-bottom:1px solid var(--ww-accent);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-now strong {\n  flex:0 0 auto;white-space:nowrap;font:950 10px system-ui,Arial,sans-serif;\n  letter-spacing:.12em;color:var(--ww-highlight);\n}\nbody[data-wwf-era] #wwf-era-strip #wwf-restored-track {\n  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n  font:750 13px system-ui,Arial,sans-serif;color:var(--ww-text);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wire {\n  display:flex;align-items:center;gap:12px;flex-wrap:wrap;\n  padding:7px 15px;background:#09090b;\n  font:850 10px/1.35 ui-monospace,Consolas,monospace;\n  letter-spacing:.10em;color:#e9e2e2;\n  border-bottom:1px solid var(--ww-accent);\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wire > strong {\n  color:var(--ww-accent);white-space:nowrap;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wire #wwf-era-title {\n  margin-left:auto;color:var(--ww-highlight);font:900 11px system-ui,Arial,sans-serif;\n  letter-spacing:.07em;text-shadow:none;\n}\nbody[data-wwf-era] #wwf-era-strip .wwf-restored-wire #wwf-era-years {\n  color:var(--ww-muted);font-size:10px;\n}\nbody[data-wwf-era].wwf-logos-off #wwf-era-strip .wwf-restored-marks {\n  display:none!important;\n}\nbody[data-wwf-era].cinemachat #wwf-era-strip {display:none!important;}\n@media(max-width:780px) {\n body[data-wwf-era] #wwf-era-strip .wwf-restored-hero {\n   gap:10px;min-height:94px;padding:12px 13px 11px;\n }\n body[data-wwf-era] #wwf-era-strip .wwf-restored-brand {font-size:clamp(30px,7vw,52px);}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-overline {font-size:9px;letter-spacing:.12em;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-tagline {font-size:9px;letter-spacing:.04em;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-onair {min-width:92px;padding:9px 6px;font-size:10px;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-now {padding:8px 11px;gap:9px;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-wire {gap:7px;}\n}\n@media(max-width:490px) {\n body[data-wwf-era] #wwf-era-strip .wwf-restored-brand {font-size:clamp(25px,8vw,42px);}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-tv {display:none;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-tagline {max-width:235px;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-onair {min-width:70px;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-onair small {display:none;}\n body[data-wwf-era] #wwf-era-strip .wwf-restored-wire > span {display:none;}\n}\n";
    doc.head.appendChild(patch);
  }
  // Failed third-party images still show a readable era logo title.
  strip.querySelectorAll('.wwf-era-card img').forEach(img=>{
    img.addEventListener('error',()=>img.closest('.wwf-era-card')?.classList.add('wwf-logo-failed'),{once:true});
  });
  const choose=doc.getElementById('wwf-era-select'),logos=doc.getElementById('wwf-logo-switch');
  let era='attitude',visible=true;
  try{const stored=win.localStorage.getItem(eraKey);if(eras[stored])era=stored;visible=win.localStorage.getItem(logosKey)!=='off';}catch(_){}
  function applyEra(which){
   which=eras[which]?which:'attitude';doc.body.dataset.wwfEra=which;choose.value=which;
   doc.getElementById('wwf-era-title').textContent=eras[which].label;
   doc.getElementById('wwf-era-years').textContent=eras[which].years;
   strip.querySelectorAll('[data-wwf-card]').forEach(card=>{
     card.setAttribute('aria-pressed',String(card.dataset.wwfCard===which));
   });
   try{win.localStorage.setItem(eraKey,which);}catch(_){}
  }
  function applyLogos(on){
   doc.body.classList.toggle('wwf-logos-off',!on);
   logos.textContent=on?'★ LOGOS':'☆ LOGOS';logos.setAttribute('aria-pressed',String(on));
   try{win.localStorage.setItem(logosKey,on?'on':'off');}catch(_){}
  }
  choose.addEventListener('change',()=>applyEra(choose.value));
  strip.addEventListener('click',event=>{
   const card=event.target.closest('[data-wwf-card]');
   if(card && strip.contains(card))applyEra(card.dataset.wwfCard);
  });
  logos.addEventListener('click',()=>applyLogos(doc.body.classList.contains('wwf-logos-off')));
  applyEra(era);applyLogos(visible);
  // Update the restored original-style broadcast header without changing
  // the player, chat, or any Xaekai layout classes.
  function updateRingsideStatus(){
   if(!strip.isConnected)return false;
   const sources=[
    doc.getElementById('currenttitle')?.textContent,
    doc.querySelector('#queue .queue_entry.queue_active .qe_title')?.textContent,
    doc.querySelector('#queue .queue_active .qe_title')?.textContent
   ];
   const showing=sources.map(s=>(s||'').replace(/^\s*(?:currently playing|now playing)\s*:?\s*/i,'').trim())
    .find(s=>s && !/^(?:no video|nothing playing|loading\.{0,3})$/i.test(s))||'';
   const title=strip.querySelector('#wwf-restored-track');
   const state=strip.querySelector('#wwf-live-state');
   if(title && title.textContent!==(showing||'The next main event is being lined up…')){
    title.textContent=showing||'The next main event is being lined up…';
   }
   if(state)state.textContent=showing?'ON AIR':'STANDBY';
   strip.classList.toggle('wwf-is-live',!!showing);
   const counter=doc.getElementById('usercount')?.textContent?.trim();
   const viewers=strip.querySelector('#wwf-live-users');
   if(viewers)viewers.textContent=counter?counter+' RINGSIDE':'RINGSIDE';
   return true;
  }
  updateRingsideStatus();
  const ringsideTimer=win.setInterval(()=>{
   if(!updateRingsideStatus())win.clearInterval(ringsideTimer);
  },8000);
 }
 function mount(){
  if(!win.jQuery||!win.CHANNEL||!win.CLIENT||!win.USEROPTS||
     !doc.querySelector('nav.navbar')||!doc.querySelector('#chatwrap')||
     !doc.querySelector('#videocontrols'))return false;
  if(!win.__wwfWweEnginePortMounted){
  win.__wwfWweEnginePortMounted=true;
  win.__wwfWweCinemaCss="/* Cinema Chat Mode */\nbody.cinemachat #motdwrap     { display: none; }\nbody.cinemachat #queue        { display: none; }\nbody.cinemachat #footer       { display: none; }\nbody.cinemachat #currenttitle { display: none; }\nbody.cinemachat .toggle-label { display: none; }\nbody.cinemachat .dropLabel    { display: none; }\nbody.cinemachat #videowrap-header { display: none; }\n\n#cinemasizeinc,\n#cinemasizedec,\n#cinematoggle {\n    position: fixed !important;\n    top: 0 !important;\n    font-size: 16px !important;\n    padding: 1px 5px !important;\n    border: 2px solid rgba(255,255,255,0.5) !important;\n    z-index:3000;\n    cursor:pointer;\n}\n\n#cinematoggle  { right: 2px; }\n#cinemasizeinc { right: 31px; }\n#cinemasizedec { right: 60px; }\n\nbody.cinemachat #cinematoggle {\n    text-shadow: 0 0 3px white;\n}\n\nbody.cinemachat.synchtube #cinematoggle {\n    right: calc(%WIDTH% + 2px);\n}\n\nbody.cinemachat #chatwrap {\n    position:fixed !important;\n    top:0 !important;\n    padding:0px !important;\n    width: %WIDTH% !important;\n    height:100% !important;\n    z-index:3001 !important;\n    background-color:#222222 !important;\n}\nbody.cinemachat:not(.synchtube) #chatwrap { left:0 !important; }\nbody.cinemachat.synchtube #chatwrap { right:0 !important; }\n\nbody.cinemachat #chatwrap #messagebuffer,\nbody.cinemachat #chatwrap #userlist {\n    height: calc(100% - 59px) !important;\n}\n\nbody.cinemachat #chatline {\n    width:calc(100% - 1px) !important;\n    position: relative !important;\n}\nbody.cinemachat:not(.synchtube) #chatline { left: 0px !important; }\nbody.cinemachat.synchtube #chatline { right: 0px !important; }\n\n\n\nbody.cinemachat #videowrap .embed-responsive {\n    height:100% !important;\n    width: 100% !important;\n    top: 0 !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap .embed-responsive { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap .embed-responsive { left: 0 !important; }\n\nbody.cinemachat #videowrap {\n    position: fixed !important;\n    top: 0 !important;\n    padding:0 !important;\n    z-index: 3000 !important;\n    background-color:black;\n    height:100% !important;\n    width: calc(100% - %WIDTH%) !important;\n}\nbody.cinemachat:not(.synchtube) #videowrap { right: 0 !important; }\nbody.cinemachat.synchtube #videowrap { left: 0 !important; }\n\n\nbody.cinemachat #pmbar {\n    width: calc(100% - %WIDTH%) !important;\n    bottom: 42px;\n}\nbody.cinemachat:not(.synchtube) #pmbar { left: %WIDTH%; }\n\n\n\n\nbody.cinemachat #pmbar .panel-heading {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat #pmbar .panel {\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.5);\n}\n\nbody.cinemachat .pm-panel:hover {\n    border-color: #bbb;\n}\nbody.cinemachat #pmbar .panel:hover {\n    opacity: 0.9;\n    background-color: rgba(0,0,0,0.77);\n}\n\n/* Active poll atop the video  */\nbody.cinemachat #pollwrap div.active:not(.dismissed) {\n    position:fixed !important;\n    top:  12px !important;\n    z-index:9999 !important;\n    min-width: 400px;\n    opacity: 0.8;\n    background-color: rgba(0,0,0,0.77);\n}\n\nbody.cinemachat:not(.synchtube) #pollwrap div.active:not(.dismissed) {\n    left: calc(%WIDTH% + 32px) !important;\n}\nbody.cinemachat.synchtube #pollwrap div.active:not(.dismissed) {\n    left: 32px !important;\n}\n\nbody:not(.cinemachat) #pollwrap .dismiss {\n    display: none;\n}\n\nbody.cinemachat.cinema-nopoll #pollwrap {\n    display: none!important;\n}\n";
  (function(){
/*!
 **|  Baked.live Channel: WTTTV Internal Script
 **|
 **|  All code written by Xaekai except where otherwise noted.
 **|  Copyright 2014-2016 All Rights Reserved
 **|
 **@preserve
 */
// WWF/WWE branding only: all WrestleTube/Xaekai modules remain intact.
if (!this[CHANNEL.name]) this[CHANNEL.name]={};
$(".navbar-brand").css({"background-image":"none","min-width":"0"}).html('<strong class="wwf-nav-brand">WWF <span>/</span> WWE</strong>');
if (!document.getElementById('scroll-btn')) $('<button id="scroll-btn" class="btn btn-sm btn-default" title="Scroll playlist to current item" />')
  .append('<span class="glyphicon glyphicon-hand-right" />')
  .prependTo("#videocontrols")
  .on("click", function() {
    if(typeof scrollQueue==='function')scrollQueue(); else document.querySelector('#queue .queue_entry.queue_active')?.scrollIntoView({block:'center'});
  });

/*!
 **|   Xaekai's Sequenced Module Loader
 **|
**@preserve
*/
({options:{designator:{prefix:"geek-",delay:90*1e3},playlist:{collapse:true,inlineBlame:true,moveReporting:true,quickQuality:false,recentMedia:true,simpleLeader:true,syncCheck:true,thumbnails:true,timeEstimates:true,volumeControl:false},chatext:{persistIgnore:true,smartScroll:true,maxMessages:120},userlist:{autoHider:true},various:{notepad:true,emoteToggle:true},whispers:{joins:false,parts:false}},modules:{settings:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_settings.min.js",done:true},audio:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_audiolib.js",done:true},privmsg:{active:1,rank:1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_privmsg.min.js",done:true},whispers:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_whispers.min.js",done:true,cache:false},userlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_userlist.min.js",done:true},md5hash:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_md5.min.js",done:true},designator:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_designator.min.js",done:true},playlist:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_playlist.min.js",done:true},notifier:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_alerts.min.js",done:true},chatline:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatline.min.js",done:true},chatext:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatext.min.js",done:true},chatcolor:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chatcolor.min.js",done:true},colormap:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_colormap.min.js",done:true},unimoji:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_unimoji.min.js",done:true},dectalk:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_tts.min.js",done:true},hotkeys:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_hotkeys.min.js",done:true},layout:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@dd49db59f589867f66742021ddcb81c7b160d40c/themes/WWE-WWF/legacy-layout.js",done:true},various:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_various.min.js",done:true},embedmedia:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_embedmedia.min.js",done:true},chaticons:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_chaticons.min.js",done:true},ci_library:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/library_chaticons.min.js",done:true,cache:false},AvtrClient:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/AvatarClient.min.js",done:true},fancysheet:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/custom_fancysheet.min.js",done:true},time:{active:1,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_time.min.js",done:true},search:{active:0,rank:-1,url:"https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/js/module_search.min.js",done:true}},getScript:function(url,success,cache=true){return jQuery.ajax({url:url,cache:cache,success:success,type:"GET",dataType:"script"})},initialize:function(){if(CLIENT.modules){return}else{CLIENT.modules=this}window[CHANNEL.name].modulesOptions=this.options;console.info("[XaeModule]","Begin Loading.");this.index=Object.keys(this.modules);this.sequencerLoader();this.cache=false},sequencerLoader:function(){if(this.state.prev){setTimeout(this.modules[this.state.prev].done,0);this.state.prev=""}if(this.state.pos>=this.index.length){return console.info("[XaeModule]","Loading Complete.")}var currKey=this.index[this.state.pos];if(this.state.pos<this.index.length){if(this.modules[currKey].active){if(this.modules[currKey].rank<=CLIENT.rank){console.info("[XaeModule]","Loading:",currKey);this.state.prev=currKey;this.state.pos++;let cache=typeof this.modules[currKey].cache=="undefined"?this.cache:this.modules[currKey].cache;this.getScript(this.modules[currKey].url,this.sequencerLoader.bind(this),cache)}else{if(this.modules[currKey].rank===0&&CLIENT.rank===-1){(function(module){socket.once("login",data=>{if(data.success){this.getScript(module.url,false,this.cache)}})})(this.modules[currKey])}this.state.pos++;this.sequencerLoader()}}else{this.state.pos++;this.sequencerLoader()}}},state:{prev:"",pos:0}}).initialize();


/*
 ** Navbar Autohider
 */
USEROPTS.sort_rank = 1;
USEROPTS.sort_afk = 1;
USEROPTS.qbtn_hide = "true";

$(".server-msg-reconnect").text("Welcome to WWF / WWE! Please add wrestling-related videos.");
$(".server-msg-disconnect").text("Your Connection Is Bad!");
$("#showmediaurl").text("Add");
$("#clearplaylist").text("Clear");
$("#mediarefresh").text("Refresh Media");
$("#emotelistbtn").text("Macros");

/* click .channel-emote and append to chat input line */ 
$('#chatwrap').on('click', '.channel-emote', function(e) {
     e.preventDefault();

     var $emote = $(this);
     var $chatline = $('#chatline');

     $chatline.val($chatline.val() + $emote.attr('title') + ' ');
});

/* click .username and append to chat input line with a colon */ 
$('#messagebuffer').on('click', '.username', function(e) {
     e.preventDefault();

     var $username = $(this);
     var $chatline = $('#chatline');

     $chatline.val($chatline.val() + $username.text() + ' ');
});
  }).call(win);
  }
  // Visual version can be upgraded independently of an existing engine.
  mountEra();
  return true;
 }
 let attempts=0;
 function boot(){
  if(mount())return;
  if(++attempts<=48)win.setTimeout(boot,250);
  else console.warn('[WWF/WWE] Channel controls unavailable; port did not start.');
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})(window,document);
