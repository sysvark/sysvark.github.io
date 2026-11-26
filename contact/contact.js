const form = document.getElementById('proposal');
if (form) {
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('send-status');
  const requiredText = ['nombre', 'empresa', 'proceso'];
  fields.disabled = false;
  form.addEventListener('input', event => {
    event.target.setCustomValidity('');
    status.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fields.disabled || form.elements._honey.value) return;
    for (const name of requiredText) {
      const field = form.elements.namedItem(name);
      const value = field.value.trim();
      const minimum = Math.max(1, field.minLength);
      field.setCustomValidity(value.length < minimum ? (name === 'proceso' ?
        'Describe el proceso con al menos 10 caracteres, sin contar los espacios al principio y al final.' :
        'Completa este campo.') : '');
    }
    const phone = form.elements.telefono;
    const simplePhone = phone.value.trim().replace(/[\s().\/-]/g, '');
    phone.setCustomValidity(phone.value.trim() && !/^\+?\d{5,17}$/.test(simplePhone) ?
      'Introduce un teléfono con su prefijo o deja este campo vacío.' : '');
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    for (const name of [...requiredText, 'email', 'telefono']) data.set(name, data.get(name).trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    fields.disabled = true;
    fields.setAttribute('aria-busy', 'true');
    status.textContent = 'Enviando tu consulta…';
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: data, headers: {Accept: 'application/json'}, signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Unconfirmed');
      form.reset();
      status.textContent = 'Mensaje enviado. Te responderemos en el correo que has indicado.';
    } catch {
      status.textContent = 'No se ha podido confirmar el envío. Conservamos lo que has escrito para que puedas reintentarlo o escribir a sysvark@outlook.com.';
    } finally {
      clearTimeout(timeout);
      fields.disabled = false;
      fields.removeAttribute('aria-busy');
      if (event.submitter && document.activeElement === document.body) event.submitter.focus({preventScroll:true});
    }
  });
}
