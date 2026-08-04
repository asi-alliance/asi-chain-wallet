import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { BIP32Interface } from 'bip32';

declare const NATIVE_TOKEN_DECIMALS_AMOUNT: number;
declare const DEFAULT_PHLO_LIMIT: number;
declare const DEFAULT_PHLO_PRICE: number;
declare const DEFAULT_NODE_STORAGE_DIR: string;
declare const ASI_WALLET_KEYFILE: string;
declare const ASI_WALLET_KEYFILE_VERSION: number;
declare const ExportFormat: {
    readonly JSON: "json";
    readonly CSV: "csv";
};
type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
declare const TRANSACTIONS_CSV_HEADERS: string[];
declare const GasFee: {
    MIN: bigint;
    MAX: bigint;
};
declare const DEPLOY_STATUS_POLLING_TIMEOUT: number;
declare const RESERVATION_EXPIRATION_TIME: number;
declare const RequirePassword: {
    readonly ONCE_PER_SESSION: "once-per-session";
    readonly EVERY_SIGNATURE: "every-signature";
};
type RequirePassword = (typeof RequirePassword)[keyof typeof RequirePassword];
declare const DEFAULT_AUTO_LOCK_MS: number;

type AssetId = string;
type Assets = Map<AssetId, Asset>;

interface IAssetOptions {
    id: string;
    name: string;
    decimals?: number;
    contractAddress?: string;
}
declare class Asset {
    private readonly id;
    private readonly name;
    private readonly decimals;
    private readonly contractAddress;
    constructor({ id, name, decimals, contractAddress }: IAssetOptions);
    getId(): string;
    getName(): string;
    getDecimals(): number;
    getContractAddress(): string | null;
}
declare const DEFAULT_ASSET: Asset;

interface IBip44PathOptions {
    coinType: number;
    account?: number;
    change?: number;
    index?: number;
}
declare class Bip44Path {
    private static readonly BIP44_PURPOSE;
    private static readonly MIN_CHANGE;
    private static readonly MAX_CHANGE;
    private static readonly PATH_COMPONENTS_COUNT;
    private static readonly PURPOSE_INDEX;
    private static readonly COIN_TYPE_INDEX;
    private static readonly ACCOUNT_INDEX;
    private static readonly CHANGE_INDEX;
    private static readonly INDEX_COMPONENT_INDEX;
    private static readonly DECIMAL_RADIX;
    private coinType;
    private account;
    private change;
    private index;
    constructor({ coinType, account, change, index, }: IBip44PathOptions);
    static parse(pathString: string): Bip44Path;
    toString(): string;
    getCoinType(): number;
    getAccount(): number;
    getChange(): number;
    getIndex(): number;
    setCoinType(value: number): void;
    setAccount(value: number): void;
    setChange(value: number): void;
    setIndex(value: number): void;
    static fromOptions(options: IBip44PathOptions): Bip44Path;
    toOptions(): IBip44PathOptions;
    clone(): Bip44Path;
    nextIndex(): Bip44Path;
}

interface IPasswordCredentials {
    password: string;
}
interface IPrivateKeyCredentials {
    privateKey: Uint8Array;
}
interface ISeedCredentials {
    seed: string;
}
interface IPrivateKeyWithCredentials extends IPasswordCredentials {
    privateKey: Uint8Array;
}
interface IHDSecret extends ISeedCredentials {
    rootHDPath: Bip44Path;
}
interface IHDSecretRecord extends ISeedCredentials {
    rootHDPath: string;
}
interface IAccountHDData extends ISeedCredentials {
    path: string;
}
type TSecretsProviderInterface = () => any;
declare class SecretsProvider {
    #private;
    constructor(providerInterface: TSecretsProviderInterface);
    getSecret(): any;
}

declare const enum KeyUsage {
    ENCRYPT = "encrypt",
    DECRYPT = "decrypt",
    DERIVATION = "deriveKey"
}
type CryptoConfig = {
    readonly VERSION: number;
    readonly IV_LENGTH: number;
    readonly SALT_LENGTH: number;
    readonly KEY_SIZE_BITS: number;
    readonly KEY_IMPORT_FORMAT: "raw" | "pkcs8" | "spki";
    readonly KEY_DERIVATION_ITERATIONS: number;
    readonly KEY_DERIVATION_FUNCTION: string;
    readonly KEY_IMPORT_USAGE: KeyUsage[];
    readonly HASH_FUNCTION: string;
    readonly ALGORITHM: string;
};
type EncryptedData = {
    data: string;
    salt: string;
    iv: string;
    version: number;
};
declare class CryptoService {
    static encryptWithPassword(data: string, password: string): Promise<EncryptedData>;
    static decryptWithPassword(payload: EncryptedData, passphrase: string): Promise<string>;
    static decryptSignerData(signerData: EncryptedData, passwordProvider: SecretsProvider): Promise<IHDSecret | IPrivateKeyCredentials>;
    static deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
}

declare enum WalletTypes {
    PRIVATE_KEY = "private-key",
    HD = "hd"
}
interface ISignerOptions {
    id: string;
    encryptedSecret: EncryptedData;
}
type TPKSigningContext = {
    passwordProvider?: SecretsProvider;
};
type THDSigningContext = {
    passwordProvider?: SecretsProvider;
    index: number;
};
type ISignedMessageResponse = {
    signature: Uint8Array;
    publicKey: Uint8Array;
};
type TSigningContext = TPKSigningContext | THDSigningContext;
type TDecryptedSecret = IPrivateKeyCredentials | IHDSecret;
interface ISignerUnlockOptions {
    autoLockMs?: number;
    onAutoLock?: () => void;
}
interface ISignerRecord {
    id: string;
    type: WalletTypes;
    encryptedData: EncryptedData;
}
declare abstract class Signer {
    protected readonly id: string;
    protected encryptedSecret: EncryptedData;
    private session;
    constructor({ id, encryptedSecret }: ISignerOptions);
    getId(): string;
    getEncryptedSecret(): EncryptedData;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISignerUnlockOptions): Promise<void>;
    protected resolveSecret(signingContext: TSigningContext): Promise<{
        secret: TDecryptedSecret;
        ephemeral: boolean;
    }>;
    lock(): void;
    abstract sign(payload: string, signingContext: TSigningContext): Promise<ISignedMessageResponse>;
}

