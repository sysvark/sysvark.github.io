const form = document.getElementById('proposal');
if (form) {
  const endpoint = form.dataset.endpoint;
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('send-status');
  if (endpoint) {
    fields.disabled = false;
    document.getElementById('contact-info').textContent = 'Describe el proceso con un ejemplo general. Evita incluir datos confidenciales o documentos de clientes.';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint || fields.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
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
