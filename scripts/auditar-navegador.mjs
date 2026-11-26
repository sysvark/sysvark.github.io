import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
const phase = process.argv[3] || 'despues';
if (!['antes','despues'].includes(phase)) throw new Error('Fase desconocida.');
const root = path.resolve('docs/auditoria');
const toolkit = await import(process.env.PLAYWRIGHT_ENTRY ? pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href : 'playwright');
const engine = process.env.QA_ENGINE || 'chromium';
const browser = await toolkit[engine].launch({executablePath:process.env.BROWSER_PATH || undefined});
const name = process.env.QA_NAME || engine;
const widths = [320,360,375,390,393,414,430,480,600,740,760,768,820,1024,1280,1366,1440,1536,1920,2560];
const evidence = {phase, browser:name,version:browser.version(),layout:[],pages:[],violations:[],errors:[],external:[],warnings:[]};
await mkdir(path.join(root,'capturas'),{recursive:true});
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  page.on('pageerror',err=>evidence.errors.push(err.message));
  page.on('request',req=>{
    const url = new URL(req.url());
    if (url.protocol.startsWith('http') && url.origin !== base.origin) evidence.external.push(url.origin);
  });
  page.on('requestfailed',req=>{if(!req.failure()?.errorText.includes('ABORT')) evidence.errors.push(req.url()+' '+req.failure()?.errorText)});
  async function checkLayout(width,height,zoom=1) {
    await page.setViewportSize({width:Math.floor(width/zoom),height:Math.floor(height/zoom)});
    await page.waitForFunction(w => innerWidth === w, Math.floor(width / zoom));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Desktop zoom changes the layout viewport; exercise its corresponding CSS width.
    const issues = await page.evaluate(() => {
      const limit=document.documentElement.clientWidth;
      const results=[];
      if (document.documentElement.scrollWidth>limit+1) results.push('documento +'+(document.documentElement.scrollWidth-limit));
      for(const el of document.querySelectorAll('h1,h2,h3,button,input,textarea,.service-card,.workbench,.calc-control,summary')){
        if (el.closest('[inert],[hidden]')||!el.getClientRects().length) continue;
        const rect=el.getBoundingClientRect();
        if(rect.width>0 && (rect.left< -2 || rect.right>innerWidth+2)) results.push(el.tagName+' '+(el.id||el.className||el.textContent.slice(0,30)));
      }
      return results;
    });
    evidence.layout.push({width,height,zoom,issues});
  }
  async function scan(label) {
    if (!process.env.AXE_ENTRY) return;
    if (!await page.evaluate(()=>typeof window.axe==='object')) await page.evaluate(await (await import('node:fs/promises')).readFile(process.env.AXE_ENTRY,'utf8'));
    const findings = await page.evaluate(async () => {
      const {violations} = await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});
      return violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(n=>n.target)}));
    });
    evidence.violations.push({label,findings});
  }
  await page.goto(base.href,{waitUntil:'networkidle'});
  for(const width of widths) await checkLayout(width,width<600?844:900);
  for(const [w,h] of [[844,390],[1024,600],[1366,768]]) await checkLayout(w,h);
  for(const zoom of [1.25,2,4]) await checkLayout(1280,900,zoom);

  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:width===390?844:900});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    if(process.env.QA_CAPTURE==='1') await page.screenshot({path:path.join(root,'capturas',phase+'-'+width+'.png'),fullPage:true});
  }
  await scan('inicio');
  const facts = await page.evaluate(()=>({
    h1:document.querySelectorAll('h1').length,lang:document.documentElement.lang,
    canonical:document.querySelector('link[rel=canonical]')?.href,
    loadMs:Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),
    resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.encodedBodySize,0),
    links:document.querySelectorAll('a[href]').length
  }));
  evidence.pages.push({url:'/',...facts});
  const faq=page.locator('.faq-list summary').first();
  await faq.focus();await page.keyboard.press('Enter');assert.ok(await faq.evaluate(el=>el.parentElement.open));await page.keyboard.press('Enter');
  for(const selector of ['Facturas','Seguimiento de envíos','Flujo conectado']){
    const control=page.getByRole('button',{name:selector,exact:true});
    await control.focus();await page.keyboard.press('Enter');assert.equal(await control.getAttribute('aria-pressed'),'true');
    await scan(selector);
  }
  for(const route of ['aviso-legal.html','privacidad.html','ruta-inexistente-auditoria/']){
    const response=await page.goto(new URL(route,base).href);
    const status=response.status();
    evidence.pages.push({url:route,status,title:await page.title(),h1:await page.locator('h1').count()});
    for(const width of [320,768,1440]) await checkLayout(width,900);
    await scan(route);
  }
} finally {
  await browser.close();
  await writeFile(path.join(root,phase+'-'+name+'.json'),JSON.stringify(evidence,null,2)+'\n');
}
console.log(name,phase,'medidas',evidence.layout.length,'desbordamientos',evidence.layout.filter(row=>row.issues.length).length,'hallazgos axe',evidence.violations.flatMap(row=>row.findings).map(row=>row.id),'errores',evidence.errors);

if (phase === 'despues') {
  assert.equal(evidence.layout.flatMap(row=>row.issues).length,0,'Desbordamiento en la matriz responsive');
  assert.equal(evidence.violations.flatMap(row=>row.findings).length,0,'Hallazgos de accesibilidad');
  assert.equal(evidence.errors.length,0,'Errores del navegador');
  assert.equal(evidence.pages.at(-1).status,404,'La ruta inexistente debe devolver 404');
}
