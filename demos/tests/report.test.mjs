import assert from 'node:assert/strict';
import test from 'node:test';
import { consolidate, csv } from '../report.mjs';
test('conserva discrepancias, origen, duplicados y filas inválidas',()=>{
  const results=consolidate([
    {name:'a',records:[['REF','Servicio','15'],['X','Transporte','pendiente']]},
    {name:'b',records:[['ref','Servicio','15,00'],['REF','Servicio','16.30']]},
    {name:'c',records:[['REF','Servicio','16,3'],['Y','Archivo','0']]}
  ]);
  assert.equal(results.rows.length,4);
  assert.equal(results.differences,1);
  assert.equal(results.duplicates,2);
  assert.equal(results.invalid,1);
  assert.equal(results.rows[0].status,'Diferencia por revisar');
  assert.equal(results.rows[0].origins.length,2);
  assert.equal(results.rows[2].amount,'16,30');
  assert.equal(results.rows[3].amount,'0,00');
});
test('exporta UTF-8 y protege los campos interpretables como fórmulas',()=>{
  assert.equal(csv([[' =SUM(A1)','uno;"dos"','á']]),'\uFEFF"\' =SUM(A1)";"uno;""dos""";"á"');
});

