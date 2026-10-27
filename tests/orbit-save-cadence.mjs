import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY||'/tmp/utxoplay-decouple/checks/node_modules/playwright/index.mjs');
const base=process.env.STORE_URL||'https://store.utxoplay.io',out=process.env.ARTIFACTS||'/tmp/orbit-save-cadence';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/home/arthur/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox']});
const context=await browser.newContext({storageState:process.env.STORAGE_STATE||undefined}),page=await context.newPage(),posts=[],errors=[];let inject=false,injected=0;
page.on('pageerror',e=>errors.push(e.message));
await page.route(base+'/games/orbit-courier/**',async route=>{
 const file=new URL(route.request().url()).pathname.slice('/games/orbit-courier/'.length)||'index.html';
 if(file==='api/action'){
  posts.push({time:Date.now(),inputs:route.request().postDataJSON().action.inputs.length});
  if(inject){inject=false;injected++;return route.fulfill({status:429,contentType:'application/json',headers:{'Retry-After':'7'},body:'{"error":"Please wait before trying again."}'});}
 }
 if(process.env.LOCAL_WEB&&!file.startsWith('api/')){const local=path.join(process.env.LOCAL_WEB,file);if(fs.existsSync(local))return route.fulfill({path:local});}
 return route.continue();
});
try{
 await page.goto(base+'/games/orbit-courier/');await page.locator('#launch:not(:disabled)').waitFor();
 await page.locator('#new').click();await page.locator('#launch').click();await page.waitForFunction(()=>document.documentElement.dataset.playing==='true');await page.keyboard.press('KeyA');inject=process.env.INJECT_429==='1';
 const start=Date.now();let pauses=0,heldSafely=false,resumedAfterHold=false,maxPending=0;
 while(Date.now()-start<75000){
  await page.waitForTimeout(500);
  const flow=await page.evaluate(()=>({pending:Number(document.documentElement.dataset.pending),held:document.querySelector('#context').textContent.includes('FLIGHT IS HELD SAFELY'),playing:document.documentElement.dataset.playing==='true'}));maxPending=Math.max(maxPending,flow.pending);if(flow.held)heldSafely=true;else if(heldSafely&&flow.playing&&flow.pending<60)resumedAfterHold=true;
  if(await page.locator('#panel').evaluate(e=>e.open)){
   const title=await page.locator('#panel-title').textContent();assert.doesNotMatch(title,/Unable|interrupted|connection/i,title+': '+await page.locator('#panel-detail').textContent());
   pauses++;await page.locator('#launch').click();await page.waitForFunction(()=>document.documentElement.dataset.playing==='true');await page.keyboard.press('KeyA');
  }
 }
 await page.locator('#menu').click();await page.locator('#verify').click();await page.locator('#panel-detail').filter({hasText:/Verified .* signed frames/}).waitFor();
 const maxMinute=Math.max(...posts.map(p=>posts.filter(q=>q.time>=p.time&&q.time<p.time+60000).length));assert.ok(maxMinute<65,`Too many saves: ${maxMinute}/minute`);assert.equal(injected,process.env.INJECT_429==='1'?1:0);assert.deepEqual(errors,[]);
 if(injected){assert.ok(heldSafely,'the simulation held when the save backlog filled');assert.ok(resumedAfterHold,'flight resumed automatically after cooldown');assert.ok(maxPending<=150);}
 const result={heldSafely,resumedAfterHold,maxPending,seconds:75,posts:posts.length,maxMinute,pauses,injected429:injected,replay:await page.locator('#panel-detail').textContent(),meanBatch:posts.reduce((sum,p)=>sum+p.inputs,0)/posts.length};
 await page.screenshot({path:out+'/result.png'});fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log(result);
}catch(error){console.error(await page.locator('#panel').innerText());throw error;}finally{await browser.close()}
