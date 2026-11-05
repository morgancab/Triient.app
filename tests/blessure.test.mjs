// Blessure : sports arrêtés, pause jusqu'à nouvel ordre, reprise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig, sessions, addDays } from './harness.mjs';

const race = raceConfig({ format: 'full', weeks: 25, date: '2027-06-27' });        // début le lundi 4 janvier 2027
const snapshot = (IM) => JSON.stringify(sessions(IM).map((s) => [s.id, s.w, s.d, s.sp, s.min, s.title]));
const on = (IM, date) => { const d = new Date(date + 'T12:00:00'); return IM.PLAN.flatMap((w) => w.days).find((x) => x.date.getFullYear() === d.getFullYear() && x.date.getMonth() === d.getMonth() && x.date.getDate() === d.getDate()).sessions; };
const days = (from, to) => { const r = []; for (let d = from; d <= to; d = addDays(d, 1)) r.push(d); return r; };
const inj = (o) => ({ id: 'b1', type: 'injury', label: 'Blessure', from: '2027-02-08', to: '2027-02-21', open: false, stop: { swim: true, bike: true, run: true, str: true }, mode: 'same', move: 'none', pool: true, bike: true, ...o });

test('pause complète : plus aucune séance pendant la période, le reste du plan ne bouge pas', () => {
  const clean = loadApp({ race, today: '2027-02-01' }).IM;
  const { IM } = loadApp({ race, today: '2027-02-01', state: { ui: { away: [inj()] } } });
  for (const d of days('2027-02-08', '2027-02-21')) on(IM, d).forEach((s) => assert.equal(s.sp, 'rest', d + ' : ' + s.title));
  assert.ok(on(IM, '2027-02-10').some((s) => s.title === 'Repos · blessure'));
  for (const d of ['2027-02-07', '2027-02-22', '2027-03-01']) assert.equal(JSON.stringify(on(IM, d).map((s) => [s.sp, s.min])), JSON.stringify(on(clean, d).map((s) => [s.sp, s.min])), d);
  IM.state.ui.away = [];
  IM.applyAway();
  assert.equal(snapshot(IM), snapshot(clean), 'supprimer la blessure rétablit le plan');
});

test('course à pied arrêtée : la course et l’enchaînement passent en repos, natation et vélo restent', () => {
  const clean = loadApp({ race, today: '2027-02-01' }).IM;
  const { IM } = loadApp({ race, today: '2027-02-01', state: { ui: { away: [inj({ stop: { run: true } })] } } });
  const period = days('2027-02-08', '2027-02-21');
  const kept = period.flatMap((d) => on(IM, d)).filter((s) => s.sp !== 'rest');
  assert.ok(kept.some((s) => s.sp === 'swim') && kept.some((s) => s.sp === 'bike'));
  assert.ok(kept.every((s) => s.sp !== 'run' && s.sp !== 'brick'));
  const before = period.flatMap((d) => on(clean, d)).filter((s) => s.sp === 'bike').map((s) => s.min);
  assert.deepEqual(kept.filter((s) => s.sp === 'bike').map((s) => s.min), before, 'mode identique : vélo inchangé');
  assert.equal(IM.awayDesc(inj({ stop: { run: true, bike: true } })), 'Vélo et course à pied à l’arrêt');
  assert.equal(IM.awayDesc(inj()), 'Pause complète');
});

test('les autres sports peuvent être allégés', () => {
  const clean = loadApp({ race, today: '2027-02-01' }).IM;
  const { IM } = loadApp({ race, today: '2027-02-01', state: { ui: { away: [inj({ stop: { run: true }, mode: 'light' })] } } });
  const sum = (X) => days('2027-02-08', '2027-02-21').flatMap((d) => on(X, d)).filter((s) => s.sp === 'bike').reduce((p, s) => p + s.min, 0);
  assert.ok(sum(IM) < sum(clean));
});

test('jusqu’à nouvel ordre : la pause couvre les 7 prochains jours et avance avec le temps', () => {
  const p = inj({ from: '2027-01-28', to: '2027-01-28', open: true });
  const a = loadApp({ race, today: '2027-02-01', state: { ui: { away: [p] } } }).IM;
  assert.equal(a.awayTo(p), '2027-02-08');
  for (const d of days('2027-01-28', '2027-02-08')) on(a, d).forEach((s) => assert.equal(s.sp, 'rest', d));
  assert.ok(on(a, '2027-02-13').some((s) => s.sp !== 'rest'), 'au-delà, le plan continue');
  const b = loadApp({ race, today: '2027-02-10', state: { ui: { away: [p] } } }).IM;
  on(b, '2027-02-17').forEach((s) => assert.equal(s.sp, 'rest'));
});

test('reprise progressive : la blessure s’arrête la veille, suivie d’une semaine allégée', () => {
  const p = inj({ from: '2027-01-28', to: '2027-01-28', open: true });
  const { IM, view } = loadApp({ race, today: '2027-02-03', hash: '#dash', state: { ui: { away: [p] } } });
  assert.match(view(), /Plan en pause · Blessure/);
  assert.match(view(), /depuis 6 jours/);
  assert.doesNotMatch(view(), /Séances manquées/i, 'pas de relance pendant la blessure');
  IM.injBack('b1', 'soft');
  const l = IM.state.ui.away;
  assert.equal(l.length, 2);
  assert.deepEqual([l[0].open, l[0].to], [false, '2027-02-02']);
  assert.deepEqual([l[1].label, l[1].mode, l[1].from, l[1].to], ['Reprise progressive', 'light', '2027-02-03', '2027-02-09']);
  assert.ok(on(IM, '2027-02-04').some((s) => s.sp !== 'rest'), 'les séances reviennent');
  assert.equal(IM.injCard(), '', 'plus de bandeau à l’accueil');
});

test('reprise le jour même du début : la blessure disparaît', () => {
  const { IM } = loadApp({ race, today: '2027-02-03', state: { ui: { away: [inj({ from: '2027-02-03', to: '2027-02-03', open: true })] } } });
  IM.injBack('b1', 'full');
  assert.equal(IM.state.ui.away.length, 0);
});

test('nouvelle blessure : à partir d’aujourd’hui, tout arrêté, jusqu’à nouvel ordre', () => {
  const { IM } = loadApp({ race, today: '2027-02-03' });
  const d = IM.newAwayDraft(5, 'injury');
  assert.deepEqual([d.type, d.from, d.open, IM.awayDesc(d)], ['injury', '2027-02-03', true, 'Pause complète']);
});
