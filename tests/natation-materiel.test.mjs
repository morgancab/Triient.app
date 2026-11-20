// Matériel de natation : les séances s'adaptent au matériel coché, sans changer les distances ni la séance envoyée à la montre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig, sessions } from './harness.mjs';

const race = raceConfig({ format: 'full', weeks: 25, sessions: 10 });
const app = (gear) => loadApp({ race, state: gear === undefined ? {} : { ui: { prof: { gear } } } }).IM;
const swims = (gear) => sessions(app(gear)).filter((s) => s.sp === 'swim');
// distance de la séance structurée (celle envoyée à la montre)
const wkM = (IM, s) => IM.wkBlocks(s.wk).reduce((t, r) => t + (r.k === 'step' ? [r.st] : r.k === 'rep' ? r.steps.map((x) => ({ ...x, val: x.val * r.n })) : []).reduce((a, x) => a + (x.u === 'mtr' ? x.val : 0), 0), 0);
const text = (l) => l.map((s) => s.title + ' | ' + s.lines.join(' | ')).join('\n');

test('sans réglage, les séances de natation ne changent pas', () => {
  const t = text(swims());
  assert.match(t, /pull-buoy/);
  assert.match(t, /4 × 50 m éducatifs \(rattrapé, poings fermés, 6 temps\)/);
});

test('aucun accessoire : plus de pull-buoy, mêmes distances', () => {
  const base = swims(), none = swims({});
  assert.doesNotMatch(text(none), /pull-buoy|plaquettes|palmes|tuba/);
  assert.match(text(none), /Endurance & bras/);
  const key = (l) => JSON.stringify(l.map((s) => [s.id, s.m, s.min]));
  assert.equal(key(none), key(base));
});

test('pull-buoy et plaquettes : séries de bras combinées, avec un garde-fou pour les épaules', () => {
  const t = text(swims({ pull: true, pads: true }));
  assert.match(t, /2 × 200 m en pull-buoy \+ plaquettes/);
  assert.match(t, /Plaquettes : pas plus d’un quart de la séance/);
});

test('tuba frontal, palmes et planche : éducatifs adaptés et conseils sur les séances de technique', () => {
  const t = text(swims({ snorkel: true, fins: true, board: true }));
  assert.match(t, /éducatifs \(rattrapé avec tuba frontal, 6 temps sur le côté avec palmes, jambes avec planche, poings fermés\)/);
  assert.match(t, /Ton matériel : tuba frontal/);
  assert.doesNotMatch(t, /pull-buoy/);
});

test('la fenêtre de réglage liste les accessoires et enregistre le choix dans le profil', () => {
  const { IM, sheet, store } = loadApp({ race });
  IM.openGear();
  assert.match(sheet(), /Pull-buoy[\s\S]*Plaquettes[\s\S]*Planche[\s\S]*Palmes[\s\S]*Tuba frontal/);
  assert.match(sheet(), /Adapter mes séances/);
  assert.equal(JSON.parse(store.get('triient:v1')).ui.prof?.gear, undefined);
});

test('le matériel entre dans le déroulé : chaque pas porte son accessoire, distances de la montre inchangées', () => {
  const gear = { pull: true, pads: true, snorkel: true, fins: true, board: true };
  const B = app(), G = app(gear), base = sessions(B).filter((s) => s.sp === 'swim'), with_ = sessions(G).filter((s) => s.sp === 'swim');
  assert.ok(base.every((s) => !/^- \D/m.test(s.wk)), 'sans réglage, aucune étiquette');
  with_.forEach((s, i) => assert.equal(wkM(G, s), wkM(B, base[i]), s.id + ' : distance montre'));
  const all = with_.map((s) => s.wk).join('\n');
  assert.match(all, /- Rattrapé avec tuba frontal 50mtr/);
  assert.match(all, /- Six temps sur le côté avec palmes 50mtr/);
  assert.match(all, /- Jambes avec planche 50mtr/);
  assert.match(all, /- Pull-buoy \+ plaquettes 200mtr/);
  assert.match(all, /- Tuba frontal 200mtr/);
  const tech = with_.find((s) => /Technique & aisance/.test(s.title));
  const html = G.detailBody(tech);
  assert.match(html, /class="gr">Tuba frontal</);
  assert.match(html, /class="gr">Rattrapé avec tuba frontal</);
  assert.doesNotMatch(html, /Récupération/);
  assert.match(G.wkText(tech.wk), /- Tuba frontal (\S+ )?200mtr/);
});
