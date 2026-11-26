// Conversion : aperçu de la première semaine avant la création du compte, source des visiteurs, tableau par source du suivi.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig } from './harness.mjs';

const pending = { ...raceConfig({ format: 'olympic', weeks: 16, sessions: 6 }), id: 'cpend', name: 'Triathlon de test' };

test('« Ton plan est prêt » montre la vraie semaine 1 du plan en attente', () => {
  const { IM, view } = loadApp({ race: undefined, state: { ui: { pendingRace: pending } } });
  assert.equal(IM.PLAN.length, 16, 'le plan est calculé pour la course en attente');
  IM.loginPreview({ googleClientId: 'x' }, pending);
  const h = view();
  assert.match(h, /Ta semaine 1/);
  assert.match(h, /Natation|Vélo|Course/);
  assert.match(h, /puis 15 semaines jusqu’au jour J|Puis 15 semaines jusqu’au jour J/);
  assert.match(h, /Crée ton compte pour voir tes 16 semaines/);
  assert.equal((h.match(/class="ld-dr /g) || []).length <= 4, true, '4 séances au plus');
});

test('sans plan calculé pour cette course, on garde le récapitulatif', () => {
  const { IM, view } = loadApp({ race: raceConfig({}) });
  IM.loginPreview({ googleClientId: 'x' }, pending);
  assert.doesNotMatch(view(), /Ta semaine 1/);
  assert.match(view(), /lgs-sum/);
});

test('la source est retenue à la première visite', () => {
  const ig = loadApp({ race: raceConfig({}), ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 Instagram 350.0' });
  assert.equal(ig.IM.srcOf(), 'instagram');
  assert.equal(JSON.parse(ig.store.get('triient:v1')).ui.src, 'instagram');
  const kept = loadApp({ race: raceConfig({}), state: { ui: { src: 'whatsapp' } } });
  assert.equal(kept.IM.srcOf(), 'whatsapp');
  assert.equal(loadApp({ race: raceConfig({}) }).IM.srcOf(), 'direct');
});

test('suivi : tableau des visites et comptes par source', () => {
  const { IM } = loadApp({ race: raceConfig({}) });
  const now = Date.parse('2027-01-15T12:00:00Z');
  const E = { totals: { gate_view: 30 }, daily: {}, acc: {}, top: {
    gate_view: [['instagram', 20], ['direct', 10]], guest_start: [['instagram', 6], ['direct', 2]],
    login_step: [['instagram', 4], ['direct', 2]], signup: [['direct', 2], ['instagram', 1]] } };
  const h = IM.admAnalytics({ users: [] }, E, 30, now).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(h, /Par source Source Visites Créer Plan prêt Comptes direct 10 2 2 2 instagram 20 6 4 1/);
});
