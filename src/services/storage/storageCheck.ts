import { StorageStatus } from './types';

export async function checkIndexedDBAvailability(): Promise<StorageStatus> {
  if (typeof indexedDB === 'undefined') {
    return StorageStatus.Unavailable;
  }

  const probeDbName = '__idb_probe__';

  try {
    const db = await openProbeDatabase(probeDbName);
    db.close();
    await deleteProbeDatabase(probeDbName);
    return StorageStatus.Available;
  } catch {
    return StorageStatus.Unavailable;
  }
}

function openProbeDatabase(name: string): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message ?? 'Failed to open probe database'));
  });
}

function deleteProbeDatabase(name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(request.error?.message ?? 'Failed to delete probe database'));
  });
}