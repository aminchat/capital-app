/* لایه‌ی داده‌ی دیده‌بان بازار
 * ----------------------------------------
 * داده‌ها مستقیم از سرور خود TSETMC گرفته می‌شوند:
 *   MarketWatchInit.aspx  -> عکس کامل همه‌ی نمادها + سمت عرضه/تقاضا (۵ سطح)
 *   ClientTypeAll.aspx    -> تفکیک حقیقی/حقوقی (برای فیلترهای پول هوشمند)
 *
 * فرمت فید و همه‌ی محاسبات مشتق (pcc/pcp/plc/plp/pe) دقیقاً از موتور خود سایت
 * (MarketWatchPlus در صفحه‌ی دیده‌بان) برداشت شده است؛ نه چیزی از خودمان.
 *
 * اگر مرورگر اجازه‌ی فراخوانی مستقیم (CORS) ندهد، به‌ترتیب چند استراتژی
 * جایگزین (پروکسی‌های CORS عمومی) امتحان می‌شوند و استراتژی سالم ذخیره می‌شود.
 */

const DIRECT_BASES = [
  "https://old.tsetmc.com/tsev2/data/",
  "https://www.tsetmc.com/tsev2/data/",
];

const PROXIES = [
  {
    id: "corsproxy",
    label: "پروکسی corsproxy.io",
    wrap: (url) => "https://corsproxy.io/?url=" + encodeURIComponent(url),
  },
  {
    id: "allorigins",
    label: "پروکسی allorigins",
    wrap: (url) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
  },
  {
    id: "codetabs",
    label: "پروکسی codetabs",
    wrap: (url) => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url),
  },
];

const STRATEGY_TIMEOUT = 15000;

export function allStrategies() {
  const list = [];
  for (const b of DIRECT_BASES) {
    list.push({ id: "direct:" + b, label: "مستقیم " + b.replace("https://", "").split("/")[0], wrap: (p) => b + p });
  }
  for (const p of PROXIES) {
    list.push({ id: p.id, label: p.label, wrap: (p.wrap) });
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

export function applyInstrumentRows(store, text) {
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

export function applyBestLimits(store, text) {
  const all = String(text).split("@");
  if (all.length < 4) return;
  const rows = all[3].split(";");
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

export function parseClientType(text) {
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
export class MarketFeed {
  constructor(opts) {
    this.onStatus = (opts && opts.onStatus) || function () {};
    this.preferred = (opts && opts.preferred) || "";
    this.strategy = null;
    this.rows = {};
    this.ct = {};
  }

  async tryFetch(path, strategy) {
    const url = strategy.wrap(path);
    const text = await fetchWithTimeout(url, STRATEGY_TIMEOUT);
    if (!text || text.length < 10) throw new Error("empty");
    return text;
  }

  // پیدا کردن اولین استراتژی سالم (ترجیحی → مستقیم‌ها → پروکسی‌ها)
  async pickStrategy(path) {
    const all = allStrategies();
    const ordered = [];
    if (this.preferred) {
      const p = all.find((s) => s.id === this.preferred);
      if (p) ordered.push(p);
    }
    for (const s of all) if (!ordered.includes(s)) ordered.push(s);
    const errors = [];
    for (const s of ordered) {
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

  async loadMarket() {
    const text = this.strategy
      ? await this.tryFetch("MarketWatchInit.aspx", this.strategy).catch(() => this.pickStrategy("MarketWatchInit.aspx"))
      : await this.pickStrategy("MarketWatchInit.aspx");
    applyInstrumentRows(this.rows, text);
    applyBestLimits(this.rows, text);
    return this.rows;
  }

  async loadClientType() {
    const text = this.strategy
      ? await this.tryFetch("ClientTypeAll.aspx", this.strategy).catch(() => this.pickStrategy("ClientTypeAll.aspx"))
      : await this.pickStrategy("ClientTypeAll.aspx");
    this.ct = parseClientType(text);
    return this.ct;
  }
}
