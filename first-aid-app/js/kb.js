/* Knowledge base layer: IndexedDB persistence + manifest diffing.
 *
 * Data lives in kb/*.json, published as static files. On every load:
 *   1. read the local copy from IndexedDB (instant, offline)
 *   2. fetch kb/manifest.json (SW does network-first with cache fallback)
 *   3. diff case versions/hashes, download only what changed
 *   4. verify SHA-256 before accepting; on any mismatch keep last good copy
 */
const DB_NAME = 'first-aid-kb';
const DB_VER = 1;

let _dbp = null;

function db() {
  if (!_dbp) {
    _dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('cases')) d.createObjectStore('cases', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return _dbp;
}

function reqp(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbGet(store, key) {
  const d = await db();
  return reqp(d.transaction(store).objectStore(store).get(key));
}

async function idbAll(store) {
  const d = await db();
  return reqp(d.transaction(store).objectStore(store).getAll());
}

async function idbPut(store, val) {
  const d = await db();
  await reqp(d.transaction(store, 'readwrite').objectStore(store).put(val));
}

async function sha256hex(buf) {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const kb = {
  version: 0,
  updatedAt: null,
  lastSync: null,
  symptoms: {},
  categories: {},
  cases: {},

  /** Load local KB; on very first run (empty IDB) fetch everything. */
  async load() {
    const rows = await idbAll('cases');
    const real = rows.filter((r) => r.id !== '__symptoms' && r.id !== '__categories');
    if (real.length) {
      this._hydrate(rows);
      const meta = await idbGet('meta', 'kb');
      if (meta) {
        this.version = meta.version;
        this.updatedAt = meta.updatedAt;
        this.lastSync = meta.lastSync;
      }
      return;
    }
    await this.sync();
  },

  /** Diff against the published manifest; download only changed entries.
   *  Returns the list of changed entry ids. Throws when offline with an empty KB. */
  async sync() {
    const res = await fetch('kb/manifest.json');
    if (!res.ok) throw new Error('manifest-unavailable');
    const man = await res.json();

    const specials = { __symptoms: 'kb/symptoms.json', __categories: 'kb/categories.json' };
    const changed = [];

    for (const [id, url] of Object.entries(specials)) {
      const entry = man.entries?.[id];
      if (!entry) continue;
      const local = await idbGet('cases', id);
      if (!local || local.version !== entry.version || local.hash !== entry.hash) {
        const data = await this._fetchVerified(entry);
        await idbPut('cases', { id, version: entry.version, hash: entry.hash, data });
        changed.push(id);
      }
    }

    for (const [id, entry] of Object.entries(man.cases || {})) {
      const local = await idbGet('cases', id);
      if (!local || local.version !== entry.version || local.hash !== entry.hash) {
        const data = await this._fetchVerified(entry);
        await idbPut('cases', { id, version: entry.version, hash: entry.hash, data });
        changed.push(id);
      }
    }

    // drop cases removed from the manifest (never the specials)
    const ids = Object.keys(man.cases || {});
    for (const row of await idbAll('cases')) {
      if (row.id.startsWith('__')) continue;
      if (!ids.includes(row.id)) {
        const d = await db();
        await reqp(d.transaction('cases', 'readwrite').objectStore('cases').delete(row.id));
        changed.push('-' + row.id);
      }
    }

    this._hydrate(await idbAll('cases'));
    this.version = man.kbVersion;
    this.updatedAt = man.updatedAt;
    this.lastSync = new Date().toISOString();
    await idbPut('meta', {
      key: 'kb',
      version: man.kbVersion,
      updatedAt: man.updatedAt,
      lastSync: this.lastSync,
      lastChanged: changed,
    });
    return changed;
  },

  async _fetchVerified(entry) {
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error('fetch-failed:' + entry.url);
    const buf = await res.arrayBuffer();
    const h = await sha256hex(buf);
    if (h !== entry.hash) throw new Error('hash-mismatch:' + entry.id);
    return JSON.parse(new TextDecoder('utf-8').decode(buf));
  },

  _hydrate(rows) {
    this.cases = {};
    for (const r of rows) {
      if (r.id === '__symptoms') this.symptoms = r.data;
      else if (r.id === '__categories') this.categories = r.data;
      else this.cases[r.id] = r.data;
    }
  },
};
