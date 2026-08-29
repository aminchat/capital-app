/* قالب‌بندی اعداد برای جدول بازار */

export function withCommas(v) {
  const n = parseInt(v, 10);
  if (!isFinite(n)) return String(v == null ? "" : v);
  return n.toLocaleString("en-US");
}

/* حجم/ارزش فشرده: 1.2B / 950M / 12K — برای ستون‌های حجم و ارزش */
export function compact(v) {
  const n = parseFloat(v);
  if (!isFinite(n)) return "-";
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + " هزار میلیارد";
  if (a >= 1e9) return (n / 1e9).toFixed(1) + " میلیارد";
  if (a >= 1e6) return (n / 1e6).toFixed(1) + " میلیون";
  if (a >= 1e3) return (n / 1e3).toFixed(0) + " هزار";
  return String(n);
}

export function num2(v, d) {
  const x = parseFloat(v);
  return isFinite(x) ? x : d;
}

export function pct(v) {
  const x = num2(v, 0);
  return (x > 0 ? "+" : "") + x.toFixed(2);
}

/* کلاس رنگ مثبت/منفی */
export function cls(v) {
  const x = num2(v, 0);
  return x > 0 ? "pos" : x < 0 ? "neg" : "";
}
