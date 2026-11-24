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
  await page.locator('#demo-sample').click();
  await page.locator('#demo-report-results:visible').waitFor();
  await page.emulateMedia({reducedMotion:'no-preference'});
  const walkthrough = page.locator('#demo-report .walkthrough');
  await walkthrough.scrollIntoViewIfNeeded();
  await walkthrough.getByRole('button',{name:'Comparar',exact:true}).and(page.locator('[aria-pressed=true]')).waitFor({timeout:10000});
  await walkthrough.getByRole('button',{name:'Consolidar',exact:true}).click();
  assert.equal(await walkthrough.getByRole('button',{name:'Reproducir el ejemplo'}).isVisible(),true);
  await page.locator('.flow-toggle').click();
  assert.equal(await page.locator('.blueprint .signal path').first().evaluate(path=>getComputedStyle(path).animationPlayState),'paused');
  await page.locator('[data-demo-mode=invoice]').click();
  await page.locator('#demo-invoice-run').click();
  await page.locator('#demo-invoice-results:visible').waitFor();
  assert.equal(await page.getByLabel('Importe total').inputValue(),'145,20 EUR');
  assert.deepEqual(errors,[]);
  console.log('Portada, tres tamaños, menú, calculadora, formulario inactivo, Excel y PDF correctos.');
} finally { await browser.close(); server.close(); }
