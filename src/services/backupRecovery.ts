import { SecureStorage, SecureAccount } from './secureStorage';
import { sealV2, openV2 } from 'utils/encryptedPayload';
import { legacyDecrypt } from 'utils/legacyCrypto';
import { hashValue } from 'utils/encryption';

// Backup format version: V1 = legacy CryptoJS, V2 = Web Crypto (AES-GCM)
enum BackupFormatVersion {
  V1Legacy = '1',
  V2 = '2',
}

export interface BackupData {
  version: string;
  timestamp: Date;
  accounts: EncryptedAccount[];
  settings: WalletSettings;
  multisigWallets?: MultisigWalletEntry[];
  twoFactorBackup?: string;
  checksum: string;
}

export interface EncryptedAccount {
  address: string;
  name: string;
  encryptedPrivateKey: string;
  publicKey: string;
  derivationPath?: string;
  isHardwareWallet: boolean;
  createdAt: Date;
}

export interface WalletSettings {
  theme: string;
  network: string;
  autoLock: boolean;
  autoLockTime: number;
  notifications: boolean;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
}

interface MultisigWalletEntry {
  [key: string]: unknown;
}

export interface RecoveryPhrase {
  words: string[];
  entropy: string;
  checksum: string;
}

export interface BackupOptions {
  includeSettings: boolean;
  includeMultisig: boolean;
  includeTwoFactor: boolean;
  password?: string;
  recoveryPhrase?: boolean;
}

export interface RecoveryOptions {
  password?: string;
  recoveryPhrase?: string;
  restoreSettings: boolean;
  restoreMultisig: boolean;
  restoreTwoFactor: boolean;
}

export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: Date;
  accountCount: number;
  hasSettings: boolean;
  hasMultisig: boolean;
  hasTwoFactor: boolean;
  size: number;
  checksum: string;
}

// Envelope wraps the encrypted blob with format version so we can route decryption
interface BackupEnvelope {
  fmtVersion: BackupFormatVersion;
  payload: string;
}

export class BackupRecoveryService {
  private static readonly BACKUP_VERSION = '2.0.0';
  private static readonly BACKUP_PREFIX = 'ASI_WALLET_BACKUP_';
  private static readonly RECOVERY_STORAGE_KEY = 'recovery_phrases';
  private static readonly BACKUP_METADATA_KEY = 'backup_metadata';

