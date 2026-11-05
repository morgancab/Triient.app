// Changement de nom de l'app (Triient) : les données et réglages enregistrés sous l'ancien nom sont repris.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadApp, raceConfig } from './harness.mjs';

const race = raceConfig({ format: 'half', weeks: 12, date: '2027-06-27' });
const OLD = 'ironman-sables-2027:v1', NEW = 'triient:v1';

test('le plan enregistré sous l’ancienne clé est repris, puis l’ancienne clé est effacée', () => {
  const a = loadApp({ race, storeKey: OLD, state: { done: { x1: 1 } } });
  assert.equal(a.store.has(OLD), false);
  const saved = JSON.parse(a.store.get(NEW));
  assert.deepEqual(saved.done, { x1: 1 });
  assert.equal(saved.race.format, 'half');
});

test('l’ancienne adresse du serveur est remplacée par la nouvelle', () => {
  const a = loadApp({ race, storeKey: OLD, state: { sv: { url: 'https://ironman-strava.morgancabironman.workers.dev', key: 'k' } } });
  const api = /var PUB_API='([^']+)'/.exec(readFileSync(new URL('../index.html', import.meta.url), 'utf8'))[1];
  assert.equal(api, 'https://triient.morgancabironman.workers.dev');
  assert.equal(a.IM.state.sv.url, api);
  assert.equal(a.IM.state.sv.key, 'k');
});

test('plus aucune trace de l’ancien nom dans ce que voit l’utilisateur', () => {
  for (const f of ['index.html', 'installer.html', 'manifest.webmanifest', 'sw.js']) {
    const s = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    assert.doesNotMatch(s, /Plan tri|plan-triathlon|ironmanproject|ironman-strava.morgan/i, f);
  }
});
