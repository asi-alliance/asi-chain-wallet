import { hashValue } from "utils/encryption";
import { legacyDecrypt } from "utils/legacyCrypto";
import {
    sealV2,
    openV2,
    detectVersion,
    PayloadVersion,
} from "utils/encryptedPayload";
import { Account } from "types/wallet";
import { StorageProvider, StoredAccountRecord } from "./storage";

export interface SecureAccount extends Omit<Account, "privateKey"> {
    encryptedPrivateKey?: string;
    privateKey?: never;
    derivationPath?: string;
    isHardwareWallet?: boolean;
    userId?: string;
}

export interface WalletSettings {
    requirePasswordForTransaction: boolean;
    idleTimeout: number;
}

interface KeyfileData {
    type: string;
    address?: string;
    revAddress?: string;
    ethAddress?: string;
    encryptedPrivateKey?: string;
}

const LS_STORAGE_KEY = hashValue("asi_wallet_secure_v2");

interface LegacyStorageShape {
    accounts?: SecureAccount[];
}

export function toStoredRecord(account: SecureAccount): StoredAccountRecord {
    return {
        id: account.id,
        name: account.name,
        address: account.address,
        revAddress: account.revAddress,
        ethAddress: account.ethAddress,
        publicKey: account.publicKey,
        encryptedPrivateKey: account.encryptedPrivateKey,
        balance: account.balance,
        isMetamask: account.isMetamask,
        networkId: account.networkId,
        userId: account.userId,
        derivationPath: account.derivationPath,
        isHardwareWallet: account.isHardwareWallet,
        createdAt:
            account.createdAt instanceof Date
                ? account.createdAt.toISOString()
                : String(account.createdAt ?? new Date().toISOString()),
    };
}

export function fromStoredRecord(record: StoredAccountRecord): SecureAccount {
    return {
        id: record.id,
        name: record.name,
        address: record.address,
        revAddress: record.revAddress,
        ethAddress: record.ethAddress,
        publicKey: record.publicKey,
        encryptedPrivateKey: record.encryptedPrivateKey,
        balance: record.balance,
        isMetamask: record.isMetamask,
        networkId: record.networkId,
        userId: record.userId,
        derivationPath: record.derivationPath,
        isHardwareWallet: record.isHardwareWallet,
        createdAt: new Date(record.createdAt),
    };
}

