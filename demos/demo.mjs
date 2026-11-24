const theater = document.querySelector('.demo-theater');
const scenes = [...theater.querySelectorAll('.scene')];
const choices = [...theater.querySelectorAll('.scene-picker button')];
const steps = scenes.map(scene => [...scene.querySelectorAll('footer button')]);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let example = 0;
let stage = 0;
let visible = false;
let timer;

const descriptions = [
  ['Cada tienda envía su Excel de ventas. Administración necesita reunir los tres archivos para cerrar el mes.', 'El flujo compara los códigos de operación. La venta OP-102 figura en dos hojas con el mismo importe y se agrupa una sola vez.', 'OP-103 tiene dos importes distintos. El informe conserva ambos para que administración compruebe la diferencia.'],
  ['Llega una factura con importes, una nota de entrega y una firma.', 'El OCR localiza la base, el IVA y el total. La firma y la nota de entrega quedan fuera de la extracción.', 'Los tres importes seleccionados pasan al registro contable, listos para su validación.'],
  ['El cliente esperaba su paquete ayer. Su correo inicia una consulta de entrega.', 'El sistema reconoce una consulta sobre un envío retrasado y la asigna al equipo de logística.', 'El cliente recibe un acuse automático. Logística recibe la tarea de localizar el paquete y contestarle.'],
  ['Una tienda pide dos cajas de aceite. El formulario envía la solicitud al flujo.', 'El flujo consulta el inventario de aceite en Airtable. Quedan tres cajas.', 'n8n compara las dos cajas solicitadas con las tres disponibles. Hay existencias para atender el pedido.', 'La reserva de dos cajas se anota en la hoja de pedidos.', 'La tienda recibe por correo la confirmación de su reserva.']
];
function render() {
  scenes.forEach((scene, index) => {
    const active = example === index;
    scene.hidden = !active;
    choices[index].setAttribute('aria-pressed', String(active));
    if (!active) return;
    scene.dataset.stage = String(stage);
    scene.querySelector("header p").textContent = descriptions[index][stage];
    steps[index].forEach((button, i) => button.setAttribute('aria-pressed', String(stage === i)));
    scene.querySelectorAll('.workflow-nodes li').forEach((node,i) => {
      node.classList.toggle('reached', i <= stage);
      node.classList.toggle('current', i === stage);
    });
  });
}
function schedule() {
  clearTimeout(timer);
  if (!visible || document.hidden || motion.matches) return;
  timer = setTimeout(() => {
    if (stage + 1 < steps[example].length) stage++;
    else {
      const previous = scenes[example];
      example = (example + 1) % scenes.length;
      stage = 0;
      if (previous.contains(document.activeElement)) choices[example].focus({preventScroll:true});
    }
    render();
    schedule();
  }, 4200);
}
function select(index, step) {
  example = index;
  stage = step;
  render();
  schedule();
}
choices.forEach((button, i) => button.addEventListener('click', () => select(i, 0)));
steps.forEach((buttons,i) => buttons.forEach((button,j) => button.addEventListener('click', () => select(i,j))));
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(theater);
document.addEventListener('visibilitychange', schedule);
motion.addEventListener('change', schedule);
render();
