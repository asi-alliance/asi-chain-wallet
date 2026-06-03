import { Account } from "types/wallet";
import { StorageProvider } from "./storage";
import { SessionPersistence } from "./sessionPersistence";
import {
    AccountsVault,
    fromStoredRecord,
    WalletSettings,
    readFromLocalStorage,
} from "./accountsVault";
import { SessionStore } from "./sessionStore";
import { GeneralKVStore } from "./generalKVStore";
import {
    runMigrations,
    readLegacySettings,
    DEFAULT_SETTINGS,
} from "./storageMigration";

export type { SecureAccount } from "./accountsVault";

export interface SecureStorageData {
    accounts: ReturnType<typeof AccountsVault.getAll>;
    settings: WalletSettings;
}

let settingsCache: WalletSettings = { ...DEFAULT_SETTINGS };
let initialized = false;
let initPromise: Promise<void> | null = null;

export class SecureStorage {
    static async init(): Promise<void> {
        if (initialized) return;
        if (initPromise) return initPromise;
        initPromise = SecureStorage.performInit();
        return initPromise;
    }

    private static async performInit(): Promise<void> {
        try {
            await StorageProvider.init();
            const adapter = StorageProvider.getAdapter();

            if (!adapter) {
                // IDB unavailable: AccountsVault already seeded from localStorage at class load
                settingsCache = readLegacySettings();
                initialized = true;
                return;
            }

            const port = SessionPersistence.init(adapter);
            SessionStore.setPort(port);

            await runMigrations(adapter);

            const [records, settingsRecord] = await Promise.all([
                adapter.getAllAccounts(),
                adapter.getSettings(),
            ]);

            AccountsVault.load(
                records.length > 0
                    ? records.map(fromStoredRecord)
                    : readFromLocalStorage(),
            );
            settingsCache = settingsRecord
                ? {
                      requirePasswordForTransaction:
                          settingsRecord.requirePasswordForTransaction,
                      idleTimeout: settingsRecord.idleTimeout,
                  }
                : readLegacySettings();

            await SessionPersistence.restore(adapter);
            SessionPersistence.cleanupStale(adapter);
            initialized = true;
        } catch (err) {
            console.error(
                "[SecureStorage] init failed, using localStorage fallback:",
                err,
            );
            // AccountsVault already seeded from localStorage at class load — no action needed
            settingsCache = readLegacySettings();
            initialized = true;
        }
    }

    static async flush(): Promise<void> {
        const adapter = StorageProvider.getAdapter();
        if (!adapter) return;
        await AccountsVault.flush();
        await adapter.putSettings({ id: "default", ...settingsCache });
    }

    // --- Accounts ---

    static getEncryptedAccounts(userId?: string) {
        return AccountsVault.getAll(userId);
    }

    static saveEncryptedAccounts(
        accounts: ReturnType<typeof AccountsVault.getAll>,
    ): void {
        AccountsVault.save(accounts);
    }

    static hasAccounts(userId?: string): boolean {
        return AccountsVault.has(userId);
    }

    static async saveAccount(
        account: Account,
        password: string,
        userId?: string,
        profileName?: string,
    ) {
        const uid =
            userId ??
            AccountsVault.generateUserId(password, profileName ?? account.name);
        if (!uid)
            throw new Error("Account name is required to generate user ID");
        return AccountsVault.saveAccount(account, password, uid);
    }

    static async unlockAccount(
        accountId: string,
        password: string,
        userId?: string,
    ): Promise<Account | null> {
        const uid = userId ?? SessionStore.getUserId();
        if (!uid) return null;
        const account = await AccountsVault.unlockAccount(
            accountId,
            password,
            uid,
        );
        if (!account) return null;
        SessionStore.storeAccount(accountId, account);
        return account;
    }

    static removeAccount(accountId: string): void {
        AccountsVault.remove(accountId);
        SessionStore.removeAccount(accountId);
    }

    static updateAccountName(accountId: string, newName: string): void {
        AccountsVault.updateAccountName(accountId, newName);
        SessionStore.updateAccountName(accountId, newName);
    }

    static exportAccount(accountId: string): string | null {
        return AccountsVault.export(accountId);
    }

    static accountExists(
        revAddress?: string,
        ethAddress?: string,
        userId?: string,
    ): boolean {
        return AccountsVault.exists(revAddress, ethAddress, userId);
    }

