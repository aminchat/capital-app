/* تست‌های اپ دیده‌بان بازار (بدون DOM):
 *  ۱) پارسر فید MarketWatchInit/Plus — دقیقاً مطابق موتور سایت
 *  ۲) فیلترها (ویژه + پایه) — همان سناریوهای نسخه‌ی قدیمی
 *  ۳) قالب‌بندی اعداد
 */
import { applyInstrumentRows, applyBestLimits, parseClientType, MarketFeed } from "../js/data.js";
import { SPECIALS, BASICS, applyFilters, filterById } from "../js/filters.js";
import { withCommas, compact, pct, cls } from "../js/util.js";
import { sectorName } from "../js/sectors.js";
import assert from "node:assert";

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name + (extra ? "  [" + extra + "]" : "")); }
}

/* ---------- ساخت فید نمونه با فرمت واقعی (۲۶ ستون) ---------- */
function initRow(a) {
  // 0inscode 1iid 2l18 3l30 4heven 5pf 6pc 7pl 8tno 9tvol 10tval 11pmin 12pmax 13py 14eps 15bvol 16visit 17flow 18cs 19tmax 20tmin 21z 22yval 23predtran 24buyop 25cgrvalcot
  return a.join(",");
}
const feedText = [
  "MSG", // all[0]
  "",   // all[1] fastview
  [
    initRow(["101", "601", "FBIC1", "فولاد مبارکه", "120000", "27800", "28500", "28500", "45000", "95000000", "2700000000000", "27500", "28600", "27600", "3200", "80000000", "5000", "1", "27", "30000", "27000", "10", "300", "0", "0", ""]),
    initRow(["102", "602", "SHABD", "سیمان سپهر", "120000", "14600", "14500", "14500", "800", "1200000", "17400000000", "14400", "14700", "146750", "1200", "1000000", "10", "1", "27", "15000", "14000", "8", "300", "0", "0", ""]),
    initRow(["103", "603", "IRFUND", "صندوق درآمد", "120000", "4190", "4200", "4200", "900", "900000", "3780000000", "4190", "4210", "4191", "", "800000", "2", "1", "68", "4300", "4100", "5", "305", "0", "0", ""]),
  ].join(";"), // all[2]
  [
    "101,1,800,2000,28400,28500,3000000,1500000",
    "102,1,500,3000,14400,14500,5000000,1000000",
    "103,1,120,400,4195,4205,600000,700000",
  ].join(";"), // all[3] عرضه/تقاضا
].join("@");

console.log("\n=== ۱) پارسر فید (فرمت واقعی موتور سایت) ===");
const rows = {};
const parts = applyInstrumentRows(rows, feedText);
applyBestLimits(rows, feedText);
check("۳ نماد خوانده شد", Object.keys(rows).length === 3, String(Object.keys(rows).length));
const f = rows["101"];
check("l18/l30 درست", f.l18 === "FBIC1" && f.l30 === "فولاد مبارکه");
check("pcc مشتق درست (28500-27600=900)", f.pcc === "900", f.pcc);
check("pcp مشتق درست (3.26)", f.pcp === "3.26", f.pcp);
check("plp مشتق درست (3.26)", f.plp === "3.26", f.plp);
check("pe از pc/eps (28500/3200=8.91)", f.pe === "8.91", f.pe);
check("bvol/flow/cs/yval ست شدند", f.bvol === "80000000" && f.flow === "1" && f.cs === "27" && f.yval === "300");
check("عرضه/تقاضای سطح ۱ ست شد (qd1=3000000, po1=28500)", f.qd1 === "3000000" && f.po1 === "28500", f.qd1 + "," + f.po1);
check("بدون eps → pe خالی (صندوق)", rows["103"].pe === "");
check("heven بیشینه برگشت (120000)", parts.heven === 120000, String(parts.heven));

console.log("\n=== ۲) ردیف به‌روزرسانی Plus (۱۰ ستون) ===");
const plusText = [
  "MSG", "",
  "101,120500,27900,28600,28600,46000,96000000,2750000000000,27600,28700",
  "",
].join("@");
applyInstrumentRows(rows, plusText);
check("pl/pc/tno/حجم به‌روز شد", f.pl === "28600" && f.pc === "28600" && f.tno === "46000" && f.tvol === "96000000", f.pl + "," + f.tvol);
check("plp با py قبلی محاسبه شد (28600/27600)", f.plp === "3.62", f.plp);
check("heven جلو رفت", f.heven === "120500");

console.log("\n=== ۳) پارسر حقیقی/حقوقی ===");
const ct = parseClientType("101,2000,50,40000000,5000000,8000,30,10000000,8000000;102,60000,10,30000000,2000000,20000,5,50000000,1000000");
check("۲ نماد حقیقی/حقوقی", Object.keys(ct).length === 2);
check("فیلدها درست", ct["101"].Buy_I_Volume === 40000000 && ct["101"].Sell_N_Volume === 8000000);

/* ---------- فیلترها ---------- */
const R = (o) => Object.assign({
  inscode: "1", l18: "X", l30: "ن", cs: "27", flow: "1", yval: "300",
  pl: "1000", plc: "0", plp: "0", pc: "1000", pcc: "0", pcp: "0",
  tno: "100", tvol: "1000000", tval: "1000000000", pe: "10", eps: "100",
  py: "1000", bvol: "500000", qd1: "0", qo1: "0", pd1: "0", po1: "0",
}, o);

