import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code = await readFile(new URL('../contact/contact.js',import.meta.url),'utf8');

function fixture(request) {
  const fields = {disabled:true, setAttribute(){}, removeAttribute(){}}, status = {};
  const elements = {namedItem(name){return this[name];}};
  for (const [name,value] of Object.entries({
    _honey:'', nombre:' Ana ', empresa:'Empresa ficticia', proceso:'Ejemplo de prueba', telefono:'', email:'a@example.org'
  })) elements[name] = {value, minLength:name==='proceso'?10:0, setCustomValidity(text){this.message=text;}};
  const form = {
    action:'https://formsubmit.co/ajax/prueba@example.org', querySelector:()=>fields, elements,
    reportValidity:()=>Object.values(elements).every(field=>!field.message),
    addEventListener(type, handler) { this[type] = handler; }, reset() { this.wasReset=true; }
  };
  class LocalData {
    constructor(){this.values=new Map(Object.entries(elements).map(([name,field])=>[name,field.value]));}
    get(name){return this.values.get(name);}
    set(name,value){this.values.set(name,value);}
  }
  vm.runInNewContext(code, {
    document:{getElementById:id=>id==='proposal'?form:status}, fetch:request,
    FormData:LocalData, AbortController, setTimeout, clearTimeout
  });
  return {form,fields,status,elements,submit:()=>form.submit({preventDefault(){}})};
}

test('la confirmación requiere respuesta HTTP positiva y acuse explícito', async () => {
  for (const result of [{ok:false,json:async()=>({success:true})},
    {ok:true,json:async()=>({success:'false'})},{ok:true,json:async()=>({})},
    {ok:true,json:async()=>{throw new SyntaxError();}},null]) {
    const view=fixture(async()=>{if(!result)throw new Error('offline');return result;});
    await view.submit();
    assert.match(view.status.textContent,/No se ha podido confirmar/);
    assert.equal(view.form.wasReset,undefined);
    assert.equal(view.fields.disabled,false);
    assert.equal(view.elements.proceso.value,'Ejemplo de prueba');
  }
});
test('bloquea el doble envío, limpia espacios y confirma la recepción tras el acuse',async()=>{
  let finish, count=0;
  const view=fixture((url, options)=>{
    count++;
    assert.equal(url,view.form.action);
    assert.equal(options.body.get('nombre'),'Ana');
    return new Promise(resolve=>{finish=resolve;});
  });
  const first=view.submit();
  await view.submit();
  assert.equal(view.fields.disabled,true);
  assert.equal(count,1);
  finish({ok:true,json:async()=>({success:'true'})});
  await first;
  assert.equal(view.form.wasReset,true);
  assert.match(view.status.textContent,/Mensaje enviado/);
});
test('filtra señuelo, texto vacío, descripción corta y teléfono malformado antes de enviar',async()=>{
  for(const [name,value] of [['_honey','robot'],['empresa','   '],['nombre',' '],['proceso','  corto   '],['telefono','texto sin teléfono']]) {
    let count=0;
    const view=fixture(()=>{count++;});
    view.elements[name].value=value;
    await view.submit();
    assert.equal(count,0);
    assert.equal(view.form.wasReset,undefined);
  }
});
