const form = document.getElementById('proposal');
if (form) {
  const endpoint = form.dataset.endpoint;
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('send-status');
  fields.disabled = false;
  if (endpoint) {
    form.querySelector("button[type=submit]").textContent = "Solicitar propuesta";
    document.getElementById('contact-info').textContent = 'Describe el proceso con un ejemplo general. Evita incluir datos confidenciales o documentos de clientes.';
  }
  const draft = document.getElementById('draft-actions');
  const preview = document.getElementById('draft-text');
  form.addEventListener('input', () => { draft.hidden = true; status.textContent = ''; });
  document.getElementById('copy-draft').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = 'Mensaje copiado. Puedes pegarlo en un correo a sysvark@outlook.com.';
    } catch {
      preview.focus();
      preview.select();
      status.textContent = 'El mensaje está seleccionado para que puedas copiarlo.';
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
    if (!endpoint) {
      preview.value = ['Hola, SYSVARK:', '', data.get('proceso'), '', data.get('nombre'), data.get('empresa'), data.get('email'), data.get('telefono')].filter(value => value != null).join('\n').trim();
      const subject = 'Consulta de automatización · ' + data.get('empresa');
      document.getElementById('open-draft').href = 'mailto:sysvark@outlook.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(preview.value);
      draft.hidden = false;
      status.textContent = 'Borrador preparado. Abre tu correo para enviarlo o copia el mensaje.';
      return;
    }
    fields.disabled = true;
    status.textContent = 'Enviando la solicitud…';
    try {
      const response = await fetch(endpoint, {method:'POST', body:data, headers:{Accept:'application/json'}, signal:AbortSignal.timeout(20000)});
      const result = await response.json();
      if (!response.ok || result.ok === false || result.errors?.length) throw new Error('Unconfirmed');
      form.reset();
      status.textContent = 'El servicio ha confirmado la recepción de tu solicitud.';
    } catch {
      status.textContent = 'No se ha podido confirmar la recepción. Conservamos lo escrito en esta página para que puedas reintentarlo.';
    } finally { fields.disabled = false; }
  });
}
