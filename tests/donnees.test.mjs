// Onglet Données sans Garmin : les séances cochées comptent, même en avance sur le calendrier.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig, sessions, addDays } from './harness.mjs';

const race = raceConfig({ format: 'half', weeks: 20 });
const view = (today, done) => loadApp({ race, today, hash: '#data', state: { done } }).view();
const idOf = (IM, w, sp) => sessions(IM).find((s) => s.w === w && s.sp === sp).id;

test('une séance cochée en avance apparaît dans la progression et par sport', () => {
  const { IM } = loadApp({ race, today: addDays(race.start, 16) });                  // semaine 3
  const run10 = idOf(IM, 10, 'run'), swim2 = idOf(IM, 2, 'swim');
  const h0 = view(addDays(race.start, 16), { [swim2]: 1 });
  const h1 = view(addDays(race.start, 16), { [swim2]: 1, [run10]: 1 });
  const done = (h) => +/class="dbig">(\d+)</.exec(h)[1];
  assert.equal(done(h0), 1);
  assert.equal(done(h1), 2, 'la séance de la semaine 10 cochée en avance compte');
  const run = (h) => /Course à pied<\/b><span>(\d+) \//.exec(h)[1];
  assert.equal(run(h0), '0');
  assert.equal(run(h1), '1');
});

test('avant le début du plan : rien tant que rien n’est coché, puis les séances cochées', () => {
  const before = addDays(race.start, -5);
  assert.doesNotMatch(view(before, {}), /Ta progression dans le plan/);
  const { IM } = loadApp({ race, today: before });
  assert.match(view(before, { [idOf(IM, 1, 'swim')]: 1 }), /Ta progression dans le plan/);
});
