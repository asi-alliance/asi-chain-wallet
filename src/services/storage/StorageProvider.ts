import { StorageAdapter, StorageStatus } from './types';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { checkIndexedDBAvailability } from './storageCheck';

const STORAGE_NOT_SUPPORTED_MESSAGE = 'storage is not supported';

export class StorageProvider {
  private static adapter: StorageAdapter | null = null;
  private static status: StorageStatus = StorageStatus.Pending;
  private static initPromise: Promise<void> | null = null;

  static async init(): Promise<StorageStatus> {
    if (this.initPromise) {
      await this.initPromise;
      return this.status;
    }

    this.initPromise = this.performInit();
    await this.initPromise;
    return this.status;
  }

  static getAdapter(): StorageAdapter | null {
    return this.adapter;
  }

  static getStatus(): StorageStatus {
    return this.status;
  }

  static isAvailable(): boolean {
    return this.status === StorageStatus.Available;
  }

  private static async performInit(): Promise<void> {
    const availability = await checkIndexedDBAvailability();

    if (availability === StorageStatus.Unavailable) {
      this.status = StorageStatus.Unavailable;
      this.adapter = null;
      console.warn(`[StorageProvider] ${STORAGE_NOT_SUPPORTED_MESSAGE}`);
      return;
    }

    try {
      this.adapter = IndexedDBAdapter.create();
      this.status = StorageStatus.Available;
    } catch (error: unknown) {
      this.status = StorageStatus.Unavailable;
      this.adapter = null;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[StorageProvider] ${STORAGE_NOT_SUPPORTED_MESSAGE}: ${message}`);
    }
  }

  static resetForTesting(): void {
    this.adapter = null;
    this.status = StorageStatus.Pending;
    this.initPromise = null;
  }
}