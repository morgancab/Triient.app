// Ajuster mon entraînement : heures par semaine de chaque sport (début de prépa → pic), par-dessus le plan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig, sessions } from './harness.mjs';

const race = (o = {}) => raceConfig({ format: 'half', weeks: 16, date: '2027-06-27', ...o });
const load = (IM) => IM.KINDS.map((k, i) => [k, i]).filter(([k]) => /^c/.test(k)).map(([, i]) => i);
const ids = (IM) => JSON.stringify(sessions(IM).map((s) => s.id));

test('sans réglage, le plan ne change pas', () => {
  const { IM } = loadApp({ race: race() });
  assert.equal(JSON.stringify(IM.VOL0.slice(0, -1)), JSON.stringify(IM.adjVol(IM.VOL0, null).slice(0, -1)));
});

test('course entre 2 h et 5 h : la semaine de charge la plus légère et la plus chargée tombent sur la fourchette', () => {
  const { IM } = loadApp({ race: race({ sessions: 10 }) });
  const a = loadApp({ race: { ...race({ sessions: 10 }), vt: { run: [120, 300] } } }).IM;
  const r = a.spRange(a.VOL, 'run');
  assert.ok(Math.abs(r[0] - 120) <= 10 && Math.abs(r[1] - 300) <= 10, 'obtenu ' + r);
  // même progression : l'ordre des semaines de charge est conservé
  const L = load(a), m0 = L.map((i) => a.spMin(IM.VOL[i], 'run')), m1 = L.map((i) => a.spMin(a.VOL[i], 'run'));
  for (let x = 0; x < L.length; x++) for (let y = 0; y < L.length; y++) if (m0[x] < m0[y] - 5) assert.ok(m1[x] <= m1[y] + 5, 'semaines ' + L[x] + '/' + L[y]);
  // décharges et affûtage restent plus légers que la semaine de charge qui précède
  a.KINDS.forEach((k, i) => { if ((k === 'rec' || k === 'taper') && i) assert.ok(a.spMin(a.VOL[i], 'run') < a.spMin(a.VOL[i - 1], 'run') + 1, k + ' ' + i); });
  // natation et vélo ne bougent pas
  assert.equal(JSON.stringify(a.spRange(a.VOL, 'bike')), JSON.stringify(IM.spRange(IM.VOL, 'bike')));
  assert.equal(ids(a), ids(IM), 'mêmes séances : les coches restent');
});

test('les séances du plan suivent les volumes réglés', () => {
  const { IM } = loadApp({ race: { ...race(), vt: { run: [150, 330] } } });
  const w = load(IM).at(-1), wk = IM.PLAN[w];
  const run = wk.days.flatMap((d) => d.sessions).filter((s) => s.sp === 'run' || s.sp === 'brick').reduce((p, s) => p + s.min, 0);
  assert.ok(Math.abs(run - IM.spMin(IM.VOL[w], 'run')) <= 15, run + ' / ' + IM.spMin(IM.VOL[w], 'run'));
});

test('plafond par séance : avec peu de séances, la cible n’est pas atteinte mais aucune séance ne déborde', () => {
  const { IM } = loadApp({ race: { ...race({ sessions: 5 }), vt: { run: [480, 600] } } });
  const r = IM.spRange(IM.VOL, 'run');
  assert.ok(r[1] < 600, 'plafonné à ' + r[1]);
  sessions(IM).filter((s) => s.sp === 'run').forEach((s) => assert.ok(s.min <= 150, s.title + ' ' + s.min));
});

test('moins d’heures : les séances gardent leur durée minimale', () => {
  const { IM } = loadApp({ race: { ...race(), vt: { swim: [30, 45], bike: [60, 90] } } });
  const reg = sessions(IM).filter((s) => /^(c1|c2|c3|rec)$/.test(IM.KINDS[s.w - 1]));   // l'affûtage a ses propres séances d'activation
  reg.filter((s) => s.sp === 'swim').forEach((s) => assert.ok(s.m >= 800, s.m + ' m'));
  reg.filter((s) => s.sp === 'bike').forEach((s) => assert.ok(s.min >= 40, s.min + ' min'));
});

test('l’écran de réglage : curseurs, par défaut, plafond signalé, enregistrement dans la course', () => {
  const { IM, sheet, store } = loadApp({ race: race({ sessions: 5 }) });
  IM.openVt();
  assert.match(sheet(), /id="vt-a-run"/);
  assert.match(sheet(), /data-act="vtapply" disabled/, 'rien à appliquer tant que rien ne change');
  assert.doesNotMatch(sheet(), /Laisser par défaut/, 'tout est par défaut');
  IM.vtSlide({ id: 'vt-b-run', value: '420' });
  IM.vtSlide({ id: 'vt-a-run', value: '450' });            // le curseur de gauche passe à droite : la fourchette se trie
  IM.vtApply();
  assert.deepEqual(JSON.parse(store.get('triient:v1')).race.vt.run, [420, 450]);
  IM.openVt();                                            // rouvrir repart de la course enregistrée
  IM.vtSlide({ id: 'vt-a-run', value: '120' });
  IM.vtSlide({ id: 'vt-b-run', value: '600' });
  IM.vtApply();
  const saved = JSON.parse(store.get('triient:v1')).race.vt;
  assert.equal(saved.run[1], 600);
  assert.ok(saved.run[0] <= 600);
  assert.equal(saved.swim, undefined);
  const b = loadApp({ race: JSON.parse(store.get('triient:v1')).race });
  b.IM.openVt();
  assert.match(b.sheet(), /Laisser par défaut/);
  assert.match(b.sheet(), /plafonne à/);
});

