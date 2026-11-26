import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {auditRelease, pages, publicAssets} from '../scripts/release.mjs';

const origin = new URL('https://sysvark.github.io/');
const document = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'"><main id="contenido"></main>';

test('el paquete público falla ante recursos ajenos, enlaces internos rotos o rutas de desarrollo', async t => {
  const output = await mkdtemp(path.join(tmpdir(), 'sysvark-release-'));
  t.after(() => rm(output, {force:true,recursive:true}));
  async function write(name, contents = '') {
    const file = path.join(output,name);
    await mkdir(path.dirname(file),{recursive:true});
    await writeFile(file,contents);
  }
  for (const name of [...publicAssets,'.nojekyll','sitemap.xml','robots.txt']) await write(name);
  for (const name of pages) await write(name, document);
  assert.equal(await auditRelease(output,origin), publicAssets.length + pages.length + 3);

  for (const extra of ['assets/debug.js.map', '.env', 'docs/privado.md']) {
    await write(extra);
    await assert.rejects(auditRelease(output,origin),/fuera de la lista pública/);
    await rm(path.join(output,extra));
    if (extra.startsWith('docs/')) await rm(path.join(output,'docs'),{recursive:true});
  }
  for (const [link,error] of [
    ['./README.md',/fuera de la lista pública/], ['/#ausente',/Ancla ausente/],
    ['https://github.com/sysvark/sysvark.github.io',/repositorio de desarrollo/]
  ]) {
    await write('index.html',document + '<a href="'+link+'">Enlace</a>');
    await assert.rejects(auditRelease(output,origin),error);
  }
  await write('index.html',document);
  await rm(path.join(output,'assets/firma-sysvark.png'));
  await assert.rejects(auditRelease(output,origin),/Falta el recurso público/);
});

test('la lista pública conserva solo la firma de correo y los módulos que la web utiliza', () => {
  assert.ok(publicAssets.includes('assets/firma-sysvark.png'));
  assert.ok(publicAssets.includes('assets/calculator.mjs'));
  assert.ok(publicAssets.includes('assets/logos/servicenow.ico'));
  assert.equal(new Set(publicAssets).size,publicAssets.length);
  assert.ok(publicAssets.every(name => !/(?:vendor|tests?|fixtures|docs|brand|scripts|\.map$|\.env)/.test(name)));
});
