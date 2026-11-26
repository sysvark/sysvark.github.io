import {readFile, writeFile, copyFile, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assertPublicSource, auditRelease, pages, publicAssets} from './release.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = 'https://sysvark.github.io/';
const base = new URL(process.env.SITE_URL || target);
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('SITE_URL debe ser el origen HTTPS del sitio web de usuario.');
}
const read = file => readFile(path.join(root,file),'utf8');
const output = path.join(root,'dist');
await rm(output,{recursive:true,force:true});
await mkdir(output);
const emit = (file, data) => writeFile(path.join(output,file),data);
for (const file of publicAssets) {
  await assertPublicSource(root, file);
  await mkdir(path.dirname(path.join(output,file)),{recursive:true});
  await copyFile(path.join(root,file),path.join(output,file));
}

const formUrl = 'https://formsubmit.co/ajax/sysvark@outlook.com';
const website = {'@context':'https://schema.org','@type':'WebSite',name:'SYSVARK',url:base.href,inLanguage:'es-ES',description:'Automatización empresarial y software a medida para pymes en España.'};
const json = JSON.stringify(website);
const jsonHash = createHash('sha256').update(json).digest('base64');
const includes = '<link rel="stylesheet" href="./contact/contact.css"><link rel="stylesheet" href="./demos/demo.css"><script type="module" src="./demos/demo.mjs"></script><script type="module" src="./contact/contact.js"></script>' +
  '<script type="application/ld+json">'+json+'</script>';

for (const page of pages) {
  const home = page === 'index.html';
  let html = await read(page);
  if (home) {
    for (const [marker,file] of [['<!--FLOW-->','assets/architecture.svg'],['<!--DEMOS-->','demos/section.html'],['<!--CONTACT-->','contact/section.html']]) {
      if (html.split(marker).length !== 2) throw new Error('Marcador ausente o repetido: ' + marker);
      const section = await read(file);
      html = html.replace(marker, () => section);
    }
    html = html.replace('</head>', includes+'</head>');
  }
  const policy = [
    "default-src 'none'", "base-uri 'none'", "object-src 'none'", "img-src 'self'", "style-src 'self'",
    home ? "script-src 'self' 'sha256-"+jsonHash+"'" : "script-src 'none'",
    "connect-src " + (home ? formUrl : "'none'"), "form-action " + (home ? formUrl : "'none'")
  ].join('; ');
  html = html.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="referrer" content="strict-origin-when-cross-origin">')
             .replaceAll(target, base.href);
  for (const [,url,file] of html.matchAll(/(?:src|href)="(\.?\/([^"]+\.(?:css|m?js)))"/g)) {
    const version = createHash('sha256').update(await readFile(path.join(output,file))).digest('hex').slice(0,12);
    html = html.replace('"'+url+'"','"'+url+'?v='+version+'"');
  }
  await emit(page, html);
}
await emit('.nojekyll','');
const urls = pages.filter(page => page !== '404.html').map(page => new URL(page === 'index.html' ? '' : page, base).href);
await emit('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>');
await emit('robots.txt','User-agent: *\nAllow: /\nSitemap: '+base.href+'sitemap.xml\n');
console.log((await auditRelease(output, base)) + ' archivos públicos verificados en dist/.');
