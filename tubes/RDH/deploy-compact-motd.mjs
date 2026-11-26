import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='rdh-compact-motd-review';await fs.mkdir(dir,{recursive:true});
const oldJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@364c972c0f75249bca4c094b02dc8104e9edff40/tubes/RDH/rdh-custom-only-v1.5.js';
const newJs='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@9502f21f4d6d192d57535fa99e8bb7a62b411935/tubes/RDH/rdh-custom-only-v1.6.js';
const oldCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@956d6239a5de8b860ac34449168ae847676748a2/tubes/RDH/rdh-neon-native.css';
const newCss='https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@ed9464b2f4fe1fee1880d2b1b7648ac7e0d184c3/tubes/RDH/rdh-neon-compact-motd.css';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const state=()=>page.evaluate(()=>{const c=window.CHANNEL||{},o=c.opts||{};return {name:c.name,user:window.CLIENT?.name,rank:window.CLIENT?.rank,loggedIn:!!window.CLIENT?.logged_in,connected:!!window.socket?.connected,css:c.css,js:c.js,motd:c.motd,externalcss:o.externalcss||'',externaljs:o.externaljs||''};});
const auth=s=>s.connected&&s.loggedIn&&s.rank>=3&&s.user?.toLowerCase()==='buttman-gpt'&&s.name?.toLowerCase()==='rdh';
let before,current,changes=[];
async function set(field,value){
 const expected=current;
 await page.evaluate(({field,value,e})=>{const c=window.CHANNEL,o=c.opts||{};if(!window.socket?.connected||!window.CLIENT?.logged_in||window.CLIENT?.rank<3||window.CLIENT?.name?.toLowerCase()!=='buttman-gpt'||c.name?.toLowerCase()!=='rdh'||c.motd!==e.motd||c.css!==e.css||c.js!==e.js||o.externalcss!==e.externalcss||o.externaljs!==e.externaljs)throw Error('Concurrent change; no write');window.socket.emit(field==='motd'?'setMotd':'setOptions',field==='motd'?{motd:value}:{[field]:value});},{field,value,e:expected});
 for(let i=0;i<100;i++){const s=await state();if(s[field]===value){current=s;return}if(field==='motd'&&s.motd!==expected.motd&&await page.evaluate(({a,b})=>{const norm=x=>{const d=new DOMParser().parseFromString(x,'text/html');return [d.body.textContent.replace(/\s+/g,' ').trim(),[...d.querySelectorAll('a[href]')].map(e=>[e.textContent,e.getAttribute('href')]),!!d.querySelector('.rdh-compact-motd'),!!d.querySelector('.rdh-newsletter-controls'),[...d.querySelectorAll('details')].map(e=>e.textContent)]};return JSON.stringify(norm(a))===JSON.stringify(norm(b));},{a:s.motd,b:value})){current=s;return}await page.waitForTimeout(250)}throw Error(field+' persistence not confirmed');
}
try{
 await page.goto('https://baked.live/login',{waitUntil:'domcontentloaded',timeout:45000});
 const f=page.locator('form[action="/login"]').last();await f.locator('input[name="name"]').fill('buttman-gpt');await f.locator('input[name="password"]').fill(process.env.BAKED_LIVE_PASSWORD);await f.locator('button[type="submit"]').click();await page.waitForLoadState('domcontentloaded');
 await page.goto('https://baked.live/tv/rdh',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.socket?.connected&&window.CLIENT?.logged_in&&window.CLIENT?.rank>=3&&window.CHANNEL?.name?.toLowerCase()==='rdh'&&document.querySelector('#queue .queue_entry'),null,{timeout:45000});
 before=current=await state();assert.ok(auth(before));assert.equal(before.externaljs,oldJs);assert.equal(before.externalcss,oldCss);assert.equal(before.js,'');await fs.writeFile(dir+'/before.json',JSON.stringify(before,null,2));
 const result=await page.evaluate(html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  const norm=s=>s.replace(/\s+/g,' ').trim();
  const rules=[...doc.querySelectorAll('details')].find(e=>/House Rules/i.test(e.querySelector('summary')?.textContent||''));
  if(!rules)throw Error('House Rules missing');
  const entry=[...rules.querySelectorAll('div,li,p')].find(e=>/^(?:8\.\s*)?Newsletters:\s*!won\s*!torch$/i.test(norm(e.textContent)));
  if(!entry)throw Error('Expected newsletter rule not found');
  const links=()=>[...doc.querySelectorAll('a[href]')].map(e=>[norm(e.textContent),e.getAttribute('href')]);
  const oldLinks=JSON.stringify(links());
  entry.remove();
  const preservedRules=norm(rules.textContent);
  const outside=doc.body.cloneNode(true);outside.querySelector('details')?.remove();
  const outsideText=norm(outside.textContent);
  if(!/^(?:●\s*)?(?:Chat along with )?Wrestling Observer Live\s*[—–-]\s*Weekdays at 3:06 PM ET$/i.test(outsideText))throw Error('Unexpected MOTD text outside rules: '+outsideText);
  const wrapper=doc.createElement('div');wrapper.className='rdh-compact-motd';
  const subtitle=doc.createElement('div');subtitle.className='rdh-motd-subtitle';subtitle.textContent='WRESTLING PODCAST CENTRAL';
  const schedule=doc.createElement('div');schedule.className='rdh-wol-chat';const strong=doc.createElement('strong');strong.textContent='Wrestling Observer Live Chat';schedule.append(strong,doc.createTextNode(' — Weekdays at 3:06 PM ET'));
  const tools=doc.createElement('div');tools.className='rdh-motd-tools';
  const summary=rules.querySelector('summary');summary.textContent='House Rules';rules.removeAttribute('open');rules.removeAttribute('style');
  const news=doc.createElement('div');news.className='rdh-newsletter-controls';news.append(doc.createTextNode('Newsletters: '));
  for(const cmd of ['!won','!torch']){const b=doc.createElement('b');b.textContent=cmd;news.append(b,doc.createTextNode(' '));}
  tools.append(rules,news);wrapper.append(subtitle,schedule,tools);doc.body.replaceChildren(wrapper);
  if(JSON.stringify(links())!==oldLinks)throw Error('Existing links lost');
  if(norm(rules.textContent)!==preservedRules)throw Error('Existing rules changed');
  return {html:doc.body.innerHTML,preservedRules};
 },before.motd);
 await fs.writeFile(dir+'/proposed.html',result.html);
 const css=await page.request.get(newCss),js=await page.request.get(newJs);assert.ok(css.ok()&&js.ok());const cssCode=await css.text(),jsCode=await js.text();await css.dispose();await js.dispose();new Function(jsCode);
 // Pilot only in this tab; no user approvals or live settings changed.
 await page.addStyleTag({content:cssCode});
 await page.evaluate(html=>{document.getElementById('motd').innerHTML=html},result.html);
 await page.evaluate(code=>{(0,eval)(code)},jsCode);await page.waitForTimeout(500);
 const layout=await page.evaluate(()=>{const motd=document.getElementById('motd'),details=motd.querySelector('details'),buttons=[...motd.querySelectorAll('.rdh-newsletter-command')];return {height:motd.getBoundingClientRect().height,subtitle:motd.querySelector('.rdh-motd-subtitle')?.textContent,schedule:motd.querySelector('.rdh-wol-chat')?.textContent,closed:!details.open,buttons:buttons.map(e=>({command:e.dataset.command,visible:!!e.getClientRects().length,outside:!details.contains(e)})),legacy:!!window.CLIENT?.modules,rows:document.querySelectorAll('#queue .queue_entry').length};});
 assert.equal(layout.subtitle,'WRESTLING PODCAST CENTRAL');assert.equal(layout.schedule,'Wrestling Observer Live Chat — Weekdays at 3:06 PM ET');assert.ok(layout.closed&&layout.height>0&&layout.height<230&&layout.buttons.length===2&&layout.buttons.every(x=>x.visible&&x.outside)&&!layout.legacy&&layout.rows>0,JSON.stringify(layout));
 await page.locator('#motd details summary').click();assert.ok(await page.locator('#motd details').evaluate(e=>e.open));await page.locator('#motd details summary').click();
 await page.evaluate(()=>{const s=window.socket,original=s.emit;window.__rdhCompactTest={sent:[],restore:()=>{s.emit=original}};s.emit=function(event,...args){if(event==='chatMsg'&&['!won','!torch'].includes(args[0]?.msg)){window.__rdhCompactTest.sent.push(args[0].msg);return this}return original.apply(this,[event,...args])}});
 try{await page.locator('#motd [data-command="!won"]').click();await page.waitForTimeout(2600);await page.locator('#motd [data-command="!torch"]').click();assert.deepEqual(await page.evaluate(()=>window.__rdhCompactTest.sent),['!won','!torch']);}finally{await page.evaluate(()=>{window.__rdhCompactTest.restore();delete window.__rdhCompactTest})}
 await page.screenshot({path:dir+'/desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 const mobile=await page.evaluate(()=>{const m=document.getElementById('motd'),buttons=[...m.querySelectorAll('.rdh-newsletter-command')];return {width:m.getBoundingClientRect().width,overflow:m.scrollWidth>m.clientWidth+2,buttons:buttons.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,visible:r.width>0&&r.height>0}})}});
 assert.ok(!mobile.overflow&&mobile.buttons.every(x=>x.visible&&x.left>=0&&x.right<=390+1),JSON.stringify(mobile));await page.screenshot({path:dir+'/mobile.png'});
 console.log('RDH_COMPACT_PILOT '+JSON.stringify({layout,mobile,commandsVerified:true,actualChatCommandsSent:0}));
 // Each write is guarded by the last confirmed state. Roll back in reverse order if needed.
 await set('externaljs',newJs);changes.push('externaljs');
 await set('externalcss',newCss);changes.push('externalcss');
 await set('motd',result.html);changes.push('motd');
 const after=await state();assert.ok(auth(after));assert.equal(after.externaljs,newJs);assert.equal(after.externalcss,newCss);assert.equal(after.js,before.js);assert.equal(after.css,before.css);assert.ok(after.motd.includes('rdh-compact-motd'));
 console.log('RDH_COMPACT_RESULT '+JSON.stringify({status:'saved-pilot-passed',layout,mobile,allOtherRulesPreserved:true,localCssAndJsPreserved:true,reloads:0,playlistWrites:0,visitorScriptApprovalMayBeRequired:true,botReplyNotTested:true}));
}catch(e){console.log('RDH_COMPACT_ERROR '+e.message);try{for(const field of changes.reverse()){const s=await state();if(!auth(s)||s[field]!==current[field])throw Error('Concurrent change prevents rollback');await set(field,before[field]);}}catch(r){console.log('RDH_COMPACT_ROLLBACK_BLOCKED '+r.message)}throw e;}finally{await browser.close();}