// Reads legacy localStorage blob — used as initial seed and IDB-unavailable fallback
export function readFromLocalStorage(): SecureAccount[] {
    try {
        const raw = localStorage.getItem(LS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LegacyStorageShape;
        return Array.isArray(parsed?.accounts) ? parsed.accounts : [];
    } catch {
        return [];
    }
}

// Handles encrypted account CRUD + V1→V2 lazy migration per account
export class AccountsVault {
    // Seed from localStorage synchronously so IDB-unavailable users are never left empty
    private static accounts: SecureAccount[] = readFromLocalStorage();

    static load(accounts: SecureAccount[]): void {
        this.accounts = accounts;
    }

    static getAll(userId?: string): SecureAccount[] {
        if (!userId) return this.accounts;
        return this.accounts.filter((a) => a.userId === userId);
    }

    static has(userId?: string): boolean {
        return this.getAll(userId).length > 0;
    }

    static save(accounts: SecureAccount[]): void {
        this.accounts = accounts;
        this.persistAsync();
    }

    static updateAccountName(targetAccountId: string, newName: string): void {
        const accountForSave: SecureAccount | undefined = this.accounts.find(
            (account: SecureAccount) => account.id === targetAccountId,
        );

        if (!accountForSave) {
            console.error("You want update name for not found account!");

            return;
        }

        accountForSave.name = newName;

        this.persistAsync();
    }

    private static persistAsync(): void {
        const adapter = StorageProvider.getAdapter();

        const records = this.accounts.map(toStoredRecord);

        if (adapter) {
            adapter.putAccounts(records).catch((err: unknown) => {
                console.error(
                    "[AccountsVault] IDB write failed, using localStorage fallback:",
                    err,
                );
                this.persistToLocalStorage();
            });
            return;
        }
        this.persistToLocalStorage();
    }

    private static persistToLocalStorage(): void {
        try {
            const current = localStorage.getItem(LS_STORAGE_KEY);
            const parsed = current
                ? (JSON.parse(current) as LegacyStorageShape)
                : {};
            localStorage.setItem(
                LS_STORAGE_KEY,
                JSON.stringify({ ...parsed, accounts: this.accounts }),
            );
        } catch {
            /* quota — non-critical */
        }
    }

    static async flush(): Promise<void> {
        const adapter = StorageProvider.getAdapter();
        if (adapter) {
            await adapter.putAccounts(this.accounts.map(toStoredRecord));
            return;
        }
        this.persistToLocalStorage();
    }

    static async saveAccount(
        account: Account,
        password: string,
        userId: string,
    ): Promise<SecureAccount> {
        if (!account.privateKey) throw new Error("Private key is required");

        const encryptedPrivateKey = await sealV2(account.privateKey, password);
        const { privateKey: _key, ...rest } = account;
        const secureAccount: SecureAccount = {
            ...rest,
            encryptedPrivateKey,
            userId,
        };

        const existing = this.accounts.findIndex((a) => a.id === account.id);
        const updated = [...this.accounts];
        if (existing >= 0) {
            updated[existing] = secureAccount;
        } else {
            updated.push(secureAccount);
        }

        this.save(updated);
        await this.flush();
        return secureAccount;
    }

    static async unlockAccount(
        accountId: string,
        password: string,
        userId: string,
    ): Promise<Account | null> {
        const secureAccount = this.accounts.find((a) => a.id === accountId);
        if (!secureAccount?.encryptedPrivateKey) return null;
        if (!this.validateOwnership(secureAccount, password, userId))
            return null;

        const version = detectVersion(secureAccount.encryptedPrivateKey);
        const privateKey = await this.decrypt(
            secureAccount.encryptedPrivateKey,
            password,
            version,
        );
        if (!privateKey) return null;

        if (version === PayloadVersion.V1)
            await this.reEncryptToV2(secureAccount.id, privateKey, password);

        const {
            encryptedPrivateKey: _enc,
            userId: _uid,
            ...accountData
        } = secureAccount;
        return { ...accountData, privateKey };
    }

    private static validateOwnership(
        account: SecureAccount,
        password: string,
        userId: string,
    ): boolean {
        if (account.userId && account.userId !== userId) return false;
        if (!account.name) return true;
        return (
            AccountsVault.generateUserId(password, account.name) ===
            (account.userId ?? userId)
        );
    }

    private static async decrypt(
        encrypted: string,
        password: string,
        version: PayloadVersion,
    ): Promise<string | undefined> {
        if (version === PayloadVersion.V2) {
            try {
                return await openV2(encrypted, password);
            } catch {
                return undefined;
            }
        }
        return legacyDecrypt(encrypted, password);
    }

    // Re-encrypts V1 payload to V2 format; async, retries on next unlock
    private static async reEncryptToV2(
        accountId: string,
        privateKey: string,
        password: string,
    ): Promise<void> {
        try {
            const encrypted = await sealV2(privateKey, password);
            this.save(
                this.accounts.map((a) =>
                    a.id === accountId
                        ? { ...a, encryptedPrivateKey: encrypted }
                        : a,
                ),
            );
        } catch {
            /* retry on next unlock */
        }
    }

    static remove(accountId: string): void {
        const adapter = StorageProvider.getAdapter();

        if (!adapter) {
            console.error(
                "[AccountsVault] IDB write failed, Adapter not found, using localStorage fallback:",
            );

            return;
        }

        adapter.deleteAccount(accountId).catch((err: unknown) => {
            console.error(
                "[AccountsVault] IDB write failed, using localStorage fallback:",
                err,
            );
            this.persistToLocalStorage();
        });

        this.save(this.accounts.filter((a) => a.id !== accountId));
    }

    static export(accountId: string): string | null {
        const account = this.accounts.find((a) => a.id === accountId);
        if (!account) return null;
        return JSON.stringify(
            {
                version: 1,
                type: "asi-wallet-keyfile",
                address: account.address,
                revAddress: account.revAddress,
                ethAddress: account.ethAddress,
                encryptedPrivateKey: account.encryptedPrivateKey,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        );
    }

    static exists(
        revAddress?: string,
        ethAddress?: string,
        userId?: string,
    ): boolean {
        const pool = userId ? this.getAll(userId) : this.accounts;
        const rev = revAddress?.toLowerCase().trim() ?? "";
        const eth = ethAddress?.toLowerCase().trim() ?? "";
        return pool.some((a) => {
            const aRev = a.revAddress?.toLowerCase().trim();
            const aEth = a.ethAddress?.toLowerCase().trim();
            return (
                (rev && aRev && rev === aRev) || (eth && aEth && eth === aEth)
            );
        });
    }

    static async importFromKeyfile(
        keyfileContent: string,
        name: string,
        userId: string,
        networkId?: string,
    ): Promise<SecureAccount> {
        let data: KeyfileData;
        try {
            data = JSON.parse(keyfileContent) as KeyfileData;
        } catch {
            throw new Error("Failed to import keyfile: Invalid format");
        }

        if (data.type !== "asi-wallet-keyfile")
            throw new Error("Invalid keyfile format");

        const account: SecureAccount = {
            id: Date.now().toString(),
            name,
            address: data.address ?? data.revAddress ?? "",
            revAddress: data.revAddress ?? "",
            ethAddress: data.ethAddress ?? "",
            publicKey: "",
            encryptedPrivateKey: data.encryptedPrivateKey,
            balance: "0",
            userId,
            ...(networkId ? { networkId } : {}),
            createdAt: new Date(),
        };

        if (this.exists(account.revAddress, account.ethAddress, userId)) {
            throw new Error("Account with this address already exists");
        }

        this.save([...this.accounts, account]);
        await this.flush();
        return account;
    }

    static updateNetworks(updateMap: Map<string, string>): boolean {
        let changed = false;
        const updated = this.accounts.map((a) => {
            const next = updateMap.get(a.id);
            if (next && a.networkId !== next) {
                changed = true;
                return { ...a, networkId: next };
            }
            return a;
        });
        if (changed) this.save(updated);
        return changed;
    }

    static generateUserId(password: string, profileName?: string): string {
        return profileName
            ? hashValue(`user_${profileName}_${password}`)
            : hashValue(`user_${password}`);
    }
}
