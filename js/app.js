/* اپ دیده‌بان بازار — منطق رابط کاربری
 * داده‌ها مستقیم از TSETMC؛ فیلترها روی نسخه‌ی محلی اعمال می‌شوند. */

import { MarketFeed } from "./data.js";
import { SPECIALS, BASICS, applyFilters, filterById } from "./filters.js";
import { sectorName } from "./sectors.js";
import { withCommas, compact, num2, pct, cls } from "./util.js";

const LS_KEY = "mwa.state.v1";
const state = {
  enabled: {},
  params: {},
  sortKey: "tval",
  sortDir: -1,
  theme: "dark",
  interval: 30,
  strategyId: "",
  drawer: window.innerWidth > 900,
};
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) Object.assign(state, JSON.parse(raw));
} catch (e) {}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
}

const $ = (s) => document.querySelector(s);
const tbody = $("#tbody");
const emptyEl = $("#empty");
const countEl = $("#count");
const statusEl = $("#status");
const bannerEl = $("#banner");

/* ---------------- وضعیت اتصال ---------------- */
function setStatus(text, kind) {
  statusEl.textContent = "● " + text;
  statusEl.className = "chip status " + (kind || "");
  statusEl.title = text;
}
function showBanner(html) {
  bannerEl.innerHTML = html;
  bannerEl.hidden = false;
}
function hideBanner() {
  bannerEl.hidden = true;
}
bannerEl.addEventListener("click", hideBanner);

/* ---------------- منبع داده ---------------- */
const feed = new MarketFeed({
  preferred: state.strategyId,
  onStatus(ev) {
    if (ev.type === "strategy") {
      state.strategyId = ev.strategy.id;
      save();
      setStatus("متصل: " + ev.strategy.label, "ok");
    } else if (ev.type === "error") {
      setStatus("خطا در دریافت", "bad");
      const lines = (ev.errors || []).map((e) => "• " + e.strategy.label + " → " + e.error).join("\n");
      showBanner(
        "دریافت داده از TSETMC نشد. راه‌های امتحان‌شده:\n" + lines +
        "\nاگر اینترنتقطع/فیلتر است، پروکسی‌ها را عوض کنید یا دکمه‌ی زیر را بزنید." +
        '<br><button class="btn" id="btnDemo" style="margin-top:8px">نمایش داده‌ی نمونه</button>'
      );
      $("#btnDemo").addEventListener("click", () => { loadDemo(); hideBanner(); });
    }
  },
});

let demoMode = false;
let lastRows = {};   // همه‌ی نمادها
let lastCT = {};     // حقیقی/حقوقی

function ctNeeded() {
  return SPECIALS.some((f) => f.needsCT && state.enabled[f.id]);
}

async function refresh(manual) {
  if (demoMode && !manual) return;
  try {
    setStatus("در حال دریافت…", "");
    lastRows = await feed.loadMarket();
    demoMode = false;
    if (ctNeeded()) {
      try { lastCT = await feed.loadClientType(); } catch (e) { lastCT = lastCT || {}; }
    }
    hideBanner();
    render();
  } catch (e) {
    /* بنر در onStatus نشان داده شد */
  }
}

