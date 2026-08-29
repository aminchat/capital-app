/* سرویس‌ورکر مینیمال: پوسته‌ی اپ کش می‌شود؛ داده‌های بازار هرگز کش نمی‌شوند. */
const CACHE = "mwa-v1";
const SHELL = ["./", "index.html", "css/app.css", "js/app.js", "js/data.js", "js/filters.js", "js/sectors.js", "js/util.js", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // داده‌ی بازار و پروکسی‌ها: فقط شبکه
  if (url.pathname.indexOf("tsev2/data") !== -1 || url.hostname !== location.hostname) return;
  // فایل‌های اپ: اول کش
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => hit))
  );
});
