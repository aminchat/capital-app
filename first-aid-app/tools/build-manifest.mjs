/* Builds kb/manifest.json from kb/cases/*.json + symptoms + categories.
 *
 * Usage:
 *   node tools/build-manifest.mjs [kbDir] [--version N] [--date YYYY-MM-DD]
 *
 * Steps for a KB change:
 *   1. edit the case JSON(s) and bump their "version"
 *   2. node tools/build-manifest.mjs   (bumps kbVersion automatically)
 *   3. git add kb && git commit && push
 * Devices diff the manifest on next online load and download only changed files.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sha256, validateAll } from './validate.mjs';

const args = process.argv.slice(2);
const kbDir = args.find((a) => !a.startsWith('--')) || 'kb';
const argVersion = (() => {
  const i = args.indexOf('--version');
  return i >= 0 ? parseInt(args[i + 1], 10) : 0;
})();
const argDate = (() => {
  const i = args.indexOf('--date');
  return i >= 0 ? args[i + 1] : new Date().toISOString().slice(0, 10);
})();

const { errors, cases, files } = validateAll(kbDir);
if (errors.length) {
  console.error('KB validation FAILED — manifest not written:\n- ' + errors.join('\n- '));
  process.exit(1);
}

const manPath = join(kbDir, 'manifest.json');
const prev = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : null;
const kbVersion = prev ? Math.max(prev.kbVersion + 1, argVersion) : Math.max(argVersion, 1);

const entry = (name, file) => ({
  version: 1,
  hash: sha256(readFileSync(join(kbDir, file))),
  url: `kb/${file}`,
});

const manifest = {
  kbVersion,
  updatedAt: argDate,
  generator: 'tools/build-manifest.mjs',
  entries: {
    __symptoms: entry('symptoms', 'symptoms.json'),
    __categories: entry('categories', 'categories.json'),
  },
  cases: {},
};

for (const f of files) {
  const id = f.replace(/\.json$/, '');
  manifest.cases[id] = {
    version: cases[id].version,
    hash: sha256(readFileSync(join(kbDir, 'cases', f))),
    url: `kb/cases/${f}`,
  };
}

writeFileSync(manPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest written: kbVersion=${kbVersion}, updatedAt=${argDate}, ${Object.keys(manifest.cases).length} cases`);
