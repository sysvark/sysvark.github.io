const fields = ['Factura','Fecha','Proveedor','Concepto','Base imponible','IVA (21%)','Importe total'];
export async function extractInvoice(id) {
  if (!['fic-001','fic-002'].includes(id)) throw new Error('Documento desconocido.');
  const pdfjs = await import('./vendor/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs',import.meta.url).href;
  const task = pdfjs.getDocument({url:new URL('./files/'+id+'.pdf',import.meta.url).href,
    isEvalSupported:false,useSystemFonts:true,useWorkerFetch:false});
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const parts = content.items.filter(item=>item.str?.trim());
    return fields.map(field=>{
      const label = parts.find(part=>part.str.trim()===field);
      const value = label && parts.find(part=>part.transform[4] > label.transform[4]+50 &&
        Math.abs(part.transform[5]-label.transform[5])<1);
      if (!value) throw new Error('Campo no localizado en el PDF.');
      return [field,value.str.trim()];
    });
  } finally {await task.destroy();}
}
