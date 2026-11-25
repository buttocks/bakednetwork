import { chromium } from 'playwright';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('tubes/feeds/discovery.json'));
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const results=[];
try {
 for(const e of config.channels){
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const url='https://buttocks.github.io/bakednetwork/tubes/'+e.directory+'/feed.html?channel='+e.key;
  try {
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#program-name')?.textContent!=='Tuning…',{},{timeout:20000});
   await page.locator('#guide-toggle').click();
   const guide=await page.locator('#guide-list li').count();
   if(!guide)throw Error('Empty guide');
   await page.locator('#guide-toggle').click();
   let playing=false;
   try {await page.waitForFunction(()=>document.querySelector('#status')?.hidden===true,{},{timeout:45000});playing=true;}catch{}
   const state=await page.evaluate(()=>({title:document.querySelector('#program-name')?.textContent,status:document.querySelector('#status-text')?.textContent,source:document.querySelector('#channel-name')?.textContent,videoTime:document.querySelector('video')?.currentTime}));
   results.push({feed:e.key,guide,playing,errors,...state});
  }catch(err){results.push({feed:e.key,playing:false,errors:[...errors,err.message]});}
  finally{await page.close();}
 }
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
fs.writeFileSync('feed-browser-results.json',JSON.stringify(results,null,2));
if(results.some(x=>!x.playing||x.errors.length))process.exitCode=1;
