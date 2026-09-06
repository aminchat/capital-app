import { kb } from './kb.js';
import { CATS, triageRoute, rankCases, triggeredFlags } from './engine.js';

const app = document.getElementById('app');
const state = {
  triage: {},
  caseFor: '',
  caseAnswers: new Set(),
  diffFor: '',
  diffAnswers: new Set(),
};

/* ---------------- tiny DOM helpers ---------------- */
function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function faDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso + 'T00:00:00'));
  } catch {
    return iso;
  }
}

/* ---------------- chrome ---------------- */
function topbar(title, back = true) {
  return h(
    `<header class="topbar">
      ${back ? '<a class="back" href="#" aria-label="بازگشت" onclick="history.back()">→</a>' : ''}
      <h1>${esc(title)}</h1>
    </header>`
  );
}
function kbPill() {
  const off = !navigator.onLine;
  return `<span class="pill ${off ? 'offline' : 'online'}">${off ? 'آفلاین — داده‌های محلی' : 'آنلاین'} · نسخه KB: ${kb.version}</span>`;
}
function badge115() {
  return `<a class="btn btn-115" href="tel:115">📞 تماس با ۱۱۵</a>`;
}
function disclaimer() {
  return `<p class="muted small">این اپ یک ابزار «دستیار تصمیم‌گیری» برای امدادگر آموزش‌دیده است و جایگزین تشخیص پزشکی نیست. هر شک → ۱۱۵.</p>`;
}

/* ---------------- screens ---------------- */
async function home() {
  app.append(topbar('امدادگر — کمک‌های اولیه', false));
  const body = h(
    `<div class="body">
      ${kbPill()}
      <a class="btn btn-primary big" href="#/triage">🚨 مصدوم دارم — شروع تریاژ</a>
      <h2 class="sec">مشاهده کیس‌ها</h2>
      <div class="grid">
        ${CATS.map(
          (c) => `<a class="card cat" href="#/cat/${c.id}"><span class="ic">${c.icon}</span><span>${esc(c.title)}</span></a>`
        ).join('')}
      </div>
      <div class="card" style="align-items:flex-start">
        <div>
          ${disclaimer()}
          <p class="muted small" style="margin:8px 0 0">پس از نصب اولیه، اپ کاملاً آفلاین کار می‌کند. داده هنگام آنلاین بودن به‌صورت خودکار به‌روز می‌شود.</p>
          <div class="foot" style="border:none;padding-top:8px;margin:8px 0 0">
            <span>داده: ${faDate(kb.updatedAt)} · آخرین همگام‌سازی: ${kb.lastSync ? new Date(kb.lastSync).toLocaleDateString('fa-IR') : '—'}</span>
            <a href="#/kb">بررسی آپدیت</a>
          </div>
        </div>
      </div>
    </div>`
  );
  app.append(body);
}

const TRIAGE_QS = [
  {
    id: 'conscious',
    text: 'مصدوم هوشیار است؟\n(به صدا یا تکان دادن شانه واکنش نشان می‌دهد؟)',
    yes: 'بله، واکنش دارد',
    no: 'هیچ واکنشی ندارد',
  },
  {
    id: 'breathing',
    showIf: (a) => a.conscious === 'n',
    text: 'آیا مصدوم عادی نفس می‌کشد؟\n(۵ تا ۱۰ ثانیه سینه را نگاه کنید. «گاسپ/تنفس کشنده» نفس محسوب نمی‌شود.)',
    yes: 'تنفس عادی دارد',
    no: 'نفس نمی‌کشد / گاسپ',
  },
  {
    id: 'bleeding',
    showIf: (a) => a.conscious === 'y',
    text: 'آیا خونریزی شدید و فعال دارد؟\n(فواره‌ای، یا دستمال که را سریع خیس می‌کند)',
    yes: 'بله، خونریزی شدید',
    no: 'خیر',
  },
];

function triage() {
  const next = TRIAGE_QS.find(
    (q) => state.triage[q.id] === undefined && (!q.showIf || q.showIf(state.triage))
  );
  app.append(topbar('تریاژ سریع'));
  if (!next) {
    const r = triageRoute(state.triage);
    if (r) {
      location.hash = '#/case/' + r;
    } else {
      state.triage = {};
      location.hash = '#/';
    }
    return;
  }
  const body = h(
    `<div class="body center">
      <div class="q-text">${esc(next.text).replace(/\n/g, '<br>')}</div>
      <div class="ans">
        <button class="btn" id="a-yes">${esc(next.yes)}</button>
        <button class="btn ans-n" id="a-no">${esc(next.no)}</button>
      </div>
      <button class="link" id="skip">رد کردن — می‌دانم چه اتفاقی افتاده</button>
    </div>`
  );
  app.append(body);
  const answer = (v) => {
    state.triage[next.id] = v;
    render();
  };
  body.querySelector('#a-yes').onclick = () => answer('y');
  body.querySelector('#a-no').onclick = () => answer('n');
  body.querySelector('#skip').onclick = () => {
    state.triage = {};
    location.hash = '#/';
  };
}