console.log("\n=== ۴) فیلترهای ویژه ===");
const CT_S = { Buy_CountI: 2000, Buy_CountN: 50, Buy_I_Volume: 400000, Buy_N_Volume: 50000, Sell_CountI: 8000, Sell_CountN: 30, Sell_I_Volume: 100000, Sell_N_Volume: 80000 };
const smart = filterById("smartBuy");
check("پول هوشمند: سناریوی خریدار سنگین رد می‌شود", smart.test(R({ tvol: "900000" }), { k: 2, x: 25 }, CT_S) === true);
check("پول هوشمند: خالص منفی رد می‌شود", smart.test(R({ tvol: "900000" }), { k: 2, x: 25 }, { ...CT_S, Buy_I_Volume: 90000 }) === false);
check("پول هوشمند: بدون داده‌ی ct رد می‌شود", smart.test(R(), { k: 2, x: 25 }, null) === false);
const legal = filterById("legalIn");
check("ورود حقوقی: خالص ۱۲٪ حجم ≥ ۱۰٪ رد می‌شود", legal.test(R({ tvol: "1000000" }), { x: 10 }, { Buy_N_Volume: 500000, Sell_N_Volume: 380000 }) === true);
check("ورود حقوقی: خالص ۵٪ رد نمی‌شود", legal.test(R({ tvol: "1000000" }), { x: 10 }, { Buy_N_Volume: 500000, Sell_N_Volume: 450000 }) === false);
check("جا مانده: P/E کم و تخت و نقدشونده", filterById("laggard").test(R({ pe: "5", pcp: "0.5", tvol: "600000", bvol: "500000" }), { pe: 6, x: 1.5 }) === true);
check("جا مانده: P/E بالا رد", filterById("laggard").test(R({ pe: "20" }), { pe: 6, x: 1.5 }) === false);
check("تجمع: ۳× مبنا و ۱٪", filterById("quietAcc").test(R({ tvol: "1600000", bvol: "500000", pcp: "1" }), { k: 3, x: 2 }) === true);
check("تجمع: منفی رد", filterById("quietAcc").test(R({ tvol: "1600000", bvol: "500000", pcp: "-0.5" }), { k: 3, x: 2 }) === false);
check("فشار سرصفحه: qd1=2×qo1 و مثبت", filterById("bidHeavy").test(R({ qd1: "200000", qo1: "90000", pcp: "1.2" }), { k: 2 }) === true);
check("فشار سرصفحه: منفی رد", filterById("bidHeavy").test(R({ qd1: "200000", qo1: "90000", pcp: "-1" }), { k: 2 }) === false);
check("توزیع: ۳× مبنا و -۲.۵٪", filterById("distress").test(R({ tvol: "1600000", bvol: "500000", pcp: "-2.5" }), { k: 3, x: -2 }) === true);

console.log("\n=== ۵) فیلترهای پایه ===");
check("noTrade", filterById("noTrade").test(R({ tno: "0" })) === false && filterById("noTrade").test(R({ tno: "5" })) === true);
check("noDeriv: yval=305 رد", filterById("noDeriv").test(R({ yval: "305" })) === false);
check("noDeriv: yval=300 می‌ماند", filterById("noDeriv").test(R({ yval: "300" })) === true);
check("noHousing: تسه رد", filterById("noHousing").test(R({ l18: "تسه01" })) === false);
check("noEnergy: flow=6 رد", filterById("noEnergy").test(R({ flow: "6" })) === false);
check("maxPE: pe خالی می‌ماند", filterById("maxPE").test(R({ pe: "" }), { x: 15 }) === true);
check("maxPE: pe=20 رد", filterById("maxPE").test(R({ pe: "20" }), { x: 15 }) === false);
check("minVolRatio", filterById("minVolRatio").test(R({ tvol: "1200000", bvol: "500000" }), { x: 2 }) === true);
check("search", filterById("search").test(R({ l18: "fbic1" }), { kw: "FBI" }) === true);
check("blacklist", filterById("blacklist").test(R({ l18: "SHAB" }), { list: "shab, aaa" }) === false);

console.log("\n=== ۶) ترکیب فیلترها ===");
const all1 = applyFilters(
  { a: R({ inscode: "a", l18: "FBIC1", tvol: "900000" }), b: R({ inscode: "b", l18: "SHAB" }) },
  { enabled: { smartBuy: true, search: true }, params: { search: { kw: "FB" } } },
  { a: CT_S }
);
check("smartBuy + search فقط a ماند", all1.length === 1 && all1[0].l18 === "FBIC1", JSON.stringify(all1.map((r) => r.l18)));
const all2 = applyFilters({ a: R({ inscode: "a" }) }, { enabled: {}, params: {} }, null);
check("بدون فیلتر فعال همه می‌مانند", all2.length === 1);
check("۱۸ فیلتر تعریف شده", SPECIALS.length === 6 && BASICS.length === 12, String(SPECIALS.length + "/" + BASICS.length));

console.log("\n=== ۷) قالب‌بندی و گروه‌ها ===");
check("withCommas", withCommas("28500") === "28,500");
check("compact میلیون", compact("95000000") === "95.0 میلیون", compact("95000000"));
check("compact میلیارد", compact("2700000000000") === "2.70 هزار میلیارد", compact("2700000000000"));
check("pct با علامت", pct("3.26") === "+3.26" && pct("-1.2") === "-1.20");
check("cls رنگ", cls("1.5") === "pos" && cls("-2") === "neg" && cls("0") === "");
check("sectorName(27)=فلزات اساسي", sectorName("27") === "فلزات اساسي", sectorName("27"));
check("۶۹ گروه", Object.keys((await import("../js/sectors.js")).SECTORS).length === 69);

console.log("\n================== نتیجه: " + passed + " موفق / " + failed + " ناموفق ==================");
process.exit(failed > 0 ? 1 : 0);
