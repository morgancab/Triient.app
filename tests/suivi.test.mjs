// Suivi propriétaire : appareil, installation, Garmin, envois vers la montre, visites, fiche par utilisateur.
// La base D1 est simulée par SQLite (node:sqlite) avec les vrais fichiers schema*.sql.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../strava-worker/worker.js';
import { loadApp, raceConfig } from './harness.mjs';

const enc = new TextEncoder();
const SECRET = 'secret-de-test', ADMIN = 'moi@triient.app';
const schema = (n) => readFileSync(new URL('../strava-worker/' + n, import.meta.url), 'utf8');

function d1(db) {
  return {
    prepare(sql) {
      const st = db.prepare(sql);
      let args = [];
      const o = {
        bind: (...a) => { args = a; return o; },
        first: async () => st.get(...args) ?? null,
        all: async () => ({ results: st.all(...args) }),
        run: async () => { st.run(...args); return { success: true }; },
      };
      return o;
    },
  };
}
function setup(withSchema5 = true) {
  const db = new DatabaseSync(':memory:');
  db.exec(schema('schema3.sql'));
  db.exec(schema('schema4.sql'));
  if (withSchema5) { db.exec(schema('schema5.sql')); db.exec(schema('schema6.sql')); }
  const add = (id, email, data = null) => db.prepare('INSERT INTO users (id, email, name, created, last_login, v, data) VALUES (?, ?, ?, ?, ?, 0, ?)').run(id, email, 'Nom ' + id, Date.now() - 864e5, Date.now() - 864e5, data);
  add('admin', ADMIN);
  add('u1', 'a@b.c', JSON.stringify({ done: { s1: 1, s2: 1 }, links: {}, lv: { run: 1 }, st: [{ id: 'x1', name: 'Semi-marathon de Paris', city: 'Paris', kind: 'run', distM: 21097, date: '2027-03-07', prio: 'key', added: '2027-01-10', secret: 'ne doit pas sortir' }], away: [], ms: {}, gks: 'secret-chiffre', race: { name: 'Triathlon de Nice', date: '2027-06-27', format: 'half', weeks: 25, sessions: 8 } }));
  return { db, env: { DB: d1(db), SESSION_SECRET: SECRET, ADMIN_EMAILS: ADMIN } };
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');
async function session(sub) {
  const body = b64u(enc.encode(JSON.stringify({ sub, exp: Date.now() + 1e7 })));
  const k = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return body + '.' + b64u(await crypto.subtle.sign('HMAC', k, enc.encode(body)));
}
async function call(env, sub, method, path, body) {
  const r = await worker.fetch(new Request('https://w.dev' + path, { method, headers: { 'Content-Type': 'application/json', 'X-Session': await session(sub) }, body: body ? JSON.stringify(body) : undefined }), env);
  return Object.assign(await r.json(), { status: r.status });
}
const ping = (env, body) => call(env, 'u1', 'POST', '/pub/account/ping', body);
const row = (db) => db.prepare('SELECT * FROM users WHERE id = ?').get('u1');
const visits = (db) => db.prepare("SELECT * FROM visits WHERE user_id = 'u1' AND kind = 'visit'").all();

test('une visite est comptée à l’ouverture, pas à chaque mise à jour, et l’installation reste acquise', async () => {
  const { db, env } = setup();
  await ping(env, { done: 3, total: 100, dev: 'iPhone · app installée', inst: 1, g: 1, sent: 4, acts: 12 });
  let u = row(db);
  assert.equal(u.device, 'iPhone · app installée');
  assert.equal(u.installed, 1);
  assert.equal(u.garmin, 1);
  assert.equal(u.sent, 4);
  assert.equal(u.acts, 12);
  assert.equal(u.visits, 1);

  await ping(env, { done: 4, total: 100, dev: 'iPhone · Safari', inst: 0, g: 1, sent: 5, acts: 12 });   // 2 min plus tard : même visite
  assert.equal(visits(db).length, 1);
  u = row(db);
  assert.equal(u.installed, 1, 'une fois installée, l’app reste comptée comme installée');
  assert.equal(u.sent, 5);

  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now() - 2 * 3600e3, 'u1');      // retour 2 h plus tard
  await ping(env, { dev: 'Windows · Chrome', inst: 0 });
  assert.equal(visits(db).length, 2);
  assert.equal(row(db).visits, 2);
});

