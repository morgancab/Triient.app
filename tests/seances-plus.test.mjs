// Plans chargés : de 9 à 12 séances par semaine et jusqu'à 29 h au pic (3e natation, footing facile, vélo d'endurance, renfo prévention).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig, sessions, addDays } from './harness.mjs';

const open = (format, n, peak = 0, weeks = 25, state = {}) => {
  const race = raceConfig({ format, weeks, sessions: n, peak });
  return loadApp({ race, today: addDays(race.start, 3), state }).IM;
};
const real = (w) => w.days.flatMap((d) => d.sessions).filter((s) => s.sp !== 'rest');

test('de 9 à 12 séances : le nombre demandé, sans doublon d’identifiant', () => {
  for (const format of ['sprint', 'olympic', 'half', 'full']) for (const n of [9, 10, 11, 12]) for (const weeks of [8, 25]) {
    const IM = open(format, n, 0, weeks), tag = format + ' ' + n + ' séances ' + weeks + ' sem.';
    const counts = IM.PLAN.slice(0, -1).map((w) => real(w).length);
    assert.ok(Math.max(...counts) === n || Math.max(...counts) === n - 1, tag + ' : ' + Math.max(...counts));   // n-1 : semaines sans enchaînement
    assert.ok(counts.every((c) => c <= n), tag);
    const ids = sessions(IM).map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, tag + ' : identifiants en double');
    sessions(IM).forEach((s) => assert.ok(Number.isFinite(s.min) && s.min >= 0 && s.title && s.lines.length, tag + ' ' + s.id));
  }
});

test('les séances ajoutées arrivent dans l’ordre : natation, footing, vélo, renfo', () => {
  const sp = (IM) => real(IM.PLAN[5]).filter((s) => s.ex != null).map((s) => s.ex).sort().join();
  assert.equal(sp(open('half', 8)), '');
  assert.equal(sp(open('half', 9)), '8');
  assert.equal(sp(open('half', 10)), '8,9');
  assert.equal(sp(open('half', 11)), '10,8,9');
  assert.equal(sp(open('half', 12)), '10,11,8,9');
});

test('jusqu’à 8 séances, les plans ne changent pas', () => {
  const ref = '345,390,440,315,470,525,575,370,590,635,675,420,695,740,785,460,805,850,880,495,880,925,690,415,175';
  const IM = loadApp({ race: raceConfig({ format: 'full', weeks: 25 }), today: '2027-01-15' }).IM;
  assert.equal(IM.PLAN.map((w) => w.min).join(), ref);
});

test('28 h au pic en distance complète avec 11 ou 12 séances', () => {
  for (const n of [11, 12]) {
    const IM = open('full', n, 28), pk = Math.max(...IM.PLAN.map((w) => w.min)) / 60;
    assert.ok(pk >= 27 && pk <= 28.5, n + ' séances : pic ' + pk.toFixed(1) + ' h');
  }
});

test('plan chargé : en semaine, rien ne dépasse les sorties longues du week-end', () => {
  for (const [format, n, peak] of [['full', 12, 29], ['full', 11, 28], ['half', 12, 22], ['olympic', 12, 16], ['sprint', 12, 12]]) {
    const IM = open(format, n, peak);
    IM.PLAN.slice(0, -1).forEach((w) => {
      const s = real(w), long = (sp, d) => s.filter((x) => x.sp === sp && x.d === d).reduce((m, x) => Math.max(m, x.min), 0);
      const lb = long('bike', 5), lr = long('run', 6), tag = format + ' S' + w.n;
      s.filter((x) => x.d >= 1 && x.d <= 4).forEach((x) => {
        if (x.sp === 'bike' && lb) assert.ok(x.min <= lb, tag + ' : ' + x.title + ' ' + x.min + ' min > vélo long ' + lb);
        if (x.sp === 'run' && lr) assert.ok(x.min <= lr, tag + ' : ' + x.title + ' ' + x.min + ' min > sortie longue ' + lr);
      });
      if (format === 'full') assert.ok(lb <= 420, tag + ' : vélo long ' + lb + ' min');
    });
  }
});

test('les séances ajoutées s’envoient sur la montre et s’adaptent en vacances', () => {
  const IM = open('full', 12);
  const added = sessions(IM).filter((s) => s.ex != null && s.sp !== 'str');
  assert.ok(added.length > 0);
  added.forEach((s) => assert.ok(s.wk && /Main/.test(s.wk), s.id + ' sans séance structurée'));
  const w = IM.PLAN[5], from = w.days[0].date, to = w.days[6].date, iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const away = { id: 'a1', type: 'vacances', label: 'Vacances', from: iso(from), to: iso(to), mode: 'min', move: 'none', pool: false, bike: true };
  const B = open('full', 12, 0, 25, { ui: { away: [away] } });
  const wk = B.PLAN[5], ex = real(wk).filter((s) => s.ex != null || (s.orig && s.orig.ex != null));
  assert.ok(ex.length > 0, 'séances ajoutées présentes pendant les vacances');
  real(wk).forEach((s) => assert.ok(Number.isFinite(s.min) && s.min > 0, s.id));
  assert.ok(!real(wk).some((s) => s.sp === 'swim'), 'pas de natation sans piscine');
});