function catPage(id) {
  const cat = kb.categories[id] || CATS.find((c) => c.id === id);
  if (!cat) return notFound();
  app.append(topbar(cat.title));
  const items = Object.values(kb.cases)
    .filter((c) => c.category === id)
    .sort((a, b) => a.title.localeCompare(b.title, 'fa'));
  const body = h(
    `<div class="body">
      ${badge115()}
      ${items
        .map(
          (c) => `<a class="card case" href="#/case/${c.id}">
            <span class="ic">${c.icon}</span>
            <div><b>${esc(c.title)}</b><p class="muted small">${esc(c.summary)}</p></div>
          </a>`
        )
        .join('')}
      <a class="card" href="#/diff/${id}">
        <span class="ic">🤔</span>
        <div><b>علت را نمی‌دانم</b><p class="muted small">چک‌لیست علائم را پاسخ بده تا محتمل‌ترین کیس پیدا شود</p></div>
      </a>
    </div>`
  );
  app.append(body);
}

function notFound() {
  app.append(topbar('یافت نشد'));
  app.append(h('<div class="body"><p class="muted">این صفحه پیدا نشد. ممکن است در آپدیت حذف شده باشد.</p><a class="btn" href="#/">بازگشت به خانه</a></div>'));
}

function casePage(id) {
  const c = kb.cases[id];
  if (!c) return notFound();
  app.append(topbar(c.title));
  if (c.riskQuestions?.length && state.caseFor !== id) {
    state.caseFor = id;
    state.caseAnswers = new Set();
    renderChecklist(c);
    return;
  }
  renderCaseResult(c);
}