declare class ItemManager<T> {
    protected readonly items: Map<string, T>;
    constructor(items?: Map<string, T>);
    add(id: string, item: T): void;
    remove(id: string): T;
    get(id: string): T | null;
    hasByFilter(filter: (item: T) => boolean): boolean;
    has(id: string): boolean;
    getAll(): T[];
    getMap(): Map<string, T>;
    clear(): void;
}

interface ICreatedAccountData {
    accountId: string;
    account: Account;
}
declare class AccountManager extends ItemManager<Account> {
    private activeAccount;
    constructor(accounts?: Map<string, Account>, activeAccount?: Account | null);
    create(payload: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<ICreatedAccountData>;
    remove(id: string): Account;
    update(id: string, payload: TEditableAccountOptions): void;
    setActiveAccount(id: string): void;
    getActiveAccount(): Account | null;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getAccount(id: string): Account | null;
}

type TAxiosClientConfig = {
    baseUrl: string;
    axiosConfig?: AxiosRequestConfig;
};
declare abstract class BaseHttpClient {
    protected readonly client: AxiosInstance;
    constructor(config: TAxiosClientConfig);
    protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    protected post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

declare class BaseGraphQLClient {
    private readonly client;
    constructor(config: TAxiosClientConfig);
    query<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

/**
 * Important: This isn't pure UI pagination. It's SDK application layer pagination. It affects what data is retrieved during database queries.
 */
type Pagination = Partial<{
    offset: number;
    limit: number;
}>;

type NetworkId = string;
type NetworkName = string;
interface INetworkConfig {
    ValidatorURL: string;
    ReadOnlyURL: string;
    IndexerURL: string;
}
type TNetworksConfig = Record<NetworkName, INetworkConfig>;
interface INetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    isDefault: boolean;
}
interface INetworkUpdate {
    name?: NetworkName;
    config?: Partial<INetworkConfig>;
}

interface ITableRecord {
    id: string;
    [key: string]: any;
}
interface ITableService<T extends ITableRecord> {
    createTable(tableName: string, keyPath?: string): Promise<void>;
    insert(tableName: string, record: T): Promise<void>;
    insertMany(tableName: string, records: T[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<T | null>;
    getAll(tableName: string): Promise<T[]>;
    update(tableName: string, id: string | number, data: Partial<T>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    tableExists(tableName: string): Promise<boolean>;
    close: () => Promise<void>;
    init(): Promise<any>;
    isInitialized(): boolean;
}

type TransactionStatus = "pending" | "completed" | "failed";
type TransactionType = "send" | "receive" | "deploy";
interface Transaction {
    id: string;
    timestamp: Date;
    type: TransactionType;
    from: string;
    to?: string;
    amount?: string;
    deployId?: string;
    blockHash?: string;
    gasCost?: string;
    status: TransactionStatus;
    contractCode?: string;
    note?: string;
    networkId: NetworkId;
    detectedBy?: "balance_change" | "manual" | "auto";
}
interface ITransactionReservationPrivateData {
    timestamp: Date;
    accountId: string;
    pendingAmount: string;
    deployId: string;
    expirationTime: number;
}
interface ITransactionReservation extends ITransactionReservationPrivateData, ITableRecord {
    networkId: NetworkId;
}

interface TransactionHistoryQueryData {
    transfers?: RawTransfer[];
    deployments?: RawDeployment[];
}
interface RawTransfer {
    deploy_id: string;
    block_number?: number | string;
    block_hash?: string;
    from_address?: string;
    to_address?: string;
    amount_asi?: number | string;
    timestamp?: number | string;
    from_public_key?: string;
    network_name?: string;
}
interface RawDeployment {
    deploy_id: string;
    block_number?: number | string;
    deployer?: string;
    timestamp?: number | string;
    block?: {
        block_hash?: string;
    };
}

declare class IndexerClient extends BaseGraphQLClient {
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination): Promise<TransactionHistoryQueryData>;
}

interface IBalanceResponse {
    balance: number;
}
interface IBlockDto {
    blockInfo: string;
    blockNumber: number;
}
type TBlocksView = "summary" | "full";
interface IGetBlocksParams {
    start?: number;
    end?: number;
    view?: TBlocksView;
}
declare class ObserverClient extends BaseHttpClient {
    getDeploy(deployHash: string): Promise<unknown>;
    getBlock(blockHash: string): Promise<IBlockDto>;
    getBlocks(params?: IGetBlocksParams): Promise<IBlockDto[]>;
}

declare class ValidatorClient extends BaseHttpClient {
    submitDeploy(deploy: any): Promise<unknown>;
    submitExploratoryDeploy(rholangCode: string): Promise<any>;
    getStatus(): Promise<unknown>;
}

interface IApiClients {
    validator: ValidatorClient;
    observer: ObserverClient;
    indexer: IndexerClient;
}
declare class ApiClientManager {
    private static instance;
    private readonly networkConfigProvider;
    private validatorClient;
    private observerClient;
    private indexerClient;
    private currentNetworkId;
    private isInitialized;
    private constructor();
    static getInstance(): ApiClientManager;
    initialize(networksConfig: TNetworksConfig, customNetworks?: INetworkRecord[], networkName?: NetworkName): void;
    switchNetwork(networkId: NetworkId): void;
    getValidatorClient(): ValidatorClient;
    getObserverClient(): ObserverClient;
    getIndexerClient(): IndexerClient;
    getClients(): {
        validator: ValidatorClient;
        observer: ObserverClient;
        indexer: IndexerClient;
    };
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    getNetworkIds(): NetworkId[];
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    addNetwork(name: NetworkName, config: INetworkConfig): INetworkRecord;
    updateNetwork(id: NetworkId, update: INetworkUpdate): void;
    removeNetwork(id: NetworkId): void;
    isReady(): boolean;
    close(): void;
}

interface DeployData {
    term: string;
    phloLimit: number;
    phloPrice: number;
    validAfterBlockNumber: number;
    timestamp: number;
    shardId?: string;
}

interface SigningRequest {
    wallet: Wallet;
    data: any;
}
interface SignedResult {
    data: any;
    deployer: string;
    signature: string;
    sigAlgorithm: string;
}
declare class SignerService {
    static readonly deployDataProtobufSerialize: (deployData: DeployData) => Uint8Array;
}

declare enum DeployStatus {
    DEPLOYING = "Deploying",
    INCLUDED_IN_BLOCK = "IncludedInBlock",
    FINALIZED = "Finalized",
    CHECK_ERROR = "CheckingError"
}
type IDeployStatusResult = {
    status: DeployStatus.DEPLOYING | DeployStatus.INCLUDED_IN_BLOCK | DeployStatus.FINALIZED;
} | {
    status: DeployStatus.CHECK_ERROR;
    errorMessage: string;
};
declare class DeployService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    private extractDeployId;
    submitSignedDeploy(deploy: SignedResult): Promise<string | undefined>;
    exploreDeployData(rholangCode: string): Promise<any>;
    getDeploy(deployHash: string): Promise<any>;
    isDeployFinalized(deploy: any): Promise<boolean>;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
}

declare class BlockService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    getBlock(blockHash: string): Promise<string>;
    getLatestBlock(): Promise<IBlockDto>;
    getLatestBlockNumber(): Promise<number>;
    isValidatorActive(): Promise<boolean>;
}

interface ITransferDetails {
    to: Address;
    amount: bigint;
    asset: Asset;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
}
interface ITransferPayload {
    walletType: WalletTypes;
    account: Account;
    signer: Signer;
    details: ITransferDetails;
    passwordProvider?: SecretsProvider;
}
interface IDeployPayload {
    walletType: WalletTypes;
    account: Account;
    signer: Signer;
    term: string;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
    passwordProvider?: SecretsProvider;
}
declare class TransactionService {
    private readonly deployService;
    private readonly blockService;
    constructor(deployService: DeployService, blockService: BlockService);
    private signDeploy;
    transfer({ walletType, account, signer, details, passwordProvider, }: ITransferPayload): Promise<string>;
    deploy({ walletType, account, signer, term, phloLimit, phloPrice, shardId, passwordProvider, }: IDeployPayload): Promise<string>;
    private signAndSubmit;
}

type AddressBrand = {
    readonly __brand: unique symbol;
};
type Address = `1111${string & AddressBrand}`;
interface IWalletOptions {
    id?: string;
    type: WalletTypes;
    signer: Signer;
    accounts: Map<string, Account>;
    activeAccount?: Account;
}
type TCreateHDPathWalletOptions = {
    customHDPath: Bip44Path;
} | {
    index: number;
};
interface ICreateHDWalletOptions {
    mnemonic: string;
    pathOptions: TCreateHDPathWalletOptions;
    accountOptions: TCreateAccountPayload;
}
interface IRestoreWalletPayload {
    signerRecord: ISignerRecord;
    accountRecords: IAccountRecord[];
}
declare class Wallet {
    private readonly id;
    private readonly type;
    private readonly signer;
    private readonly accountManager;
    private constructor();
    getId(): string;
    getType(): WalletTypes;
    getSigner(): Signer;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISignerUnlockOptions): Promise<void>;
    lock(): void;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getActiveAccount(): Account | null;
    setActiveAccount(id: string): void;
    private getDerivationIndex;
    deriveAccount(payload: Omit<TCreateAccountPayload, "index">, passwordProvider: SecretsProvider): Promise<ICreatedAccountData>;
    removeAccount(id: string): Account;
    updateAccount(id: string, payload: TEditableAccountOptions): void;
    static createPk(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Wallet>;
    static createHD(options: ICreateHDWalletOptions, passwordProvider: SecretsProvider): Promise<Wallet>;
    static restore(payload: IRestoreWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    transfer(payload: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
}

interface IPortfolioOptions {
    assets?: Assets;
    primaryAsset?: Asset;
}
interface IAccountOptions {
    id?: string;
    name: string;
    index: number | null;
    address: Address;
    publicKey: Uint8Array;
    portfolioOptions?: IPortfolioOptions;
}
type TEditableAccountOptions = Partial<Pick<IAccountOptions, "name">>;
type TCreateAccountPayload = Omit<IAccountOptions, "address" | "index" | "publicKey"> & {
    index?: number;
};
interface IAccountRecord {
    id: string;
    signerId: string;
    name: string;
    index: number | null;
}
declare class Account {
    private readonly id;
    private readonly index;
    private readonly address;
    private readonly publicKey;
    private name;
    private assets;
    private primaryAsset;
    constructor({ id, name, index, portfolioOptions, address, publicKey, }: IAccountOptions);
    getId(): string;
    getName(): string;
    getIndex(): number | null;
    listAssets(): Asset[];
    getAddress(): Address;
    getPublicKey(): Uint8Array;
    getAsset(id: Asset["id"]): Asset | null;
    registerAsset(asset: Asset): void;
    setPrimaryAsset(id: Asset["id"]): void;
    static create(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Account>;
    update(options: TEditableAccountOptions): void;
    getBalance(): Promise<IBalanceData>;
    getTransactionsHistory(networkId?: NetworkId, pagination?: Pagination): Promise<Transaction[]>;
}

interface IStorageFabricOptions {
    nodeStorageDir?: string;
}

declare abstract class BaseStorageRepository<T extends ITableRecord> {
    protected readonly tableName: string;
    protected storageInterface: ITableService<ITableRecord>;
    private isInitialized;
    private initPromise;
    protected constructor(tableName: string, options?: IStorageFabricOptions);
    initialize(): Promise<void>;
    private doInitialize;
    protected ensureInitialized(): Promise<void>;
    getRawDB(): ITableService<ITableRecord>;
    protected insertRecord(record: T): Promise<void>;
    protected insertManyRecords(records: T[]): Promise<void>;
    protected getRecordById(id: string): Promise<T | null>;
    protected getAllRecords(): Promise<T[]>;
    protected updateRecord(id: string, updates: Partial<T>): Promise<void>;
    protected deleteRecord(id: string): Promise<void>;
    protected deleteManyRecords(ids: string[]): Promise<void>;
    protected hasRecord(id: string): Promise<boolean>;
    protected getRecordsCount(): Promise<number>;
    clearAllData(): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    isReady(): boolean;
    getTablesList(): Promise<string[]>;
    close(): void;
}

declare const ACCOUNTS_DATA_KEY: string;
interface IPublicWalletRecord extends ITableRecord {
    name: string;
    type: WalletTypes;
}
interface IWalletRecordEncryptedFields {
    keyData: string;
    depth: number | null;
    HDPath: string | null;
}
interface IFullWalletRecord extends IPublicWalletRecord, ITableRecord {
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
interface IAccountStorageRecord extends ITableRecord {
    signerId: string;
    name: string;
    index: number | null;
    createdAt: number;
    updatedAt?: number;
}
declare class AccountsStorageRepository extends BaseStorageRepository<IAccountStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): AccountsStorageRepository;
    saveAccount(accountId: string, signerId: string, name: string, index: number | null): Promise<void>;
    saveAccounts(accounts: IAccountStorageRecord[]): Promise<void>;
    getAccount(id: string): Promise<IAccountStorageRecord | null>;
    getAllAccounts(): Promise<IAccountStorageRecord[]>;
    updateAccount(accountId: string, updates: Partial<IAccountStorageRecord>): Promise<void>;
    deleteAccount(accountId: string): Promise<void>;
    deleteMultipleAccounts(accountIds: string[]): Promise<void>;
    hasAccount(accountId: string): Promise<boolean>;
    getAccountsCount(): Promise<number>;
}

declare class AccountDataService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination, networkId?: NetworkId): Promise<Transaction[]>;
}

interface IBalanceData {
    amount: bigint;
    asset: Asset;
}
declare class AssetsService {
    private readonly deployService;
    constructor(deployService: DeployService);
    getBalance(address: Address, asset: Asset): Promise<IBalanceData>;
}

interface IDeployConfirmedResult {
    deployId: string;
    blockHash?: string;
}
interface IDeployWatchCallbacks {
    onConfirmed?: (result: IDeployConfirmedResult) => void;
    onError?: (error: Error) => void;
    onStatus?: (status: IDeployStatusResult, deployId: string) => void;
}
interface IDeployWatchOptions {
    intervalMs?: number;
    timeoutMs?: number;
}
interface IDeployWatchHandle {
    cancel: () => void;
    done: Promise<IDeployConfirmedResult>;
}
declare class DeployStatusPoller {
    private readonly deployService;
    constructor(deployService: DeployService);
    watch(deployId: string, callbacks?: IDeployWatchCallbacks, { intervalMs, timeoutMs, }?: IDeployWatchOptions): IDeployWatchHandle;
    waitFor(deployId: string, options?: IDeployWatchOptions): Promise<IDeployConfirmedResult>;
}

declare class ApiServiceRegistry {
    private static instance;
    readonly deploy: DeployService;
    readonly blocks: BlockService;
    readonly accountData: AccountDataService;
    readonly assets: AssetsService;
    readonly transactions: TransactionService;
    readonly poller: DeployStatusPoller;
    private constructor();
    static getInstance(apiClientManager?: ApiClientManager): ApiServiceRegistry;
}

interface IAutoTimerOptions {
    delayMs: number;
    onElapsed: () => void;
}
declare class AutoTimer {
    private readonly delayMs;
    private readonly onElapsed;
    private timer;
    constructor({ delayMs, onElapsed }: IAutoTimerOptions);
    isActive(): boolean;
    start(): void;
    clear(): void;
}

declare class BinaryWriterService {
    private buffer;
    writeString(fieldNumber: number, value: string): void;
    writeInt64(fieldNumber: number, value: number): void;
    private writeInteger;
    private writeInteger64;
    getResultBuffer(): Uint8Array;
}

declare class BrowserStorage implements ITableService<ITableRecord> {
    private static instance;
    private readonly name;
    private storageInterface;
    constructor(name?: string);
    static getInstance(name?: string): BrowserStorage;
    init(): Promise<IDBDatabase>;
    createTable(tableName: string, keyPath?: string): Promise<void>;
    insert(tableName: string, record: ITableRecord): Promise<void>;
    insertMany(tableName: string, records: ITableRecord[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<ITableRecord | null>;
    getAll(tableName: string): Promise<ITableRecord[]>;
    update(tableName: string, id: string | number, data: Partial<ITableRecord>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    tableExists(tableName: string): Promise<boolean>;
    getVersion(): number;
    getDatabaseName(): string;
    getTableNamesList(): string[];
    private executeTransaction;
    isInitialized(): boolean;
    close(): Promise<void>;
}

declare enum MnemonicStrength {
    TWELVE_WORDS = 128,
    TWENTY_FOUR_WORDS = 256
}
declare class MnemonicService {
    static generateMnemonic(strength?: MnemonicStrength): string;
    static generateMnemonicArray(strength?: MnemonicStrength): string[];
    static isMnemonicValid(mnemonic: string): boolean;
    static mnemonicToWordArray(mnemonic: string): string[];
    static wordArrayToMnemonic(words: string[]): string;
    static mnemonicToSeed(mnemonic: string | string[], passphrase?: string): Promise<Uint8Array>;
}

interface IAccountMetadata {
    id: string;
    name: string;
    index: number | null;
}
interface IWalletMetadata {
    signerId: string;
    type: WalletTypes;
    accounts: IAccountMetadata[];
}
interface ICreateHDWalletParams {
    mnemonic: string;
    accountName: string;
    index?: number;
}
interface IDerivedAccount {
    accountId: string;
    account: Account;
}
declare class WalletManager extends ItemManager<Wallet> {
    createHD({ mnemonic, accountName, index }: ICreateHDWalletParams, passwordProvider: SecretsProvider): Promise<Wallet>;
    createPrivateKey(accountName: string, secretProvider: SecretsProvider): Promise<Wallet>;
    unlock(signerId: string, passwordProvider: SecretsProvider): Promise<Wallet>;
    delete(id: string): Promise<Wallet>;
    deriveAccount(walletId: string, accountName: string, passwordProvider: SecretsProvider): Promise<IDerivedAccount>;
    removeAccount(walletId: string, accountId: string): Promise<Account>;
    renameAccount(walletId: string, accountId: string, name: string): Promise<void>;
    getAccount(walletId: string, accountId: string): Account;
    setActiveAccount(walletId: string, accountId: string): void;
    getPublicWalletsMetadata(): Promise<IWalletMetadata[]>;
    count(): Promise<number>;
    countInStorage(): Promise<number>;
    private persist;
}

declare const INSENSITIVE_CACHE_TABLE_KEY = "INSENSITIVE_CACHE";
interface IInsensitiveCacheRecord extends ITableRecord {
    address: string;
    publicKey: string;
}
declare class InsensitiveCacheStorageRepository extends BaseStorageRepository<IInsensitiveCacheRecord> {
    private static instance;
    constructor();
    static getInstance(): InsensitiveCacheStorageRepository;
    saveRecord(record: IInsensitiveCacheRecord): Promise<void>;
    getRecord(id: string): Promise<IInsensitiveCacheRecord | null>;
    getAllRecords(): Promise<IInsensitiveCacheRecord[]>;
    updateRecord(id: string, updates: Partial<IInsensitiveCacheRecord>): Promise<void>;
    deleteRecord(id: string): Promise<void>;
    clear(): Promise<void>;
}

interface IUnlockedWallet {
    id: string;
    signerId: string;
    type: WalletTypes;
    accounts: Account[];
    activeAccountId: string | null;
}
interface ICreateHDWalletPayload {
    mnemonic: string;
    accountName: string;
    index?: number;
}
interface ICreatePrivateKeyWalletPayload {
    privateKey: Uint8Array;
    accountName: string;
}
interface ITransferRequest {
    walletId: string;
    accountId: string;
    to: Address;
    amount: bigint;
}
interface IDeployRequest {
    walletId: string;
    accountId: string;
    term: string;
    phloLimit?: number;
}
interface IClientEventDispatcher {
    onWalletsChanged?(wallets: Wallet[]): void;
    onAccountsChanged?(walletId: string, accounts: Account[]): void;
    onNetworkChanged?(network: INetworkRecord): void;
    onReservationsChanged?(walletId: string, reservations: ITransactionReservation[]): void;
    onWalletLocked?(walletId: string): void;
}
interface ISessionPolicy {
    autoLockMs?: number;
    requirePassword?: RequirePassword;
}
interface ICreateClientFlags {
    withInsensitiveCacheStorage?: boolean;
}
interface ICreateClientOptions {
    networksConfig: TNetworksConfig;
    defaultNetwork?: NetworkName;
    storageOptions?: IStorageFabricOptions;
    eventDispatcher?: IClientEventDispatcher;
    flags?: ICreateClientFlags;
    security?: ISessionPolicy;
}
declare class Client {
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

declare enum CustomErrorCode {
    WALLET_LOCKED = "WALLET_LOCKED"
}
declare class CustomError extends Error {
    readonly code: CustomErrorCode;
    readonly status: number;
    constructor(code: CustomErrorCode, message: string, status: number);
}
declare class WalletLockedError extends CustomError {
    constructor(message?: string);
}

declare class NetworkConfigProvider {
    private networksRecords;
    private validateConfigUrls;
    initialize(config: TNetworksConfig): void;
    restoreCustomNetworks(records: INetworkRecord[]): void;
    getAll(): INetworkRecord[];
    get(id: NetworkId): INetworkRecord;
    getIds(): NetworkId[];
    add(name: NetworkName, networkConfig: INetworkConfig): INetworkRecord;
    remove(id: NetworkId): INetworkRecord;
    update(id: NetworkId, update: INetworkUpdate): void;
    isReady(): boolean;
}

declare class NodeStorage implements ITableService<ITableRecord> {
    private static instance;
    private readonly storageDir;
    private storageInterface;
    constructor(storageDir?: string);
    static getInstance(storageDir?: string): NodeStorage;
    init(): Promise<void>;
    private getTableKey;
    private getTable;
    private saveTable;
    createTable(tableName: string, _keyPath: string): Promise<void>;
    insert(tableName: string, record: ITableRecord): Promise<void>;
    insertMany(tableName: string, records: ITableRecord[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<ITableRecord | null>;
    getAll(tableName: string): Promise<ITableRecord[]>;
    update(tableName: string, id: string | number, data: Partial<ITableRecord>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    isInitialized(): boolean;
    getKeys(): Promise<string[]>;
    tableExists(tableName: string): Promise<boolean>;
    close(): Promise<void>;
}

declare const SIGNERS_DATA_KEY: string;
interface IPrivateKeySignerEncryptedFields {
    keyData: Uint8Array;
}
interface IHDSignerEncryptedFields {
    seed: string;
    rootHDPath: string;
}
interface ISignerStorageRecord extends ITableRecord {
    type: WalletTypes;
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
declare class SignersStorageRepository extends BaseStorageRepository<ISignerStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): SignersStorageRepository;
    saveSigner(signerId: string, type: WalletTypes, encryptedData: EncryptedData): Promise<void>;
    getSigner(id: string): Promise<ISignerStorageRecord | null>;
    getAllSigners(): Promise<ISignerStorageRecord[]>;
    updateSigner(signerId: string, updates: Partial<ISignerStorageRecord>): Promise<void>;
    deleteSigner(signerId: string): Promise<void>;
    deleteMultipleSigners(signerIds: string[]): Promise<void>;
    hasSigner(signerId: string): Promise<boolean>;
    getSignersCount(): Promise<number>;
}

declare const TRANSACTION_RESERVATIONS_DATA_KEY: string;
interface ITransactionReservationsStorageRecord extends ITableRecord {
    networkId: NetworkId;
    signerId: string;
    privateData: ITransactionReservationPrivateData;
    createdAt: number;
    updatedAt?: number;
}
declare class TransactionReservationsStorageRepository extends BaseStorageRepository<ITransactionReservationsStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): TransactionReservationsStorageRepository;
    saveTransactionReservation(id: string, networkId: NetworkId, signerId: string, privateData: ITransactionReservationPrivateData): Promise<void>;
    getTransactionReservations(id: string): Promise<ITransactionReservationsStorageRecord | null>;
    getAllTransactionReservations(): Promise<ITransactionReservationsStorageRecord[]>;
    updateTransactionReservation(id: string, updates: Partial<ITransactionReservationsStorageRecord>): Promise<void>;
    deleteTransactionReservation(id: string): Promise<void>;
    deleteMultipleTransactionReservations(ids: string[]): Promise<void>;
    hasTransactionReservations(id: string): Promise<boolean>;
    getTransactionReservationsCount(): Promise<number>;
}

interface IDisposable {
    dispose(): void;
}
declare class DisposableItemManager<T extends IDisposable> extends ItemManager<T> {
    add(id: string, item: T): void;
    remove(id: string): T;
    clear(): void;
}

interface IAccountKeyfileInput {
    address: string;
    encryptedPrivateKey: EncryptedData;
}
declare class ExportService {
    static exportAccountKeyfile(input: IAccountKeyfileInput): string;
    static exportTransactions(transactions: Transaction[], format?: ExportFormat): string;
    private static escapeCsvValue;
}

interface ITransactionReservationsManagerOptions {
    onConfirmed?: (reservation: ITransactionReservation) => void;
    onExpired?: (reservation: ITransactionReservation) => void;
    onFailed?: (reservation: ITransactionReservation, error: Error) => void;
    watchCallbacks?: IDeployWatchCallbacks;
    watchOptions?: IDeployWatchOptions;
}

declare class ReservationAdapter {
    private readonly reservationsManager;
    constructor(reservations: ITransactionReservation[], reservationsManagerOptions?: Omit<ITransactionReservationsManagerOptions, "onConfirmed" | "onExpired">);
    static create(wallet: Wallet, reservationsManagerOptions?: Omit<ITransactionReservationsManagerOptions, "onConfirmed" | "onExpired">): Promise<ReservationAdapter>;
    private getReservedAmount;
    getBalance(account: Account): Promise<IBalanceData>;
    getReservations(): ITransactionReservation[];
    dispose(): void;
    private persistReservation;
    validateSufficientBalance(account: Account, amount: bigint): Promise<boolean>;
    transfer(wallet: Wallet, details: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
}

declare class ReservationAdapterManager extends DisposableItemManager<ReservationAdapter> {
    create(wallet: Wallet): Promise<ReservationAdapter>;
}

declare class KeyDerivationService {
    static deriveKeyFromMnemonic(mnemonic: string | string[], bip44path: string | Bip44Path): Promise<Uint8Array>;
    static derivePrivateKey(masterNode: BIP32Interface, path: Bip44Path): Uint8Array;
    static mnemonicToSeed(mnemonicWords: string[] | string, passphrase?: string): Promise<Uint8Array>;
    static seedToMasterNode(seed: any): BIP32Interface;
    static deriveNextKeyFromMnemonic(mnemonicWords: string[], currentIndex: number, options?: Omit<IBip44PathOptions, "index">): Promise<Uint8Array>;
}

type KeyPair = {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
};
interface IBaseHDWalletPrivateKeyData {
    path: Bip44Path;
    privateKey: Uint8Array;
}
interface IHDWalletPrivateKeyDataFromMnemonic extends IBaseHDWalletPrivateKeyData {
    seed: Uint8Array;
}
interface IHDWalletPrivateKeyDataFromSeed extends IBaseHDWalletPrivateKeyData {
    index: number;
}
declare class KeysManager {
    static generateRandomKey(length?: number): Uint8Array;
    static generateKeyPair(keyLength?: number): KeyPair;
    static getKeyPairFromPrivateKey(privateKey: Uint8Array): KeyPair;
    static getPublicKeyFromPrivateKey(privateKey: Uint8Array): Uint8Array;
    static convertKeyToHex(key: Uint8Array): string;
    static getInitialHDPathFromOptions(hdWalletOptions: TCreateHDPathWalletOptions): Promise<Bip44Path>;
    static getPrivateDataFromSeed(seed: Uint8Array, path: Bip44Path): Promise<IHDWalletPrivateKeyDataFromSeed>;
}

interface ISaveSignerToStorageOptions {
    id: string;
    type: WalletTypes;
    signer: Signer;
}
interface ISaveAccountToStorageOptions {
    id: string;
    account: Account;
    signerId: string;
}
interface ISaveWalletToStorageOptions {
    signerId: string;
    wallet: Wallet;
}
interface IGetWalletFromStorageOptions {
    signerId: string;
    passwordProvider: SecretsProvider;
}
interface IWalletStorageData {
    signer: ISignerRecord;
    accounts: IAccountRecord[];
}
interface ISaveTransactionReservationsOptions {
    id: string;
    networkId: NetworkId;
    signerId: string;
    privateData: ITransactionReservationPrivateData;
}
declare class StorageManager {
    static init: (options?: IStorageFabricOptions) => Promise<void>;
    static saveSigner: ({ id, type, signer, }: ISaveSignerToStorageOptions) => Promise<void>;
    static saveSigners: (signersOptions: ISaveSignerToStorageOptions[]) => Promise<void[]>;
    static getSigner: (id: string) => Promise<ISignerRecord>;
    static getSigners: () => Promise<ISignerRecord[]>;
    static updateSigner: (id: string, updates: Partial<ISignerRecord>) => Promise<void>;
    static deleteSigner: (id: string) => Promise<void>;
    static deleteMultipleSigners: (ids: string[]) => Promise<void>;
    static saveAccount: ({ id, account, signerId, }: ISaveAccountToStorageOptions) => Promise<void>;
    static saveAccounts: (accountsOptions: ISaveAccountToStorageOptions[]) => Promise<void>;
    static getAccount: (id: string) => Promise<IAccountRecord>;
    static getAccounts: () => Promise<IAccountRecord[]>;
    static updateAccount: (id: string, updates: Partial<IAccountRecord>) => Promise<void>;
    static deleteAccount: (id: string) => Promise<void>;
    static deleteMultipleAccounts: (ids: string[]) => Promise<void>;
    static saveWallet: ({ signerId, wallet, }: ISaveWalletToStorageOptions) => Promise<void>;
    static saveWallets: (walletsOptions: ISaveWalletToStorageOptions[]) => Promise<void[]>;
    static getWallet: ({ signerId, passwordProvider, }: IGetWalletFromStorageOptions) => Promise<Wallet>;
    static getWallets: () => Promise<IWalletStorageData[]>;
    static saveTransactionReservation: ({ id, networkId, signerId, privateData, }: ISaveTransactionReservationsOptions) => Promise<void>;
    static getTransactionReservationsBySignerId: (signerId: string, networkId: NetworkId) => Promise<ITransactionReservationsStorageRecord[]>;
    static updateTransactionReservation: (id: string, updates: Partial<ITransactionReservationsStorageRecord>) => Promise<void>;
    static deleteTransactionReservation: (id: string) => Promise<void>;
    static deleteMultipleTransactionReservations: (ids: string[]) => Promise<void>;
    static getCustomNetworks: () => Promise<INetworkRecord[]>;
    static saveCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static updateCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static deleteCustomNetwork: (id: NetworkId) => Promise<void>;
    static clear: () => Promise<void>;
    static close: () => void;
}

interface CreateWalletOptions {
    name?: string;
}
interface WalletMeta {
    address: string;
    privateKey: Uint8Array;
    publicKey?: Uint8Array;
    mnemonic?: string;
}
declare class WalletsService {
    static createWallet(privateKey?: Uint8Array, options?: CreateWalletOptions): WalletMeta;
    static createFirstWalletWithMnemonic(mnemonic?: string, index?: number): Promise<WalletMeta>;
    static deriveAddressFromPrivateKey(privateKey: Uint8Array): Address;
    static deriveAddressFromPublicKey(publicKey: Uint8Array): Address;
}

declare const PRIVATE_KEY_LENGTH = 32;
declare const ASI_CHAIN_PREFIX: {
    coinId: string;
    version: string;
};
declare const ASI_COIN_TYPE = 60;
declare const ASI_DECIMALS = 8;
declare const HEX_RADIX: number;
declare const HEX_BYTE_PADDING: number;
declare const POWER_BASE: number;
declare const ASI_BASE_UNIT: bigint;
declare const FAULT_TOLERANCE_THRESHOLD: number;
declare const INVALID_BLOCK_NUMBER = -1;
declare const DEFAULT_BIP_44_PATH_OPTIONS: {
    coinType: number;
    account: number;
    change: number;
    index: number;
};

declare const setupBufferPolyfill: () => void;

declare const encodeBase58: (hex: string) => string;
declare const decodeBase58: (value: string) => Uint8Array;
declare const decodeBase16: (hex: string) => Uint8Array;
declare const encodeBase16: (bytes: Uint8Array) => string;
declare const arrayBufferToBase64: (buffer: ArrayBuffer) => string;
declare const base64ToArrayBuffer: (base64: string) => ArrayBuffer;
declare const bufferToBigInt: (buffer: Uint8Array) => bigint;
declare const bigIntToBuffer: (num: bigint) => Uint8Array;

declare const genRandomHex: (size: number) => string;
declare const generateRandomId: () => string;
declare const toAtomicAmount: (amount: number | string, decimals: number) => bigint;
declare const fromAtomicAmountToNumber: (atomicAmount: bigint, decimals: number) => number;
declare const fromAtomicAmount: (atomicAmount: bigint, decimals: number) => string;
declare const toUint8Array: (value: unknown) => Uint8Array;
type IUrlValue = string | number | boolean | undefined;
interface IUrlParams {
    path?: Record<string, IUrlValue>;
    query?: Record<string, IUrlValue | undefined | null>;
}
declare const buildUrl: (pathPrefix: string, params?: IUrlParams) => string;
/**
 * @returns address in the format accepted within the SDK application
 */
declare function normalizeAddress(address: string | undefined): string;

declare const validateAccountName: (name: string, maxLength?: number) => {
    isValid: boolean;
    error?: string;
};
declare enum AddressValidationErrorCode {
    INVALID_PREFIX = "INVALID_PREFIX",
    INVALID_LENGTH = "INVALID_LENGTH",
    INVALID_ALPHABET = "INVALID_ALPHABET",
    INVALID_BASE58 = "INVALID_BASE58",
    INVALID_HEX_LENGTH = "INVALID_HEX_LENGTH",
    INVALID_CHAIN_PREFIX = "INVALID_CHAIN_PREFIX",
    INVALID_CHECKSUM = "INVALID_CHECKSUM",
    NON_CANONICAL = "NON_CANONICAL"
}
interface AddressValidationResult {
    isValid: boolean;
    errorCode?: AddressValidationErrorCode;
}
declare const validateAddress: (address: string) => AddressValidationResult;
declare const isAddress: (address: string) => address is Address;
declare const validateUrl: (url: string) => {
    isValid: boolean;
    error?: string;
};
declare const isValidUrl: (url: string) => boolean;

export { ACCOUNTS_DATA_KEY, ASI_BASE_UNIT, ASI_CHAIN_PREFIX, ASI_COIN_TYPE, ASI_DECIMALS, ASI_WALLET_KEYFILE, ASI_WALLET_KEYFILE_VERSION, Account, AccountDataService, AccountManager, AccountsStorageRepository, AddressValidationErrorCode, ApiClientManager, ApiServiceRegistry, Asset, AssetsService, AutoTimer, BaseGraphQLClient, BaseHttpClient, BinaryWriterService as BinaryWriter, Bip44Path, BlockService, BrowserStorage, Client, CryptoService as Crypto, CustomError, CustomErrorCode, DEFAULT_ASSET, DEFAULT_AUTO_LOCK_MS, DEFAULT_BIP_44_PATH_OPTIONS, DEFAULT_NODE_STORAGE_DIR, DEFAULT_PHLO_LIMIT, DEFAULT_PHLO_PRICE, DEPLOY_STATUS_POLLING_TIMEOUT, DeployService, DeployStatus, DeployStatusPoller, DisposableItemManager, ExportFormat, ExportService, FAULT_TOLERANCE_THRESHOLD, GasFee, HEX_BYTE_PADDING, HEX_RADIX, INSENSITIVE_CACHE_TABLE_KEY, INVALID_BLOCK_NUMBER, IndexerClient, InsensitiveCacheStorageRepository, ItemManager, KeyDerivationService as KeyDerivation, KeysManager, MnemonicService as Mnemonic, MnemonicStrength, NATIVE_TOKEN_DECIMALS_AMOUNT, NetworkConfigProvider, NodeStorage, ObserverClient, POWER_BASE, PRIVATE_KEY_LENGTH, RESERVATION_EXPIRATION_TIME, RequirePassword, ReservationAdapterManager, SIGNERS_DATA_KEY, SecretsProvider, Signer, SignerService, SignersStorageRepository, StorageManager, TRANSACTIONS_CSV_HEADERS, TRANSACTION_RESERVATIONS_DATA_KEY, TransactionReservationsStorageRepository, TransactionService, ValidatorClient, Wallet, WalletLockedError, WalletManager, WalletTypes, WalletsService as Wallets, arrayBufferToBase64, base64ToArrayBuffer, bigIntToBuffer, bufferToBigInt, buildUrl, decodeBase16, decodeBase58, encodeBase16, encodeBase58, fromAtomicAmount, fromAtomicAmountToNumber, genRandomHex, generateRandomId, isAddress, isValidUrl, normalizeAddress, setupBufferPolyfill, toAtomicAmount, toUint8Array, validateAccountName, validateAddress, validateUrl };
export type { Address, AddressValidationResult, AssetId, Assets, CreateWalletOptions, CryptoConfig, DeployData, EncryptedData, IAccountHDData, IAccountKeyfileInput, IAccountMetadata, IAccountOptions, IAccountRecord, IAccountStorageRecord, IApiClients, IAssetOptions, IAutoTimerOptions, IBalanceData, IBalanceResponse, IBaseHDWalletPrivateKeyData, IBip44PathOptions, IBlockDto, IClientEventDispatcher, ICreateClientFlags, ICreateClientOptions, ICreateHDWalletOptions, ICreateHDWalletParams, ICreateHDWalletPayload, ICreatePrivateKeyWalletPayload, ICreatedAccountData, IDeployConfirmedResult, IDeployPayload, IDeployRequest, IDeployStatusResult, IDeployWatchCallbacks, IDeployWatchHandle, IDeployWatchOptions, IDerivedAccount, IDisposable, IFullWalletRecord, IGetBlocksParams, IGetWalletFromStorageOptions, IHDSecret, IHDSecretRecord, IHDSignerEncryptedFields, IHDWalletPrivateKeyDataFromMnemonic, IHDWalletPrivateKeyDataFromSeed, IInsensitiveCacheRecord, INetworkConfig, INetworkRecord, INetworkUpdate, IPasswordCredentials, IPortfolioOptions, IPrivateKeyCredentials, IPrivateKeySignerEncryptedFields, IPrivateKeyWithCredentials, IPublicWalletRecord, IRestoreWalletPayload, ISaveAccountToStorageOptions, ISaveSignerToStorageOptions, ISaveTransactionReservationsOptions, ISaveWalletToStorageOptions, ISeedCredentials, ISessionPolicy, ISignedMessageResponse, ISignerOptions, ISignerRecord, ISignerStorageRecord, ISignerUnlockOptions, ITableRecord, ITableService, ITransactionReservation, ITransactionReservationPrivateData, ITransactionReservationsStorageRecord, ITransferDetails, ITransferPayload, ITransferRequest, IUnlockedWallet, IUrlParams, IUrlValue, IWalletMetadata, IWalletOptions, IWalletRecordEncryptedFields, IWalletStorageData, KeyPair, NetworkId, NetworkName, SignedResult, SigningRequest, TAxiosClientConfig, TBlocksView, TCreateAccountPayload, TCreateHDPathWalletOptions, TDecryptedSecret, TEditableAccountOptions, THDSigningContext, TNetworksConfig, TPKSigningContext, TSecretsProviderInterface, TSigningContext, Transaction, TransactionStatus, TransactionType, WalletMeta };
