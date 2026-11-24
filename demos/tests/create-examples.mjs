import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
import { writeFile } from 'node:fs/promises';

const samples = [
  [['OP-101','Papelería',125],['OP-102','Archivo',80],['OP-103','Mensajería',32]],
  [['OP-102','Archivo',80],['OP-104','Material',215],['OP-105','Transporte',65]],
  [['OP-103','Mensajería',36],['OP-106','Suministros',102],['OP-107','Inventario','pendiente']]
];
for (const [index, records] of samples.entries()) {
  const book = Workbook.create();
  const sheet = book.worksheets.add('Operaciones');
  sheet.getRange('A1:C4').values = [['Referencia','Concepto','Importe'], ...records];
  const header = sheet.getRange('A1:C1');
  header.format.fill = '#203D48';
  header.format.font.color = '#FFFFFF';
  header.format.font.bold = true;
  sheet.getRange('A1:C4').format.columnWidth = 19;
  sheet.getRange('A1:C4').format.rowHeight = 24;
  const file = await SpreadsheetFile.exportXlsx(book);
  await file.save(process.argv[2] + '/operaciones-' + (index + 1) + '.xlsx');
  if (process.argv[3]) {
    const preview = await book.render({sheetName:'Operaciones',range:'A1:C4',format:'png'});
    await writeFile(process.argv[3] + '/operaciones-' + (index + 1) + '.png',new Uint8Array(await preview.arrayBuffer()));
  }
}