  static async createBackup(
    password: string,
    options: BackupOptions = { includeSettings: true, includeMultisig: true, includeTwoFactor: false },
  ): Promise<{ success: boolean; backupData?: string; metadata?: BackupMetadata; error?: string }> {
    try {
      if (!password || password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      const accounts = await this.getAccountsForBackup();
      if (accounts.length === 0) {
        return { success: false, error: 'No accounts found to backup' };
      }

      const settings = options.includeSettings ? await this.getWalletSettings() : ({} as WalletSettings);
      const multisigWallets = options.includeMultisig ? await this.getMultisigWallets() : undefined;
      const twoFactorBackup = options.includeTwoFactor
        ? await this.getTwoFactorBackupData(password)
        : undefined;

      const dataForChecksum: Omit<BackupData, 'checksum'> = {
        version: this.BACKUP_VERSION,
        timestamp: new Date(),
        accounts,
        settings,
        multisigWallets,
        twoFactorBackup,
      };

      // Checksum over the data-without-checksum string (consistent with restore)
      const checksumSource = JSON.stringify(dataForChecksum);
      const checksum = hashValue(checksumSource);

      const backupData: BackupData = { ...dataForChecksum, checksum };
      const encryptedPayload = await this.encryptBackupV2(backupData, password);

      const envelope: BackupEnvelope = { fmtVersion: BackupFormatVersion.V2, payload: encryptedPayload };
      const envelopeStr = JSON.stringify(envelope);

      const metadata: BackupMetadata = {
        id: this.generateBackupId(),
        name: `Backup ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        accountCount: accounts.length,
        hasSettings: !!settings,
        hasMultisig: !!multisigWallets && multisigWallets.length > 0,
        hasTwoFactor: !!twoFactorBackup,
        size: envelopeStr.length,
        checksum,
      };

      await this.saveBackupMetadata(metadata);
      return { success: true, backupData: envelopeStr, metadata };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Backup creation failed' };
    }
  }

  static async restoreFromBackup(
    rawBackup: string,
    password: string,
    options: RecoveryOptions = { restoreSettings: true, restoreMultisig: true, restoreTwoFactor: false },
  ): Promise<{ success: boolean; restoredData?: BackupData; error?: string }> {
    try {
      const backupData = await this.decryptBackup(rawBackup, password);
      if (!backupData) return { success: false, error: 'Incorrect password or corrupted backup data' };

      // Verify integrity — checksum was computed over data-without-checksum
      const { checksum, ...dataForChecksum } = backupData;
      const calculated = hashValue(JSON.stringify(dataForChecksum));
      if (calculated !== checksum) return { success: false, error: 'Backup data integrity check failed' };

      if (!this.isVersionCompatible(backupData.version)) {
        return { success: false, error: `Backup version ${backupData.version} is not compatible` };
      }

      await this.restoreAccounts(backupData.accounts);

      if (options.restoreSettings && backupData.settings) {
        await this.restoreWalletSettings(backupData.settings);
      }
      if (options.restoreMultisig && backupData.multisigWallets) {
        await this.restoreMultisigWallets(backupData.multisigWallets);
      }
      if (options.restoreTwoFactor && backupData.twoFactorBackup) {
        await this.restoreTwoFactorData(backupData.twoFactorBackup, password);
      }

      return { success: true, restoredData: backupData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Backup restoration failed' };
    }
  }

  static generateRecoveryPhrase(): { success: boolean; phrase?: RecoveryPhrase; error?: string } {
    try {
      const entropy = crypto.getRandomValues(new Uint8Array(16));
      const entropyHex = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');
      const words = this.entropyToMnemonic(entropy);
      const checksum = hashValue(words.join(' '));
      return { success: true, phrase: { words, entropy: entropyHex, checksum } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate recovery phrase' };
    }
  }

  static validateRecoveryPhrase(words: string[]): { valid: boolean; error?: string } {
    if (words.length !== 12) return { valid: false, error: 'Recovery phrase must be exactly 12 words' };
    return { valid: true };
  }

  static async exportBackupToFile(
    backupData: string,
    metadata: BackupMetadata,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.BACKUP_PREFIX}${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to export backup file' };
    }
  }

  static async importBackupFromFile(file: File): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      if (!file.name.startsWith(this.BACKUP_PREFIX)) {
        return { success: false, error: 'Invalid backup file format' };
      }
      const text = await file.text();
      // Accept both V2 envelope (JSON) and V1 legacy (CryptoJS base64 prefix)
      const isV2Envelope = text.startsWith('{');
      const isV1Legacy = text.startsWith('U2FsdGVkX1');
      if (!isV2Envelope && !isV1Legacy) {
        return { success: false, error: 'Invalid backup file content' };
      }
      return { success: true, data: text };
    } catch {
      return { success: false, error: 'Failed to read backup file' };
    }
  }

  static async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const metadataJson = await SecureStorage.getItem(this.BACKUP_METADATA_KEY);
      if (!metadataJson) return [];
      const metadata = JSON.parse(metadataJson) as BackupMetadata[];
      return metadata.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Private — encryption (V2 Web Crypto)
  // ---------------------------------------------------------------------------

  private static async encryptBackupV2(data: BackupData, password: string): Promise<string> {
    return sealV2(JSON.stringify(data), password);
  }

  // Route to V2 or legacy V1 based on envelope format version
  private static async decryptBackup(raw: string, password: string): Promise<BackupData | null> {
    // V2 envelope: { fmtVersion, payload }
    if (raw.startsWith('{')) {
      try {
        const envelope = JSON.parse(raw) as Partial<BackupEnvelope>;
        if (envelope.fmtVersion === BackupFormatVersion.V2 && envelope.payload) {
          const plaintext = await openV2(envelope.payload, password);
          return this.parseBackupJson(plaintext);
        }
      } catch {
        return null;
      }
    }

    // Legacy V1 path (CryptoJS) — clearly labelled, read-only
    return this.decryptBackupV1Legacy(raw, password);
  }

  private static decryptBackupV1Legacy(encrypted: string, password: string): BackupData | null {
    const dataString = legacyDecrypt(encrypted, password);
    if (!dataString) return null;
    return this.parseBackupJson(dataString);
  }

  private static parseBackupJson(json: string): BackupData | null {
    try {
      const data = JSON.parse(json) as BackupData;
      data.timestamp = new Date(data.timestamp);
      data.accounts.forEach((account) => { account.createdAt = new Date(account.createdAt); });
      return data;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private — data helpers
  // ---------------------------------------------------------------------------

  private static async getAccountsForBackup(): Promise<EncryptedAccount[]> {
    const userId = SecureStorage.getCurrentUserId();
    const accountsData = SecureStorage.getEncryptedAccounts(userId ?? undefined);
    return accountsData
      .filter((account) => !!account.encryptedPrivateKey)
      .map((account) => ({
        address: account.address,
        name: account.name ?? 'Unnamed Account',
        encryptedPrivateKey: account.encryptedPrivateKey!,
        publicKey: account.publicKey,
        derivationPath: account.derivationPath,
        isHardwareWallet: account.isHardwareWallet ?? false,
        createdAt: account.createdAt instanceof Date ? account.createdAt : new Date(account.createdAt ?? Date.now()),
      }));
  }

  private static async getWalletSettings(): Promise<WalletSettings> {
    return {
      theme: 'light',
      network: 'mainnet',
      autoLock: true,
      autoLockTime: 15,
      notifications: true,
      biometricEnabled: false,
      twoFactorEnabled: false,
    };
  }

  private static async getMultisigWallets(): Promise<MultisigWalletEntry[]> {
    try {
      const data = await SecureStorage.getItem('multisig_wallets_list');
      return data ? (JSON.parse(data) as MultisigWalletEntry[]) : [];
    } catch {
      return [];
    }
  }

  private static async getTwoFactorBackupData(password: string): Promise<string | undefined> {
    const twoFactorData = await SecureStorage.getItem('twofa_settings');
    if (!twoFactorData) return undefined;
    // Encrypt 2FA data using V2 (Web Crypto)
    return sealV2(twoFactorData, password);
  }

  private static async restoreAccounts(accounts: EncryptedAccount[]): Promise<void> {
    for (const account of accounts) {
      await SecureStorage.storeEncryptedAccount({
        id: account.address,
        address: account.address,
        name: account.name,
        encryptedPrivateKey: account.encryptedPrivateKey,
        publicKey: account.publicKey,
        balance: '0',
        revAddress: account.address,
        ethAddress: account.address,
        derivationPath: account.derivationPath,
        isHardwareWallet: account.isHardwareWallet,
        createdAt: account.createdAt,
      } as SecureAccount);
    }
  }

  private static async restoreWalletSettings(_settings: WalletSettings): Promise<void> {
    // Settings restoration is handled by individual services on load
  }

  private static async restoreMultisigWallets(wallets: MultisigWalletEntry[]): Promise<void> {
    await SecureStorage.setItem('multisig_wallets_list', JSON.stringify(wallets));
  }

  private static async restoreTwoFactorData(encryptedData: string, password: string): Promise<void> {
    try {
      const dataString = await openV2(encryptedData, password);
      await SecureStorage.setItem('twofa_settings', dataString);
    } catch {
      // Legacy V1 2FA backup — attempt CryptoJS decrypt
      const dataString = legacyDecrypt(encryptedData, password);
      if (dataString) await SecureStorage.setItem('twofa_settings', dataString);
    }
  }

  private static isVersionCompatible(version: string): boolean {
    return version.split('.')[0] === this.BACKUP_VERSION.split('.')[0];
  }

  private static generateBackupId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private static async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const existing = await this.getBackupHistory();
      const limited = [...existing, metadata].slice(-20);
      await SecureStorage.setItem(this.BACKUP_METADATA_KEY, JSON.stringify(limited));
    } catch {
      // Non-critical
    }
  }

  private static entropyToMnemonic(entropy: Uint8Array): string[] {
    const wordList = this.getBasicWordList();
    return Array.from({ length: 12 }, (_, i) => wordList[entropy[i] % wordList.length]);
  }

  private static getBasicWordList(): string[] {
    return [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    ];
  }
}

export default BackupRecoveryService;