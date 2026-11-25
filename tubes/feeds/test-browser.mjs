import { chromium } from 'playwright';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('tubes/feeds/discovery.json'));
const browser=await chromium.launch({...(process.env.BAKED_TEST_BROWSER==='chrome'?{channel:'chrome'}:{}),headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const results=[];
try {
 for(const e of config.channels.filter(e=>!process.env.BAKED_TEST_FEED||e.key===process.env.BAKED_TEST_FEED)){
  const page=await browser.newPage();
  const errors=[],diagnostics=[];page.on('pageerror',err=>errors.push(err.message));page.on('console',msg=>{if(msg.text().includes('[Baked TV]'))diagnostics.push(msg.text())});
  const url='https://buttocks.github.io/bakednetwork/tubes/'+e.directory+'/feed.html?channel='+e.key+(process.env.BAKED_TEST_EMBED==='standard'?'&embed=standard':'');
  try {
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#program-name')?.textContent!=='Tuning…',{},{timeout:20000});
   await page.locator('#guide-toggle').click();
   const guide=await page.locator('#guide-list li').count();
   if(!guide)throw Error('Empty guide');
   await page.locator('#guide-toggle').click();
   let playing=false;
   try {await page.waitForFunction(()=>document.querySelector('#status')?.hidden===true,{},{timeout:75000});playing=true;}catch{}
   let videoProof=null;
   if(playing&&process.env.BAKED_TEST_REQUIRE_VIDEO==='1'){
     const first=await page.evaluate(()=>{const v=document.querySelector('video');return {time:v.currentTime,src:v.currentSrc,hidden:v.hidden};});
     if(first.hidden)throw Error('Direct video proof required');
     await page.waitForFunction(start=>{const v=document.querySelector('video');return !v.hidden&&!v.paused&&v.currentSrc===start.src&&v.videoWidth>0&&v.videoHeight>0&&v.currentTime>start.time+1;},first,{timeout:20000});
     videoProof=await page.evaluate(()=>{const v=document.querySelector('video');return {width:v.videoWidth,height:v.videoHeight,time:v.currentTime,readyState:v.readyState};});
   }
   await page.evaluate(()=>document.body.classList.add('overlay-idle'));
   if(await page.locator('body.youtube-mode').count()===0)await page.locator('#menu-reveal').click();
   const toolbarSeparated=await page.evaluate(()=>{
     const body=document.body, was=body.classList.contains('youtube-mode');
     body.classList.add('youtube-mode');body.classList.remove('overlay-idle');
     const header=document.querySelector('header'), shell=document.querySelector('#youtube-shell');
     const hidden=shell.hidden;shell.hidden=false;
     const ok=getComputedStyle(header).visibility==='visible'&&Math.abs(shell.getBoundingClientRect().top)<2&&shell.getBoundingClientRect().height>=innerHeight-2;
     shell.hidden=hidden;if(!was)body.classList.remove('youtube-mode');body.classList.remove('overlay-idle');return ok;
   });
   if(!toolbarSeparated)throw Error('YouTube full-size overlay layout failed');
   const menuRestored=await page.locator('#guide-toggle').isVisible();
   if(!menuRestored)throw Error('Persistent menu failed to restore controls');
   const state=await page.evaluate(()=>({title:document.querySelector('#program-name')?.textContent,status:document.querySelector('#status-text')?.textContent,source:document.querySelector('#channel-name')?.textContent,videoTime:document.querySelector('video')?.currentTime}));
   results.push({feed:e.key,guide,playing,menuRestored,toolbarSeparated,videoProof,errors,diagnostics,...state});
  }catch(err){results.push({feed:e.key,playing:false,errors:[...errors,err.message]});}
  finally{await page.close();}
 }
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
fs.writeFileSync('feed-browser-results.json',JSON.stringify(results,null,2));
if(results.some(x=>!x.playing||x.errors.length))process.exitCode=1;