test('la première visite suivie est comptée même juste après un passage de l’ancienne version', async () => {
  const { db, env } = setup();
  await ping(env, { done: 1, total: 100 });                         // ancienne version : sans appareil
  await ping(env, { done: 1, total: 100, dev: 'iPhone · app installée', inst: 1 });
  assert.equal(visits(db).length, 1);
  assert.equal(row(db).visits, 1);
  await ping(env, { done: 2, total: 100, dev: 'iPhone · app installée', inst: 1 });   // même visite
  assert.equal(visits(db).length, 1);
});

test('l’ordinateur n’écrase pas les valeurs de l’iPhone', async () => {
  const { db, env } = setup();
  await ping(env, { dev: 'iPhone · app installée', inst: 1, g: 1, sent: 14, acts: 60 });
  await ping(env, { dev: 'Windows · Chrome', inst: 0, g: 0, sent: 0, acts: 0 });
  let u = row(db);
  assert.deepEqual([u.device, u.installed, u.garmin, u.sent, u.acts], ['Windows · Chrome', 1, 1, 14, 60]);
  await ping(env, { dev: 'iPhone · app installée', inst: 1, g: 0, sent: 15, acts: 61 });   // Garmin déconnecté sur l’iPhone aussi
  u = row(db);
  assert.deepEqual([u.garmin, u.sent], [0, 15]);
  const j = await call(env, 'admin', 'GET', '/pub/admin/user?id=u1');
  assert.deepEqual(j.devices.map((d) => [d.device, d.installed, d.sent]), [['iPhone · app installée', 1, 15], ['Windows · Chrome', 0, 0]]);
});

test('statistiques désactivées : seule la progression est enregistrée', async () => {
  const { db, env } = setup();
  await ping(env, { done: 7, total: 90 });
  const u = row(db);
  assert.equal(u.prog_done, 7);
  assert.equal(u.device, null);
  assert.equal(u.installed, null);
  assert.equal(visits(db).length, 0);
});

test('sans schema5.sql, le suivi d’origine continue de marcher', async () => {
  const { db, env } = setup(false);
  const j = await ping(env, { done: 2, total: 50, dev: 'iPhone · Safari', inst: 0 });
  assert.equal(j.ok, true);
  assert.equal(db.prepare('SELECT prog_done FROM users WHERE id = ?').get('u1').prog_done, 2);
  const o = await call(env, 'admin', 'GET', '/pub/admin/overview');
  assert.equal(o.ok, true);
  assert.equal(o.users.length, 2);
});

test('la fiche est réservée au propriétaire et ne renvoie ni le plan brut ni la clé Garmin', async () => {
  const { env } = setup();
  await ping(env, { done: 3, total: 100, dev: 'Android · Chrome', inst: 1, g: 1, sent: 2, acts: 5 });
  assert.equal((await call(env, 'u1', 'GET', '/pub/admin/user?id=u1')).status, 403);

  const j = await call(env, 'admin', 'GET', '/pub/admin/user?id=u1');
  assert.equal(j.ok, true);
  assert.equal(j.user.device, 'Android · Chrome');
  assert.equal(j.user.garminKey, true);
  assert.equal(j.race.name, 'Triathlon de Nice');
  assert.deepEqual([j.plan.checked, j.plan.levelTest, j.plan.races], [2, true, 1]);
  assert.deepEqual(j.steps, [{ name: 'Semi-marathon de Paris', city: 'Paris', kind: 'run', format: undefined, distM: 21097, date: '2027-03-07', prio: 'key', added: '2027-01-10' }].map((x) => JSON.parse(JSON.stringify(x))));
  assert.equal(j.devices[0].device, 'Android · Chrome');
  assert.equal(j.visits[0].kind, 'visit');
  assert.doesNotMatch(JSON.stringify(j), /secret-chiffre|gks|"data"/);

  const o = await call(env, 'admin', 'GET', '/pub/admin/overview');
  const u1 = o.users.find((u) => u.id === 'u1');
  assert.equal(u1.device, 'Android · Chrome');
  assert.deepEqual([o.totals.installed, o.totals.garmin, o.totals.sent], [1, 1, 2]);
});

