/*! دیده‌بان بازار — نسخه‌ی تزریقی (اجرا در صفحه‌ی خود tsetmc؛ هم‌مبدأ، بدون CORS/پروکسی)
 * ساخته‌شده با inject/build.js — فایل دستی ویرایش نشود */
(function(){
"use strict";
/* نگاشت کد گروه (cs) به نام گروه — از خود سایت TSETMC */
const SECTORS = {
  "01": "زراعت و خدمات وابسته",
  "02": "جنگلداري و ماهيگيري",
  "10": "استخراج زغال سنگ",
  "11": "استخراج نفت گاز و خدمات جنبي جز اکتشاف",
  "13": "استخراج کانه هاي فلزي",
  "14": "استخراج ساير معادن",
  "15": "حذف شده- فرآورده‌هاي غذايي و آشاميدني",
  "17": "منسوجات",
  "19": "دباغي، پرداخت چرم و ساخت انواع پاپوش",
  "20": "محصولات چوبي",
  "21": "محصولات كاغذي",
  "22": "انتشار، چاپ و تکثير",
  "23": "فراورده هاي نفتي، كك و سوخت هسته اي",
  "24": "حذف شده-مواد و محصولات شيميايي",
  "25": "لاستيك و پلاستيك",
  "26": "توليد محصولات كامپيوتري الكترونيكي ونوري",
  "27": "فلزات اساسي",
  "28": "ساخت محصولات فلزي",
  "29": "ماشين آلات و تجهيزات",
  "31": "ماشين آلات و دستگاه‌هاي برقي",
  "32": "ساخت دستگاه‌ها و وسايل ارتباطي",
  "33": "ابزارپزشکي، اپتيکي و اندازه‌گيري",
  "34": "خودرو و ساخت قطعات",
  "35": "ساير تجهيزات حمل و نقل",
  "36": "مبلمان و مصنوعات ديگر",
  "38": "قند و شكر",
  "39": "شرکتهاي چند رشته اي صنعتي",
  "40": "عرضه برق، گاز، بخاروآب گرم",
  "41": "جمع آوري، تصفيه و توزيع آب",
  "42": "محصولات غذايي و آشاميدني به جز قند و شكر",
  "43": "مواد و محصولات دارويي",
  "44": "محصولات شيميايي",
  "45": "پيمانكاري صنعتي",
  "46": "تجارت عمده فروشي به جز وسايل نقليه موتور",
  "47": "خرده فروشي،باستثناي وسايل نقليه موتوري",
  "49": "كاشي و سراميك",
  "50": "تجارت عمده وخرده فروشي وسائط نقليه موتور",
  "51": "حمل و نقل هوايي",
  "52": "انبارداري و حمايت از فعاليتهاي حمل و نقل",
  "53": "سيمان، آهك و گچ",
  "54": "ساير محصولات كاني غيرفلزي",
  "55": "هتل و رستوران",
  "56": "سرمايه گذاريها",
  "57": "بانكها و موسسات اعتباري",
  "58": "ساير واسطه گريهاي مالي",
  "59": "اوراق حق تقدم استفاده از تسهيلات مسكن",
  "60": "حمل ونقل، انبارداري و ارتباطات",
  "61": "حمل و نقل آبي",
  "63": "فعاليت هاي پشتيباني و كمكي حمل و نقل",
  "64": "مخابرات",
  "65": "واسطه‌گري‌هاي مالي و پولي",
  "66": "بيمه وصندوق بازنشستگي به جزتامين اجتماعي",
  "67": "فعاليتهاي كمكي به نهادهاي مالي واسط",
  "68": "صندوق سرمايه گذاري قابل معامله",
  "69": "اوراق تامين مالي",
  "70": "انبوه سازي، املاك و مستغلات",
  "71": "فعاليت مهندسي، تجزيه، تحليل و آزمايش فني",
  "72": "رايانه و فعاليت‌هاي وابسته به آن",
  "73": "اطلاعات و ارتباطات",
  "74": "خدمات فني و مهندسي",
  "76": "اوراق بهادار مبتني بر دارايي فكري",
  "77": "فعالبت هاي اجاره و ليزينگ",
  "80": "تبليغات و بازار پژوهي",
  "82": "فعاليت پشتيباني اجرائي اداري وحمايت كسب",
  "84": "سلامت انسان و مددكاري اجتماعي",
  "90": "فعاليت هاي هنري، سرگرمي و خلاقانه",
  "93": "فعاليتهاي فرهنگي و ورزشي",
  "98": "گروه اوراق غيرفعال",
  "X1": "شاخص",
};

function sectorName(cs) {
  return SECTORS[String(cs)] || "";
}


/* لایه‌ی داده‌ی دیده‌بان بازار
 * ----------------------------------------
 * داده‌ها مستقیم از سرور خود TSETMC گرفته می‌شوند:
 *   MarketWatchInit.aspx  -> عکس کامل همه‌ی نمادها + سمت عرضه/تقاضا (۵ سطح)
 *   ClientTypeAll.aspx    -> تفکیک حقیقی/حقوقی (برای فیلترهای پول هوشمند)
 *
 * فرمت فید و همه‌ی محاسبات مشتق (pcc/pcp/plc/plp/pe) دقیقاً از موتور خود سایت
 * (MarketWatchPlus در صفحه‌ی دیده‌بان) برداشت شده است.
 *
 * ترتیب دریافت:
 *   ۱) پروکسی سفارشی شما (اگر در localStorage با کلید mwa.customProxy ثبت شده باشد)
 *   ۲) مستقیم: old / www / cdn .tsetmc.com  (اگر سرور هدر CORS بدهد)
 *   ۳) پروکسی‌های عمومی، به‌ترتیب
 * اولین روش سالم ذخیره می‌شود و دفعات بعد همان اول امتحان می‌شود.
 *
 * قالب پروکسی سفارشی: آدرسی که در آن {url} با آدرس کدگذاری‌شده‌ی هدف جایگزین می‌شود؛
 * یا یک پیشوند ساده که آدرس کامل به آن می‌چسبد. مثال:
 *   https://my-worker.workers.dev/?url={url}
 */

const TARGET_BASE = "https://old.tsetmc.com/tsev2/data/";
const STRATEGY_TIMEOUT = 12000;
const CUSTOM_LS_KEY = "mwa.customProxy";

function enc(s) {
  return encodeURIComponent(s);
}

function targetUrl(path) {
  return TARGET_BASE + path;
}

/* ساخت فهرست استراتژی‌ها؛ custom قالب پروکسی سفارشی است (اختیاری) */
function buildStrategies(custom) {
  const list = [];
  custom = String(custom || "").trim();
  if (custom) {
    list.push({
      id: "custom",
      label: "پروکسی سفارشی شما",
      url: (p) => (custom.indexOf("{url}") !== -1
        ? custom.replace("{url}", enc(targetUrl(p)))
        : custom + targetUrl(p)),
    });
  }
  const directs = [
    ["https://old.tsetmc.com/tsev2/data/", "مستقیم old.tsetmc.com"],
    ["https://www.tsetmc.com/tsev2/data/", "مستقیم www.tsetmc.com"],
    ["https://cdn.tsetmc.com/tsev2/data/", "مستقیم cdn.tsetmc.com"],
  ];
  for (const [base, label] of directs) {
    list.push({ id: "direct:" + base, label, url: (p) => base + p });
  }
  const proxies = [
    ["codetabs", "پروکسی codetabs", (u) => "https://api.codetabs.com/v1/proxy?quest=" + enc(u)],
    ["allorigins", "پروکسی allorigins", (u) => "https://api.allorigins.win/raw?url=" + enc(u)],
    ["corslol", "پروکسی cors.lol", (u) => "https://api.cors.lol/?url=" + enc(u)],
    ["corseu", "پروکسی cors.eu.org", (u) => "https://cors.eu.org/" + u],
    ["corsfix", "پروکسی corsfix", (u) => "https://proxy.corsfix.com/" + u],
  ];
  for (const [id, label, wrap] of proxies) {
    list.push({ id, label, url: (p) => wrap(targetUrl(p)) });
  }
  return list;
}

function fetchWithTimeout(url, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(url, { cache: "no-store" })
      .then((r) => {
        clearTimeout(t);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(resolve, (e) => { clearTimeout(t); reject(e); });
  });
}

/* ------------------------------------------------------------
 * پارسر MarketWatchInit/Plus — برداشت مستقیم از موتور سایت
 * پاسخ با @ به بخش‌ها تقسیم می‌شود:
 *   [0] پیام‌ها  [1] fastview  [2] ردیف نمادها  [3] سمت عرضه/تقاضا
 * ردیف نماد کامل = ۲۶ ستون؛ ردیف به‌روزرسانی (Plus) = ۱۰ ستون
 * ------------------------------------------------------------ */
function advRound(x, d) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function applyInstrumentRows(store, text) {
  const all = String(text).split("@");
  const parts = { heven: 0 };
  if (all.length < 3) return parts;

  const instPrice = all[2].split(";");
  for (let i = 0; i < instPrice.length; i++) {
    const col = instPrice[i].split(",");
    if (col.length < 5) continue;
    const id = col[0];
    if (col.length === 10) {
      // ردیف به‌روزرسانی: inscode,heven,pf,pc,pl,tno,tvol,tval,pmin,pmax
      const old = store[id];
      if (!old) continue;
      const py = parseInt(old.py, 10);
      const eps = old.eps;
      const pl = col[4], pc = col[3];
      old.heven = col[1]; old.pf = col[2]; old.pc = pc;
      old.pcc = "" + (parseInt(pc, 10) - py);
      old.pcp = "" + advRound(100 * (parseInt(pc, 10) - py) / py, 2);
      old.pl = pl;
      old.plc = col[5] === "0" ? "0" : "" + (parseInt(pl, 10) - py);
      old.plp = col[5] === "0" ? "0" : "" + advRound(100 * (parseInt(pl, 10) - py) / py, 2);
      old.tno = col[5]; old.tvol = col[6]; old.tval = col[7];
      old.pmin = col[8]; old.pmax = col[9];
      old.pe = eps === "" ? "" : "" + advRound(parseInt(pl, 10) / parseInt(eps, 10), 2);
      if (parts.heven < parseInt(col[1], 10)) parts.heven = parseInt(col[1], 10);
    } else {
      // ردیف کامل (Init):
      // 0inscode 1iid 2l18 3l30 4heven 5pf 6pc 7pl 8tno 9tvol 10tval
      // 11pmin 12pmax 13py 14eps 15bvol 16visit 17flow 18cs 19tmax 20tmin
      // 21z 22yval 23predtran 24buyop 25cgrvalcot
      const py = col[13], pc = col[6], pl = col[7], tno = col[8], eps = col[14];
      const row = {
        inscode: col[0], iid: col[1], l18: col[2], l30: col[3],
        heven: col[4], pf: col[5], pc: pc,
        pcc: "" + (parseInt(pc, 10) - parseInt(py, 10)),
        pcp: "" + advRound(100 * (parseInt(pc, 10) - parseInt(py, 10)) / parseInt(py, 10), 2),
        pl: pl,
        plc: tno === "0" ? "0" : "" + (parseInt(pl, 10) - parseInt(py, 10)),
        plp: tno === "0" ? "0" : "" + advRound(100 * (parseInt(pl, 10) - parseInt(py, 10)) / parseInt(py, 10), 2),
        tno: tno, tvol: col[9], tval: col[10],
        pmin: col[11], pmax: col[12], py: py,
        eps: eps, pe: eps === "" ? "" : "" + advRound(parseInt(pc, 10) / parseInt(eps, 10), 2),
        bvol: col[15], flow: col[17], cs: col[18], tmax: col[19], tmin: col[20],
        z: col[21], yval: col[22], cgrvalcot: col[25],
        zo1: "", zd1: "", pd1: "", po1: "", qd1: "", qo1: "",
      };
      store[id] = row;
      if (parts.heven < parseInt(col[4], 10)) parts.heven = parseInt(col[4], 10);
    }
  }
  return parts;
}

function applyBestLimits(store, text, section) {
  const all = String(text).split("@");
  const sec = section === 1 ? 1 : 3; // Plus: بخش ۱ | Init: بخش ۳ (مثل موتور سایت)
  if (all.length <= sec) return;
  const rows = all[sec].split(";");
  for (let i = 0; i < rows.length; i++) {
    const col = rows[i].split(",");
    if (col.length < 8) continue;
    const row = store[col[0]];
    if (!row) continue;
    const n = col[1]; // سطح 1..5
    if (n === "1") {
      row.zo1 = col[2]; row.zd1 = col[3]; row.pd1 = col[4];
      row.po1 = col[5]; row.qd1 = col[6]; row.qo1 = col[7];
    }
  }
}

function parseClientType(text) {
  const out = {};
  const rows = String(text).split(";");
  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].split(",");
    if (cols.length < 9) continue;
    out[cols[0]] = {
      Buy_CountI: parseInt(cols[1], 10) || 0,
      Buy_CountN: parseInt(cols[2], 10) || 0,
      Buy_I_Volume: parseInt(cols[3], 10) || 0,
      Buy_N_Volume: parseInt(cols[4], 10) || 0,
      Sell_CountI: parseInt(cols[5], 10) || 0,
      Sell_CountN: parseInt(cols[6], 10) || 0,
      Sell_I_Volume: parseInt(cols[7], 10) || 0,
      Sell_N_Volume: parseInt(cols[8], 10) || 0,
    };
  }
  return out;
}

