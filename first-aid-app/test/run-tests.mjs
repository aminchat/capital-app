/* KB + engine test suite. Run: node test/run-tests.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateAll, sha256 } from '../tools/validate.mjs';
import { triageRoute, rankCases, triggeredFlags } from '../js/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kbDir = join(root, 'kb');

let pass = 0;
const fail = [];
function t(name, cond) {
  if (cond) pass++;
  else fail.push(name);
}

/* ---------- KB structure ---------- */
const kb = validateAll(kbDir);
if (kb.errors.length) {
  console.error('KB validation errors:\n- ' + kb.errors.join('\n- '));
}
t('KB passes schema validation', kb.errors.length === 0);
t('KB has >= 25 cases', Object.keys(kb.cases).length >= 25);
t('all 8 categories present', Object.keys(kb.categories).length === 8);
t('every category has diffSymptoms', Object.values(kb.categories).every((c) => (c.diffSymptoms || []).length > 0));

/* every case has sources (auditability) and explicit 115 policy */
t(
  'every case cites at least one source',
  Object.values(kb.cases).every((c) => (c.sources || []).length > 0)
);
t(
  'every case has an explicit 115 policy (always, when, or explicit "not needed" text)',
  Object.values(kb.cases).every(
    (c) => c.call115 && (c.call115.always || (c.call115.when || []).length || c.call115.text)
  )
);

/* resuscitation is AHA-2025 based */
t('cardiac-arrest sourced to AHA 2025', (kb.cases['cardiac-arrest'].sources || []).some((s) => s.includes('AHA 2025')));
t('choking sourced to AHA 2025', (kb.cases['choking'].sources || []).some((s) => s.includes('AHA 2025')));
t('choking mentions the 2025 alternating 5+5 pattern', kb.cases['choking'].actions.join(' ').includes('۲۰۲۵'));

/* national-protocol notes exist where expected */
t('snake-bite has national note', Boolean(kb.cases['snake-bite'].nationalNote));
t('scorpion-sting has national note', Boolean(kb.cases['scorpion-sting'].nationalNote));
t('poisoning points to national poison center', Boolean(kb.cases['poisoning'].nationalNote));

/* ---------- triage engine ---------- */
t('triage: no response + no breathing -> cardiac-arrest', triageRoute({ conscious: 'n', breathing: 'n' }) === 'cardiac-arrest');
t('triage: no response + breathing -> unresponsive-breathing', triageRoute({ conscious: 'n', breathing: 'y' }) === 'unresponsive-breathing');
t('triage: conscious + heavy bleeding -> severe-bleeding', triageRoute({ conscious: 'y', bleeding: 'y' }) === 'severe-bleeding');
t('triage: all normal -> no interception', triageRoute({ conscious: 'y', bleeding: 'n' }) === null);

/* ---------- differential diagnosis (scoring) ---------- */
const ans = (ids) => new Set(ids);
let r = rankCases('bite', ans(['saw_snake', 'local_swelling', 'swelling_spreading']), kb.cases);
t('diff(bite): saw snake + spreading swelling -> snake-bite on top', r[0]?.c.id === 'snake-bite');
r = rankCases('bite', ans(['scorpion_seen', 'local_pain', 'child_victim']), kb.cases);
t('diff(bite): scorpion + child -> scorpion-sting on top', r[0]?.c.id === 'scorpion-sting');
r = rankCases('reaction', ans(['throat_tightness', 'wheezing', 'hives_widespread']), kb.cases);
t('diff(reaction): airway signs -> anaphylaxis on top', r[0]?.c.id === 'anaphylaxis');
r = rankCases('resuscitation', ans(['drowning_recent', 'not_breathing']), kb.cases);
t('diff(resuscitation): rescued from water -> drowning on top', r[0]?.c.id === 'drowning');
r = rankCases('consciousness', ans(['facial_droop', 'speech_difficulty']), kb.cases);
t('diff(consciousness): FAST signs -> stroke on top', r[0]?.c.id === 'stroke');
r = rankCases('illness', ans(['chest_pain', 'sweating_cold']), kb.cases);
t('diff(illness): chest pain + cold sweat -> heart-attack on top', r[0]?.c.id === 'heart-attack');

/* ---------- red flags & 115 triggers ---------- */
t('snake-bite: ptosis triggers 115', triggeredFlags(kb.cases['snake-bite'], ans(['ptosis'])).call === true);
t('snake-bite: local pain only -> no 115 forced', triggeredFlags(kb.cases['snake-bite'], ans(['local_pain'])).call === false);
t('heat-illness: confusion triggers 115', triggeredFlags(kb.cases['heat-illness'], ans(['confusion'])).call === true);
t('cardiac-arrest: 115 always', triggeredFlags(kb.cases['cardiac-arrest'], ans([])).call === true);
t('seizure: >5min seizure triggers 115', triggeredFlags(kb.cases['seizure'], ans(['seizure_long'])).call === true);
t('nosebleed: head impact triggers 115', triggeredFlags(kb.cases['nosebleed'], ans(['head_impact'])).call === true);

/* ---------- manifest integrity ---------- */
const man = JSON.parse(readFileSync(join(kbDir, 'manifest.json'), 'utf8'));
t('manifest covers every case file', Object.keys(man.cases).length === Object.keys(kb.cases).length);
let hashesOk = true;
for (const [id, e] of Object.entries(man.cases)) {
  const h = sha256(readFileSync(join(kbDir, 'cases', id + '.json')));
  if (h !== e.hash) hashesOk = false;
}
t('manifest hashes match case files', hashesOk);
t('manifest has symptoms + categories entries', Boolean(man.entries?.__symptoms && man.entries?.__categories));
t('manifest kbVersion is a number', typeof man.kbVersion === 'number' && man.kbVersion >= 1);

/* ---------- app shell references exist ---------- */
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
t('service worker precaches the app shell', sw.includes('index.html') && sw.includes('js/app.js'));
t('service worker treats KB files as network-first', sw.includes('/kb/cases/'));

/* ---------- report ---------- */
const total = pass + fail.length;
if (fail.length) {
  console.error(`\n❌ ${fail.length} failed:`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✅ ${pass}/${total} tests passed`);
