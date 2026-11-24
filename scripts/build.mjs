import {readFile, writeFile, cp, mkdir, rm, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const target = 'https://sysvark.github.io/';
const base = new URL(process.env.SITE_URL || target);
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('SITE_URL debe ser el origen HTTPS del sitio web de usuario.');
}
const read = file => readFile(file,'utf8');
const output = path.join(root,'dist');
await rm(output,{recursive:true,force:true});
await mkdir(output);
const emit = (file, data) => writeFile(path.join(output,file),data);
await cp('assets',path.join(output,'assets'),{recursive:true});
await mkdir(path.join(output,'demos'));
for (const file of ['demo.css','demo.mjs']) await cp('demos/'+file,path.join(output,'demos',file));
await mkdir(path.join(output,'contact'));
for (const name of ['contact.css','contact.js']) await cp('contact/'+name,path.join(output,'contact',name));

let home = await read('index.html');
const flow = await read('assets/architecture.svg');
home = home.replace('<!--FLOW-->', () => flow);
let contact = await read('contact/section.html');
for (const [marker, html] of [['<!--DEMOS-->',await read('demos/section.html')],['<!--CONTACT-->',contact]]) {
  if (home.split(marker).length !== 2) throw new Error('Marcador ausente o repetido: ' + marker);
  home = home.replace(marker,()=>html);
}
const website = {'@context':'https://schema.org','@type':'WebSite',name:'SYSVARK',url:base.href,inLanguage:'es-ES',description:'Automatización empresarial y software a medida para pymes en España.'};
const includes = '<link rel="stylesheet" href="./contact/contact.css"><link rel="stylesheet" href="./demos/demo.css"><script type="module" src="./demos/demo.mjs"></script><script type="module" src="./contact/contact.js"></script>' +
  '<script type="application/ld+json">'+JSON.stringify(website)+'</script>';
home = home.replace('</head>',includes+'</head>').replaceAll(target,base.href);
for (const [,file] of home.matchAll(/(?:src|href)="(\.\/[^"]+\.(?:css|m?js))"/g)) {
  const version = createHash('sha256').update(await readFile(file)).digest('hex').slice(0,12);
  home = home.replace('"'+file+'"','"'+file+'?v='+version+'"');
}
await emit('index.html',home);
for (const page of ['aviso-legal','privacidad','404']) {
  await emit(page+'.html',(await read(page+'.html')).replaceAll(target,base.href));
}
await emit('.nojekyll','');
await emit('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['','aviso-legal.html','privacidad.html'].map(p=>'<url><loc>'+base.href+p+'</loc></url>').join('')+'</urlset>');
await emit('robots.txt','User-agent: *\nAllow: /\nSitemap: '+base.href+'sitemap.xml\n');

// Verify the links and fragments in the generated artifact, including sample downloads.
for (const name of (await readdir(output)).filter(name=>name.endsWith('.html'))) {
  const html = await read(path.join(output,name));
  for (const [,value] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const url = new URL(value,new URL(name,base));
    if (url.origin !== base.origin) continue;
    const file = path.join(output,decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname));
    try { await access(file); } catch { throw new Error(name+' enlaza a un recurso ausente: '+value); }
    if (url.hash && file.endsWith('.html') && !(await read(file)).includes('id="'+decodeURIComponent(url.hash.slice(1))+'"')) {
      throw new Error(name+' enlaza a un ancla ausente: '+value);
    }
  }
}
console.log('Exportación estática y enlaces verificados en dist/.');

