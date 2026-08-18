import type { ScreeningSyncQueueItem } from '@medscreen/types';

const DB_NAME = 'medscreen-sync';
const STORE_NAME = 'queue';
const DB_VERSION = 1;
const LAST_SYNC_KEY = 'medscreen_last_successful_sync_at';

function isBrowser(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

export async function listSyncQueueItems(): Promise<ScreeningSyncQueueItem[]> {
  if (!isBrowser()) return [];
  return withStore('readonly', (store) => store.getAll());
}

export async function getSyncQueueItem(id: string): Promise<ScreeningSyncQueueItem | null> {
  if (!isBrowser()) return null;
  const item = await withStore<ScreeningSyncQueueItem | undefined>('readonly', (store) => store.get(id));
  return item ?? null;
}

export async function upsertSyncQueueItem(item: ScreeningSyncQueueItem): Promise<void> {
  if (!isBrowser()) return;
  await withStore('readwrite', (store) => store.put(item));
}

export async function deleteSyncQueueItem(id: string): Promise<void> {
  if (!isBrowser()) return;
  await withStore('readwrite', (store) => store.delete(id));
}

export function getLastSuccessfulSyncAt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSuccessfulSyncAt(isoDate: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, isoDate);
}

export async function findQueuedItemByScreeningId(
  screeningId: string,
): Promise<ScreeningSyncQueueItem | null> {
  const items = await listSyncQueueItems();
  return items.find((item) => item.screening_id === screeningId) ?? null;
}