test('supprimer son compte efface aussi son historique de visites', async () => {
  const { db, env } = setup();
  await ping(env, { dev: 'iPhone · Safari', inst: 0 });
  await call(env, 'u1', 'DELETE', '/pub/account');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM visits WHERE user_id = 'u1'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM devices WHERE user_id = 'u1'").get().n, 0);
});

test('la fiche affichée échappe ce que l’appareil envoie', () => {
  const a = loadApp({ race: raceConfig({ format: 'half', weeks: 12 }) });
  const html = a.IM.admDetail({ user: { email: 'a@b.c', created: 1, seen: 2, device: '<img src=x onerror=alert(1)>', installed: 1, garmin: 0, sent: 3, acts: 0, visits: 1 }, race: { name: 'Triathlon de Nice', date: '2027-06-27', format: 'half', weeks: 25 }, plan: null,
    visits: [{ t: Date.now(), kind: 'visit', device: '<b>x</b>' }, { t: Date.now() - 1, kind: 'login' }], devices: [{ device: '<script>', n: 1, last: Date.now() }],
    steps: [{ name: '<i>Marathon</i>', city: 'Berlin', kind: 'run', distM: 42195, date: '2027-09-26', prio: 'key' }, { name: 'Triathlon de Vichy', kind: 'tri', format: 'olympic', date: '2027-05-16', prio: 'prep' }] });
  assert.doesNotMatch(html, /<img|<script|<b>x/);
  assert.match(html, /Connexion Google/);
  assert.doesNotMatch(html, /<i>Marathon/);
  assert.match(html, /Courses intermédiaires · 2/);
  assert.ok(html.indexOf('Vichy') < html.indexOf('Marathon'), 'triées par date');
  assert.match(html, /42,195? km/);
  assert.match(html, /Séances envoyées vers la montre<\/span><b>3/);
});

test('l’appareil est décrit en « système · navigateur »', () => {
  const a = loadApp({ race: raceConfig({ format: 'half', weeks: 12 }) });
  assert.match(a.IM.devInfo().dev, / · /);
});

test('analyse du suivi : entonnoir, rétention et répartitions calculés sans le compte propriétaire', () => {
  const a = loadApp({ race: raceConfig({ format: 'half', weeks: 12 }) });
  const now = Date.UTC(2027, 1, 10, 12), D = 864e5;
  const u = (o) => ({ created: now - 40 * D, seen: now - 1 * D, done: 0, total: 100, race: 'X', raceDate: '2027-06-27', format: 'half', weeks: 20, ...o });
  const data = { users: [
    u({ id: 'a', done: 10, visits: 5, device: 'iPhone · app installée', installed: 1, garmin: 1, sent: 3 }),
    u({ id: 'b', created: now - 2 * D, seen: now - 2 * D, done: 0, visits: 1, device: 'Android · Chrome', installed: 0 }),
    u({ id: 'c', created: now - 10 * D, seen: now - 9.5 * D, format: 'full', weeks: 30, raceDate: '2027-09-12' }),
    u({ id: 'moi', owner: true, done: 99, device: 'Windows · Chrome' }),
  ] };
  const ev = { totals: { gate_view: 100, guest_start: 40, setup_view: 30, plan_created: 10, open: 50, install: 8 }, daily: {}, top: { search_miss: [['trifouillis', 3]], plan_created: [['half|7s|l1', 6]] } };
  const h = a.IM.admAnalytics(data, ev, 30, now);
  assert.match(h, /Page d’accueil vue<\/b><span>100</);
  assert.match(h, /« Créer mon plan » touché<\/b><span>40 · 40 %/);
  assert.match(h, /Compte créé<\/b><span>2 · 20 %/);                    // b et c inscrits dans les 30 jours, sur 10 plans remplis
  assert.match(h, /<b>50 %<\/b><span>Encore là après 7 jours<\/span><small>1 sur 2/);   // a revenu, c parti avant 7 jours, b trop récent pour compter
  assert.match(h, /Demi-distance \(70\.3\)<\/b><span>2 · 67 %/);
  assert.doesNotMatch(h, /Windows/, 'le compte propriétaire est exclu');
  assert.match(h, /trifouillis/);
  assert.match(h, /Demi-distance \(70\.3\) · 7 séances · Intermédiaire/);
});
