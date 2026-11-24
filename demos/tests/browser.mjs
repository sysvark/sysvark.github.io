import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname,sep,extname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY ? pathToFileURL(process.env.PLAYWRIGHT_ENTRY).href : 'playwright');
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
  try{
    if (req.url==='/') {
      res.setHeader('content-type','text/html;charset=utf-8');
      res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/demos/demo.css">'+await fs.readFile(resolve(root,'demos/section.html'),'utf8')+'<script type="module" src="/demos/demo.mjs"></script>');
      return;
    }
    const filename=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!filename.startsWith(root+sep)) throw Error();
    const data=await fs.readFile(filename);
    res.setHeader('content-type',types[extname(filename)]||'application/octet-stream');
    res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true});
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  const external=[];
  page.on('request',req=>{if(/^https?:/.test(req.url())&&new URL(req.url()).hostname!=='127.0.0.1') external.push(req.url());});
  await page.click('#demo-sample');
  await page.waitForSelector('#demo-report-results:not([hidden])');
  assert.match(await page.textContent('#demo-report-status'),/9 filas leídas · 8 filas consolidadas. Duplicados: 1. Referencias con diferencias: 1. Filas no válidas: 1/);
  const reportDownload=page.waitForEvent('download');
  await page.click('#demo-report-export');
  assert.equal((await reportDownload).suggestedFilename(),'sysvark-informe.csv');
  await page.click('#demo-reset');
  await page.click('#demo-report summary');
  const files=[1,2,3].map(i=>resolve(root,'demos/files/operaciones-'+i+'.xlsx'));
  await page.setInputFiles('#demo-input',files.slice(0,1));
  assert.match(await page.textContent('#demo-report-status'),/exactamente tres/);
  await page.setInputFiles('#demo-input',files);
  await page.waitForSelector('#demo-report-results:not([hidden])');
  assert.equal(await page.locator('#demo-report-results tbody tr').count(),8);
  await page.click('[data-demo-mode=invoice]');
  for(const [id,total] of [['fic-001','145,20 EUR'],['fic-002','290,40 EUR']]){
    await page.selectOption('#demo-invoice-choice',id);
    await page.click('#demo-invoice-run');
    await page.waitForSelector('#demo-invoice-results:not([hidden])');
    assert.equal(await page.inputValue('[aria-label="Importe total"]'),total);
    await page.fill('[aria-label=Concepto]','Revisado');
    const pending=page.waitForEvent('download');
    await page.click('#demo-invoice-export');
    assert.match(await fs.readFile(await (await pending).path(),'utf8'),/Revisado/);
  }
  for(const width of [360,768,1280]){
    await page.setViewportSize({width,height:800});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Ancho '+width);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  console.log('OK: muestras, consolidación, validación, selección, revisión, dos PDFs reales, descargas, tres anchos, consola y solicitudes locales.');
}finally{
  await browser?.close();
  await new Promise(r=>server.close(r));
}

