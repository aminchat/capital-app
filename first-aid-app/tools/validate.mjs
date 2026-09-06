/* Shared KB validation — used by both build-manifest.mjs and the test suite.
 * Run as a script too: node tools/validate.mjs [kbDir] */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

const REQUIRED = ['id', 'title', 'icon', 'category', 'version', 'updatedAt', 'summary', 'sources', 'actions'];

function checkSymptomRefs(caseId, where, ids, symptoms, errs) {
  for (const k of ids || []) {
    if (!symptoms[k]) errs.push(`${caseId}: ${where} references unknown symptom "${k}"`);
  }
}

export function validateCase(c, symptoms, categories, caseIds, errs) {
  for (const f of REQUIRED) {
    const v = c[f];
    const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) errs.push(`${c.id}: missing or empty field "${f}"`);
  }
  if (c.call115 === undefined || c.call115 === null) errs.push(`${c.id}: missing "call115"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.updatedAt || '')) errs.push(`${c.id}: updatedAt must be YYYY-MM-DD`);
  if (typeof c.version !== 'number' || c.version < 1) errs.push(`${c.id}: version must be an integer >= 1`);
  if (!categories[c.category]) errs.push(`${c.id}: unknown category "${c.category}"`);
  checkSymptomRefs(c.id, 'match', Object.keys(c.match || {}), symptoms, errs);
  checkSymptomRefs(c.id, 'riskQuestions', c.riskQuestions, symptoms, errs);
  for (const f of c.redFlags || []) {
    checkSymptomRefs(c.id, 'redFlags.when', f.when, symptoms, errs);
    if (!f.text) errs.push(`${c.id}: redFlag missing text`);
  }
  const c115 = c.call115 || {};
  checkSymptomRefs(c.id, 'call115.when', c115.when, symptoms, errs);
  for (const r of c.related || []) {
    if (!caseIds.has(r.case)) errs.push(`${c.id}: related case "${r.case}" not found`);
    if (!r.text) errs.push(`${c.id}: related entry missing text`);
  }
  if ((c.actions || []).some((a) => !String(a).trim())) errs.push(`${c.id}: empty action string`);
  if ((c.prohibitions || []).some((p) => !String(p).trim())) errs.push(`${c.id}: empty prohibition string`);
}

export function validateAll(kbDir) {
  const errs = [];
  const symptoms = loadJson(join(kbDir, 'symptoms.json'));
  const categories = loadJson(join(kbDir, 'categories.json'));

  for (const [cid, cat] of Object.entries(categories)) {
    if (!cat.title) errs.push(`category ${cid}: missing title`);
    for (const s of cat.diffSymptoms || []) {
      if (!symptoms[s]) errs.push(`category ${cid}: diffSymptoms references unknown symptom "${s}"`);
    }
  }

  const files = readdirSync(join(kbDir, 'cases')).filter((f) => f.endsWith('.json'));
  const cases = {};
  const caseIds = new Set();
  for (const f of files) {
    const c = loadJson(join(kbDir, 'cases', f));
    if (c.id !== basename(f, '.json')) errs.push(`${f}: id "${c.id}" does not match filename`);
    if (caseIds.has(c.id)) errs.push(`duplicate case id "${c.id}"`);
    caseIds.add(c.id);
    cases[c.id] = c;
  }
  for (const c of Object.values(cases)) validateCase(c, symptoms, categories, caseIds, errs);

  // triage route targets must exist
  for (const id of ['cardiac-arrest', 'unresponsive-breathing', 'severe-bleeding']) {
    if (!cases[id]) errs.push(`triage target case missing: ${id}`);
  }

  return { errors: errs, cases, symptoms, categories, files };
}

if (process.argv[1] && process.argv[1].endsWith('validate.mjs')) {
  const kbDir = process.argv[2] || 'kb';
  const { errors } = validateAll(kbDir);
  if (errors.length) {
    console.error('KB validation FAILED:\n- ' + errors.join('\n- '));
    process.exit(1);
  }
  console.log('KB validation OK');
}
