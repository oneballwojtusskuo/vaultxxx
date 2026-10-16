// Saves the in-progress "sell" form (including selected files) in the browser,
// so a creator who leaves to connect Stripe comes back to a filled-in form.
const DB = "vlnd-sell-draft";
const STORE = "draft";
const KEY = "current";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const saveSellDraft = (draft: Record<string, unknown>) =>
  run("readwrite", (s) => s.put({ ...draft, savedAt: Date.now() }, KEY)).catch(() => undefined);

export const loadSellDraft = async (): Promise<Record<string, any> | null> => {
  try {
    const d: any = await run("readonly", (s) => s.get(KEY));
    if (!d || Date.now() - d.savedAt > 24 * 60 * 60 * 1000) return null;
    return d;
  } catch {
    return null;
  }
};

export const clearSellDraft = () => run("readwrite", (s) => s.delete(KEY)).catch(() => undefined);
