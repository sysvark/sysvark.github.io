const form = document.getElementById('proposal');
if (form) {
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('send-status');
  fields.disabled = false;
  form.addEventListener('input', () => { status.textContent = ''; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_honey')) return;
    fields.disabled = true;
    status.textContent = 'Enviando tu consulta…';
    try {
      const response = await fetch(form.action, {method:'POST', body:data, headers:{Accept:'application/json'}, signal:AbortSignal.timeout(60000)});
      const result = await response.json();
      if (!response.ok || String(result.success) !== 'true') throw new Error('Unconfirmed');
      form.reset();
      status.textContent = 'Mensaje enviado. Te responderemos en el correo que has indicado.';
    } catch {
      status.textContent = 'No se ha podido confirmar el envío. Puedes reintentarlo o escribir a sysvark@outlook.com.';
    } finally { fields.disabled = false; }
  });
}
