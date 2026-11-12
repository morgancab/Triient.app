// Catalogues de courses : chaque pays est connu de l'app et du robot de mise à jour, et le catalogue une discipline est valide.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const ccNames = Object.keys(vm.runInNewContext('(' + /var CC_NAMES=(\{[^}]*\})/.exec(read('src/js/07-catalogue.js'))[1] + ')'));
const robot = new Set(Object.values(vm.runInNewContext('(' + /const COUNTRY = (\{[^}]*\})/.exec(read('scripts/update-races.mjs'))[1] + ')')));
const raceCat = (() => { const ctx = { window: {} }; vm.runInNewContext(read('races.js'), ctx); return ctx.window.RACE_CAT; })();
const stepCat = vm.runInNewContext(/var STEP_CAT=(\[[\s\S]*?\n\]);/.exec(read('src/js/04-vues.js').replace(/\r\n/g, '\n'))[1]);

test('triathlons : chaque pays a un nom dans l’app et une entrée dans le robot de mise à jour', () => {
  const codes = [...new Set(raceCat.map((e) => e[2]))];
  codes.forEach((c) => {
    assert.ok(ccNames.includes(c), c + ' manque dans CC_NAMES (src/js/07-catalogue.js)');
    assert.ok(robot.has(c), c + ' manque dans COUNTRY (scripts/update-races.mjs)');
  });
});

test('courses d’une discipline : lignes valides, sans doublon, pays connus', () => {
  assert.ok(stepCat.length >= 80);
  const seen = new Set();
  stepCat.forEach((e) => {
    assert.ok(e[0] && !seen.has(e[0]), 'doublon ou nom vide : ' + e[0]); seen.add(e[0]);
    assert.ok(e[1], 'ville manquante : ' + e[0]);
    assert.ok(ccNames.includes(e[2]), e[0] + ' : pays ' + e[2] + ' absent de CC_NAMES');
    assert.ok(['run', 'bike', 'swim'].includes(e[3]), e[0]);
    assert.ok(Number.isInteger(e[4]) && e[4] >= 0, e[0] + ' : distance');
    assert.ok(Number.isInteger(e[5]) && e[5] >= 1 && e[5] <= 12, e[0] + ' : mois');
  });
  const cap = stepCat.find((e) => e[0] === 'Marathon du Cap');
  assert.equal(cap[5], 10, 'le marathon du Cap a lieu en octobre');
});
