/* فیلترهای دیده‌بان بازار — پورت مستقیم همان فیلترهای نسخه‌ی بوکمارکلت
 * هر فیلتر: test(row, params, ct) که ct داده‌ی حقیقی/حقوقی همان نماد است.
 * همه‌ی آستانه‌ها نسبی‌اند (درصد/ضریب) تا به واحد ریال یا تومان وابسته نباشند. */

function num(v, d) {
  const x = parseFloat(v);
  return isFinite(x) ? x : d;
}
function i(v) {
  const x = parseInt(v, 10);
  return isFinite(x) ? x : 0;
}

const DERIV_YVALS = ["306", "301", "706", "208", "206", "305", "380", "263", "304", "400", "403", "404", "600", "602", "605", "603", "311", "312", "320", "321"];

export const SPECIALS = [
  {
    id: "smartBuy", icon: "🧠", needsCT: true,
    label: "پول هوشمند — خرید حقیقی سنگین",
    desc: "خالص خرید حقیقی مثبت + سرانه‌ی خرید هر حقیقی ≥ K برابر سرانه‌ی فروش + خرید حقیقی ≥ X٪ کل حجم",
    def: { k: 2, x: 25 },
    pmeta: [{ key: "k", label: "ضریب سرانه" }, { key: "x", label: "٪ خرید از حجم" }],
    test(row, p, ct) {
      if (!ct) return false;
      const bv = ct.Buy_I_Volume || 0, sv = ct.Sell_I_Volume || 0;
      const bn = ct.Buy_CountI || 0, sn = ct.Sell_CountI || 0;
      if (bv <= sv || bn <= 0) return false;
      if (bv / Math.max(bn, 1) < num(p.k, 2) * (sv / Math.max(sn, 1))) return false;
      const tv = i(row.tvol);
      if (tv > 0 && bv < num(p.x, 25) * tv / 100) return false;
      return true;
    },
  },
  {
    id: "legalIn", icon: "🏛", needsCT: true,
    label: "ورود پول حقوقی",
    desc: "خالص حجم خرید حقوقی ≥ X٪ کل حجم معاملات (ورود نهادی)",
    def: { x: 10 },
    pmeta: [{ key: "x", label: "٪ خالص از حجم" }],
    test(row, p, ct) {
      if (!ct) return false;
      const net = (ct.Buy_N_Volume || 0) - (ct.Sell_N_Volume || 0);
      const tv = i(row.tvol);
      return net > 0 && tv > 0 && net >= num(p.x, 10) * tv / 100;
    },
  },
  {
    id: "laggard", icon: "💎",
    label: "جا مانده از بازار (ارزنده)",
    desc: "P/E پایین اما هنوز حرکت نکرده و نقدشونده — کاندید «جا مانده از رالی»",
    def: { pe: 6, x: 1.5 },
    pmeta: [{ key: "pe", label: "حداکثر P/E" }, { key: "x", label: "حداکثر |٪|" }],
    test(row, p) {
      const pe = num(row.pe, 0);
      return row.pe !== "" && row.pe != null && pe > 0 && pe <= num(p.pe, 6)
        && Math.abs(num(row.pcp, 0)) <= num(p.x, 1.5)
        && i(row.tno) > 0
        && (i(row.bvol) > 0 ? i(row.tvol) >= i(row.bvol) : true);
    },
  },
  {
    id: "quietAcc", icon: "🤫",
    label: "تجمع بی‌سروصدا",
    desc: "حجم ≥ K برابر حجم مبنا ولی قیمت هنوز بین ۰ تا X درصد — الگوی جمع‌کردن",
    def: { k: 3, x: 2 },
    pmeta: [{ key: "k", label: "ضریب مبنا" }, { key: "x", label: "حداکثر ٪" }],
    test(row, p) {
      return i(row.bvol) > 0 && i(row.tvol) >= num(p.k, 3) * i(row.bvol)
        && num(row.pcp, 0) >= 0 && num(row.pcp, 0) <= num(p.x, 2)
        && i(row.tno) > 0;
    },
  },
  {
    id: "bidHeavy", icon: "⚖️",
    label: "فشار خرید سرصفحه",
    desc: "حجم بهترین صف خرید ≥ K برابر صف فروش، همراه با مثبت بودن",
    def: { k: 2 },
    pmeta: [{ key: "k", label: "نسبت تقاضا/عرضه" }],
    test(row, p) {
      const qd = num(row.qd1, 0), qo = num(row.qo1, 0);
      return qd > 0 && (qo <= 0 || qd >= num(p.k, 2) * qo) && num(row.pcp, 0) > 0 && i(row.tno) > 0;
    },
  },
  {
    id: "distress", icon: "🚨",
    label: "هشدار توزیع (خروج پول)",
    desc: "حجم ≥ K برابر مبنا همراه با افت ≥ |X|٪ — نمادهای پرریسک",
    def: { k: 3, x: -2 },
    pmeta: [{ key: "k", label: "ضریب مبنا" }, { key: "x", label: "حداکثر ٪ (منفی)" }],
    test(row, p) {
      return i(row.bvol) > 0 && i(row.tvol) >= num(p.k, 3) * i(row.bvol)
        && num(row.pcp, 0) <= num(p.x, -2);
    },
  },
];

