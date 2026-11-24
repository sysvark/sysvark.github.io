import {consolidate,csv} from './report.mjs';

const $ = id=> document.getElementById(id);
const buttons = document.querySelectorAll('[data-demo-mode]');
buttons.forEach(button=>button.addEventListener('click',()=>{
  buttons.forEach(el=>{
    const selected = el===button;
    el.setAttribute('aria-pressed',String(selected));
    $('demo-'+el.dataset.demoMode).hidden = !selected;
  });
}));

function download(name,rows) {
  const address = URL.createObjectURL(new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=address;
  link.download=name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(address),30000);
}
function appendRow(body,values) {
  const row=body.insertRow();
  values.forEach(value=>{row.insertCell().textContent=value;});
}
function status(id,message,busy=false) {
  const el=$(id);
  el.textContent=message;
  el.classList.toggle('busy',busy);
}
let currentReport,reportBusy=false;
const reportBody=$('demo-report-results').querySelector('tbody');
function clearReport() {
  currentReport=undefined;
  reportBody.replaceChildren();
  $('demo-report-results').hidden=true;
  $('demo-input').value='';
  status('demo-report-status','');
}
$('demo-reset').addEventListener('click',()=>{clearReport();$('demo-sample').focus();});
async function report(files) {
  if(reportBusy) return;
  reportBusy=true;
  clearReport();
  $('demo-sample').disabled=$('demo-input').disabled=true;
  status('demo-report-status','Leyendo las hojas y comparando referencias…',true);
  try {
    if (!files) {
      files=await Promise.all([1,2,3].map(async index=>{
        const name='operaciones-'+index+'.xlsx';
        const response=await fetch(new URL('./files/'+name,import.meta.url));
        if (!response.ok) throw new Error('No se pudo abrir la plantilla. Vuelve a intentarlo.');
        return new File([await response.blob()],name);
      }));
    }
    if(files.length!==3) throw new Error('Selecciona exactamente tres archivos XLSX a la vez.');
    const {readBook}=await import('./report.mjs');
    const books=[];
    for (const file of files) books.push(await readBook(file));
    currentReport=consolidate(books);
    const {rows,duplicates,differences,invalid}=currentReport;
    rows.forEach(r=>appendRow(reportBody,[r.ref,r.concept,r.amount,r.origins.join(' / '),r.status]));
    $('demo-report-results').hidden=false;
    const count=books.reduce((sum,b)=>sum+b.records.length,0);
    status('demo-report-status',count+' filas leídas · '+rows.length+' filas consolidadas. Duplicados: '+duplicates+'. Referencias con diferencias: '+differences+'. Filas no válidas: '+invalid+'.');
  } catch(error) {
    status('demo-report-status',error instanceof TypeError ? 'No se pudo cargar el lector o el ejemplo. Comprueba la conexión y vuelve a intentarlo.' : error.message);
  } finally {
    reportBusy=false;
    $('demo-sample').disabled=$('demo-input').disabled=false;
  }
}
$('demo-report-export').addEventListener('click',()=>{
  if (!currentReport) return;
  download('sysvark-informe.csv',[['Referencia','Concepto','Importe (€)','Origen','Revisión'],
    ...currentReport.rows.map(r=>[r.ref,r.concept,r.amount,r.origins.join(' / '),r.status])]);
});
$('demo-sample').addEventListener('click',()=>report());
$('demo-input').addEventListener('change',e=>report(Array.from(e.target.files)));
const drop=$('demo-drop');
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');report(Array.from(e.dataTransfer.files));});

const choice=$('demo-invoice-choice'), invoiceBody=$('demo-invoice-results').querySelector('tbody');
choice.addEventListener('change',()=>{
  const id=choice.value;
  $('demo-pdf-preview').src=new URL('./files/'+id+'.png',import.meta.url);
  $('demo-pdf-preview').alt='Vista previa de la factura ficticia '+id.toUpperCase();
  $('demo-pdf-download').href=new URL('./files/'+id+'.pdf',import.meta.url);
  $('demo-invoice-results').hidden=true;
  invoiceBody.replaceChildren();
  status('demo-invoice-status','');
});
$('demo-invoice-run').addEventListener('click',async()=>{
  choice.disabled=$('demo-invoice-run').disabled=true;
  status('demo-invoice-status','Leyendo el texto del PDF…',true);
  $('demo-invoice-results').hidden=true;
  invoiceBody.replaceChildren();
  try {
    const {extractInvoice}=await import('./invoice.mjs');
    const fields=await extractInvoice(choice.value);
    for(const [name,value] of fields) {
      const row=invoiceBody.insertRow(), label=document.createElement('th');
      label.scope='row';
      label.textContent=name;
      row.append(label);
      const input=document.createElement('input');
      input.value=value;
      input.maxLength=160;
      input.setAttribute('aria-label',name);
      row.insertCell().append(input);
    }
    $('demo-invoice-results').hidden=false;
    status('demo-invoice-status','Siete campos extraídos. Comprueba los valores con el PDF y edita los que necesites.');
  } catch {
    status('demo-invoice-status','No se pudo leer el PDF. Comprueba la conexión y prueba con un navegador actualizado. Puedes descargar el documento para revisarlo.');
  } finally {choice.disabled=$('demo-invoice-run').disabled=false;}
});
$('demo-invoice-export').addEventListener('click',()=>{
  const inputs=Array.from(invoiceBody.querySelectorAll('input'));
  download('sysvark-'+choice.value+'.csv',[inputs.map(input=>input.getAttribute('aria-label')),inputs.map(input=>input.value)]);
});
