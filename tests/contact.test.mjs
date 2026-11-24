import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code = await readFile(new URL('../contact/contact.js',import.meta.url),'utf8');

// Exercise the submit handler without sending personal data or contacting a provider.
function fixture(endpoint, request) {
  const fields = {disabled:true}, status = {}, info = {};
  const form = {
    dataset:{endpoint}, querySelector:()=>fields, reportValidity:()=>true,
    addEventListener(type, handler) { this[type] = handler; },
    reset() { this.wasReset = true; }
  };
  const elements = {proposal:form, 'contact-info':info, 'send-status':status,'draft-actions':{},'draft-text':{},'open-draft':{},'copy-draft':{addEventListener(){}}};
  vm.runInNewContext(code, {
    document:{getElementById:id=>elements[id]}, fetch:request,
    FormData:class { get(key) { return key === 'empresa' ? 'A & B' : ''; } }, AbortSignal
  });
  return {form,fields,status,elements,submit:()=>form.submit({preventDefault(){}})};
}

test('prepara un borrador con el destinatario y asunto sin transmitir datos',async()=>{
  let called = false;
  const view = fixture('',()=>{called=true;});
  await view.submit();
  assert.equal(view.fields.disabled,false);
  assert.match(view.elements["open-draft"].href,/mailto:sysvark@outlook.com.*A%20%26%20B/);
  assert.equal(called,false);
});
test('la confirmación requiere una respuesta positiva del proveedor',async()=>{
  for (const result of [{ok:false,json:async()=>({})},{ok:true,json:async()=>({errors:['invalid']})},null]) {
    const view = fixture('https://formspree.io/f/example',async()=>{
      if (!result) throw new Error('offline');
      return result;
    });
    await view.submit();
    assert.match(view.status.textContent,/No se ha podido confirmar/);
    assert.equal(view.form.wasReset,undefined);
    assert.equal(view.fields.disabled,false);
  }
});
test('bloquea el doble envío y confirma la recepción tras el acuse',async()=>{
  let finish, count=0;
  const view = fixture('https://formspree.io/f/example',()=>{count++;return new Promise(resolve=>{finish=resolve;});});
  const first = view.submit();
  await view.submit();
  assert.equal(count,1);
  assert.equal(view.fields.disabled,true);
  finish({ok:true,json:async()=>({ok:true})});
  await first;
  assert.equal(view.form.wasReset,true);
  assert.match(view.status.textContent,/ha confirmado/);
});
