import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code = await readFile(new URL('../contact/contact.js',import.meta.url),'utf8');

// Exercise the submit handler without sending personal data or contacting a provider.
function fixture(endpoint, request) {
  const fields = {disabled:true}, status = {}, info = {};
  const form = {
    action:endpoint, querySelector:()=>fields, reportValidity:()=>true,
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

test('la confirmación requiere una respuesta positiva del proveedor',async()=>{
  for (const result of [{ok:false,json:async()=>({})},{ok:true,json:async()=>({success:'false'})},null]) {
    const view = fixture('https://formsubmit.co/ajax/prueba@example.com',async()=>{
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
  const view = fixture('https://formsubmit.co/ajax/prueba@example.com',()=>{count++;return new Promise(resolve=>{finish=resolve;});});
  const first = view.submit();
  await view.submit();
  assert.equal(count,1);
  assert.equal(view.fields.disabled,true);
  finish({ok:true,json:async()=>({success:"true"})});
  await first;
  assert.equal(view.form.wasReset,true);
  assert.match(view.status.textContent,/Mensaje enviado/);
});