function renderChecklist(c) {
  const items = c.riskQuestions.map((qid) => kb.symptoms[qid]).filter(Boolean);
  const body = h(
    `<div class="body">
      <p class="muted">سؤالات سریع — فقط چیزی که در مصدوم می‌بینید را انتخاب کنید. می‌توانید رد کنید.</p>
      <div class="chips">
        ${items.map((s) => `<button class="chip" data-sym="${s.id}">${esc(s.label)}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="show">نمایش دستورالعمل</button>
      <button class="link" id="skip">رد کردن سؤالات</button>
    </div>`
  );
  app.append(body);
  body.querySelectorAll('.chip').forEach((ch) => {
    ch.onclick = () => {
      const s = ch.dataset.sym;
      if (state.caseAnswers.has(s)) {
        state.caseAnswers.delete(s);
        ch.classList.remove('on');
      } else {
        state.caseAnswers.add(s);
        ch.classList.add('on');
      }
    };
  });
  body.querySelector('#show').onclick = () => renderCaseResult(c);
  body.querySelector('#skip').onclick = () => renderCaseResult(c);
}

function renderCaseResult(c) {
  const { flags, call, callText } = triggeredFlags(c, state.caseAnswers);
  if (call) {
    app.append(
      h(`<div class="banner-115"><a href="tel:115">📞 ۱۱۵ را زنگ بزنید${callText ? ' — ' + esc(callText) : ''}</a></div>`)
    );
  }
  const related = (c.related || [])
    .map((r) => `<a class="link" href="#/case/${r.case}">↳ ${esc(r.text)}</a>`)
    .join(' ');
  const body = h(
    `<div class="body">
      ${call ? '' : badge115()}
      ${flags.length ? `<div class="box-danger"><b>⚠️ هشدار</b><ul>${flags.map((f) => `<li>${esc(f.text)}</li>`).join('')}</ul></div>` : ''}
      ${c.tip ? `<div class="box-info"><b>💡</b> ${esc(c.tip)}</div>` : ''}
      <div class="steps-wrap"><ol class="steps">${c.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ol></div>
      ${c.prohibitions?.length ? `<div class="box-danger"><b>❌ ممنوع</b><ul>${c.prohibitions.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
      ${c.nationalNote ? `<div class="box-warn"><b>🇮🇷 پروتکل ملی:</b> ${esc(c.nationalNote)}</div>` : ''}
      ${related ? `<p style="margin:14px 0 0">${related}</p>` : ''}
      <p class="src">منابع: ${c.sources.map(esc).join(' · ')}${c.crossRefs?.length ? '<br>چک‌کراس: ' + c.crossRefs.map(esc).join(' · ') : ''}<br>نسخه ${c.version} — ${faDate(c.updatedAt)}</p>
      <button class="link" id="re-ask">دوباره پاسخ‌دهی به سؤالات</button>
    </div>`
  );
  app.append(body);
  body.querySelector('#re-ask')?.addEventListener('click', () => {
    state.caseFor = '';
    render();
  });
}

function diffPage(id) {
  const cat = kb.categories[id];
  if (!cat) return notFound();
  app.append(topbar('علت نامشخص — ' + cat.title));
  if (state.diffFor !== id) {
    state.diffFor = id;
    state.diffAnswers = new Set();
  }
  const items = (cat.diffSymptoms || []).map((s) => kb.symptoms[s]).filter(Boolean);
  const body = h(
    `<div class="body">
      <p class="muted">همه علائمی که در مصدوم <b>می‌بینید</b> را انتخاب کنید:</p>
      <div class="chips">
        ${items.map((s) => `<button class="chip" data-sym="${s.id}">${esc(s.label)}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="calc">پیدا کردن محتمل‌ترین کیس</button>
      <div id="result"></div>
    </div>`
  );
  app.append(body);
  body.querySelectorAll('.chip').forEach((ch) => {
    ch.onclick = () => {
      const s = ch.dataset.sym;
      if (state.diffAnswers.has(s)) {
        state.diffAnswers.delete(s);
        ch.classList.remove('on');
      } else {
        state.diffAnswers.add(s);
        ch.classList.add('on');
      }
    };
  });
  body.querySelector('#calc').onclick = () => {
    const ranked = rankCases(id, state.diffAnswers, kb.cases).filter((r) => r.score > 0).slice(0, 2);
    const box = body.querySelector('#result');
    if (!ranked.length) {
      box.innerHTML = `<div class="box-warn">تطبیق قوی با پایگاه دانش وجود ندارد. اقدامات عمومی (امنیت صحنه، ABC) را انجام دهید و با <a href="tel:115"><b>۱۱۵</b></a> در تماس باشید تا اپراتور پزشکی راهنمایی کند.</div>`;
      return;
    }
    box.innerHTML =
      ranked
        .map(
          (r, i) => `<div class="card" style="display:block;margin-top:14px">
          <b>${i === 0 ? '۱) ' : '۲) '}${esc(r.c.title)}</b> <span class="tag">امتیاز ${r.score}</span>
          <div class="steps-wrap"><ol class="steps">${r.c.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ol></div>
          ${r.c.prohibitions?.length ? `<div class="box-danger"><b>ممنوع:</b><ul>${r.c.prohibitions.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
          <a class="btn" href="#/case/${r.c.id}">مشاهده کامل کیس</a>
        </div>`
        )
        .join('') + `<div class="box-warn">اگر وضعیت مصدوم بدتر شد یا مطمئن نیستید → <a href="tel:115"><b>۱۱۵</b></a>.</div>`;
  };
}

function kbPage() {
  app.append(topbar('پایگاه دانش'));
  const body = h(
    `<div class="body">
      <div class="card" style="display:block">
        <p style="margin:6px 0"><b>نسخه داده:</b> ${kb.version}</p>
        <p style="margin:6px 0"><b>آخرین به‌روزرسانی داده:</b> ${faDate(kb.updatedAt)}</p>
        <p style="margin:6px 0"><b>آخرین همگام‌سازی این دستگاه:</b> ${kb.lastSync ? new Date(kb.lastSync).toLocaleString('fa-IR') : '—'}</p>
        <p style="margin:6px 0"><b>تعداد کیس‌ها:</b> ${Object.keys(kb.cases).length}</p>
      </div>
      <button class="btn btn-primary" id="sync">بررسی آپدیت داده</button>
      <div id="sync-out" class="muted"></div>
      <p class="muted small">آپدیت داده مستقل از اپ است؛ نیازی به نصب مجدد اپ نیست. اگر آنلاین باشید، همین حالا فقط موارد تغییریافته (نه کل دیتابیس) دانلود می‌شود.</p>
    </div>`
  );
  app.append(body);
  body.querySelector('#sync').onclick = async () => {
    const out = body.querySelector('#sync-out');
    out.textContent = 'در حال بررسی…';
    try {
      const changed = await kb.sync();
      out.textContent = changed.length
        ? `✅ ${changed.length} مورد به‌روز شد`
        : '✅ داده به‌روز است';
      render();
    } catch {
      out.textContent = '❌ اینترنت در دسترس نیست — هنگام آنلاین شدن دوباره بررسی کنید.';
    }
  };
}

/* ---------------- router ---------------- */
const ROUTES = [
  ['/', home],
  ['/triage', triage],
  ['/cat/:id', catPage],
  ['/case/:id', casePage],
  ['/diff/:id', diffPage],
  ['/kb', kbPage],
];

function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  for (const [pat, fn] of ROUTES) {
    const parts = pat.split('/').filter(Boolean);
    const rest = hash.split('/').filter(Boolean);
    if (parts.length !== rest.length) continue;
    let ok = true;
    const args = [];
    parts.forEach((p, i) => {
      if (p.startsWith(':')) args.push(decodeURIComponent(rest[i]));
      else if (p !== rest[i]) ok = false;
    });
    if (ok) return { fn, args };
  }
  return { fn: home, args: [] };
}

function render() {
  const { fn, args } = parseRoute();
  window.scrollTo(0, 0);
  app.innerHTML = '';
  fn(...args);
}
window.addEventListener('hashchange', render);

/* ---------------- init ---------------- */
(async function init() {
  try {
    await kb.load();
  } catch {
    app.innerHTML = `<div class="body center">
      <h1>نصب اولیه به اینترنت نیاز دارد</h1>
      <p class="muted">در اولین اجرا، پایگاه دانش دانلود می‌شود. پس از آن اپ کاملاً آفلاین کار می‌کند.</p>
      <button class="btn btn-primary" style="max-width:280px;margin:18px auto" onclick="location.reload()">تلاش دوباره</button>
    </div>`;
    return;
  }
  render();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