/* ------------------------------------------------------------
 * انتخاب استراتژی و دریافت
 * ------------------------------------------------------------ */
class MarketFeed {
  constructor(opts) {
    opts = opts || {};
    this.onStatus = opts.onStatus || function () {};
    this.preferred = opts.preferred || "";
    this.custom = opts.custom != null ? opts.custom : readCustomProxy();
    this.strategy = null;
    this.rows = {};
    this.ct = {};
    this.heven = 0;
  }

  async tryFetch(path, strategy) {
    const url = strategy.url(path); // همیشه آدرس کامل هدف ساخته می‌شود
    const text = await fetchWithTimeout(url, STRATEGY_TIMEOUT);
    if (!text || text.length < 10) throw new Error("empty");
    return text;
  }

  orderedStrategies() {
    const all = buildStrategies(this.custom);
    if (!this.preferred) return all;
    const i = all.findIndex((s) => s.id === this.preferred);
    if (i <= 0) return all;
    return [all[i]].concat(all.slice(0, i), all.slice(i + 1));
  }

  // پیدا کردن اولین استراتژی سالم (ترجیحی → سفارشی → مستقیم‌ها → پروکسی‌ها)
  async pickStrategy(path) {
    const ordered = this.orderedStrategies();
    const errors = [];
    for (const s of ordered) {
      this.onStatus({ type: "trying", strategy: s });
      try {
        const text = await this.tryFetch(path, s);
        this.strategy = s;
        this.onStatus({ type: "strategy", strategy: s, errors });
        return text;
      } catch (e) {
        errors.push({ strategy: s, error: String(e && e.message ? e.message : e) });
      }
    }
    const err = new Error("همه‌ی روش‌های دریافت شکست خوردند");
    err.details = errors;
    this.onStatus({ type: "error", errors });
    throw err;
  }