/* ---------------- جدول ---------------- */
const COLS = {
  l18: { txt: (r) => r.l18, num: (r) => r.l18, html: (r) => '<a class="sym-l" target="_blank" href="https://old.tsetmc.com/Loader.aspx?ParTree=151311&i=' + r.inscode + '">' + esc(r.l18) + "</a>" },
  l30: { txt: (r) => r.l30, num: (r) => r.l30 },
  cs:  { txt: (r) => sectorName(r.cs), num: (r) => r.cs },
  pl:  { txt: (r) => withCommas(r.pl), num: (r) => num2(r.pl, 0), c: (r) => cls(r.plc) },
  plp: { txt: (r) => pct(r.plp), num: (r) => num2(r.plp, 0), c: (r) => cls(r.plp) },
  pc:  { txt: (r) => withCommas(r.pc), num: (r) => num2(r.pc, 0), c: (r) => cls(r.pcc) },
  pcp: { txt: (r) => pct(r.pcp), num: (r) => num2(r.pcp, 0), c: (r) => cls(r.pcp) },
  tvol: { txt: (r) => compact(r.tvol), num: (r) => num2(r.tvol, 0) },
  tval: { txt: (r) => compact(r.tval), num: (r) => num2(r.tval, 0) },
  tno: { txt: (r) => withCommas(r.tno), num: (r) => num2(r.tno, 0) },
  pe:  { txt: (r) => (r.pe === "" ? "-" : String(r.pe)), num: (r) => num2(r.pe, 1e9) },
  pd1: { txt: (r) => withCommas(r.pd1), num: (r) => num2(r.pd1, 0) },
  po1: { txt: (r) => withCommas(r.po1), num: (r) => num2(r.po1, 0) },
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render() {
  const all = lastRows || {};
  const list = demoMode ? all : applyFilters(all, state, feed.ct || lastCT);
  const col = COLS[state.sortKey] || COLS.tval;
  const dir = state.sortDir || -1;
  list.sort((a, b) => {
    const x = col.num(a), y = col.num(b);
    if (x === y) return 0;
    return (x < y ? -1 : 1) * dir;
  });

  const frag = document.createDocumentFragment();
  for (const r of list) {
    const tr = document.createElement("tr");
    for (const key of Object.keys(COLS)) {
      const td = document.createElement("td");
      const c = COLS[key];
      if (c.html) td.innerHTML = c.html(r);
      else td.textContent = c.txt(r);
      if (key === "l18") td.className = "sym";
      if (key === "l30") td.className = "name hide-sm";
      if (key === "cs") td.className = "sec-col hide-sm";
      if (key === "tno") td.className = "hide-sm";
      if (key === "pe") td.className = "hide-sm";
      if (key === "pd1" || key === "po1") td.className = "hide-md";
      if (c.c) td.classList.add(c.c(r));
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);

  const total = Object.keys(all).length;
  countEl.textContent = "نمایش " + list.length.toLocaleString("fa-IR") + " از " + total.toLocaleString("fa-IR");
  emptyEl.hidden = list.length > 0;
  emptyEl.textContent = total === 0 ? "در حال دریافت داده‌ها از TSETMC…" : "هیچ نمادی با فیلترهای فعلی نمی‌ماند";
}

/* مرتب‌سازی با کلیک روی سرستون */
document.querySelectorAll("thead th").forEach((th) => {
  th.addEventListener("click", () => {
    const k = th.dataset.k;
    if (state.sortKey === k) state.sortDir = -state.sortDir;
    else { state.sortKey = k; state.sortDir = -1; }
    save();
    markSorted();
    render();
  });
});
function markSorted() {
  document.querySelectorAll("thead th").forEach((th) => {
    th.classList.toggle("sorted", th.dataset.k === state.sortKey);
  });
}

/* ---------------- پنل فیلترها ---------------- */
function paramOf(f) {
  return Object.assign({}, f.def, state.params[f.id] || {});
}
function debounce(fn, ms) {
  let t = null;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function switchEl(f) {
  const lab = document.createElement("label");
  lab.className = "sw";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!state.enabled[f.id];
  cb.addEventListener("change", async () => {
    state.enabled[f.id] = cb.checked;
    save();
    if (cb.checked && f.needsCT && !Object.keys(feed.ct || {}).length) {
      setStatus("دریافت حقیقی/حقوقی…", "");
      try { lastCT = await feed.loadClientType(); } catch (e) {}
    }
    render();
    buildDrawer();
  });
  const i = document.createElement("i");
  lab.append(cb, i);
  return lab;
}

function paramsEl(f) {
  const box = document.createElement("div");
  box.className = "fparams";
  for (const m of f.pmeta || []) {
    const p = document.createElement("div");
    p.className = "fp";
    const lab = document.createElement("label");
    lab.textContent = m.label + ":";
    const inp = document.createElement("input");
    inp.type = m.text ? "text" : "number";
    inp.step = "any";
    inp.value = paramOf(f)[m.key] != null ? paramOf(f)[m.key] : "";
    inp.addEventListener("input", debounce(() => {
      state.params[f.id] = Object.assign({}, state.params[f.id], { [m.key]: inp.value });
      save();
      render();
    }, 400));
    p.append(lab, inp);
    box.appendChild(p);
  }
  return box;
}

function buildDrawer() {
  const list = $("#filterList");
  list.replaceChildren();

  const sec1 = document.createElement("div");
  sec1.className = "sec";
  sec1.innerHTML = "<span>✨ فیلترهای ویژه</span><span class='ln'></span>";
  list.appendChild(sec1);

  for (const f of SPECIALS) {
    const card = document.createElement("div");
    card.className = "fcard" + (state.enabled[f.id] ? " on" : "");
    const row1 = document.createElement("div");
    row1.className = "row1";
    const ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = f.icon;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = f.label;
    name.title = f.desc;
    row1.append(ic, name, switchEl(f));
    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = f.desc;
    card.append(row1, desc, paramsEl(f));
    list.appendChild(card);
  }

  const sec2 = document.createElement("div");
  sec2.className = "sec";
  sec2.innerHTML = "<span class='ln'></span>";
  const tog = document.createElement("span");
  tog.id = "basicsToggle";
  tog.textContent = (state.basicsOpen ? "▾" : "▸") + " فیلترهای پایه";
  sec2.appendChild(tog);
  list.appendChild(sec2);

  const basics = document.createElement("div");
  basics.style.display = state.basicsOpen ? "flex" : "none";
  basics.style.flexDirection = "column";
  basics.style.gap = "4px";
  tog.addEventListener("click", () => {
    state.basicsOpen = !state.basicsOpen;
    save();
    buildDrawer();
  });
  for (const f of BASICS) {
    const row = document.createElement("div");
    row.className = "frow" + (state.enabled[f.id] ? " on" : "");
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = f.label;
    name.title = f.desc;
    name.addEventListener("click", () => {
      state.enabled[f.id] = !state.enabled[f.id];
      save(); render(); buildDrawer();
    });
    row.append(switchEl(f), name);
    const meta = (f.pmeta || [])[0];
    if (meta && !meta.text) {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.step = "any";
      inp.value = paramOf(f).x != null ? paramOf(f).x : "";
      inp.addEventListener("input", debounce(() => {
        state.params[f.id] = { x: inp.value };
        save(); render();
      }, 400));
      row.appendChild(inp);
    } else if (meta && meta.text) {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = paramOf(f)[meta.key] || "";
      inp.addEventListener("input", debounce(() => {
        state.params[f.id] = { [meta.key]: inp.value };
        save(); render();
      }, 400));
      row.appendChild(inp);
    }
    basics.appendChild(row);
  }
  list.appendChild(basics);
}

$("#btnResetFilters").addEventListener("click", () => {
  state.enabled = {};
  state.params = {};
  save();
  buildDrawer();
  render();
});

/* ---------------- کشو، تم، تازه‌سازی ---------------- */
const drawer = $("#drawer");
function applyDrawer() {
  drawer.classList.toggle("closed", !state.drawer);
}
$("#btnFilters").addEventListener("click", () => { state.drawer = !state.drawer; save(); applyDrawer(); });
$("#btnCloseDrawer").addEventListener("click", () => { state.drawer = false; save(); applyDrawer(); });

const btnTheme = $("#btnTheme");
function applyTheme() {
  document.body.dataset.theme = state.theme;
  btnTheme.textContent = state.theme === "dark" ? "☀️" : "🌙";
}
btnTheme.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save();
  applyTheme();
});

$("#btnRefresh").addEventListener("click", () => refresh(true));

const intervalSel = $("#interval");
intervalSel.value = String(state.interval);
let timer = null;
function restartTimer() {
  if (timer) clearInterval(timer);
  const s = parseInt(intervalSel.value, 10);
  state.interval = s;
  save();
  if (s > 0) timer = setInterval(() => refresh(false), s * 1000);
}
intervalSel.addEventListener("change", restartTimer);

/* ---------------- داده‌ی نمونه (وقتی هیچ راهی کار نکرد) ---------------- */
function loadDemo() {
  demoMode = true;
  lastRows = demoRows();
  setStatus("حالت نمایشی (داده‌ی واقعی نیست)", "bad");
  render();
}
function demoRows() {
  const mk = (id, l18, l30, cs, pl, plp, pc, pcp, tvol, tval, tno, pe, bvol, qd1, qo1, yval, flow, eps) => ({
    inscode: id, l18, l30, cs, pl, plc: String(Math.round(pl * plp / 100)), plp: String(plp),
    pc, pcc: String(Math.round(pc * pcp / 100)), pcp: String(pcp),
    tvol: String(tvol), tval: String(tval), tno: String(tno), pe: String(pe), py: String(Math.round(pl / (1 + plp / 100))),
    eps: String(eps), bvol: String(bvol), qd1: String(qd1), qo1: String(qo1), zd1: "900", zo1: "800",
    pd1: String(Math.round(pl * 0.999)), po1: String(Math.round(pl * 1.001)),
    yval: String(yval), flow: String(flow), heven: "120000", pf: pl, pmin: String(Math.round(pl * 0.99)), pmax: String(Math.round(pl * 1.01)),
  });
  const rows = {};
  const spec = [
    ["101", "FBIC1", "فولاد مبارکه", "27", 28500, 3.26, 28500, 3.26, 95e6, 2.7e12, 45000, 8.91, 80e6, 3e6, 1.5e6, 300, 1, 3200],
    ["102", "SHABD", "سیمان سپهر", "27", 14500, -1.2, 14500, -1.2, 1.2e6, 1.74e10, 800, 12.1, 1e6, 5e6, 1e6, 300, 1, 1200],
    ["103", "XIRAN", "بانک ملی فرابورس", "57", 6200, 5.5, 6200, 5.5, 3e7, 1.86e11, 30000, 41.3, 9e6, 8e6, 2e6, 300, 3, 150],
    ["104", "CHEAP", "پتروشیمی ارزان", "23", 5000, 0.8, 5000, 0.8, 2e8, 1e12, 20000, 4.2, 1e8, 2e6, 3e6, 300, 1, 1190],
    ["105", "HIGPE", "پیش‌فروش گران", "72", 55000, 0.3, 55000, 0.3, 1.5e5, 8.25e9, 150, 55, 1.2e5, 1e5, 9e5, 300, 1, 1000],
    ["106", "FABRD", "پتروشیمی فارابی", "23", 41000, -3.1, 41000, -3.1, 1.5e8, 6.15e12, 60000, 9.1, 6e7, 1e6, 4e6, 300, 1, 4500],
    ["107", "تسه01", "تسهیلات مسکن یک", "59", 15000, 0.66, 15000, 0.66, 5e7, 7.5e11, 5000, "", 2e7, 1e6, 2e6, 214, 1, 0],
    ["108", "IRFUND", "صندوق درآمد ثابت", "68", 4200, 0.2, 4200, 0.2, 9e5, 3.78e9, 900, "", 8e5, 5e5, 6e5, 305, 1, 0],
    ["109", "ATIRF", "آتی فلزات", "64", 250000, 8.1, 250000, 8.1, 1.2e7, 3e12, 12000, "", 4e6, 9e6, 1e6, 263, 1, 0],
    ["110", "HATQ1", "حق تقدم فولاد", "27", 3200, 2.1, 3200, 2.1, 7e5, 2.24e9, 700, "", 6e5, 8e5, 5e5, 400, 1, 0],
    ["111", "ZAJEO", "انرژی خورشیدی", "40", 8900, 0, 8900, 0, 3e5, 2.67e9, 300, 15, 2.5e5, 2e5, 3e5, 300, 6, 593],
    ["112", "NOTRA", "بدون معامله", "27", 12000, 0, 12000, 0, 0, 0, 0, 6, 5e6, 0, 0, 300, 1, 2000],
  ];
  for (const s of spec) rows[s[0]] = mk(...s);
  // حقیقی/حقوقی نمونه: فقط برای FBIC1 «خریدار حقیقی سنگین»
  feed.ct = {
    "101": { Buy_CountI: 2000, Buy_CountN: 50, Buy_I_Volume: 4e7, Buy_N_Volume: 5e6, Sell_CountI: 8000, Sell_CountN: 30, Sell_I_Volume: 1e7, Sell_N_Volume: 8e6 },
    "102": { Buy_CountI: 60000, Buy_CountN: 10, Buy_I_Volume: 3e7, Buy_N_Volume: 2e6, Sell_CountI: 20000, Sell_CountN: 5, Sell_I_Volume: 5e7, Sell_N_Volume: 1e6 },
    "104": { Buy_CountI: 40000, Buy_CountN: 40, Buy_I_Volume: 8e7, Buy_N_Volume: 3e7, Sell_CountI: 45000, Sell_CountN: 20, Sell_I_Volume: 8.5e7, Sell_N_Volume: 4e6 },
  };
  return rows;
}

/* ---------------- service worker ---------------- */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ---------------- شروع ---------------- */
applyTheme();
applyDrawer();
markSorted();
buildDrawer();
render();
restartTimer();
refresh(false);
