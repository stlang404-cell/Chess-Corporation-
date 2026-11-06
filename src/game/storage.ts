/**
 * Persistent local saves. IndexedDB with a rotating backup slot and a checksum;
 * falls back to localStorage if IndexedDB is unavailable. Every write stores the
 * whole save in ONE transaction (main + previous-as-backup), so settlement is atomic.
 */
import { migrate, type SaveData } from './state';

const DB = 'seven-corporate-chess';
const STORE = 'saves';

function checksum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Envelope {
  json: string;
  sum: number;
  at: number;
}

const wrap = (save: SaveData): Envelope => {
  const json = JSON.stringify(save);
  return { json, sum: checksum(json), at: Date.now() };
};
const unwrap = (e: Envelope | undefined | null): SaveData | null => {
  if (!e || typeof e.json !== 'string' || checksum(e.json) !== e.sum) return null;
  try {
    return migrate(JSON.parse(e.json));
  } catch {
    return null;
  }
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let dbp: Promise<IDBDatabase | null> | null = null;
const db = () => (dbp ??= openDb());

export async function loadSave(): Promise<{ save: SaveData | null; recovered: boolean }> {
  const d = await db();
  if (d) {
    const [main, backup] = await new Promise<[Envelope | undefined, Envelope | undefined]>((resolve) => {
      const tx = d.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const a = st.get('main');
      const b = st.get('backup');
      tx.oncomplete = () => resolve([a.result, b.result]);
      tx.onerror = () => resolve([undefined, undefined]);
    });
    const m = unwrap(main);
    if (m) return { save: m, recovered: false };
    const b = unwrap(backup);
    if (b) return { save: b, recovered: true };
  }
  try {
    const ls = localStorage.getItem('seven-save');
    if (ls) {
      const s = unwrap(JSON.parse(ls));
      if (s) return { save: s, recovered: !d };
    }
  } catch {
    /* ignore */
  }
  return { save: null, recovered: false };
}

export async function writeSave(save: SaveData): Promise<void> {
  const env = wrap(save);
  const d = await db();
  if (d) {
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const cur = st.get('main');
      cur.onsuccess = () => {
        if (cur.result) st.put(cur.result, 'backup');
        st.put(env, 'main');
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  try {
    localStorage.setItem('seven-save', JSON.stringify(env));
  } catch {
    /* quota or unavailable: IndexedDB copy is authoritative */
  }
}

export function exportSave(save: SaveData): string {
  return JSON.stringify(wrap(save));
}
export function importSave(text: string): SaveData | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.json === 'string') return unwrap(parsed);
    return migrate(parsed);
  } catch {
    return null;
  }
}

export async function wipeSave(): Promise<void> {
  const d = await db();
  if (d)
    await new Promise<void>((resolve) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  try {
    localStorage.removeItem('seven-save');
  } catch {
    /* ignore */
  }
}