    static async importFromKeyfile(
        keyfileContent: string,
        name: string,
        networkId?: string,
        userId?: string,
    ) {
        const uid = userId ?? SessionStore.getUserId();
        if (!uid) throw new Error("User ID is required. Please login first.");
        return AccountsVault.importFromKeyfile(
            keyfileContent,
            name,
            uid,
            networkId,
        );
    }

    static async storeEncryptedAccount(
        account: ReturnType<typeof AccountsVault.getAll>[number],
    ): Promise<void> {
        const accounts = AccountsVault.getAll();
        const idx = accounts.findIndex(
            (a) => a.id === account.id || a.address === account.address,
        );
        const updated = [...accounts];
        if (idx >= 0) {
            updated[idx] = account;
        } else {
            updated.push(account);
        }
        AccountsVault.save(updated);
        await AccountsVault.flush();
    }

    // --- Network updates ---

    static updateAccountNetwork(accountId: string, networkId: string): void {
        this.updateAccountsNetworkBulk([{ id: accountId, networkId }]);
    }

    static updateAccountsNetwork(
        accountIds: string[],
        networkId: string,
    ): void {
        if (!networkId || !accountIds.length) return;
        this.updateAccountsNetworkBulk(
            accountIds.map((id) => ({ id, networkId })),
        );
    }

    static updateAccountsNetworkBulk(
        updates: Array<{ id: string; networkId?: string }>,
    ): void {
        const map = new Map<string, string>();
        for (const { id, networkId } of updates) {
            if (networkId) map.set(id, networkId);
        }
        if (!map.size) return;
        AccountsVault.updateNetworks(map);
        SessionStore.updateAccountNetworks(map);
    }

    // --- Session ---

    static getUnlockedAccount(accountId: string): Account | null {
        return SessionStore.getAccount(accountId);
    }
    static getAllUnlockedAccounts(): Account[] {
        return SessionStore.getAllAccounts();
    }
    static clearAccountFromSession(accountId: string): void {
        SessionStore.removeAccount(accountId);
    }
    static clearSession(): void {
        SessionStore.clear();
    }
    static setAuthenticated(value: boolean): void {
        SessionStore.setAuthenticated(value);
    }
    static isAuthenticated(): boolean {
        return SessionStore.isAuthenticated();
    }
    static getCurrentUserId(): string | null {
        return SessionStore.getUserId();
    }
    static setCurrentUserId(userId: string): void {
        SessionStore.setUserId(userId);
    }
    static generateSessionToken(): string {
        return SessionStore.generateToken();
    }
    static setSessionToken(token: string): void {
        SessionStore.setToken(token);
    }
    static getSessionToken(): string | null {
        return SessionStore.getToken();
    }
    static hasSessionToken(): boolean {
        return SessionStore.hasToken();
    }
    static updateLastActivity(): void {
        SessionStore.updateLastActivity();
    }
    static getLastActivity(): number {
        return SessionStore.getLastActivity();
    }

    // --- Settings ---

    static getSettings(): WalletSettings {
        return settingsCache;
    }

    static updateSettings(settings: Partial<WalletSettings>): void {
        settingsCache = { ...settingsCache, ...settings };
        const adapter = StorageProvider.getAdapter();
        if (adapter) {
            adapter
                .putSettings({ id: "default", ...settingsCache })
                .catch((err: unknown) => {
                    console.error(
                        "[SecureStorage] Failed to persist settings:",
                        err,
                    );
                });
        }
    }

    // --- KV store ---

    static async setItem(key: string, value: string): Promise<void> {
        return GeneralKVStore.set(key, value);
    }
    static async getItem(key: string): Promise<string | null> {
        return GeneralKVStore.get(key);
    }
    static async removeItem(key: string): Promise<void> {
        return GeneralKVStore.remove(key);
    }

    // --- Helpers ---

    static generateUserIdFromPassword(
        password: string,
        profileName?: string,
    ): string {
        return AccountsVault.generateUserId(password, profileName);
    }

    static async clearAll(): Promise<void> {
        AccountsVault.save([]);
        settingsCache = { ...DEFAULT_SETTINGS };
        SessionStore.clear();
        const adapter = StorageProvider.getAdapter();
        if (adapter) await adapter.clear();
    }
}
