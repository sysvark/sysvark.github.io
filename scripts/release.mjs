import {lstat, readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

// Exact public filenames. The Outlook signature is referenced by already-sent email.
export const publicAssets = [
  'assets/tokens.css', 'assets/site.css', 'assets/legal.css', 'assets/site.js', 'assets/calculator.mjs',
  'assets/favicon.svg', 'assets/wordmark.svg', 'assets/og.png', 'assets/firma-sysvark.png',
  'assets/experience/bbva.webp', 'assets/experience/ntt-data.svg', 'assets/experience/telefonica.svg',
  'assets/experience/transportes.webp', 'assets/experience/ust-aslan.webp',
  ...['airtable','github','gmail','googlecalendar','googledrive','googleforms','googlesheets','notion']
    .map(name => 'assets/logos/'+name+'.svg'),
  'assets/logos/servicenow.ico',
  'contact/contact.css', 'contact/contact.js', 'demos/demo.css', 'demos/demo.mjs'
];

export const pages = ['index.html', 'aviso-legal.html', 'privacidad.html', '404.html'];
const publicNames = new Set([...publicAssets, ...pages, '.nojekyll', 'robots.txt', 'sitemap.xml']);
const credentialPattern = /-----BEGIN (?:OPENSSH |RSA |EC |DSA |ENCRYPTED )?PRIVATE KEY-----|\b(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{28,}|AKIA[A-Z0-9]{16}|sk_(?:live|test)_[A-Za-z0-9]{20,}|xox[bp]-\d{8,}-[A-Za-z0-9-]{15,})/;

export async function assertPublicSource(root, filename) {
  let current = root;
  for (const part of filename.split('/')) {
    current = path.join(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw new Error('Enlace simbólico excluido: ' + filename);
  }
  if (!(await lstat(current)).isFile()) throw new Error('Recurso público no regular: ' + filename);
}

export async function auditRelease(output, base) {
  const found = new Set();
  async function visit(directory = '') {
    for (const entry of await readdir(path.join(output, directory), {withFileTypes:true})) {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (![...publicNames].some(name => name.startsWith(file + '/'))) throw new Error('Directorio fuera de la lista pública: ' + file);
        await visit(file);
        continue;
      }
      if (!entry.isFile() || !publicNames.has(file)) throw new Error('Archivo fuera de la lista pública: ' + file);
      found.add(file);
      if (!/\.(?:html|css|m?js|svg|txt|xml)$/.test(file)) continue;
      const text = await readFile(path.join(output, file), 'utf8');
      if (credentialPattern.test(text)) throw new Error('Posible credencial en ' + file);
      if (/sourceMappingURL\s*=/.test(text)) throw new Error('Referencia a mapa de fuentes en ' + file);
      if (!file.endsWith('.html')) continue;
      if (!text.includes('http-equiv="Content-Security-Policy"')) throw new Error('Falta CSP en ' + file);
      if (/\s(?:href|src)="https?:\/\/(?:www\.)?github\.com\/sysvark(?:[/?#"]|$)/i.test(text)) {
        throw new Error('Enlace al perfil o repositorio de desarrollo en ' + file);
      }
      for (const [,value] of text.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const url = new URL(value, new URL(file,base));
        if (url.origin !== base.origin) continue;
        const target = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
        if (!publicNames.has(target)) throw new Error(file + ' enlaza a un recurso fuera de la lista pública: ' + value);
        if (url.hash && target.endsWith('.html')) {
          const destination = file === target ? text : await readFile(path.join(output,target),'utf8');
          if (!destination.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"')) throw new Error('Ancla ausente en ' + file + ': ' + value);
        }
      }
    }
  }
  await visit();
  for (const file of publicNames) if (!found.has(file)) throw new Error('Falta el recurso público: ' + file);
  return found.size;
}
