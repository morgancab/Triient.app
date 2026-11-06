// Assemble index.html à partir des sources de src/ :
//   src/page.html   la page (en-tête, balises, scripts externes) avec deux repères, @@CSS@@ et @@JS@@
//   src/style.css   tout le CSS
//   src/js/*.js     le script de l'app, en morceaux lus dans l'ordre de leur nom (01-, 02-…)
// Les morceaux JS sont collés tels quels : ils forment une seule fonction englobante, comme avant le découpage,
// donc le site en ligne reste un fichier unique et rien ne change pour Vercel ni pour les utilisateurs.
//
//   node scripts/build.mjs           reconstruit index.html
//   node scripts/build.mjs --check   vérifie seulement que index.html est à jour (code de sortie 1 sinon)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

export function build() {
  const page = read('src/page.html');
  const css = read('src/style.css');
  const js = readdirSync(new URL('src/js/', root)).filter((f) => f.endsWith('.js')).sort().map((f) => read('src/js/' + f)).join('');
  for (const mark of ['@@CSS@@', '@@JS@@']) if (page.split(mark).length !== 2) throw new Error('src/page.html doit contenir ' + mark + ' une seule fois');
  return page.replace('@@CSS@@', () => css).replace('@@JS@@', () => js);
}

// comparaison sans tenir compte des fins de ligne (Git peut les convertir sous Windows)
export const same = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = build(), file = new URL('index.html', root);
  if (process.argv.includes('--check')) {
    if (!same(out, readFileSync(file, 'utf8'))) { console.error('index.html n’est pas à jour : lance node scripts/build.mjs'); process.exit(1); }
    console.log('index.html est à jour');
  } else {
    writeFileSync(file, out);
    console.log('index.html reconstruit (' + Math.round(out.length / 1024) + ' Ko)');
  }
}
