// Connexion Garmin gardée dans le compte : la clé intervals.icu est stockée chiffrée et rendue au seul propriétaire.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../strava-worker/worker.js';
import { loadApp, raceConfig } from './harness.mjs';

const enc = new TextEncoder();
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const SECRET = 'secret-de-test';

// Base D1 réduite à la ligne de l'utilisateur, pour les seules requêtes du compte
function fakeDB() {
  const row = { email: 'a@b.c', name: 'A', created: 1, last_login: 1, v: 0, data: null, data_updated: 0 };
  return {
    row,
    prepare: (sql) => ({
      bind: (...a) => ({
        first: async () => ({ ...row }),
        run: async () => { if (/^UPDATE users SET data/.test(sql)) { row.data = a[0]; row.v++; row.data_updated = a[1]; } },
      }),
    }),
  };
}
async function session(sub) {
  const body = b64u(enc.encode(JSON.stringify({ sub, exp: Date.now() + 1e7 })));
  const k = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return body + '.' + b64u(await crypto.subtle.sign('HMAC', k, enc.encode(body)));
}
async function call(env, method, data) {
  const headers = { 'Content-Type': 'application/json', 'X-Session': await session('u1') };
  const r = await worker.fetch(new Request('https://w.dev/pub/account/data', { method, headers, body: data ? JSON.stringify({ data, base: env.DB.row.v }) : undefined }), env);
  return r.json();
}

test('la clé est stockée chiffrée, rendue en clair au propriétaire, et gardée si un appareil envoie le plan sans clé', async () => {
  const env = { DB: fakeDB(), SESSION_SECRET: SECRET };
  await call(env, 'PUT', { done: {}, gk: 'cle-intervals-123456' });
  assert.doesNotMatch(env.DB.row.data, /cle-intervals/);
  assert.match(env.DB.row.data, /"gks"/);
  assert.equal((await call(env, 'GET')).data.gk, 'cle-intervals-123456');

  await call(env, 'PUT', { done: { s1: 1 } });
  const j = await call(env, 'GET');
  assert.equal(j.data.gk, 'cle-intervals-123456');
  assert.deepEqual(j.data.done, { s1: 1 });
});

test('« Déconnecter Garmin » efface la clé du compte', async () => {
  const env = { DB: fakeDB(), SESSION_SECRET: SECRET };
  await call(env, 'PUT', { done: {}, gk: 'cle-intervals-123456' });
  await call(env, 'PUT', { done: {}, gkx: 1 });
  assert.doesNotMatch(env.DB.row.data, /gks|gkx/);
  assert.equal((await call(env, 'GET')).data.gk, undefined);
});

test('l’app envoie sa clé au compte, jamais dans la sauvegarde par code, et la reprend depuis le compte', () => {
  const race = raceConfig({ format: 'half', weeks: 12 });
  const a = loadApp({ race, state: { sv: { url: 'https://triient.morgancabironman.workers.dev', key: 'k-123456789' } } });
  assert.equal(a.IM.cloudPayload(true).gk, 'k-123456789');
  assert.equal(a.IM.cloudPayload().gk, undefined);

  const b = loadApp({ race });
  b.IM.cloudApply({ done: {}, gk: 'k-123456789' });
  assert.equal(b.IM.state.sv.key, 'k-123456789');
  assert.equal(b.IM.state.sv.url, 'https://triient.morgancabironman.workers.dev');
});