  // دریافت با استراتژی فعلی؛ اگر افتاد بود، دوباره جست‌وجو
  async fetchFeed(path) {
    // در هر بارگذاری صفحه یک‌بار، مستقیم‌ها را اول امتحان کن:
    // اگر افزونه‌ی «دیتای مستقیم TSETMC» (پوشه‌ی cors-extension) نصب باشد، همین‌جا وصل می‌شود.
    if (!this._directProbed) {
      this._directProbed = true;
      const directs = buildStrategies(this.custom).filter((s) => s.id.indexOf("direct:") === 0);
      for (const s of directs) {
        this.onStatus({ type: "trying", strategy: s });
        try {
          const text = await this.tryFetch(path, s);
          this.strategy = s;
          this.onStatus({ type: "strategy", strategy: s, errors: [] });
          return text;
        } catch (e) { /* مستقیم ممکن نشد — سراغ بقیه‌ی روش‌ها می‌رویم */ }
      }
    }
    if (this.strategy) {
      try {
        return await this.tryFetch(path, this.strategy);
      } catch (e) {
        try { console.warn("[MWA] feed failed via '" + this.strategy.id + "':", e && e.message ? e.message : e); } catch (e2) {}
        this.strategy = null;
      }
    }
    return this.pickStrategy(path);
  }

