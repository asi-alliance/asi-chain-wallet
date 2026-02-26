export {
  StoreName,
  TransactionMode,
  StorageStatus,
  StorageError,
} from './types';

export type {
  StorageAdapter,
  StoredAccountRecord,
  SettingsRecord,
  SessionRecord,
  GeneralRecord,
} from './types';

export { IndexedDBAdapter } from './IndexedDBAdapter';
export { checkIndexedDBAvailability } from './storageCheck';
export { StorageProvider } from './StorageProvider';