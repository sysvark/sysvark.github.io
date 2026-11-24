from pathlib import Path
import sys
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.colors import HexColor

for number, date, supplier, concept, base in [
    ('FIC-001', '12/03/2026', 'Taller Nube (ficticio)', 'Material de archivo', 120),
    ('FIC-002', '16/03/2026', 'Oficina Delta (ficticia)', 'Servicio de catalogación', 240)
]:
    pdf = Canvas(str(Path(sys.argv[1]) / (number.lower() + '.pdf')), pagesize=(480, 450), invariant=1)
    pdf.setTitle('Factura ficticia ' + number)
    pdf.setAuthor('SYSVARK')
    def label(x,y,s,size=12,color='#203D48',font='Helvetica'):
        pdf.setFillColor(HexColor(color))
        pdf.setFont(font,size)
        pdf.drawString(x,y,s)
    label(35,398,'Factura de ejemplo',30,font='Helvetica-Bold')
    label(35,366,'Documento ficticio para la demostración de SYSVARK',12)
    amounts = [f'{n:.2f}'.replace('.', ',') + ' EUR' for n in [base, base*.21, base*1.21]]
    fields = [('Factura',number),('Fecha',date),('Proveedor',supplier),('Concepto',concept),
              ('Base imponible',amounts[0]),('IVA (21%)',amounts[1]),('Importe total',amounts[2])]
    for i, (name,value) in enumerate(fields):
        y = 313 - i * 36
        label(35,y,name,12)
        label(183,y,value,13,font='Helvetica-Bold' if i == 6 else 'Helvetica')
        pdf.setStrokeColor(HexColor('#D6DEDE'))
        pdf.line(35,y-10,440,y-10)
    label(35,42,'Sin validez fiscal.',11)
    pdf.save()

