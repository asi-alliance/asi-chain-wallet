import { ExportFormat, RequirePassword } from "@config/index";
import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
import { IStorageFabricOptions } from "@fabrics/Storage";
import { IDeployWatchCallbacks, IDeployWatchHandle, IDeployWatchOptions } from "@services/DeployStatusPoller";
import Wallet, { Address } from "@domains/Wallet";
import Account from "@domains/Account";
import { ITransactionReservation } from "@domains/Transaction";
import { MnemonicStrength } from "@services/Mnemonic";
import WalletManager from "@services/WalletManager";
import { ICreatedAccountData } from "@services/AccountManager";
import { IInsensitiveCacheRecord } from "@domains/InsensitiveCacheStorageRepository";
import { WalletTypes } from "@domains/Signer";
export interface IUnlockedWallet {
    id: string;
    signerId: string;
    type: WalletTypes;
    accounts: Account[];
    activeAccountId: string | null;
}
export interface ICreateHDWalletPayload {
    mnemonic: string;
    accountName: string;
    index?: number;
}
export interface ICreatePrivateKeyWalletPayload {
    privateKey: Uint8Array;
    accountName: string;
}
export interface ITransferRequest {
    walletId: string;
    accountId: string;
    to: Address;
    amount: bigint;
}
export interface IDeployRequest {
    walletId: string;
    accountId: string;
    term: string;
    phloLimit?: number;
}
export interface IClientEventDispatcher {
    onWalletsChanged?(wallets: Wallet[]): void;
    onAccountsChanged?(walletId: string, accounts: Account[]): void;
    onNetworkChanged?(network: INetworkRecord): void;
    onReservationsChanged?(walletId: string, reservations: ITransactionReservation[]): void;
    onWalletLocked?(walletId: string): void;
}
export interface ISessionPolicy {
    autoLockMs?: number;
    requirePassword?: RequirePassword;
}
export interface ICreateClientFlags {
    withInsensitiveCacheStorage?: boolean;
}
export interface ICreateClientOptions {
    networksConfig: TNetworksConfig;
    defaultNetwork?: NetworkName;
    storageOptions?: IStorageFabricOptions;
    eventDispatcher?: IClientEventDispatcher;
    flags?: ICreateClientFlags;
    security?: ISessionPolicy;
}
export default class Client {
    private readonly walletManager;
    private readonly reservationAdapterManager;
    private readonly eventDispatcher?;
    private readonly flags?;
    private readonly autoLockMs;
    private readonly requirePassword;
    private constructor();
    static create({ networksConfig, defaultNetwork, storageOptions, eventDispatcher, flags, security, }: ICreateClientOptions): Promise<Client>;
    private shouldHoldSession;
    private lockAllSessions;
    getWalletManager(): WalletManager;
    getInsensitiveAccountsData(): Promise<IInsensitiveCacheRecord[]>;
    clearPersistence(): Promise<void>;
    close(): void;
    generateMnemonic(strength?: MnemonicStrength): string;
    generatePrivateKey(): Uint8Array;
    createHDWallet({ mnemonic, accountName, index }: ICreateHDWalletPayload, password: string): Promise<Wallet>;
    createPrivateKeyWallet({ privateKey, accountName }: ICreatePrivateKeyWalletPayload, password: string): Promise<Wallet>;
    removeWallet(walletId: string): Promise<Wallet>;
    private holdSession;
    private ensureSession;
    unlockWallet(signerId: string, password: string): Promise<Wallet>;
    lockWallet(walletId: string): void;
    isWalletUnlocked(walletId: string): boolean;
    deriveAccount(walletId: string, accountName: string, password: string): Promise<ICreatedAccountData>;
    removeAccount(walletId: string, accountId: string): Promise<Account>;
    renameAccount(walletId: string, accountId: string, name: string): Promise<void>;
    getExportedAccountData(walletId: string, accountId: string): string;
    getExportedTransactionsData(walletId: string, accountId: string, format?: ExportFormat, networkId?: string): Promise<string>;
    setActiveAccount(walletId: string, accountId: string): void;
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    setNetwork(networkId: NetworkId): void;
    getBalance(address: Address): Promise<bigint>;
    getAvailableBalance(walletId: string, accountId: string): Promise<bigint>;
    getReservations(walletId: string): Promise<ITransactionReservation[]>;
    transfer({ walletId, accountId, to, amount }: ITransferRequest, password?: string): Promise<string>;
    deploy({ walletId, accountId, term, phloLimit }: IDeployRequest, password?: string): Promise<string>;
    exploreDeploy(rholang: string): Promise<unknown>;
    watchDeploy(deployId: string, callbacks?: IDeployWatchCallbacks, options?: IDeployWatchOptions): IDeployWatchHandle;
    toDisplayAmount(atomicAmount: bigint): string;
    toAtomicAmount(amount: number | string): bigint;
    private getUnlockedWallet;
    private getAccount;
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    addNetwork(name: NetworkName, config: INetworkConfig): Promise<INetworkRecord>;
    updateNetwork(id: NetworkId, update: INetworkUpdate): Promise<void>;
    removeNetwork(id: NetworkId): Promise<void>;
    private createPasswordProvider;
    private emitAccountsChanged;
    private emitWalletsChanged;
}
