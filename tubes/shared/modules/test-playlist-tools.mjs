import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 await page.route('https://test.invalid/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><div id="playlistcontrols"></div><div id="queue"></div></body></html>'}));
 await page.goto('https://test.invalid/tv/test');
 await page.evaluate(()=>{
  window.PL_CURRENT=1;
  window.hasPermission=()=>true;
  window.sent=[];
  window.fail=false;
  window.jQuery=el=>({data:key=>key==='uid'?Number(el.dataset.uid):{id:el.dataset.media,type:'yt',title:el.textContent}});
  window.socket={connected:true,emit(event,uid){window.sent.push(uid);if(!window.fail)document.querySelector('[data-uid="'+uid+'"]')?.remove();}};
  for(let i=1;i<=5;i++){const e=document.createElement('div');e.className='queue_entry';e.dataset.uid=i;e.dataset.media='video'+i;e.textContent='Video '+i;document.querySelector('#queue').appendChild(e);}
 });
 await page.addScriptTag({path:'tubes/shared/modules/PlaylistTools-Standalone.js'});
 await page.locator('#bpt-open').click();
 await page.locator('#bpt-mode').selectOption('last');
 await page.locator('#bpt-n').fill('0');
 assert.equal(await page.locator('#bpt-delete').isDisabled(),true);
 await page.locator('#bpt-n').fill('2');
 page.on('dialog',d=>d.accept());
 await page.locator('#bpt-delete').click();
 await page.waitForFunction(()=>document.querySelector('#bpt-status').textContent.includes('2 removals confirmed'));
 assert.deepEqual(await page.evaluate(()=>window.sent),[4,5]);
 await page.evaluate(()=>{window.fail=true});
 await page.locator('#bpt-mode').selectOption('others');
 await page.locator('#bpt-delete').click();
 await page.waitForFunction(()=>document.querySelector('#bpt-status').textContent.includes('Removal not confirmed'),{},{timeout:15000});
 assert.deepEqual(await page.evaluate(()=>window.sent),[4,5,2]);
 assert.equal(await page.locator('[data-uid="1"]').count(),1);
 assert.equal(await page.locator('[data-uid="3"]').count(),1);
 console.log('PASS: zero count, confirmed removal, current playback protection, stop on failed removal');
} finally {await browser.close();}
