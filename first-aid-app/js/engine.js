/* Deterministic rule engine: triage routing + case scoring.
 * Everything here runs offline with zero dependencies. */

export const CATS = [
  { id: 'resuscitation', title: 'احیا و تنفس', icon: '🫀' },
  { id: 'consciousness', title: 'غش و هوشیاری', icon: '🧠' },
  { id: 'bleeding', title: 'خونریزی و زخم', icon: '🩸' },
  { id: 'bite', title: 'گزش و نیش', icon: '🐍' },
  { id: 'reaction', title: 'واکنش شدید (آنافیلاکسی)', icon: '⚡' },
  { id: 'burn', title: 'سوختگی و برق', icon: '🔥' },
  { id: 'trauma', title: 'تروما و استخوان', icon: '🦴' },
  { id: 'illness', title: 'بیماری‌های داخلی', icon: '💊' },
];

/** Global triage: answers = { conscious:'y'|'n', breathing:'y'|'n', bleeding:'y'|'n' }
 *  Returns a case id to route to, or null if no interception. */
export function triageRoute(a) {
  if (a.conscious === 'n' && a.breathing === 'n') return 'cardiac-arrest';
  if (a.conscious === 'n' && a.breathing === 'y') return 'unresponsive-breathing';
  if (a.bleeding === 'y') return 'severe-bleeding';
  return null;
}

/** Rank all cases in a category by how many of the answered symptoms
 *  their `match` weights hit. Used by the "don't know the cause" flow. */
export function rankCases(categoryId, answered, cases) {
  return Object.values(cases)
    .filter((c) => c.category === categoryId && c.match && Object.keys(c.match).length)
    .map((c) => ({
      c,
      score: Object.entries(c.match).reduce((s, [k, w]) => s + (answered.has(k) ? w : 0), 0),
    }))
    .sort((x, y) => y.score - x.score || x.c.title.localeCompare(y.c.title, 'fa'));
}

/** Evaluate a case's red flags and 115 conditions against answered symptoms. */
export function triggeredFlags(item, answered) {
  const flags = (item.redFlags || []).filter((f) => (f.when || []).some((s) => answered.has(s)));
  const c = item.call115 || {};
  const call = c.always === true || (c.when || []).some((s) => answered.has(s));
  return { flags, call, callText: c.text || '' };
}