export const BASICS = [
  {
    id: "noTrade", label: "حذف نمادهای بی‌معامله", desc: "نمادهایی که هنوز معامله‌ای ثبت نکرده‌اند",
    def: {}, pmeta: [],
    test(row) { return i(row.tno) > 0; },
  },
  {
    id: "minPrice", label: "حداقل قیمت", desc: "قیمت آخرین معامله", def: { x: 5000 },
    pmeta: [{ key: "x", label: "قیمت" }],
    test(row, p) { return num(row.pl, 0) >= num(p.x, 0); },
  },
  {
    id: "minPct", label: "حداقل درصد تغییر", desc: "درصد آخرین قیمت", def: { x: 1 },
    pmeta: [{ key: "x", label: "درصد" }],
    test(row, p) { return num(row.plp, 0) >= num(p.x, 0); },
  },
  {
    id: "minVol", label: "حداقل حجم", desc: "حجم معامله (سهم)", def: { x: 1000000 },
    pmeta: [{ key: "x", label: "حجم" }],
    test(row, p) { return i(row.tvol) >= num(p.x, 0); },
  },
  {
    id: "minVolRatio", label: "حجم ≥ ضریب × حجم مبنا", desc: "نمادهای داغ", def: { x: 2 },
    pmeta: [{ key: "x", label: "ضریب" }],
    test(row, p) {
      const b = i(row.bvol);
      return b > 0 ? i(row.tvol) >= num(p.x, 1) * b : true;
    },
  },
  {
    id: "minTval", label: "حداقل ارزش معامله", desc: "همان واحد ستون ارزش", def: { x: 1000000000 },
    pmeta: [{ key: "x", label: "ارزش" }],
    test(row, p) { return i(row.tval) >= num(p.x, 0); },
  },
  {
    id: "noDeriv", label: "حذف اوراق و مشتقات", desc: "صندوق، اوراق، آتی، حق تقدم، اختیار فروش و…",
    def: {}, pmeta: [],
    test(row) { return DERIV_YVALS.indexOf(String(row.yval)) === -1; },
  },
  {
    id: "noHousing", label: "حذف تسهیلات مسکن", desc: "نمادهای «تسه…» و «تملي…»",
    def: {}, pmeta: [],
    test(row) { return !(String(row.l18).indexOf("تسه") === 0 || String(row.l18).indexOf("تملي") === 0); },
  },
  {
    id: "noEnergy", label: "حذف بازار انرژی", desc: "نمادهای flow=6",
    def: {}, pmeta: [],
    test(row) { return String(row.flow) !== "6"; },
  },
  {
    id: "maxPE", label: "حداکثر P/E", desc: "حذف نمادهای P/E بالاتر از X (بدون P/E می‌مانند)", def: { x: 15 },
    pmeta: [{ key: "x", label: "P/E" }],
    test(row, p) { return row.pe === "" || row.pe == null || num(row.pe, 0) <= num(p.x, 0); },
  },
  {
    id: "search", label: "جستجوی نماد", desc: "فقط نمادهای حاوی این متن", def: { kw: "" },
    pmeta: [{ key: "kw", label: "متن", text: true }],
    test(row, p) {
      const kw = String(p.kw || "").toUpperCase();
      if (!kw) return true;
      return String(row.l18).toUpperCase().indexOf(kw) !== -1;
    },
  },
  {
    id: "blacklist", label: "سیاهه", desc: "نمادهای مخفی، جدا با ویرگول", def: { list: "" },
    pmeta: [{ key: "list", label: "AAA,BBB", text: true }],
    test(row, p) {
      const list = String(p.list || "").split(/[\s,،;؛]+/).filter(Boolean).map((s) => s.toUpperCase());
      if (!list.length) return true;
      return list.indexOf(String(row.l18).toUpperCase()) === -1;
    },
  },
];

export const ALL_FILTERS = SPECIALS.concat(BASICS);

export function filterById(id) {
  return ALL_FILTERS.find((f) => f.id === id) || null;
}

/* اعمال همه‌ی فیلترهای فعال روی مجموعه‌ی ردیف‌ها */
export function applyFilters(rows, state, ct) {
  const active = [];
  for (const f of ALL_FILTERS) {
    if (!state.enabled[f.id]) continue;
    const params = Object.assign({}, f.def, state.params[f.id] || {});
    if (f.id === "search" && !String(params.kw || "").trim()) continue;
    if (f.id === "blacklist" && !String(params.list || "").trim()) continue;
    active.push({ f, params });
  }
  const out = [];
  for (const key in rows) {
    if (!Object.prototype.hasOwnProperty.call(rows, key)) continue;
    const row = rows[key];
    let ok = true;
    for (const a of active) {
      if (!a.f.test(row, a.params, ct ? ct[row.inscode] : null)) { ok = false; break; }
    }
    if (ok) out.push(row);
  }
  return out;
}
