// Installation de l'app : bandeau dans le navigateur d'une autre appli, proposition d'installation et report de 7 jours.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, raceConfig } from './harness.mjs';

const race = raceConfig({ format: 'half', weeks: 20 });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const app = (ua, ui = {}, today) => loadApp({ race, ua, state: { ui }, ...(today ? { today } : {}) });

test('les navigateurs d’autres applis sont reconnus, pas les vrais navigateurs', () => {
  const cases = [
    [IPHONE + ' Instagram 350.0.0.0', 'Instagram'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]', 'Facebook'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FB_IAB/MESSENGER]', 'Messenger'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36', 'app'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', 'app'],
    [IPHONE, ''],
    [ANDROID, ''],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1', ''],
  ];
  for (const [ua, want] of cases) assert.equal(app(ua).IM.inAppName(), want, ua);
});

test('dans Instagram : bandeau sur l’Accueil à la place de la proposition d’installation', () => {
  const { view } = app(IPHONE + ' Instagram 350.0.0.0');
  assert.match(view(), /Ouvre Triient dans Safari/);
  assert.match(view(), /l’application Instagram/);
  assert.match(view(), /data-act="inappcopy"/);
  assert.match(view(), /data-act="inappopen">Ouvrir dans Safari/);
  assert.doesNotMatch(view(), /Installe Triient sur ton téléphone/);
});

test('Android dans une appli : bouton pour rouvrir dans Chrome', () => {
  const { IM } = app('Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]');
  const h = IM.inAppHtml('visiteur');
  assert.match(h, /Ouvre Triient dans Chrome/);
  assert.match(h, /data-act="inappopen"/);
});

test('iPhone dans Safari : guide d’installation en 3 étapes, aussi sur la présentation', () => {
  const { IM, view, sheet } = app(IPHONE);
  assert.match(view(), /Installe Triient sur ton téléphone/);
  assert.match(view(), /Sur l’écran d’accueil/);
  assert.match(view(), /data-act="instlater"/);
  IM.openWelcome();
  assert.match(sheet(), /Installe Triient sur ton téléphone/);
  assert.doesNotMatch(sheet(), /data-act="instlater"/, 'la présentation a déjà « C’est parti »');
});

test('« Plus tard » repousse de 7 jours, et après 3 refus la carte ne revient plus', () => {
  const later = { n: 1, until: '2027-01-22' };
  assert.doesNotMatch(app(IPHONE, { instLater: later }, '2027-01-21').view(), /Installe Triient/);
  assert.match(app(IPHONE, { instLater: later }, '2027-01-22').view(), /Installe Triient/);
  assert.doesNotMatch(app(IPHONE, { instLater: { n: 3, until: '2027-01-01' } }, '2027-03-01').view(), /Installe Triient/);
  const a = app(IPHONE);
  a.IM.instLater(false);
  const l = JSON.parse(a.store.get('triient:v1')).ui.instLater;
  assert.equal(l.n, 1);
  assert.equal(l.until, '2027-01-22');
});

test('l’ancien « Plus tard » définitif compte comme un refus : la carte revient', () => {
  const { view, store } = app(IPHONE, { hideInstall: true });
  assert.match(view(), /Installe Triient/);
  const ui = JSON.parse(store.get('triient:v1')).ui;
  assert.equal(ui.hideInstall, undefined);
  assert.equal(ui.instLater.n, 1);
});

test('ordinateur sans bouton du navigateur, ou app déjà installée : rien à proposer', () => {
  assert.doesNotMatch(app('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0').view(), /Installe Triient|Ouvre Triient/);
  assert.doesNotMatch(app(IPHONE, { instDone: true }).view(), /Installe Triient/);
});