  async loadMarket() {
    // دقیقاً مثل موتور خود سایت: بار اول Init با h=0&r=0؛ بعدش Plus با هِوِنِ ذخیره‌شده
    // (سرور بدون این پارامترها جواب درست نمی‌دهد)
    const isPlus = this.heven > 0;
    const path = isPlus
      ? "MarketWatchPlus.aspx?h=" + (5 * Math.floor(this.heven / 5)) + "&r=0"
      : "MarketWatchInit.aspx?h=0&r=0";
    const text = await this.fetchFeed(path);
    const parts = applyInstrumentRows(this.rows, text);
    if (parts.heven > this.heven) this.heven = parts.heven;
    applyBestLimits(this.rows, text, isPlus ? 1 : 3);
    return this.rows;
  }

  async loadClientType() {
    const text = await this.fetchFeed("ClientTypeAll.aspx");
    this.ct = parseClientType(text);
    return this.ct;
  }
}

function readCustomProxy() {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(CUSTOM_LS_KEY) || "";
  } catch (e) {}
  return "";
}


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

const SPECIALS = [
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

const BASICS = [
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

const ALL_FILTERS = SPECIALS.concat(BASICS);

function filterById(id) {
  return ALL_FILTERS.find((f) => f.id === id) || null;
}

/* اعمال همه‌ی فیلترهای فعال روی مجموعه‌ی ردیف‌ها */
function applyFilters(rows, state, ct) {
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


var __g = (typeof window !== 'undefined') ? window : globalThis;
__g.__mwaCore = { MarketFeed: MarketFeed, applyInstrumentRows: applyInstrumentRows, applyBestLimits: applyBestLimits, parseClientType: parseClientType, buildStrategies: buildStrategies, applyFilters: applyFilters, filterById: filterById, SPECIALS: SPECIALS, BASICS: BASICS, SECTORS: SECTORS, sectorName: sectorName };

/* UI تزریقی «دیده‌بان بازار» — اجرا در صفحه‌ی خود tsetmc
 * ------------------------------------------------------------
 * چون این کد داخل صفحه‌ی tsetmc اجرا می‌شود، دریافت داده با آدرس نسبی
 * /tsev2/data/... «هم‌مبدأ» است → هیچ CORS و هیچ پروکسی‌ای در کار نیست.
 * وابستگی‌ها (در همان باندل، بالای همین فایل):
 *   MarketFeed, applyFilters, SPECIALS, BASICS, sectorName
 */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  window.__mwaVer = "1.2.2";
  if (window.__mwaInjected) {
    var r = document.getElementById("mwaRoot");
    if (r) r.style.display = r.style.display === "none" ? "flex" : "none";
    return;
  }
  if (location.hostname.indexOf("tsetmc.com") === -1) {
    alert("این اسکریپت فقط روی صفحه‌های tsetmc.com کار می‌کند");
    return;
  }
  window.__mwaInjected = 1;

  var LS = "mwa.inj.v1";
  var state = {
    enabled: {}, params: {},
    sortKey: "tval", sortDir: -1, interval: 30, drawer: true, basicsOpen: false,
  };
  try {
    var raw = localStorage.getItem(LS);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function withCommas(v) {
    var n = parseInt(v, 10);
    if (!isFinite(n)) return String(v == null ? "" : v);
    return n.toLocaleString("en-US");
  }
  function compact(v) {
    var n = parseFloat(v);
    if (!isFinite(n)) return "-";
    var a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + " هم‌میلارد";
    if (a >= 1e9) return (n / 1e9).toFixed(1) + " میلیارد";
    if (a >= 1e6) return (n / 1e6).toFixed(1) + " میلیون";
    if (a >= 1e3) return (n / 1e3).toFixed(0) + " هزار";
    return String(n);
  }
  function num2(v, d) { var x = parseFloat(v); return isFinite(x) ? x : d; }
  function pct(v) { var x = num2(v, 0); return (x > 0 ? "+" : "") + x.toFixed(2); }
  function cls(v) { var x = num2(v, 0); return x > 0 ? "pos" : x < 0 ? "neg" : ""; }
  function debounce(fn, ms) { var t = null; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  /* ---------- استایل ---------- */
  var CSS = [
    "#mwaRoot{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;direction:rtl;",
    "background:#0b0f17;color:#e8eaed;font-family:Vazirmatn,Vazir,'Segoe UI',Tahoma,sans-serif;font-size:13px}",
    "#mwaRoot *{box-sizing:border-box;margin:0;padding:0}",
    "#mwaTop{display:flex;align-items:center;gap:8px;padding:8px 12px;flex-wrap:wrap;",
    "background:linear-gradient(120deg,#0e7490,#4f46e5);color:#fff;box-shadow:0 2px 12px rgba(0,0,0,.35)}",
    "#mwaRoot .brand{font-weight:800;font-size:14px;white-space:nowrap}",
    "#mwaRoot .grow{flex:1}",
    "#mwaRoot .chip{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);color:#fff;",
    "border-radius:99px;padding:4px 12px;font-family:inherit;font-size:12px;cursor:pointer;appearance:none}",
    "#mwaRoot .chip:hover{background:rgba(255,255,255,.24)}",
    "#mwaRoot .chip.ok{background:rgba(34,197,94,.3)}",
    "#mwaRoot .chip.bad{background:rgba(239,68,68,.4)}",
    "#mwaMain{flex:1;display:flex;min-height:0}",
    "#mwaDrawer{width:308px;flex:0 0 auto;background:#111826;border-inline-start:1px solid rgba(255,255,255,.09);",
    "display:flex;flex-direction:column;min-height:0}",
    "#mwaDrawer.closed{display:none}",
    "#mwaRoot .dhead{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;",
    "border-bottom:1px solid rgba(255,255,255,.09);font-size:13px}",
    "#mwaRoot .dfoot{padding:10px 14px;border-top:1px solid rgba(255,255,255,.09)}",
    "#mwaFList{overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}",
    "#mwaRoot .sec{font-size:11px;font-weight:800;color:#60a5fa;display:flex;align-items:center;gap:6px;margin-top:4px}",
    "#mwaRoot .sec .ln{flex:1;height:1px;background:rgba(255,255,255,.1)}",
    "#mwaRoot .fcard{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 11px}",
    "#mwaRoot .fcard.on{border-color:rgba(96,165,250,.55);background:rgba(59,130,246,.12)}",
    "#mwaRoot .row1{display:flex;align-items:center;gap:8px}",
    "#mwaRoot .fname{flex:1;font-weight:700;font-size:12.5px;cursor:pointer}",
    "#mwaRoot .fdesc{font-size:11px;color:#94a3b8;line-height:1.8;margin-top:4px}",
    "#mwaRoot .fparams{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}",
    "#mwaRoot .fp{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.1);",
    "border-radius:8px;padding:3px 8px}",
    "#mwaRoot .fp label{font-size:10px;color:#94a3b8;white-space:nowrap}",
    "#mwaRoot .fp input,#mwaRoot .finp{background:transparent;border:0;outline:0;color:#e8eaed;font-family:inherit;",
    "font-size:11.5px;direction:ltr;text-align:center}",
    "#mwaRoot .fp input{width:70px}",
    "#mwaRoot .frow{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.035);border:1px solid transparent;",
    "border-radius:10px;padding:6px 9px}",
    "#mwaRoot .frow.on{border-color:rgba(52,211,153,.4);background:rgba(52,211,153,.1)}",
    "#mwaRoot .frow .finp{width:86px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.12);border-radius:7px;padding:3px 6px}",
    "#mwaRoot .sw{position:relative;display:inline-block;width:34px;height:19px;flex:0 0 auto;cursor:pointer}",
    "#mwaRoot .sw input{opacity:0;width:0;height:0;position:absolute}",
    "#mwaRoot .sw i{position:absolute;inset:0;background:rgba(128,128,128,.45);border-radius:99px;transition:.18s}",
    "#mwaRoot .sw i:before{content:'';position:absolute;width:15px;height:15px;right:2px;top:2px;background:#fff;border-radius:50%;transition:.18s}",
    "#mwaRoot .sw input:checked + i{background:linear-gradient(120deg,#22c55e,#16a34a)}",
    "#mwaRoot .sw input:checked + i:before{transform:translateX(-15px)}",
    "#mwaRoot .btn{border:0;border-radius:10px;padding:8px 14px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;",
    "background:rgba(239,68,68,.16);color:#f87171;border:1px solid rgba(239,68,68,.4)}",
    "#mwaRoot .basicsT{cursor:pointer;color:#60a5fa;font-size:11px;font-weight:800;padding:2px 0}",
    "#mwaTblWrap{flex:1;overflow:auto;position:relative}",
    "#mwaRoot table{border-collapse:collapse;width:100%;min-width:980px}",
    "#mwaRoot thead th{position:sticky;top:0;background:#111826;color:#94a3b8;font-size:11.5px;font-weight:700;",
    "padding:8px 10px;text-align:right;cursor:pointer;user-select:none;white-space:nowrap;",
    "border-bottom:1px solid rgba(255,255,255,.09);z-index:2}",
    "#mwaRoot thead th.sorted{color:#60a5fa}",
    "#mwaRoot tbody td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.07);white-space:nowrap;font-size:12.5px;",
    "direction:ltr;text-align:right;font-variant-numeric:tabular-nums}",
    "#mwaRoot td.sym{direction:rtl;font-weight:700}",
    "#mwaRoot td.name,#mwaRoot td.seccol{direction:rtl}",
    "#mwaRoot tbody tr:hover{background:rgba(96,165,250,.1)}",
    "#mwaRoot td.pos{color:#4ade80}#mwaRoot td.neg{color:#f87171}",
    "#mwaRoot a.sym-l{color:#60a5fa;text-decoration:none}",
    "#mwaEmpty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:14px}",
    "@media (max-width:900px){#mwaRoot .hm{display:none}#mwaDrawer{position:fixed;inset-inline-start:0;top:0;bottom:0;z-index:5}}",
  ].join("");

  /* ---------- منبع داده (هم‌مبدأ) ---------- */
  var feed = new MarketFeed({
    onStatus: function (ev) {
      if (ev.type === "trying") setStatus("امتحان: " + ev.strategy.label + "…", "");
      else if (ev.type === "strategy") setStatus("متصل: " + ev.strategy.label, "ok");
      else if (ev.type === "error") setStatus("خطا در دریافت", "bad");
    },
  });
  // در صفحه‌ی خود tsetmc: مسیر نسبی هم‌مبدأ بهترین و سریع‌ترین راه است
  feed._directProbed = true; // نیازی به امتحان مستقیم‌های مطلق نیست
  feed.strategy = { id: "same-origin", label: "هم‌مبدأ (بدون پروکسی)", url: function (p) { return "/tsev2/data/" + p; } };

  function ctNeeded() {
    for (var i = 0; i < SPECIALS.length; i++) if (SPECIALS[i].needsCT && state.enabled[SPECIALS[i].id]) return true;
    return false;
  }

  var timer = null;
  async function refresh() {
    setStatus("در حال دریافت…", "");
    try {
      await feed.loadMarket();
      if (ctNeeded()) { try { await feed.loadClientType(); } catch (e) {} }
      setStatus("متصل: هم‌مبدأ (بدون پروکسی)", "ok");
      render();
    } catch (e) {
      setStatus("خطا در دریافت", "bad");
      emptyEl.textContent = "دریافت داده نشد؛ دکمه‌ی ↻ را بزنید. (" + e + ")";
    }
  }
  function restartTimer() {
    if (timer) clearInterval(timer);
    if (state.interval > 0) timer = setInterval(refresh, state.interval * 1000);
  }

  /* ---------- جدول ---------- */
  var COLS = {
    l18: { txt: function (r) { return r.l18; }, num: function (r) { return r.l18; }, html: function (r) { return '<a class="sym-l" target="_blank" href="/Loader.aspx?ParTree=151311&i=' + esc(r.inscode) + '">' + esc(r.l18) + "</a>"; } },
    l30: { txt: function (r) { return r.l30; }, num: function (r) { return r.l30; } },
    cs: { txt: function (r) { return sectorName(r.cs); }, num: function (r) { return r.cs; } },
    pl: { txt: function (r) { return withCommas(r.pl); }, num: function (r) { return num2(r.pl, 0); }, c: function (r) { return cls(r.plc); } },
    plp: { txt: function (r) { return pct(r.plp); }, num: function (r) { return num2(r.plp, 0); }, c: function (r) { return cls(r.plp); } },
    pc: { txt: function (r) { return withCommas(r.pc); }, num: function (r) { return num2(r.pc, 0); }, c: function (r) { return cls(r.pcc); } },
    pcp: { txt: function (r) { return pct(r.pcp); }, num: function (r) { return num2(r.pcp, 0); }, c: function (r) { return cls(r.pcp); } },
    tvol: { txt: function (r) { return compact(r.tvol); }, num: function (r) { return num2(r.tvol, 0); } },
    tval: { txt: function (r) { return compact(r.tval); }, num: function (r) { return num2(r.tval, 0); } },
    tno: { txt: function (r) { return withCommas(r.tno); }, num: function (r) { return num2(r.tno, 0); } },
    pe: { txt: function (r) { return r.pe === "" ? "-" : String(r.pe); }, num: function (r) { return num2(r.pe, 1e9); } },
    pd1: { txt: function (r) { return withCommas(r.pd1); }, num: function (r) { return num2(r.pd1, 0); } },
    po1: { txt: function (r) { return withCommas(r.po1); }, num: function (r) { return num2(r.po1, 0); } },
  };
  var HIDE = { l30: "hm", cs: "hm", tno: "hm", pe: "hm", pd1: "hm2", po1: "hm2" };

  var tbody, emptyEl, countEl, statusEl;

  function render() {
    var all = feed.rows || {};
    var list = applyFilters(all, state, feed.ct || {});
    var col = COLS[state.sortKey] || COLS.tval;
    var dir = state.sortDir || -1;
    list.sort(function (a, b) {
      var x = col.num(a), y = col.num(b);
      if (x === y) return 0;
      return (x < y ? -1 : 1) * dir;
    });
    var frag = document.createDocumentFragment();
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var tr = document.createElement("tr");
      for (var key in COLS) {
        if (!Object.prototype.hasOwnProperty.call(COLS, key)) continue;
        var td = document.createElement("td");
        var c = COLS[key];
        if (c.html) td.innerHTML = c.html(r);
        else td.textContent = c.txt(r);
        if (key === "l18") td.className = "sym";
        else if (key === "l30") td.className = "name " + (HIDE.l30 || "");
        else if (key === "cs") td.className = "seccol " + (HIDE.cs || "");
        else if (HIDE[key]) td.className = HIDE[key];
        if (c.c) td.classList.add(c.c(r));
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
    tbody.replaceChildren(frag);
    var total = 0;
    for (var k in all) if (Object.prototype.hasOwnProperty.call(all, k)) total++;
    countEl.textContent = "نمایش " + list.length.toLocaleString("fa-IR") + " از " + total.toLocaleString("fa-IR");
    emptyEl.style.display = list.length ? "none" : "flex";
    emptyEl.textContent = total === 0 ? "در حال دریافت…" : "هیچ نمادی با فیلترهای فعلی نمی‌ماند";
  }

  function setStatus(t, kind) {
    if (!statusEl) return;
    statusEl.textContent = "● " + t;
    statusEl.className = "chip status " + (kind || "");
  }

  /* ---------- کشوی فیلترها ---------- */
  function paramOf(f) { return Object.assign({}, f.def, state.params[f.id] || {}); }

  function switchEl(f) {
    var lab = h("label", "sw");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!state.enabled[f.id];
    cb.addEventListener("change", async function () {
      state.enabled[f.id] = cb.checked;
      save();
      if (cb.checked && f.needsCT && !Object.keys(feed.ct || {}).length) {
        try { await feed.loadClientType(); } catch (e) {}
      }
      render(); buildDrawer();
    });
    var i = document.createElement("i");
    lab.appendChild(cb); lab.appendChild(i);
    return lab;
  }

  function paramsEl(f) {
    var box = h("div", "fparams");
    (f.pmeta || []).forEach(function (m) {
      var p = h("div", "fp");
      var lab = h("label", null, m.label + ":");
      var inp = document.createElement("input");
      inp.type = m.text ? "text" : "number";
      inp.step = "any";
      var v = paramOf(f)[m.key];
      inp.value = v != null ? v : "";
      inp.addEventListener("input", debounce(function () {
        state.params[f.id] = Object.assign({}, state.params[f.id], {});
        state.params[f.id][m.key] = inp.value;
        save(); render();
      }, 400));
      p.appendChild(lab); p.appendChild(inp);
      box.appendChild(p);
    });
    return box;
  }

  function buildDrawer() {
    var list = document.getElementById("mwaFList");
    if (!list) return;
    list.replaceChildren();

    var s1 = h("div", "sec");
    s1.appendChild(h("span", null, "✨ فیلترهای ویژه"));
    s1.appendChild(h("span", "ln"));
    list.appendChild(s1);

    SPECIALS.forEach(function (f) {
      var card = h("div", "fcard" + (state.enabled[f.id] ? " on" : ""));
      var row1 = h("div", "row1");
      row1.appendChild(h("span", null, f.icon));
      var nm = h("span", "fname", f.label);
      nm.title = f.desc;
      row1.appendChild(nm);
      row1.appendChild(switchEl(f));
      card.appendChild(row1);
      var d = h("div", "fdesc", f.desc);
      card.appendChild(d);
      card.appendChild(paramsEl(f));
      list.appendChild(card);
    });

    var s2 = h("div", "sec");
    s2.appendChild(h("span", "ln"));
    var tog = h("span", "basicsT", (state.basicsOpen ? "▾" : "▸") + " فیلترهای پایه");
    s2.appendChild(tog);
    list.appendChild(s2);

    var basics = h("div");
    basics.style.display = state.basicsOpen ? "flex" : "none";
    basics.style.flexDirection = "column";
    basics.style.gap = "4px";
    tog.addEventListener("click", function () {
      state.basicsOpen = !state.basicsOpen; save(); buildDrawer();
    });

    BASICS.forEach(function (f) {
      var row = h("div", "frow" + (state.enabled[f.id] ? " on" : ""));
      row.appendChild(switchEl(f));
      var nm = h("span", "fname", f.label);
      nm.title = f.desc;
      nm.addEventListener("click", function () {
        state.enabled[f.id] = !state.enabled[f.id]; save(); render(); buildDrawer();
      });
      row.appendChild(nm);
      var meta = (f.pmeta || [])[0];
      if (meta) {
        var inp = document.createElement("input");
        inp.className = "finp";
        inp.type = meta.text ? "text" : "number";
        inp.step = "any";
        var v = paramOf(f)[meta.key];
        inp.value = v != null ? v : "";
        inp.addEventListener("input", debounce(function () {
          state.params[f.id] = {};
          state.params[f.id][meta.key] = inp.value;
          save(); render();
        }, 400));
        row.appendChild(inp);
      }
      basics.appendChild(row);
    });
    list.appendChild(basics);
  }

  /* ---------- ساخت اورلی ---------- */
  function build() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    var root = h("div");
    root.id = "mwaRoot";

    var top = h("div");
    top.id = "mwaTop";
    var brand = h("span", "brand", "📊 دیده‌بان بازار");
    var ver = h("span", "chip", "v1.2.2");
    ver.title = "نسخه‌ی باندل";
    var grow = h("span", "grow");
    countEl = h("span", "chip", "—");
    statusEl = h("span", "chip");
    var sel = document.createElement("select");
    sel.className = "chip";
    [[15, "۱۵ ثانیه"], [30, "۳۰ ثانیه"], [60, "۱ دقیقه"], [0, "خاموش"]].forEach(function (o) {
      var op = document.createElement("option");
      op.value = String(o[0]);
      op.textContent = o[1];
      sel.appendChild(op);
    });
    sel.value = String(state.interval);
    sel.addEventListener("change", function () {
      state.interval = parseInt(sel.value, 10);
      save(); restartTimer();
    });
    var bR = h("button", "chip", "↻");
    bR.title = "به‌روزرسانی";
    bR.addEventListener("click", refresh);
    var bF = h("button", "chip", "☰ فیلترها");
    bF.addEventListener("click", function () {
      state.drawer = !state.drawer; save();
      document.getElementById("mwaDrawer").classList.toggle("closed", !state.drawer);
    });
    var bX = h("button", "chip", "✕");
    bX.title = "بستن (برای باز شدن دوباره، همان کد را دوباره اجرا کنید)";
    bX.addEventListener("click", close);
    top.appendChild(brand); top.appendChild(ver); top.appendChild(grow); top.appendChild(countEl);
    top.appendChild(statusEl); top.appendChild(sel); top.appendChild(bR); top.appendChild(bF); top.appendChild(bX);

    var main = h("div");
    main.id = "mwaMain";

    var drawer = h("div");
    drawer.id = "mwaDrawer";
    drawer.classList.toggle("closed", !state.drawer);
    var dhead = h("div", "dhead");
    dhead.appendChild(h("b", null, "فیلترها"));
    var dclose = h("button", "chip", "✕");
    dclose.addEventListener("click", function () {
      state.drawer = false; save();
      drawer.classList.add("closed");
    });
    dhead.appendChild(dclose);
    var flist = h("div");
    flist.id = "mwaFList";
    var dfoot = h("div", "dfoot");
    var reset = h("button", "btn", "بازنشانی همه");
    reset.addEventListener("click", function () {
      state.enabled = {}; state.params = {}; save(); buildDrawer(); render();
    });
    dfoot.appendChild(reset);
    drawer.appendChild(dhead); drawer.appendChild(flist); drawer.appendChild(dfoot);

    var wrap = h("div");
    wrap.id = "mwaTblWrap";
    var tbl = document.createElement("table");
    var thead = document.createElement("thead");
    var trh = document.createElement("tr");
    var heads = [["l18", "نماد"], ["l30", "نام"], ["cs", "گروه"], ["pl", "آخرین"], ["plp", "٪آخرین"],
      ["pc", "پایانی"], ["pcp", "٪پایانی"], ["tvol", "حجم"], ["tval", "ارزش"], ["tno", "تعداد"],
      ["pe", "P/E"], ["pd1", "خرید"], ["po1", "فروش"]];
    heads.forEach(function (hd) {
      var th = document.createElement("th");
      th.dataset.k = hd[0];
      th.textContent = hd[1];
      if (HIDE[hd[0]]) th.classList.add(HIDE[hd[0]]);
      if (hd[0] === "l30" || hd[0] === "cs" || hd[0] === "tno" || hd[0] === "pe") {
        // کلاس hm در CSS با media کوچک مخفی می‌شود
      }
      th.addEventListener("click", function () {
        if (state.sortKey === hd[0]) state.sortDir = -state.sortDir;
        else { state.sortKey = hd[0]; state.sortDir = -1; }
        save(); markSorted(); render();
      });
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    tbody = document.createElement("tbody");
    tbl.appendChild(thead); tbl.appendChild(tbody);
    emptyEl = h("div", null, "در حال دریافت…");
    emptyEl.id = "mwaEmpty";
    wrap.appendChild(tbl); wrap.appendChild(emptyEl);

    main.appendChild(drawer); main.appendChild(wrap);
    root.appendChild(top); root.appendChild(main);
    document.body.appendChild(root);

    markSorted();
    buildDrawer();
  }

  function markSorted() {
    var ths = document.querySelectorAll("#mwaRoot thead th");
    for (var i = 0; i < ths.length; i++) {
      ths[i].classList.toggle("sorted", ths[i].dataset.k === state.sortKey);
    }
  }

  function close() {
    var r = document.getElementById("mwaRoot");
    if (r) r.remove();
    if (timer) clearInterval(timer);
    window.__mwaInjected = 0;
  }

  build();
  restartTimer();
  refresh();
})();

})();
