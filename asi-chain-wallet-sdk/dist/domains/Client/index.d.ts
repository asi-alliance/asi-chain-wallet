import { ExportFormat, RequirePassword } from "@config/index";
import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
import { IStorageFabricOptions } from "@fabrics/storage";
import { IDeployWatchCallbacks, IDeployWatchHandle, IDeployWatchOptions } from "@services/DeployStatusPoller";
import Wallet, { Address } from "@domains/Wallet";
import Account from "@domains/Account";
import ClosableDomain from "@domains/ClosableDomain";
import { IReservedOperationResult } from "@domains/ReservationAdapter";
import { ITransactionReservation, TReservationsByWallet, Transaction } from "@domains/Transaction";
import { MnemonicStrength } from "@services/Mnemonic";
import { SignedResult } from "@services/Signer";
import WalletManager from "@services/WalletManager";
import { IKeyfileAccountsImportResult, IKeyfileImportPreview } from "@services/WalletImport";
import { IAccountKeyfile, IWalletKeyfile } from "@services/ExportKeyfileService";
import { IImportWalletKeyfileOptions } from "@services/ImportKeyfileService";
import { Pagination } from "@services/GraphqlParser/queryOptions";
import { ICreatedAccountData } from "@services/AccountManager";
import { IInsensitiveCacheRecord } from "@domains/InsensitiveCacheStorageRepository";
import { IClientEventSource, TClientEventListenerErrorHandler } from "@services/ClientEventBus";
import { TTransactionReservationMeta } from "@fabrics/transactionReservation";
export type { IDeployReservationMeta, ITransferReservationMeta, TTransactionReservationMeta, } from "@fabrics/transactionReservation";
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
export interface ISignDeployRequest {
    walletId: string;
    accountId: string;
    term: string;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
}
export type TTransactionReservationRequest = {
    walletId: string;
    accountId: string;
} & TTransactionReservationMeta;
export type THistorySource = "pending" | "executed";
export interface ITransactionsHistoryOptions {
    sources?: THistorySource[];
    pagination?: Pagination;
}
export interface IClientEventDispatcher {
    onWalletsChanged?(wallets: Wallet[]): void | Promise<void>;
    onAccountsChanged?(walletId: string, accounts: Account[]): void | Promise<void>;
    onNetworkChanged?(network: INetworkRecord): void | Promise<void>;
    onReservationsChanged?(reservationsByWallet: TReservationsByWallet): void | Promise<void>;
    onNetworkBusyChanged?(networkId: NetworkId, isBusy: boolean): void | Promise<void>;
    onWalletLocked?(walletId: string): void | Promise<void>;
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
    onListenerError?: TClientEventListenerErrorHandler;
    flags?: ICreateClientFlags;
    security?: ISessionPolicy;
}
export default class Client extends ClosableDomain {
    private readonly walletManager;
    private readonly reservationAdapterManager;
    private readonly eventBus;
    private readonly flags?;
    private readonly autoLockMs;
    private readonly requirePassword;
    private readonly lifecycleGuard;
    private constructor();
    static create({ networksConfig, defaultNetwork, storageOptions, eventDispatcher, onListenerError, flags, security, }: ICreateClientOptions): Promise<Client>;
    private shouldHoldSession;
    private lockAllSessions;
    private resetRuntimeState;
    getWalletManager(): WalletManager;
    getEventBus(): IClientEventSource;
    getInsensitiveAccountsData(): Promise<IInsensitiveCacheRecord[]>;
    closeAllWallets(): void;
    clearPersistence(): Promise<void>;
    protected onClose(): Promise<void>;
    generateMnemonic(strength?: MnemonicStrength): string;
    generatePrivateKey(): Uint8Array;
    private cacheInsensitiveAccountsData;
    createHDWallet({ mnemonic, accountName, index }: ICreateHDWalletPayload, password: string): Promise<Wallet>;
    createPrivateKeyWallet({ privateKey, accountName }: ICreatePrivateKeyWalletPayload, password: string): Promise<Wallet>;
    removeWallet(walletId: string): Promise<Wallet>;
    private discardWallet;
    private holdSession;
    private ensureSession;
    openWallet(signerId: string, password: string): Promise<Wallet>;
    closeWallet(walletId: string): void;
    isWalletOpen(walletId: string): boolean;
    unlockWallet(walletId: string, password: string): Promise<void>;
    lockWallet(walletId: string): void;
    isWalletUnlocked(walletId: string): boolean;
    deriveAccount(walletId: string, accountName: string, password: string): Promise<ICreatedAccountData>;
    removeAccount(walletId: string, accountId: string): Promise<Account>;
    renameAccount(walletId: string, accountId: string, name: string): Promise<void>;
    getExportedAccountData(walletId: string, accountId: string): IAccountKeyfile;
    exportWalletKeyfile(walletId: string, password: string): Promise<IWalletKeyfile>;
    previewWalletKeyfileImport(source: unknown, password: string): Promise<IKeyfileImportPreview>;
    importWalletKeyfile(source: unknown, password: string, options?: IImportWalletKeyfileOptions): Promise<Wallet>;
    importKeyfileAccounts(source: unknown, password: string, options?: IImportWalletKeyfileOptions): Promise<IKeyfileAccountsImportResult>;
    getExportedTransactionsData(walletId: string, accountId: string, format?: ExportFormat, networkId?: string): Promise<string>;
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    setNetwork(networkId: NetworkId): void;
    getBalance(address: Address): Promise<bigint>;
    getAvailableBalance(walletId: string, accountId: string): Promise<bigint>;
    getReservations(walletId: string): Promise<ITransactionReservation[]>;
    addTransactionReservation(request: TTransactionReservationRequest, password?: string): Promise<ITransactionReservation>;
    updateTransactionReservation(reservationId: ITransactionReservation["id"], request: TTransactionReservationRequest, password?: string): Promise<ITransactionReservation>;
    removeTransactionReservation(walletId: string, reservationId: ITransactionReservation["id"]): Promise<ITransactionReservation>;
    getTransactionsHistory(walletId: string, accountId: string, options?: ITransactionsHistoryOptions): Promise<Transaction[]>;
    transfer({ walletId, accountId, to, amount }: ITransferRequest, password?: string): Promise<IReservedOperationResult>;
    deploy({ walletId, accountId, term, phloLimit }: IDeployRequest, password?: string): Promise<IReservedOperationResult>;
    signDeploy({ walletId, accountId, term, phloLimit, phloPrice, shardId, }: ISignDeployRequest, password?: string): Promise<SignedResult>;
    exploreDeploy(rholang: string): Promise<unknown>;
    watchDeploy(deployId: string, callbacks?: IDeployWatchCallbacks, options?: IDeployWatchOptions): IDeployWatchHandle;
    toDisplayAmount(atomicAmount: bigint): string;
    toAtomicAmount(amount: number | string): bigint;
    private getOpenWallet;
    getAccount(walletId: Wallet["id"], accountId: Account["id"]): Account;
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    isNetworkBusy(networkId?: NetworkId): boolean;
    addNetwork(name: NetworkName, config: INetworkConfig): Promise<INetworkRecord>;
    hasNetworkReservations(networkId?: NetworkId): boolean;
    updateNetwork(id: NetworkId, update: INetworkUpdate): Promise<void>;
    removeNetwork(id: NetworkId): Promise<void>;
    private createPasswordProvider;
    private emitReservationsChanged;
    private emitNetworkBusyChanged;
    private emitAccountsChanged;
    private emitWalletsChanged;
}
