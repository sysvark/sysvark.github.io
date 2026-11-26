import test from 'node:test';
import assert from 'node:assert/strict';
import {estimate, formatEstimate, normalizeInput} from '../assets/calculator.mjs';

test('la estimación inicial usa 52 semanas y 12 meses sin redondear resultados intermedios', () => {
  const values = estimate(10,25,50);
  assert.equal(values['monthly-hours'],520/12);
  assert.equal(values['monthly-saved'],260/12);
  assert.equal(values['remaining-hours'],260/12);
  assert.equal(values['yearly-hours'],260);
  assert.equal(values['monthly-cost'],13000/12);
  assert.equal(values['monthly-value'],6500/12);
  assert.equal(values['yearly-value'],6500);
  assert.equal(formatEstimate('monthly-saved', values['monthly-saved']), '21,67 h');
  assert.match(formatEstimate('monthly-value',values['monthly-value']), /^541,67\s€$/);
});
test('la tarifa admite céntimos y horas y porcentaje admiten décimas', () => {
  const values = estimate(12.5,23.75,62.5);
  assert.equal(values['yearly-hours'],406.25);
  assert.equal(values['yearly-value'],9648.4375);
  assert.equal(formatEstimate('yearly-value',values['yearly-value']).replace(/\s/g,''),'9648,44€');
  assert.equal(normalizeInput(1.235,'rate'),1.24);
  assert.equal(normalizeInput(10.075,'rate'),10.08);
});
test('mensual y anual son coherentes y el tiempo remanente más el liberado equivale al total', () => {
  for (const hours of [0,.1,12.6,168]) for (const rate of [0,.01,29.53,500]) for (const percent of [0,.1,50,100]) {
    const values=estimate(hours,rate,percent);
    assert.ok(Math.abs(values['monthly-saved']*12-values['yearly-hours'])<1e-8);
    assert.ok(Math.abs(values['monthly-value']*12-values['yearly-value'])<1e-8);
    assert.ok(Math.abs(values['remaining-hours']+values['monthly-saved']-values['monthly-hours'])<1e-8);
    assert.ok(values['monthly-cost']>=values['monthly-value']);
  }
});
test('ceros, mínimos, máximos, vacíos e inválidos', () => {
  assert.ok(Object.values(estimate(0,200,100)).every(value=>value===0));
  assert.equal(estimate(168,500,100)['yearly-value'],4368000);
  assert.equal(estimate(10,25,100)['remaining-hours'],0);
  for (const id of ['hours','rate','percent']) {
    assert.equal(normalizeInput(-5,id),0);
    for(const input of ['',NaN,Infinity,'no válido']) assert.equal(normalizeInput(input,id,10),10);
  }
  assert.deepEqual(estimate(999,900,125),estimate(168,500,100));
  assert.deepEqual(estimate(-8,-9,-18),estimate(0,0,0));
});
