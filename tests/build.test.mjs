// index.html est assemblé à partir de src/ (node scripts/build.mjs) : il doit toujours correspondre aux sources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, same } from '../scripts/build.mjs';

test('index.html est à jour avec src/ (sinon : node scripts/build.mjs)', () => {
  const built = build(), current = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(same(built, current), 'index.html ne correspond pas aux sources de src/ : lance node scripts/build.mjs');
});

test('le script de l’app reste une seule fonction englobante, ouverte et fermée une fois', () => {
  const js = build().match(/<script>\s*'use strict';[\s\S]*?<\/script>/)[0];
  assert.match(js, /^<script>\s*'use strict';\s*\(function\(\)\{/);
  assert.match(js, /\}\)\(\);\s*<\/script>$/);
});
