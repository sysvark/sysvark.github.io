import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {join} from 'node:path';
const {chromium} = await import(process.env.PLAYWRIGHT_ENTRY ? pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href : 'playwright');
const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || undefined});
process.env.PORT = '0';
const {server} = await import('./serve.mjs');
if (!server.listening) await once(server,'listening');
try {
  const url = process.env.REVISAR_PAGES === '1' ? 'https://sysvark.github.io/' : 'http://127.0.0.1:'+server.address().port+'/';
  const captures = process.env.QA_SCREENSHOTS || 'docs/capturas';
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
  await mkdir(captures,{recursive:true});
  for (const [width,height] of [[1440,900],[768,1024],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(url,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#proposal button[type=submit]').isDisabled(),false);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:join(captures,'inicio-'+width+'.png')});
    if(width===1440) {
      console.log('Chromium',browser.version(),await page.evaluate(()=>({
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
  let deliveries = 0;
  let accepted = false;
  await page.route('https://formsubmit.co/ajax/**', route => {
    deliveries++;
    return route.fulfill({json:{success:String(accepted)}});
  });
  const contact = page.locator('#proposal');
  for (const [name,value] of Object.entries({nombre:'Prueba',empresa:'Empresa ficticia',email:'prueba@example.com',proceso:'Preparar el cierre mensual.'})) await contact.locator('[name='+name+']').fill(value);
  const send = contact.locator('[type=submit]');
  await send.click();
  assert.equal(deliveries,0);
  await contact.locator('[name=privacidad]').check();
  for (const [name,value] of [['email','correo'],['nombre','   '],['empresa','  '],['proceso','    corto    '],['telefono','incompleto']]) {
    const field = contact.locator('[name='+name+']');
    const original = await field.inputValue();
    await field.fill(value);
    await send.click();
    assert.equal(deliveries,0);
    assert.equal(await field.evaluate(node=>node.validity.valid),false);
    await field.fill(original);
  }
  await send.click();
  await page.getByText('No se ha podido confirmar el envío.',{exact:false}).waitFor();
  assert.equal(deliveries,1);
  assert.equal(await contact.locator('[name=proceso]').inputValue(),'Preparar el cierre mensual.');
  accepted = true;
  await contact.locator('[type=submit]').click();
  await page.getByRole('status').filter({hasText:'Mensaje enviado'}).waitFor();
  assert.equal(deliveries,2);
  assert.equal(await contact.locator('[name=proceso]').inputValue(),'');
  const hours = page.locator('#hours-number');
  for (const [draft,committed] of [['-1','0'],['300','168'],['','168'],['0.15','0.2']]) {
    await hours.fill(draft);
    assert.equal(await hours.getAttribute('aria-invalid'),'true');
    await hours.blur();
    assert.equal(await hours.inputValue(),committed);
    assert.equal(await page.locator('#hours-range').inputValue(),committed);
  }
  await page.locator('#rate-number').fill('23.75');
  await page.locator('#rate-number').blur();
  assert.equal(await page.locator('#rate-range').inputValue(),'23.75');
  await hours.fill('12');
  await page.locator('#rate-number').fill('20');
  await page.locator('#percent-number').fill('50');
  assert.match(await page.locator('#monthly-hours').innerText(),/52 h/);
  assert.match(await page.locator('#monthly-saved').innerText(),/26 h/);
  assert.match(await page.locator('#monthly-value').innerText(),/520,00/);
  assert.equal(await page.locator('.scene:visible').count(),1);
  assert.equal(await page.locator('#demostraciones input[type=file]').count(),0);
  assert.equal(await page.locator('.controls .calc-note').count(),1);
  await page.getByRole('button',{name:'Flujo conectado',exact:true}).click();
  await page.getByRole('button',{name:'Decidir',exact:true}).click();
  assert.equal(await page.locator('.workflow .current b').innerText(),'Regla de stock');
  await page.getByRole('button',{name:'Informes Excel',exact:true}).click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.flow-layer').getAttribute('transform')==='translate(0 48)');
  const layer = page.locator('.flow-layer').first();
  const before = await layer.getAttribute('transform');
  await page.evaluate(()=>window.scrollBy({top:document.querySelector('.blueprint').getBoundingClientRect().top-50,behavior:'instant'}));
  await page.waitForFunction(value=>document.querySelector('.flow-layer').getAttribute('transform')!==value,before);
  const snapshot = () => Array.from(document.querySelectorAll('.port-content'), n => n.dataset.icon).join(',');
  const initial = await page.evaluate(snapshot);
  for (let i=0, state=initial; i<3; i++) {
    await page.waitForFunction(old => Array.from(document.querySelectorAll('.port-content'), n=>n.dataset.icon).join(',') !== old, state);
    const next = await page.evaluate(snapshot);
    assert.equal(new Set(next.split(',')).size,6);
    assert.equal(next.split(',').filter((icon,j)=>icon !== state.split(',')[j]).length,1);
    state = next;
  }
  await page.locator('.demo-theater').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Informes Excel',exact:true}).focus();
  await page.keyboard.press('Tab');
  const focusBefore = await page.evaluate(()=>document.activeElement.textContent);
  const sceneBefore = await page.locator('.scene:visible').getAttribute('data-stage');
  await page.waitForTimeout(4500);
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),focusBefore);
  assert.equal(await page.locator('.scene:visible').getAttribute('data-stage'),sceneBefore);
  await page.evaluate(()=>document.activeElement.blur());
  for (const name of ['bills','inbox','workflow','sheets']) {
    await page.locator('.scene.'+name+':visible').waitFor({timeout:33000});
  }
  await page.setViewportSize({width:1280,height:840});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.scene.sheets').screenshot({path:join(captures,'demostracion-informes.png')});
  await page.getByRole('button',{name:'Facturas',exact:true}).click();
  await page.getByRole('button',{name:'Preparar registro',exact:true}).click();
  await page.locator('.scene.bills').screenshot({path:join(captures,'demostracion-factura.png')});
  const staticPage = await browser.newPage({javaScriptEnabled:false, viewport:{width:390,height:844}});
  await staticPage.goto(url);
  assert.equal(await staticPage.locator('.scene:visible').count(),4);
  const tops = await staticPage.locator('.scene').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().top));
  assert.ok(tops.every((top,i)=>!i || top>tops[i-1]));
  assert.equal(await staticPage.locator('.scene-picker:visible').count(),0);
  assert.match(await staticPage.locator('#monthly-value').innerText(),/541,67/);
  assert.equal(await staticPage.locator('#hours-number').isDisabled(),true);
  assert.ok(await staticPage.locator('#contacto a[href^="mailto:"]').first().isVisible());
  await staticPage.close();
  assert.deepEqual(errors,[]);
  console.log('Portada, tres tamaños, menú, calculadora, formulario editable, compactación y rotación de cuatro escenas correctas.');
} finally { await browser.close(); server.close(); }