test('séances par sport : 3 natations, 3 courses, l’enchaînement et un renfo', () => {
  const sc = { swim: 3, bike: 2, run: 3, brick: 1, str: 1 };
  const { IM } = loadApp({ race: { ...race(), sc } });
  const w = load(IM).at(-1), ss = IM.PLAN[w].days.flatMap((d) => d.sessions);
  const n = (sp) => ss.filter((s) => s.sp === sp).length;
  assert.deepEqual([n('swim'), n('bike'), n('run'), n('brick'), n('str')], [3, 2, 3, 1, 1]);
  const ids = ss.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques');
  // sans réglage, la répartition par défaut d'un total reproduit exactement le plan
  const base = loadApp({ race: race({ sessions: 8 }) }).IM;
  assert.equal(JSON.stringify(base.volPlan(base.scDefault(8))), JSON.stringify(base.volPlan(null)));
});

test('choisir la répartition par défaut n’enregistre aucun réglage de séances', () => {
  const { IM, store } = loadApp({ race: race({ sessions: 8 }) });
  IM.openVt();
  assert.equal(IM.vtScOut(), null);
  IM.vtSlide({ id: 'vt-b-run', value: '300' });
  IM.vtApply();
  const r = JSON.parse(store.get('triient:v1')).race;
  assert.equal(r.sc, undefined);
  assert.equal(r.vt.run[1], 300);
});

test('la barre du milieu décale toute la fourchette, sans sortir de l’échelle', () => {
  const { IM, store } = loadApp({ race: race() });
  IM.openVt();
  const x = ['run', 'Course à pied', 30, 480], r = { left: 0, width: 326 };   // 300 px utiles : 1 px = 1,5 min
  const g = { sp: 'run', x, r, x0: 100, v0: [120, 240], both: true, i: 0 };
  IM.vtMove(g, 160);                                                           // +60 px = +90 min
  IM.vtApply();
  assert.deepEqual(JSON.parse(store.get('triient:v1')).race.vt.run, [210, 330]);
  IM.openVt();
  IM.vtMove({ ...g, v0: [300, 420] }, 400);                                    // bute en haut de l'échelle
  IM.vtApply();
  assert.deepEqual(JSON.parse(store.get('triient:v1')).race.vt.run, [360, 480]);
});

test('jusqu’à 5 séances par semaine dans chaque sport, jamais deux fois le même sport le même jour', () => {
  const sc = { swim: 5, bike: 5, run: 5, brick: 1, str: 2 };
  const { IM } = loadApp({ race: { ...race(), sc, vt: { run: [240, 360] } } });
  const w = load(IM).at(-1), days = IM.PLAN[w].days;
  const ss = days.flatMap((d) => d.sessions), n = (sp) => ss.filter((s) => s.sp === sp).length;
  assert.deepEqual([n('swim'), n('bike'), n('run'), n('brick'), n('str')], [5, 5, 5, 1, 2]);
  days.forEach((d) => { const sps = d.sessions.map((s) => s.sp); assert.equal(new Set(sps).size, sps.length, d.name + ' : ' + sps); });
  assert.equal(days[0].sessions.map((s) => s.sp).join(), 'rest', 'le lundi reste au repos');
  const r = IM.spRange(IM.VOL, 'run');
  assert.ok(Math.abs(r[1] - 360) <= 10, 'pic de course à 6 h sur 5 courses : ' + r[1]);
  // des vacances adaptent aussi les séances ajoutées
  const away = { id: 'a1', type: 'vacances', label: 'Vacances', from: '2027-05-03', to: '2027-05-09', mode: 'min', move: 'none', pool: true, bike: true };
  const v = loadApp({ race: { ...race(), sc }, state: { ui: { away: [away] } } }).IM;
  const wk = v.PLAN.find((x) => x.start.getMonth() === 4 && x.start.getDate() === 3);
  const added = wk.days.flatMap((d) => d.sessions).filter((s) => s.orig && s.orig.ex >= 12);   // séance adaptée : l'original garde sa colonne
  assert.equal(added.length, 6, 'les 6 séances ajoutées de la semaine sont adaptées');
  added.forEach((s) => assert.ok(s.adapt && s.min <= s.orig.min, s.orig.title + ' ' + s.orig.min + ' → ' + s.min));
});

test('ajouter des courses ajoute des minutes de course sans rien retirer à la natation ni au vélo', () => {
  for (const [format, peak] of [['olympic', 8.5], ['half', 11], ['full', 15]]) {
    const base = raceConfig({ format, weeks: 16, date: '2027-06-27', level: 1, peak });
    const at = (run) => loadApp({ race: { ...base, sc: { swim: 2, bike: 2, run, brick: 1, str: 1 } } }).IM;
    const a = at(2), b = at(5), f = (IM, sp) => JSON.stringify(IM.spRange(IM.VOL, sp));
    assert.equal(f(b, 'swim'), f(a, 'swim'), format + ' natation');
    assert.equal(f(b, 'bike'), f(a, 'bike'), format + ' vélo');
    assert.ok(b.spRange(b.VOL, 'run')[1] > a.spRange(a.VOL, 'run')[1] + 60, format + ' course');
  }
});
