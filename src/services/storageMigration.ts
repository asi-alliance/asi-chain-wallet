import { hashValue } from 'utils/encryption';
import { StorageAdapter } from './storage';
import { SecureAccount, WalletSettings, toStoredRecord } from './accountsVault';

const STORAGE_KEY = hashValue('asi_wallet_secure_v2');
const ACCOUNTS_MIGRATED_KEY = hashValue('asi_wallet_accounts_migrated_v1');
const SETTINGS_MIGRATED_KEY = hashValue('asi_wallet_settings_migrated_v1');

export const DEFAULT_SETTINGS: WalletSettings = {
  requirePasswordForTransaction: false,
  idleTimeout: 15,
};

interface LegacyStorageData {
  accounts?: SecureAccount[];
  settings?: WalletSettings;
}

function readLegacyData(): LegacyStorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LegacyStorageData) : {};
  } catch { return {}; }
}

export function readLegacySettings(): WalletSettings {
  return { ...DEFAULT_SETTINGS, ...(readLegacyData().settings ?? {}) };
}

async function migrateAccounts(adapter: StorageAdapter): Promise<void> {
  const flag = await adapter.getItem(ACCOUNTS_MIGRATED_KEY);
  if (flag === 'true') return;

  const existing = await adapter.getAllAccounts();
  if (existing.length === 0) {
    const { accounts } = readLegacyData();
    if (accounts?.length) await adapter.putAccounts(accounts.map(toStoredRecord));
  }
  await adapter.setItem(ACCOUNTS_MIGRATED_KEY, 'true');
}

async function migrateSettings(adapter: StorageAdapter): Promise<void> {
  const flag = await adapter.getItem(SETTINGS_MIGRATED_KEY);
  if (flag === 'true') return;

  const existing = await adapter.getSettings();
  if (!existing) {
    const settings = readLegacySettings();
    await adapter.putSettings({ id: 'default', ...settings });
  }
  await adapter.setItem(SETTINGS_MIGRATED_KEY, 'true');
}

// Idempotent: safe to call on every init; removes LS only once both flags are set
export async function runMigrations(adapter: StorageAdapter): Promise<void> {
  await migrateAccounts(adapter);
  await migrateSettings(adapter);

  const [aDone, sDone] = await Promise.all([
    adapter.getItem(ACCOUNTS_MIGRATED_KEY),
    adapter.getItem(SETTINGS_MIGRATED_KEY),
  ]);
  if (aDone === 'true' && sDone === 'true') localStorage.removeItem(STORAGE_KEY);
}