import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
const {chromium} = await import(process.env.PLAYWRIGHT_ENTRY ? pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href : 'playwright');
const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || undefined});
process.env.PORT = '0';
const {server} = await import('./serve.mjs');
if (!server.listening) await once(server,'listening');
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
  await mkdir('docs/capturas',{recursive:true});
  for (const [width,height] of [[1440,900],[768,1024],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(process.env.REVISAR_PAGES === '1' ? 'https://sysvark.github.io/' : 'http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#proposal button[type=submit]').isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:'docs/capturas/inicio-'+width+'.png'});
    if(width===1440) {
      console.log('Edge',browser.version(),await page.evaluate(()=>({
        loadMs:performance.getEntriesByType('navigation')[0].loadEventEnd,
        resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.encodedBodySize,0),
        htmlBytes:performance.getEntriesByType('navigation')[0].encodedBodySize
      })));
    }
    if(width===390) {
      await page.getByRole('button',{name:'Abrir menú'}).click();
      await page.locator('#primary-nav').getByText('Soluciones').click();
      assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');
    }
  }
  await page.locator('#hours-number').fill('12');
  await page.locator('#rate-number').fill('20');
  await page.locator('#percent-number').fill('50');
  assert.match(await page.locator('#monthly-hours').innerText(),/52 h/);
  assert.match(await page.locator('#monthly-saved').innerText(),/26 h/);
  assert.match(await page.locator('#monthly-value').innerText(),/520,00/);
  assert.equal(await page.locator('.scene:visible').count(),3);
  assert.equal(await page.locator('#demostraciones input,#demostraciones button,.flow-toggle').count(),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.flow-layer').getAttribute('transform')==='translate(0 48)');
  const layer = page.locator('.flow-layer').first();
  const before = await layer.getAttribute('transform');
  await page.evaluate(()=>window.scrollBy({top:document.querySelector('.blueprint').getBoundingClientRect().top-50,behavior:'instant'}));
  await page.waitForFunction(value=>document.querySelector('.flow-layer').getAttribute('transform')!==value,before);
  await page.locator('.demo-theater').scrollIntoViewIfNeeded();
  for (const name of ['bills','inbox','sheets']) {
    await page.locator('.scene.'+name+':visible').waitFor({timeout:26000});
  }
  await page.setViewportSize({width:1280,height:840});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.scene.sheets').screenshot({path:'docs/capturas/demostracion-informes.png'});
  assert.deepEqual(errors,[]);
  console.log('Portada, tres tamaños, menú, calculadora, formulario inactivo, compactación y rotación de tres escenas correctas.');
} finally { await browser.close(); server.close(); }

