export const MAX_BYTES = 256 * 1024;
const MAX_XML = 512 * 1024;
const cellText = (node, tag) => Array.from(node.getElementsByTagNameNS('*',tag), el=>el.textContent).join('');
const children = (node, tag) => Array.from(node.getElementsByTagNameNS('*',tag));
let zipLibrary;

function loadZip() {
  if (!zipLibrary) {
    zipLibrary = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = new URL('./vendor/jszip.min.js',import.meta.url);
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => {zipLibrary = undefined; reject(new Error('No se pudo cargar el lector de Excel.'));};
      document.head.append(script);
    });
  }
  return zipLibrary;
}

async function readXML(entry) {
  if (!entry) throw new Error('Estructura XLSX no compatible.');
  const bytes = await new Promise((resolve,reject) => {
    const chunks = [];
    let length = 0;
    const stream = entry.internalStream('uint8array');
    stream.on('data', chunk => {
      length += chunk.length;
      if (length > MAX_XML) {
        stream.pause();
        reject(new Error('El contenido de la hoja supera el límite descomprimido.'));
      } else {
        chunks.push(chunk);
      }
    });
    stream.on('end', () => resolve(new Blob(chunks)));
    stream.on('error', reject);
    stream.resume();
  });
  const xml = await bytes.text();
  if (/<!(DOCTYPE|ENTITY)/i.test(xml)) throw new Error('Tipo de XML no compatible.');
  const tree = new DOMParser().parseFromString(xml,'application/xml');
  if (children(tree,'parsererror').length) throw new Error('El libro contiene datos XML no válidos.');
  return tree;
}

export async function readBook(file) {
  if (!/\.xlsx$/i.test(file.name) || !file.size || file.size > MAX_BYTES)
    throw new Error('Elige libros XLSX de hasta 256 KiB.');
  const Zip = await loadZip();
  let archive;
  try {archive = await Zip.loadAsync(await file.arrayBuffer());}
  catch {throw new Error('No se puede leer el archivo. Usa una plantilla XLSX sin contraseña.');}
  const keys = Object.keys(archive.files);
  const sheets = keys.filter(name=>/^xl\/worksheets\/[^/]+\.xml$/.test(name));
  if (keys.length > 100 || sheets.length !== 1) throw new Error('Usa un libro con una única hoja y la estructura de la plantilla.');
  const sheet = await readXML(archive.file(sheets[0]));
  const sharedEntry = archive.file('xl/sharedStrings.xml');
  const shared = sharedEntry ? children(await readXML(sharedEntry),'si').map(item=>cellText(item,'t')) : [];
  const rows = children(sheet,'row');
  if (rows.length < 2 || rows.length > 301) throw new Error('Cada libro debe contener entre 1 y 300 registros.');
  const records = rows.map(row=>{
    const values = ['','',''];
    for (const cell of children(row,'c')) {
      const match = /^([ABC])\d+$/.exec(cell.getAttribute('r'));
      if (!match) throw new Error('Usa únicamente las tres columnas de la plantilla.');
      const type = cell.getAttribute('t');
      let value = cellText(cell,'v');
      if (type === 's') value = shared[Number(value)] ?? '';
      if (type === 'inlineStr') value = cellText(cell,'t');
      if (children(cell,'f').length) throw new Error('Usa valores en las celdas, sin fórmulas.');
      if (value.length > 160) throw new Error('Cada celda admite hasta 160 caracteres.');
      values[match[1].charCodeAt(0)-65] = value.trim();
    }
    return values;
  });
  if (records.shift().map(x=>x.toLowerCase()).join('|') !== 'referencia|concepto|importe')
    throw new Error('Revisa las columnas de la primera fila: Referencia, Concepto e Importe.');
  return {name:file.name, records};
}

export function consolidate(books) {
  const groups = new Map(), rows = [];
  let duplicates = 0, invalid = 0, differences = 0;
  for (const {name,records} of books) {
    for (const [i,[ref,concept,raw]] of records.entries()) {
      const validAmount = /^\d{1,12}([.,]\d{1,2})?$/.test(raw);
      const amount = validAmount ? Number(raw.replace(',','.')).toFixed(2).replace('.',',') : raw;
      const origin = name + ' · fila ' + (i + 2);
      if (!ref || !concept || !validAmount) {
        invalid++;
        rows.push({ref,concept,amount,origins:[origin],status:'Dato no válido'});
        continue;
      }
      const key = ref.toLowerCase();
      const versions = groups.get(key) || [];
      const identical = versions.find(r=>r.amount===amount && r.concept===concept);
      if (identical) {
        duplicates++;
        identical.origins.push(origin);
        if (versions.length === 1) identical.status='Duplicado consolidado';
      } else {
        const row = {ref,concept,amount,origins:[origin],status:'Correcto'};
        rows.push(row);
        versions.push(row);
        if (versions.length > 1) {
          if (versions.length===2) differences++;
          versions.forEach(r=>r.status='Diferencia por revisar');
        }
        groups.set(key,versions);
      }
    }
  }
  return {rows,duplicates,invalid,differences};
}

export function csv(rows) {
  return '\uFEFF'+rows.map(row=>row.map(value=>{
    let text=String(value);
    if (/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text)) text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  }).join(';')).join('\r\n');
}
