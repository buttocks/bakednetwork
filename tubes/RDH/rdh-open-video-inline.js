(function(w,d){
"use strict";
if(!/^\/(tv|r)\/rdh\/?$/i.test(w.location.pathname)||w.__rdhOpenVideoPatch)return;
w.__rdhOpenVideoPatch={version:"1.0"};
const style=d.createElement("style");
style.id="rdh-open-video-inline-style";
style.textContent=
"#queue .rdh-open-video-pill{display:inline-flex!important;align-items:center;justify-content:center;padding:2px 8px;margin-left:6px;border:1px solid #397f90;border-radius:5px;background:#102c35;color:#b6f7ff;font-size:11px;line-height:16px;cursor:pointer;pointer-events:auto!important;vertical-align:middle;position:relative;z-index:3;text-decoration:none!important}"+
"#queue .rdh-open-video-pill:hover,#queue .rdh-open-video-pill:focus-visible{border-color:#7df3ff;color:white;background:#194653}"+
"#queue .rdh-attribution-group{display:flex!important;align-items:center;justify-content:space-between!important;gap:8px!important;width:100%!important;max-width:100%!important;text-align:left}"+
"#queue .rdh-url-line{margin-left:auto!important;gap:6px!important;align-items:center!important}"+
"@media (hover:none),(pointer:coarse),(max-width:767px){#queue .rdh-open-video-pill{min-height:44px;padding:4px 10px;font-size:12px;touch-action:manipulation}}";
(d.head||d.documentElement).appendChild(style);
function attach(row){
 const line=row?.querySelector(".rdh-url-line");
 if(!line||line.querySelector(".rdh-open-video-pill"))return;
 const copy=line.querySelector(".rdh-video-url-pill");
 const raw=line.dataset.url||copy?.title||"";
 let url;try{url=new URL(raw,w.location.href)}catch{return}
 if(!/^https?:$/.test(url.protocol)||url.username||url.password)return;
 const group=line.closest(".rdh-attribution-group");
 if(group){
  group.style.setProperty("display","flex","important");
  group.style.setProperty("width","100%","important");
  group.style.setProperty("justify-content","space-between","important");
 }
 line.style.setProperty("margin-left","auto","important");
 line.style.setProperty("gap","6px","important");
 const button=d.createElement("button");
 button.type="button";
 button.className="rdh-open-video-pill";
 button.textContent="Open video";
 button.title="Open source video in a new tab";
 button.setAttribute("aria-label","Open source video in a new tab");
 button.addEventListener("click",event=>{
  event.preventDefault();event.stopPropagation();
  let target;try{target=new URL(line.dataset.url||copy?.title||url.href,w.location.href)}catch{return}
  if(/^https?:$/.test(target.protocol)&&!target.username&&!target.password)
   w.open(target.href,"_blank","noopener,noreferrer");
 });
 line.append(button);
}
function scan(){d.querySelectorAll("#queue .queue_entry.rdh-featured").forEach(attach)}
let timer=0;
const schedule=()=>{if(timer)return;timer=w.setTimeout(()=>{timer=0;scan()},60)};
scan();
new MutationObserver(schedule).observe(d.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class"]});
w.setInterval(scan,2000);
})(window,document);
