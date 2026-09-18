import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { BIP32Interface } from 'bip32';

declare const NATIVE_TOKEN_DECIMALS_AMOUNT: number;
declare const DEFAULT_PHLO_LIMIT: number;
declare const DEFAULT_PHLO_PRICE: number;
declare const DEFAULT_NODE_STORAGE_DIR: string;
declare enum KeyfileTypes {
    WALLET = "asi-wallet-keyfile",
    ACCOUNT = "asi-account-keyfile"
}
declare const CURRENT_STORAGE_VERSION: number;
declare const BASELINE_STORAGE_VERSION: number;
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
declare const DEFAULT_REQUEST_TIMEOUT: number;
declare const RequirePassword: {
    readonly ONCE_PER_SESSION: "once-per-session";
    readonly EVERY_SIGNATURE: "every-signature";
};
type RequirePassword = (typeof RequirePassword)[keyof typeof RequirePassword];
declare const DEFAULT_AUTO_LOCK_MS: number;
declare const DEFAULT_DRAIN_TIMEOUT_MS: number;

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
    private static readonly HARDENED_SUFFIX;
    private static readonly MIN_CHANGE;
    private static readonly MAX_CHANGE;
    private static readonly PATH_COMPONENTS_COUNT;
    private static readonly PURPOSE_INDEX;
    private static readonly COIN_TYPE_INDEX;
    private static readonly ACCOUNT_INDEX;
    private static readonly CHANGE_INDEX;
    private static readonly INDEX_COMPONENT_INDEX;
    private static readonly DECIMAL_RADIX;
    private static readonly MAX_COMPONENT_VALUE;
    private coinType;
    private account;
    private change;
    private index;
    constructor({ coinType, account, change, index, }: IBip44PathOptions);
    static parse(pathString: string): Bip44Path;
    static isValid(pathString: string): boolean;
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
interface IStoredPrivateKeySecret {
    privateKey: unknown;
}
type TStoredSecret = IHDSecretRecord | IStoredPrivateKeySecret;
type TDecryptedSecret = IPrivateKeyCredentials | IHDSecret;
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
    readonly AUTH_TAG_LENGTH: number;
    readonly DATA_KEY_LENGTH: number;
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
interface IDecodeEncryptedFieldConfig {
    minimalLength?: number;
    length?: number;
}
declare class CryptoService {
    static generateDataKeySecret(): string;
    static encryptWithPassword(data: string, password: string): Promise<EncryptedData>;
    private static decodeEncryptedField;
    static decryptWithPassword(payload: EncryptedData, passphrase: string): Promise<string>;
    static decryptSignerData(signerData: EncryptedData, passwordProvider: SecretsProvider): Promise<IHDSecret | IPrivateKeyCredentials>;
    static deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
}

interface ISigningSessionOptions {
    autoLockMs?: number;
    onAutoLock?: () => void;
}
interface ISigningSessionSecrets {
    secret: TDecryptedSecret;
    dataKeySecret: string;
}
declare class SigningSession {
    private readonly signerId;
    private state;
    private generation;
    constructor(signerId: string);
    isActive(): boolean;
    getSecret(): TDecryptedSecret | null;
    getDataKey(): string | null;
    getSessionGeneration(): number;
    private wipeSecret;
    release(): void;
    hold(currentGeneration: number, secrets: ISigningSessionSecrets, options?: ISigningSessionOptions): void;
}

declare const SIGNER_KEY_PREFIX: string;
declare enum WalletTypes {
    PRIVATE_KEY = "private-key",
    HD = "hd"
}
interface ISignerOptions {
    id: string;
    encryptedSecret: EncryptedData;
    encryptedDataKey: EncryptedData;
    fingerprint: string;
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
interface ISignerRecord {
    id: string;
    type: WalletTypes;
    encryptedData: EncryptedData;
    encryptedDataKey: EncryptedData;
    fingerprint: string;
}
declare abstract class Signer {
    protected readonly id: string;
    protected encryptedSecret: EncryptedData;
    protected encryptedDataKey: EncryptedData;
    private readonly fingerprint;
    private readonly session;
    constructor({ id, encryptedSecret, encryptedDataKey, fingerprint, }: ISignerOptions);
    getId(): string;
    getFingerprint(): string;
    getEncryptedSecret(): EncryptedData;
    getEncryptedDataKey(): EncryptedData;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISigningSessionOptions): Promise<void>;
    resolveDataKey(passwordProvider?: SecretsProvider): Promise<string>;
    protected resolveSecret(signingContext: TSigningContext): Promise<{
        secret: TDecryptedSecret;
        ephemeral: boolean;
    }>;
    lock(): void;
    isPasswordValid(passwordProvider: SecretsProvider): Promise<boolean>;
    abstract sign(payload: string, signingContext: TSigningContext): Promise<ISignedMessageResponse>;
}

declare class ItemManager<T> {
    protected readonly items: Map<string, T>;
    constructor(items?: Map<string, T>);
    add(id: string, item: T): void;
    addMany(entries: Iterable<[string, T]>): void;
    remove(id: string): T;
    get(id: string): T | null;
    removeByFilter(filter: (item: T) => boolean): T[];
    getByFilter(filter: (item: T) => boolean): T[];
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
    private static orderAccounts;
    constructor(accounts?: Map<string, Account>);
    private reorder;
    create(payload: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<ICreatedAccountData>;
    addAccounts(accounts: Account[]): void;
    update(id: string, payload: TEditableAccountOptions): void;
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

declare enum NodeApiProfile {
    SCALA = "scala",
    RUST = "rust"
}
declare enum NodeApiProfileStability {
    STABLE = "stable",
    EXPERIMENTAL = "experimental"
}
declare const DEFAULT_NODE_API_PROFILE: NodeApiProfile;
declare const NODE_API_PROFILES: NodeApiProfile[];
interface INodeApiProfileDescriptor {
    profile: NodeApiProfile;
    label: string;
    description: string;
    stability: NodeApiProfileStability;
}
declare const NODE_API_PROFILE_DESCRIPTORS: Record<NodeApiProfile, INodeApiProfileDescriptor>;

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
    submitExploratoryDeploy(body: unknown): Promise<any>;
}

interface DeployData {
    term: string;
    phloLimit: number;
    phloPrice: number;
    validAfterBlockNumber: number;
    timestamp: number;
    shardId?: string;
}
interface IDeployInfo {
    blockHash?: string;
    faultTolerance?: number;
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

interface IExploratoryDeployClient {
    submitExploratoryDeploy(body: unknown): Promise<unknown>;
}
declare abstract class NodeApiAdapter {
    protected readonly clients: IApiClients;
    constructor(clients: IApiClients);
    abstract getProfile(): NodeApiProfile;
    submitDeploy(deploy: SignedResult): Promise<unknown>;
    protected getExploreDeployClient(): IExploratoryDeployClient;
    protected buildExploreDeployBody(term: string): unknown;
    exploreDeploy(term: string): Promise<unknown>;
    getDeploy(deployHash: string): Promise<unknown>;
    isDeployFinalized(deploy: IDeployInfo): boolean;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
    getBlock(blockHash: string): Promise<IBlockDto>;
    getBlocks(params?: IGetBlocksParams): Promise<IBlockDto[]>;
    getValidatorStatus(): Promise<unknown>;
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination): Promise<TransactionHistoryQueryData>;
}

type NetworkId = string;
type NetworkName = string;
interface INetworkEndpoints {
    ValidatorURL: string;
    ReadOnlyURL: string;
    IndexerURL: string;
}
interface INetworkConfig extends INetworkEndpoints {
    nodeApiProfile: NodeApiProfile;
}
type TNetworksConfig = Record<NetworkName, INetworkConfig>;
interface INetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    isDefault: boolean;
}
interface IPersistedNetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
}
interface INetworkUpdate {
    name?: NetworkName;
    config?: Partial<INetworkConfig>;
}
type TNetworkBusyListener = (networkId: NetworkId, isBusy: boolean) => void;
interface INetworkContext {
    networkId: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    clients: IApiClients;
    api: NodeApiAdapter;
}
declare const NETWORK_URL_FIELDS: (keyof INetworkEndpoints)[];
declare const NETWORK_CONFIG_FIELDS: (keyof INetworkConfig)[];

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
    getTableNames(): Promise<string[]>;
    close: () => Promise<void>;
    init(): Promise<any>;
    isInitialized(): boolean;
}
interface ISchemeVersionRecord {
    schemaVersion: number;
}

declare const TRANSACTION_STATUSES: readonly ["pending", "completed", "failed"];
declare const TRANSACTION_TYPES: readonly ["send", "receive", "deploy"];
declare const TRANSACTION_DETECTED_BY_TYPES: readonly ["balance_change", "manual", "auto"];
declare const TRANSACTION_RESERVATION_KINDS: readonly ["transfer", "deploy"];
type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
type TransactionType = (typeof TRANSACTION_TYPES)[number];
type TransactionDetectedBy = (typeof TRANSACTION_DETECTED_BY_TYPES)[number];
type TransactionReservationKind = (typeof TRANSACTION_RESERVATION_KINDS)[number];
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
    networkId: NetworkId;
    detectedBy?: TransactionDetectedBy;
}
type TSerializedTransaction = Omit<Transaction, "timestamp"> & {
    timestamp: string;
};
interface ITransactionReservationDetails {
    deployId: string;
    timestamp: Date;
    from: string;
    to?: string;
    amount?: string;
    gasCost?: string;
    contractCode?: string;
}
type TSerializedTransactionReservationDetails = Omit<ITransactionReservationDetails, "timestamp"> & {
    timestamp: string;
};
interface ITransactionReservationPrivateData {
    accountId: string;
    pendingAmount: string;
    expirationTime: number;
    kind: TransactionReservationKind;
    details: ITransactionReservationDetails;
}
interface ISerializedTransactionReservationPrivateData extends Omit<ITransactionReservationPrivateData, "details"> {
    details: TSerializedTransactionReservationDetails;
}
interface ITransactionReservation extends ITransactionReservationPrivateData, ITableRecord {
    networkId: NetworkId;
}
type TReservationsByWallet = Record<string, ITransactionReservation[]>;

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

declare class ValidatorClient extends BaseHttpClient {
    submitDeploy(deploy: any): Promise<unknown>;
    submitExploratoryDeploy(body: unknown): Promise<any>;
    getStatus(): Promise<unknown>;
}

interface IApiClients {
    validator: ValidatorClient;
    observer: ObserverClient;
    indexer: IndexerClient;
}
interface INetworkOperationOptions {
    onBusyChanged?: TNetworkBusyListener;
    networkId?: NetworkId;
}
declare class ApiClientManager {
    private static instance;
    private readonly networkConfigProvider;
    private readonly networkBusyRegistry;
    private validatorClient;
    private observerClient;
    private indexerClient;
    private currentNetworkId;
    private isInitialized;
    private constructor();
    static getInstance(): ApiClientManager;
    initialize(networksConfig: TNetworksConfig, customNetworks?: IPersistedNetworkRecord[], networkName?: NetworkName): void;
    switchNetwork(networkId: NetworkId): void;
    getValidatorClient(): ValidatorClient;
    getObserverClient(): ObserverClient;
    getIndexerClient(): IndexerClient;
    getClients(): IApiClients;
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    getNetworkIds(): NetworkId[];
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    isNetworkBusy(networkId: NetworkId): boolean;
    runNetworkOperation<TResult>(operation: () => Promise<TResult>, { onBusyChanged, networkId }?: INetworkOperationOptions): Promise<TResult>;
    createNetworkContext(networkId?: NetworkId): INetworkContext;
    addNetwork(name: NetworkName, config: INetworkConfig): INetworkRecord;
    updateNetwork(id: NetworkId, update: INetworkUpdate): void;
    removeNetwork(id: NetworkId): void;
    isReady(): boolean;
    close(): void;
}

declare class NodeApiProvider {
    private static instance;
    private readonly apiClientManager;
    private constructor();
    static getInstance(apiClientManager?: ApiClientManager): NodeApiProvider;
    getApi(): NodeApiAdapter;
}

declare class DeployService {
    private readonly nodeApiProvider;
    constructor(nodeApiProvider?: NodeApiProvider);
    private get api();
    private extractDeployId;
    submitSignedDeploy(deploy: SignedResult): Promise<string | undefined>;
    exploreDeployData(rholangCode: string): Promise<any>;
    getDeploy(deployHash: string): Promise<any>;
    isDeployFinalized(deploy: IDeployInfo): Promise<boolean>;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
}

declare class BlockService {
    private readonly nodeApiProvider;
    constructor(nodeApiProvider?: NodeApiProvider);
    private get api();
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
type TDeployDetails = Omit<IDeployPayload, "walletType" | "account" | "signer" | "passwordProvider">;
declare class TransactionService {
    private readonly deployService;
    private readonly blockService;
    private readonly nodeApiProvider;
    constructor(deployService: DeployService, blockService: BlockService, nodeApiProvider?: NodeApiProvider);
    private get terms();
    signDeploy({ walletType, account, signer, term, phloLimit, phloPrice, shardId, passwordProvider, }: IDeployPayload): Promise<SignedResult>;
    private submitSignedDeploy;
    private signAndSubmit;
    transfer({ walletType, account, signer, details, passwordProvider, }: ITransferPayload): Promise<string>;
    deploy(payload: IDeployPayload): Promise<string>;
}

type AddressBrand = {
    readonly __brand: unique symbol;
};
type Address = `1111${string & AddressBrand}`;
declare const ACCOUNT_KEY_PREFIX: string;
interface IWalletOptions {
    id?: string;
    type: WalletTypes;
    signer: Signer;
    accounts: Map<string, Account>;
}
type TCreateHDPathWalletOptions = {
    customHDPath: Bip44Path;
} | {
    index: number;
};
interface ICreateHDWalletOptions {
    pathOptions: TCreateHDPathWalletOptions;
    accountOptions: TCreateAccountPayload;
}
interface IRestoreWalletPayload {
    signerRecord: ISignerRecord;
    accountRecords: IAccountRecord[];
}
interface IImportKeyfileWalletPayload {
    walletType: WalletTypes;
    encryptedSecret: EncryptedData;
    accounts: TCreateAccountPayload[];
}
declare class Wallet {
    private readonly id;
    private readonly type;
    private readonly signer;
    private readonly accountManager;
    private readonly accountOperationsGuard;
    private constructor();
    getId(): string;
    getType(): WalletTypes;
    getSigner(): Signer;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISigningSessionOptions): Promise<void>;
    lock(): void;
    isPasswordValid(passwordProvider: SecretsProvider): Promise<boolean>;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getAccount(id: string): Account;
    runAccountOperation<TResult>(accountId: string, operation: (account: Account) => Promise<TResult>): Promise<TResult>;
    private getDerivationIndex;
    deriveAccount(payload: Omit<TCreateAccountPayload, "index">, passwordProvider: SecretsProvider): Promise<ICreatedAccountData>;
    addAccounts(accounts: Account[]): void;
    removeAccount(id: string): Account;
    updateAccount(id: string, payload: TEditableAccountOptions): void;
    static createPk(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Wallet>;
    static createHD(options: ICreateHDWalletOptions, secretProvider: SecretsProvider): Promise<Wallet>;
    static importKeyfile({ walletType, encryptedSecret, accounts }: IImportKeyfileWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    static restore(payload: IRestoreWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    transfer(accountId: string, payload: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
    deploy(accountId: string, payload: TDeployDetails, passwordProvider?: SecretsProvider): Promise<string>;
    signDeploy(accountId: string, payload: TDeployDetails, passwordProvider?: SecretsProvider): Promise<SignedResult>;
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
    private readonly fingerprint;
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
    getFingerprint(): string;
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
    protected getByFilter(predicate: (record: T) => boolean): Promise<T[]>;
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
    fingerprint: string;
    createdAt: number;
    updatedAt?: number;
}
declare class AccountsStorageRepository extends BaseStorageRepository<IAccountStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): AccountsStorageRepository;
    saveAccount(accountId: string, signerId: string, name: string, index: number | null, fingerprint: string): Promise<void>;
    saveAccounts(accounts: IAccountStorageRecord[]): Promise<void>;
    getAccount(id: string): Promise<IAccountStorageRecord | null>;
    getAllAccounts(): Promise<IAccountStorageRecord[]>;
    getAccountsBySignerId(signerId: string): Promise<IAccountStorageRecord[]>;
    findAccountByFingerprint(fingerprint: string): Promise<IAccountStorageRecord | null>;
    updateAccount(accountId: string, updates: Partial<IAccountStorageRecord>): Promise<void>;
    deleteAccount(accountId: string): Promise<void>;
    deleteMultipleAccounts(accountIds: string[]): Promise<void>;
    hasAccount(accountId: string): Promise<boolean>;
    getAccountsCount(): Promise<number>;
}

declare class AccountDataService {
    private readonly nodeApiProvider;
    private readonly apiClientManager;
    constructor(nodeApiProvider?: NodeApiProvider, apiClientManager?: ApiClientManager);
    private get api();
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination, networkId?: NetworkId): Promise<Transaction[]>;
}

interface IBalanceData {
    amount: bigint;
    asset: Asset;
}
declare class AssetsService {
    private readonly deployService;
    private readonly nodeApiProvider;
    constructor(deployService: DeployService, nodeApiProvider?: NodeApiProvider);
    private get terms();
    getBalance(address: Address, asset: Asset): Promise<IBalanceData>;
}

declare abstract class ApiWorker {
    protected readonly networkContext: INetworkContext;
    constructor(networkContext: INetworkContext);
    getApi(): NodeApiAdapter;
    getNetworkId(): NetworkId;
    getNodeApiProfile(): NodeApiProfile;
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
declare class DeployStatusPoller extends ApiWorker {
    watch(deployId: string, callbacks?: IDeployWatchCallbacks, { intervalMs, timeoutMs, }?: IDeployWatchOptions): IDeployWatchHandle;
    waitFor(deployId: string, options?: IDeployWatchOptions): Promise<IDeployConfirmedResult>;
}

declare class ApiServiceRegistry {
    private static instance;
    private readonly apiClientManager;
    readonly deploy: DeployService;
    readonly blocks: BlockService;
    readonly accountData: AccountDataService;
    readonly assets: AssetsService;
    readonly transactions: TransactionService;
    get poller(): DeployStatusPoller;
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
    getTableNames(): Promise<string[]>;
    private executeTransaction;
    isInitialized(): boolean;
    close(): Promise<void>;
}

declare abstract class ClosableDomain {
    private active;
    constructor();
    isActive(): boolean;
    close(): Promise<void>;
    protected abstract onClose(): Promise<void>;
}

interface IDisposable {
    dispose(): void;
}
declare class DisposableItemManager<T extends IDisposable> extends ItemManager<T> {
    add(id: string, item: T): void;
    remove(id: string): T;
    removeByFilter(filter: (item: T) => boolean): T[];
    clear(): void;
}

interface ITransactionReservationsManagerOptions {
    onAdded?: (reservation: ITransactionReservation) => void;
    onReplaced?: (reservation: ITransactionReservation) => void;
    onRemoved?: (reservation: ITransactionReservation) => void;
    onConfirmed?: (reservation: ITransactionReservation) => void;
    onExpired?: (reservation: ITransactionReservation) => void;
    onFailed?: (reservation: ITransactionReservation, error: Error) => void;
    watchCallbacks?: IDeployWatchCallbacks;
    watchOptions?: IDeployWatchOptions;
}

declare const TRANSACTION_RESERVATIONS_DATA_KEY: string;
interface ITransactionReservationsStorageRecord extends ITableRecord {
    networkId: NetworkId;
    signerId: string;
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
declare class TransactionReservationsStorageRepository extends BaseStorageRepository<ITransactionReservationsStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): TransactionReservationsStorageRepository;
    saveTransactionReservation(id: string, networkId: NetworkId, signerId: string, encryptedData: EncryptedData): Promise<void>;
    getTransactionReservations(id: string): Promise<ITransactionReservationsStorageRecord | null>;
    getAllTransactionReservations(): Promise<ITransactionReservationsStorageRecord[]>;
    getTransactionReservationsBySignerId(signerId: string): Promise<ITransactionReservationsStorageRecord[]>;
    updateTransactionReservation(id: string, updates: Partial<ITransactionReservationsStorageRecord>): Promise<void>;
    deleteTransactionReservation(id: string): Promise<void>;
    deleteMultipleTransactionReservations(ids: string[]): Promise<void>;
    hasTransactionReservations(id: string): Promise<boolean>;
    getTransactionReservationsCount(): Promise<number>;
}

interface IReservationPayload {
    deployId: string;
    networkId: NetworkId;
    account: Account;
    pendingAmount: bigint;
    kind: TransactionReservationKind;
    gasCost?: bigint;
}
interface ICreateTransferReservationPayload extends IReservationPayload {
    kind: "transfer";
    details: {
        to: Address;
        amount: bigint;
    };
}
interface ICreateDeployReservationPayload extends IReservationPayload {
    kind: "deploy";
    term?: string;
}
type TCreateTransactionReservationPayload = ICreateTransferReservationPayload | ICreateDeployReservationPayload;
interface IReservationMeta {
    deployId: string;
    pendingAmount: bigint;
    gasCost: bigint;
}
interface ITransferReservationMeta extends IReservationMeta {
    kind: "transfer";
    to: Address;
    amount: bigint;
}
interface IDeployReservationMeta extends IReservationMeta {
    kind: "deploy";
    term?: string;
}
type TTransactionReservationMeta = ITransferReservationMeta | IDeployReservationMeta;

interface IReservedOperationResult {
    deployId: string;
    subscribe: (callbacks: IDeployWatchCallbacks) => () => void;
}
declare class ReservationAdapter {
    private static readonly operationsGuard;
    private readonly reservationsManager;
    constructor(reservations: ITransactionReservation[], reservationsManagerOptions?: ITransactionReservationsManagerOptions);
    private ensureSufficientBalance;
    validateSufficientBalance(account: Account, amount: bigint): Promise<boolean>;
    add(wallet: Wallet, payload: TCreateTransactionReservationPayload, passwordProvider?: SecretsProvider): Promise<ITransactionReservation>;
    update(wallet: Wallet, reservationId: ITransactionReservation["id"], payload: TCreateTransactionReservationPayload, passwordProvider?: SecretsProvider): Promise<ITransactionReservation>;
    remove(id: ITransactionReservation["id"]): Promise<ITransactionReservation>;
    getReservation(id: ITransactionReservation["id"]): ITransactionReservation;
    private static readPrivateData;
    static create(wallet: Wallet, passwordProvider?: SecretsProvider, reservationsManagerOptions?: ITransactionReservationsManagerOptions): Promise<ReservationAdapter>;
    private getReservedAmount;
    getBalance(account: Account): Promise<IBalanceData>;
    getReservations(): ITransactionReservation[];
    getOutgoingPendingTransactions(account: Account): Transaction[];
    hasNetworkReservations(networkId: NetworkId): boolean;
    removeNetworkReservations(networkId: NetworkId): Promise<void>;
    dispose(): void;
    private encryptReservationData;
    private persistReservation;
    private updatePersistedReservation;
    private reserve;
    transfer(wallet: Wallet, accountId: string, details: ITransferDetails, passwordProvider?: SecretsProvider): Promise<IReservedOperationResult>;
    deploy(wallet: Wallet, accountId: string, details: TDeployDetails, passwordProvider?: SecretsProvider): Promise<IReservedOperationResult>;
}

declare enum MnemonicStrength {
    TWELVE_WORDS = 128,
    TWENTY_FOUR_WORDS = 256
}
declare class MnemonicService {
    static generateMnemonic(strength?: MnemonicStrength): string;
    static generateMnemonicArray(strength?: MnemonicStrength): string[];
    static isMnemonicValid(mnemonic: string): boolean;
    static normalizeMnemonic(mnemonic: string): string;
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
    accountName: string;
    index?: number;
}
interface IDerivedAccount {
    accountId: string;
    account: Account;
}
declare class WalletManager extends ItemManager<Wallet> {
    private static readonly operationsGuard;
    createHD({ accountName, index }: ICreateHDWalletParams, secretProvider: SecretsProvider): Promise<Wallet>;
    createPrivateKey(accountName: string, secretProvider: SecretsProvider): Promise<Wallet>;
    getBySignerId(signerId: string): Wallet | null;
    importKeyfile(payload: IImportKeyfileWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    open(signerId: string, passwordProvider: SecretsProvider): Promise<Wallet>;
    delete(id: string): Promise<Wallet>;
    deriveAccount(walletId: string, accountName: string, passwordProvider: SecretsProvider): Promise<IDerivedAccount>;
    removeAccount(walletId: string, accountId: string): Promise<Account>;
    renameAccount(walletId: string, accountId: string, name: string): Promise<void>;
    getAccount(walletId: string, accountId: string): Account;
    getPublicWalletsMetadata(): Promise<IWalletMetadata[]>;
    count(): Promise<number>;
    countInStorage(): Promise<number>;
    private persist;
}

interface IKeyfileAccount {
    name: string;
    address: string;
    index: number | null;
}
interface IKeyfileWalletAccount {
    name: string;
    index: number | null;
}
interface IKeyfileWallet {
    walletType: WalletTypes;
    encryptedPrivateData: EncryptedData;
    encryptedAccounts: EncryptedData;
}
declare class KeyfileSerializer {
    static serializeAccount: (account: Account) => IKeyfileAccount;
    static serializeWalletAccount: (account: Account) => IKeyfileWalletAccount;
    static serializeWallet: (wallet: Wallet, passwordProvider: SecretsProvider) => Promise<IKeyfileWallet>;
}

interface IKeyfileEnvelope {
    version: number;
    type: string;
    timestamp: string;
}
interface IAccountKeyfile extends IKeyfileEnvelope {
    account: IKeyfileAccount;
}
interface IWalletKeyfile extends IKeyfileEnvelope, IKeyfileWallet {
}
declare class ExportKeyfileService {
    static toJSON(data: unknown): string;
    private static createKeyfileEnvelope;
    static exportAccountKeyfile(account: Account): IAccountKeyfile;
    static exportWalletKeyfile(wallet: Wallet, passwordProvider: SecretsProvider): Promise<IWalletKeyfile>;
    private static escapeCsvValue;
    static transactionsToCsv(transactions: Transaction[]): string;
    static exportTransactions(transactions: Transaction[], format?: ExportFormat): string;
}

interface IImportWalletKeyfileOptions {
    accountIndexes?: number[];
}
declare class ImportKeyfileService {
    static fromJSON(source: string): unknown;
    private static validateWalletKeyfile;
    private static validateWalletKeyfileAccounts;
    static parseWalletKeyfile(source: unknown): IWalletKeyfile;
    static decryptKeyfileAccounts(keyfile: IWalletKeyfile, passwordProvider: SecretsProvider): Promise<IKeyfileWalletAccount[]>;
    private static selectAccounts;
    static toImportPayload(keyfile: IWalletKeyfile, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IImportKeyfileWalletPayload>;
    static decryptKeyfileSecret(walletType: WalletTypes, encryptedSecret: EncryptedData, passwordProvider: SecretsProvider): Promise<TDecryptedSecret>;
}

declare enum KeyfileImportAccountStatus {
    NEW = "new",
    ALREADY_IMPORTED = "already-imported"
}
interface IKeyfileImportAccountPreview {
    name: string;
    index: number | null;
    address: Address;
    status: KeyfileImportAccountStatus;
    existingAccountId: string | null;
}
interface IKeyfileImportPreview {
    walletType: WalletTypes;
    existingSignerId: string | null;
    isExistingWalletOpen: boolean;
    accounts: IKeyfileImportAccountPreview[];
}
interface IKeyfileImportPlan {
    payload: IImportKeyfileWalletPayload;
    secretProvider: SecretsProvider;
}
interface IKeyfileAccountsImportPlan extends IKeyfileImportPlan {
    signerId: string;
}
interface IKeyfileAccountsImportResult {
    signerId: string;
    importedAccountIds: string[];
}
declare class WalletImportService {
    private static resolveKeyfileImport;
    static prepareKeyfileImport(source: unknown, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IKeyfileImportPlan>;
    static prepareKeyfileAccountsImport(source: unknown, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IKeyfileAccountsImportPlan>;
    static previewKeyfileImport(source: unknown, passwordProvider: SecretsProvider): Promise<Omit<IKeyfileImportPreview, "isExistingWalletOpen">>;
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

declare enum ClientEvent {
    WALLETS_CHANGED = "walletsChanged",
    ACCOUNTS_CHANGED = "accountsChanged",
    NETWORK_CHANGED = "networkChanged",
    RESERVATIONS_CHANGED = "reservationsChanged",
    NETWORK_BUSY_CHANGED = "networkBusyChanged",
    WALLET_LOCKED = "walletLocked"
}
interface IClientEventMap {
    [ClientEvent.WALLETS_CHANGED]: [wallets: Wallet[]];
    [ClientEvent.ACCOUNTS_CHANGED]: [walletId: string, accounts: Account[]];
    [ClientEvent.NETWORK_CHANGED]: [network: INetworkRecord];
    [ClientEvent.RESERVATIONS_CHANGED]: [
        reservationsByWallet: TReservationsByWallet
    ];
    [ClientEvent.NETWORK_BUSY_CHANGED]: [networkId: NetworkId, isBusy: boolean];
    [ClientEvent.WALLET_LOCKED]: [walletId: string];
}
type TClientEventName = keyof IClientEventMap;
type TClientEventListener<TName extends TClientEventName> = (...payload: IClientEventMap[TName]) => void | Promise<void>;
type TUnsubscribe = () => void;
type TClientEventListenerErrorHandler = (name: TClientEventName, error: unknown) => void | Promise<void>;
interface IClientEventSource {
    on<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): TUnsubscribe;
    off<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): void;
}
declare class ClientEventBus implements IClientEventSource {
    private readonly listeners;
    private readonly onListenerError?;
    private readonly source;
    constructor(onListenerError?: TClientEventListenerErrorHandler);
    private createSource;
    getSource(): IClientEventSource;
    on<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): TUnsubscribe;
    off<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): void;
    private reportListenerError;
    private notify;
    emit<TName extends TClientEventName>(name: TName, ...payload: IClientEventMap[TName]): void;
    clear(): void;
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
interface ISignDeployRequest {
    walletId: string;
    accountId: string;
    term: string;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
}
type TTransactionReservationRequest = {
    walletId: string;
    accountId: string;
} & TTransactionReservationMeta;
type THistorySource = "pending" | "executed";
interface ITransactionsHistoryOptions {
    sources?: THistorySource[];
    pagination?: Pagination;
}
interface IClientEventDispatcher {
    onWalletsChanged?(wallets: Wallet[]): void | Promise<void>;
    onAccountsChanged?(walletId: string, accounts: Account[]): void | Promise<void>;
    onNetworkChanged?(network: INetworkRecord): void | Promise<void>;
    onReservationsChanged?(reservationsByWallet: TReservationsByWallet): void | Promise<void>;
    onNetworkBusyChanged?(networkId: NetworkId, isBusy: boolean): void | Promise<void>;
    onWalletLocked?(walletId: string): void | Promise<void>;
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
    onListenerError?: TClientEventListenerErrorHandler;
    flags?: ICreateClientFlags;
    security?: ISessionPolicy;
}
declare class Client extends ClosableDomain {
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

declare enum CustomErrorCode {
    WALLET_LOCKED = "WALLET_LOCKED",
    NETWORK_BUSY = "NETWORK_BUSY",
    STORAGE_VERSION_DOWNGRADE = "STORAGE_VERSION_DOWNGRADE",
    STORAGE_MIGRATION_FAILED = "STORAGE_MIGRATION_FAILED",
    STORAGE_MIGRATION_INTERRUPTED = "STORAGE_MIGRATION_INTERRUPTED",
    STORAGE_MIGRATION_ROLLBACK_FAILED = "STORAGE_MIGRATION_ROLLBACK_FAILED",
    STORAGE_MIGRATION_CHAIN_INVALID = "STORAGE_MIGRATION_CHAIN_INVALID",
    BALANCE_UNAVAILABLE = "BALANCE_UNAVAILABLE",
    DUPLICATE_WALLET = "DUPLICATE_WALLET",
    DUPLICATE_ACCOUNT = "DUPLICATE_ACCOUNT",
    WALLET_ACTION_IN_PROGRESS = "WALLET_ACTION_IN_PROGRESS",
    RESERVATION_ACTION_IN_PROGRESS = "RESERVATION_ACTION_IN_PROGRESS",
    INVALID_KEYFILE = "INVALID_KEYFILE",
    INVALID_KEYFILE_PASSWORD = "INVALID_KEYFILE_PASSWORD",
    KEYFILE_WALLET_NOT_FOUND = "KEYFILE_WALLET_NOT_FOUND",
    WALLET_OPERATION_CANCELLED = "WALLET_OPERATION_CANCELLED",
    DOMAIN_CLOSED = "DOMAIN_CLOSED",
    INVALID_PASSWORD = "INVALID_PASSWORD",
    CORRUPTED_DATA = "CORRUPTED_DATA",
    UNSUPPORTED_ENCRYPTION_VERSION = "UNSUPPORTED_ENCRYPTION_VERSION",
    KEY_DERIVATION_FAILED = "KEY_DERIVATION_FAILED",
    STORAGE_OPERATION_FAILED = "STORAGE_OPERATION_FAILED",
    API_REQUEST_FAILED = "API_REQUEST_FAILED",
    DEPLOY_TIMEOUT = "DEPLOY_TIMEOUT",
    HD_WALLET_ONLY_OPERATION = "HD_WALLET_ONLY_OPERATION",
    LAST_ACCOUNT_REMOVAL = "LAST_ACCOUNT_REMOVAL",
    UNKNOWN_ACCOUNT = "UNKNOWN_ACCOUNT",
    ACCOUNT_BUSY = "ACCOUNT_BUSY"
}
declare enum WalletAction {
    OPEN = "OPEN",
    DERIVE_ACCOUNT = "DERIVE_ACCOUNT",
    SAVE_ACCOUNTS = "SAVE_ACCOUNTS"
}
declare enum ReservationAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    REMOVE = "REMOVE",
    TRANSFER = "TRANSFER",
    DEPLOY = "DEPLOY",
    NETWORK_CLEANUP = "NETWORK_CLEANUP"
}
declare enum StorageMigrationChainViolation {
    DUPLICATE_VERSION = "DUPLICATE_VERSION",
    VERSION_OUT_OF_RANGE = "VERSION_OUT_OF_RANGE",
    MISSING_MIGRATION = "MISSING_MIGRATION"
}
declare enum StorageMigrationInterruptionReason {
    ROLLBACK_FAILED = "ROLLBACK_FAILED",
    MIGRATION_NOT_RESUMABLE = "MIGRATION_NOT_RESUMABLE",
    MIGRATION_NOT_FOUND = "MIGRATION_NOT_FOUND"
}
declare enum UnknownErrorReason {
    STORAGE = "browser storage did not report a reason",
    STORAGE_MIGRATION = "the storage migration did not report a reason",
    NODE_API = "node api did not report a reason",
    GRAPHQL_API = "graphql api did not report a reason",
    CRYPTO = "the crypto engine did not report a reason"
}
declare enum CorruptedDataSource {
    ENCRYPTED_SALT = "the salt of the encrypted payload",
    ENCRYPTED_IV = "the initialization vector of the encrypted payload",
    ENCRYPTED_CONTENT = "the content of the encrypted payload",
    WALLET_SECRET = "the decrypted wallet secret",
    RESERVATION_DATA = "the decrypted transaction reservation"
}
declare enum StorageOperation {
    OPEN_DATABASE = "open the database",
    CREATE_TABLE = "create the table",
    DROP_TABLE = "drop the table",
    RUN_TRANSACTION = "run a transaction on the table",
    FINISH_TRANSACTION = "finish an aborted transaction on the table"
}
declare enum ApiSource {
    NODE = "node api",
    GRAPHQL = "graphql api"
}
interface IErrorContext {
    context: string;
}
declare class CustomError extends Error {
    readonly code: CustomErrorCode;
    readonly status: number;
    constructor(code: CustomErrorCode, message: string, status: number);
}
declare class WalletLockedError extends CustomError {
    constructor(message?: string);
}
declare class WalletOperationCancelledError extends CustomError {
    readonly signerId: string;
    constructor(signerId: string, message?: string);
}
declare class InvalidPasswordError extends CustomError {
    readonly details: string | null;
    constructor(details?: string | null);
}
declare class CorruptedDataError extends CustomError {
    readonly source: CorruptedDataSource;
    constructor(source: CorruptedDataSource, message?: string);
}
declare class UnsupportedEncryptionVersionError extends CustomError {
    readonly version: number;
    readonly supportedVersion: number;
    constructor(version: number, supportedVersion: number, message?: string);
}
declare class KeyDerivationError extends CustomError {
    readonly reason: string;
    constructor(reason: string);
}
declare class StorageOperationError extends CustomError {
    readonly operation: StorageOperation;
    readonly target: string;
    readonly reason: string;
    constructor(operation: StorageOperation, target: string, reason: string);
}
declare class ApiRequestError extends CustomError {
    readonly source: ApiSource;
    readonly operation: string;
    readonly reason: string;
    constructor(source: ApiSource, operation: string, reason: string);
}
declare class DeployTimeoutError extends CustomError {
    readonly deployId: string;
    readonly timeoutMs: number;
    constructor(deployId: string, timeoutMs: number, message?: string);
}
declare class DomainClosedError extends CustomError {
    readonly domainName: string;
    constructor(domainName: string, message?: string);
}
declare class DuplicateWalletError extends CustomError {
    readonly existingSignerId: string;
    constructor(existingSignerId: string, message?: string);
}
declare class DuplicateAccountError extends CustomError {
    readonly existingSignerId: string;
    readonly existingAccountId: string;
    constructor(existingSignerId: string, existingAccountId: string, message?: string);
}
declare class WalletActionInProgressError extends CustomError {
    readonly action: WalletAction;
    readonly signerId: string;
    constructor(action: WalletAction, signerId: string, message?: string);
}
declare class ReservationActionInProgressError extends CustomError {
    readonly action: ReservationAction;
    readonly networkId: NetworkId;
    readonly accountId?: string;
    constructor(action: ReservationAction, networkId: NetworkId, accountId?: string, message?: string);
}
declare class HDWalletOnlyOperationError extends CustomError {
    readonly operation: string;
    constructor(operation: string, message?: string);
}
declare class LastAccountRemovalError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
declare class AccountBusyError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
declare class UnknownAccountError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
declare class InvalidKeyfileError extends CustomError {
    constructor(message?: string);
}
declare class InvalidKeyfilePasswordError extends CustomError {
    constructor(message?: string);
}
declare class KeyfileWalletNotFoundError extends CustomError {
    constructor(message?: string);
}
declare class NetworkBusyError extends CustomError {
    readonly networkId: NetworkId;
    constructor(networkId: NetworkId, message?: string);
}
declare class StorageSchemaError extends CustomError {
    readonly isStorageIntact: boolean;
    constructor(code: CustomErrorCode, message: string, status: number, isStorageIntact: boolean);
}
declare class StorageVersionDowngradeError extends StorageSchemaError {
    readonly storedVersion: number;
    readonly supportedVersion: number;
    constructor(storedVersion: number, supportedVersion: number, message?: string);
}
declare class StorageMigrationChainError extends CustomError {
    readonly violation: StorageMigrationChainViolation;
    readonly versions: number[];
    constructor(violation: StorageMigrationChainViolation, versions: number[], message?: string);
}
declare class StorageMigrationFailedError extends StorageSchemaError {
    readonly failedVersion: number;
    readonly description: string;
    readonly storedVersion: number;
    readonly migrationError: unknown;
    constructor(failedVersion: number, description: string, storedVersion: number, migrationError: unknown, message?: string);
}
declare class StorageMigrationInterruptedError extends StorageSchemaError {
    readonly pendingVersion: number;
    readonly reason: StorageMigrationInterruptionReason;
    constructor(pendingVersion: number, reason: StorageMigrationInterruptionReason, message?: string);
}
declare class StorageMigrationRollbackError extends StorageSchemaError {
    readonly failedVersion: number;
    readonly failures: string[];
    readonly migrationError: unknown;
    constructor(failedVersion: number, failures: string[], migrationError: unknown, message?: string);
}
declare class BalanceUnavailableError extends CustomError {
    readonly address: Address;
    readonly reason: string;
    constructor(address: Address, reason: string);
}

declare class LifecycleGuard {
    private generation;
    private readonly pendingOperations;
    constructor();
    private isCurrentGeneration;
    invalidate(): void;
    drain(timeoutMs?: number): Promise<void>;
    track<T>(operation: () => Promise<T>): Promise<T>;
    run<T>(operation: () => Promise<T>, onInvalidated: (result: T) => Error): Promise<T>;
}

declare class NetworkBusyRegistry {
    private readonly counters;
    acquire(networkId: NetworkId): void;
    release(networkId: NetworkId): void;
    isBusy(networkId: NetworkId): boolean;
    clear(): void;
    private getCounter;
}

declare class NetworkConfigProvider {
    private networksRecords;
    private validateConfigUrls;
    private validateConfigProfile;
    initialize(config: TNetworksConfig): void;
    restoreCustomNetworks(records: IPersistedNetworkRecord[]): void;
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
    getTableNames(): Promise<string[]>;
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
    encryptedDataKey: EncryptedData;
    fingerprint: string;
    createdAt: number;
    updatedAt?: number;
}
declare class SignersStorageRepository extends BaseStorageRepository<ISignerStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): SignersStorageRepository;
    saveSigner(signerId: string, type: WalletTypes, encryptedData: EncryptedData, encryptedDataKey: EncryptedData, fingerprint: string): Promise<void>;
    getSigner(id: string): Promise<ISignerStorageRecord | null>;
    findSignerByFingerprint(fingerprint: string): Promise<ISignerStorageRecord | null>;
    getAllSigners(): Promise<ISignerStorageRecord[]>;
    updateSigner(signerId: string, updates: Partial<ISignerStorageRecord>): Promise<void>;
    deleteSigner(signerId: string): Promise<void>;
    deleteMultipleSigners(signerIds: string[]): Promise<void>;
    hasSigner(signerId: string): Promise<boolean>;
    getSignersCount(): Promise<number>;
}

declare const STORAGE_METADATA_DATA_KEY: string;
declare const STORAGE_SCHEMA_RECORD_ID: string;
interface IStorageMetadataRecord extends ITableRecord {
    version: number;
    pendingVersion?: number | null;
    rollbackFailure?: string | null;
    createdAt: number;
    updatedAt?: number;
}
declare class StorageMetadataStorageRepository extends BaseStorageRepository<IStorageMetadataRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): StorageMetadataStorageRepository;
    private updateSchemaRecord;
    getVersion(): Promise<number | null>;
    saveVersion(version: number): Promise<void>;
    getPendingVersion(): Promise<number | null>;
    markPendingMigration(version: number): Promise<void>;
    clearPendingMigration(): Promise<void>;
    getRollbackFailure(): Promise<string | null>;
    markRollbackFailure(reason: string): Promise<void>;
}

declare class AccountsService {
    static createAccounts(accounts: TCreateAccountPayload[], secretProvider: SecretsProvider): Promise<Account[]>;
}

type TDiscardWallet = (wallet: Wallet) => void;
declare class ClientLifecycleGuard extends LifecycleGuard {
    private readonly discardWallet;
    constructor(discardWallet: TDiscardWallet);
    runWalletPublication(operation: () => Promise<Wallet>): Promise<Wallet>;
    runAccountsUpdate<T>(signerId: string, operation: () => Promise<T>): Promise<T>;
}

declare class HttpResponseParser {
    private static quoteUnsafeIntegers;
    static parseWithBigIntegersAsStrings(data: unknown): unknown;
}

interface ICreateReservationAdapterManagerOptions {
    onReservationsChanged?: () => void;
    reservationAdapters?: Map<string, ReservationAdapter>;
}
declare class ReservationAdapterManager extends DisposableItemManager<ReservationAdapter> {
    private static readonly operationsGuard;
    private readonly onReservationsChanged;
    constructor({ reservationAdapters, onReservationsChanged, }: ICreateReservationAdapterManagerOptions);
    private readonly notifyReservationsChanged;
    create(wallet: Wallet, passwordProvider?: SecretsProvider): Promise<ReservationAdapter>;
    remove(id: string): ReservationAdapter;
    removeByFilter(filter: (reservationAdapter: ReservationAdapter) => boolean): ReservationAdapter[];
    clear(): void;
    getReservationsByWallet(): TReservationsByWallet;
    getAllReservations(): ITransactionReservation[];
    getIncomingReservations(targetAddress: Address): ITransactionReservation[];
    hasNetworkReservations(networkId: NetworkId): boolean;
    isExclusiveNetwork(networkId: NetworkId): boolean;
    runExclusiveNetworkAction<T>(networkId: NetworkId, operation: () => Promise<T>): Promise<T>;
    removeNetworkReservations(networkId: NetworkId): Promise<void>;
    getPendingTransactions(walletId: string, account: Account): Transaction[];
}

declare class WalletPersistenceService {
    static saveAccounts(signerId: string, accounts: Account[]): Promise<void>;
    static createAccounts(signerId: string, accounts: TCreateAccountPayload[], secretProvider: SecretsProvider): Promise<Account[]>;
}

declare class WalletUniquenessService {
    static findSignerBySecret(secretProvider: SecretsProvider): Promise<ISignerStorageRecord | null>;
    static findExistingAccount(account: Account): Promise<IAccountStorageRecord | null>;
    static assertAccountIsNotDuplicate(account: Account): Promise<void>;
    static assertWalletIsNotDuplicate(wallet: Wallet): Promise<void>;
}

declare class KeyDerivationService {
    static deriveKeyFromMnemonic(mnemonic: string | string[], bip44path: string | Bip44Path): Promise<Uint8Array>;
    static derivePrivateKey(masterNode: BIP32Interface, path: Bip44Path): Uint8Array;
    static mnemonicToSeed(mnemonicWords: string[] | string, passphrase?: string): Promise<Uint8Array>;
    static seedToMasterNode(seed: any): BIP32Interface;
    static compareIndexes(firstIndex: number | null, secondIndex: number | null): number;
    static deriveNextKeyFromMnemonic(mnemonicWords: string[], currentIndex: number, options?: Omit<IBip44PathOptions, "index">): Promise<Uint8Array>;
}

type TFingerprintSecret = IPrivateKeyCredentials | ISeedCredentials;
declare class KeyFingerprintService {
    static fromPublicKey(publicKey: Uint8Array): string;
    static fromPrivateKey(privateKey: Uint8Array): string;
    static fromMnemonic(mnemonic: string): Promise<string>;
    static fromSecret(secret: TFingerprintSecret): Promise<string>;
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

interface IStorageBootstrapOptions {
    storageOptions?: IStorageFabricOptions;
    withInsensitiveCacheStorage?: boolean;
}
declare class StorageBootstrap {
    private static createMigrationRunner;
    static init: ({ storageOptions, withInsensitiveCacheStorage, }?: IStorageBootstrapOptions) => Promise<void>;
    static close: () => void;
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
    signer: ISignerStorageRecord;
    accounts: IAccountRecord[];
}
interface ISaveTransactionReservationsOptions {
    id: string;
    networkId: NetworkId;
    signerId: string;
    encryptedData: EncryptedData;
}
declare class StorageManager {
    static init: (options?: IStorageFabricOptions) => Promise<void>;
    static saveSigner: ({ id, type, signer, }: ISaveSignerToStorageOptions) => Promise<void>;
    static saveSigners: (signersOptions: ISaveSignerToStorageOptions[]) => Promise<void[]>;
    static getSigner: (id: string) => Promise<ISignerRecord>;
    static getSigners: () => Promise<ISignerStorageRecord[]>;
    static findSignerByFingerprint: (fingerprint: string) => Promise<ISignerStorageRecord | null>;
    static updateSigner: (id: string, updates: Partial<ISignerStorageRecord>) => Promise<void>;
    static deleteSigner: (id: string) => Promise<void>;
    static deleteMultipleSigners: (ids: string[]) => Promise<void>;
    static saveAccount: ({ id, account, signerId, }: ISaveAccountToStorageOptions) => Promise<void>;
    static saveAccounts: (accountsOptions: ISaveAccountToStorageOptions[]) => Promise<void>;
    static getAccount: (id: string) => Promise<IAccountRecord>;
    static getAccounts: () => Promise<IAccountStorageRecord[]>;
    static getAccountsBySignerId: (signerId: string) => Promise<IAccountStorageRecord[]>;
    static findAccountByFingerprint: (fingerprint: string) => Promise<IAccountStorageRecord | null>;
    static updateAccount: (id: string, updates: Partial<IAccountRecord>) => Promise<void>;
    static deleteAccount: (id: string) => Promise<void>;
    static deleteMultipleAccounts: (ids: string[]) => Promise<void>;
    static saveWallet: ({ signerId, wallet, }: ISaveWalletToStorageOptions) => Promise<void>;
    static saveWallets: (walletsOptions: ISaveWalletToStorageOptions[]) => Promise<void[]>;
    static getWallet: ({ signerId, passwordProvider, }: IGetWalletFromStorageOptions) => Promise<Wallet>;
    static getWallets: () => Promise<IWalletStorageData[]>;
    static saveTransactionReservation: ({ id, networkId, signerId, encryptedData, }: ISaveTransactionReservationsOptions) => Promise<void>;
    static getTransactionReservationsBySignerId: (signerId: string) => Promise<ITransactionReservationsStorageRecord[]>;
    static updateTransactionReservation: (id: string, updates: Partial<ITransactionReservationsStorageRecord>) => Promise<void>;
    static deleteTransactionReservation: (id: string) => Promise<void>;
    static deleteMultipleTransactionReservations: (ids: string[]) => Promise<void>;
    static getCustomNetworks: () => Promise<IPersistedNetworkRecord[]>;
    static saveCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static updateCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static deleteCustomNetwork: (id: NetworkId) => Promise<void>;
    static clear: () => Promise<void>;
    static close: () => void;
}

interface IStorageMigration {
    version: number;
    description: string;
    resumable: boolean;
    run(storage: ITableService<ITableRecord>): Promise<void>;
}
declare const STORAGE_MIGRATIONS: IStorageMigration[];

interface IStorageMigrationRunnerOptions {
    storage: ITableService<ITableRecord>;
    metadataRepository: StorageMetadataStorageRepository;
    tables: string[];
    migrations?: IStorageMigration[];
    currentVersion?: number;
}
declare class StorageMigrationRunner {
    private readonly storage;
    private readonly metadataRepository;
    private readonly tables;
    private readonly migrations;
    private readonly currentVersion;
    constructor({ storage, metadataRepository, tables, migrations, currentVersion, }: IStorageMigrationRunnerOptions);
    private resolveStoredVersion;
    private getPendingMigrations;
    private describeFailure;
    private createBackup;
    private dropTablesCreatedByMigration;
    private restoreTable;
    private restoreBackup;
    private revertMigration;
    private runMigrationStep;
    private applyMigration;
    private assertInterruptedMigrationIsResumable;
    private assertDeclaredVersionsAreValid;
    private assertChainIsComplete;
    assertCompatible(): Promise<void>;
    run(): Promise<number>;
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
declare const SCALA_FAULT_TOLERANCE_THRESHOLD: number;
declare const RUST_FAULT_TOLERANCE_THRESHOLD: number;
declare const INVALID_BLOCK_NUMBER = -1;
declare const DIGITS_ONLY_REGEX: RegExp;
declare const CANONICAL_INTEGER_REGEX: RegExp;
declare const INTEGER_REGEX: RegExp;
declare const DECIMAL_REGEX: RegExp;
declare const NON_NEGATIVE_INTEGER_REGEX: RegExp;
declare const NON_NEGATIVE_DECIMAL_REGEX: RegExp;
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
declare const toUint8Array: (value: unknown) => Uint8Array;
declare const arrayBufferToBase64: (buffer: ArrayBuffer) => string;
declare const base64ToArrayBuffer: (base64: string) => ArrayBuffer;
declare const bufferToBigInt: (buffer: Uint8Array) => bigint;
declare const bigIntToBuffer: (num: bigint) => Uint8Array;

declare const genRandomHex: (size: number) => string;
declare const generateRandomId: () => string;
declare const toAtomicAmount: (amount: number | string, decimals: number) => bigint;
declare const fromAtomicAmountToNumber: (atomicAmount: bigint, decimals: number) => number;
declare const fromAtomicAmount: (atomicAmount: bigint, decimals: number) => string;
declare const parseAtomicAmount: (value: unknown) => bigint | null;
type IUrlValue = string | number | boolean | undefined;
interface IUrlParams {
    path?: Record<string, IUrlValue>;
    query?: Record<string, IUrlValue | undefined | null>;
}
declare const buildUrl: (pathPrefix: string, params?: IUrlParams) => string;
declare function normalizeAddress(address: string | undefined): string;
declare function isSameAddress(address: string | undefined, other: string | undefined): boolean;
declare function resolveTransferType(from: string, viewerAddress: string): TransactionType;
declare const getErrorMessage: (error: unknown, fallback: string) => string;
declare const parseDecryptedJson: <T>(payload: string, source: CorruptedDataSource, isExpectedStructure: (value: unknown) => value is T) => T;
declare const runProtected: (run: () => void | Promise<void>, onFailure: (error: unknown) => void) => void;
interface IFieldSelection<T, V> {
    selected: T[];
    missingValues: V[];
}
declare const selectByField: <T, K extends keyof T>(items: T[], field: K, values: readonly T[K][]) => IFieldSelection<T, T[K]>;
declare const isNetworkConfigChanged: (current: INetworkConfig, update?: Partial<INetworkConfig>) => boolean;
declare const withSchemaVersion: <T extends ITableRecord>(record: T) => T;

declare const isIntegerInRange: (value: number, min: number, max: number) => boolean;
declare const validatePrivateKey: (privateKey: Uint8Array) => {
    isValid: boolean;
    error?: string;
};
declare const isPrivateKeyValid: (privateKey: Uint8Array) => boolean;

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
declare const validateNodeApiProfile: (profile: unknown) => {
    isValid: boolean;
    error?: string;
};
declare const ensureValid: ({ isValid, error }: {
    isValid: boolean;
    error?: string;
}, { context }: IErrorContext) => void;
declare const validatePositiveAmount: (amount: bigint) => {
    isValid: boolean;
    error?: string;
};
declare const validateReservationPayload: (payload: TCreateTransactionReservationPayload) => {
    isValid: boolean;
    error?: string;
};
declare const validateDeployPayload: ({ term, phloLimit, phloPrice, shardId, }: TDeployDetails) => {
    isValid: boolean;
    error?: string;
};

declare const isRecord: (value: unknown) => value is Record<string, unknown>;
declare const isValidByte: (value: unknown) => value is number;
declare const isByteIndexedRecord: (value: object) => value is Record<string, number>;
declare const isValueInConst: <const T extends readonly string[]>(value: unknown, values: T) => value is T[number];
declare const isSerializedDecimal: (value: unknown) => value is string;
declare const isSerializedInteger: (value: unknown) => value is string;
declare const isRecordWithMessage: (value: unknown) => value is {
    message: string;
};
declare const isErrorWithMessage: (value: unknown) => value is Error;
declare const isPromiseLike: (value: unknown) => value is PromiseLike<unknown>;

declare const isCustomCreateHDWalletOptions: (options: TCreateHDPathWalletOptions) => options is {
    customHDPath: Bip44Path;
};
declare const isPrivateKeySecretData: (secretData: IPrivateKeyCredentials | IHDSecret) => secretData is IPrivateKeyCredentials;
declare const isNodeApiProfile: (value: unknown) => value is NodeApiProfile;
declare const isStoredSecret: (value: unknown) => value is TStoredSecret;
declare const isSerializedReservationPrivateData: (value: unknown) => value is ISerializedTransactionReservationPrivateData;
declare const isEncryptedData: (value: unknown) => value is EncryptedData;
declare const isKeyfileAccount: (value: unknown) => value is IKeyfileAccount;
declare const isKeyfileWalletAccount: (value: unknown) => value is IKeyfileWalletAccount;

export { ACCOUNTS_DATA_KEY, ACCOUNT_KEY_PREFIX, ASI_BASE_UNIT, ASI_CHAIN_PREFIX, ASI_COIN_TYPE, ASI_DECIMALS, ASI_WALLET_KEYFILE_VERSION, Account, AccountBusyError, AccountDataService, AccountManager, AccountsService, AccountsStorageRepository, AddressValidationErrorCode, ApiClientManager, ApiRequestError, ApiServiceRegistry, ApiSource, ApiWorker, Asset, AssetsService, AutoTimer, BASELINE_STORAGE_VERSION, BalanceUnavailableError, BaseGraphQLClient, BaseHttpClient, BinaryWriterService as BinaryWriter, Bip44Path, BlockService, BrowserStorage, CANONICAL_INTEGER_REGEX, CURRENT_STORAGE_VERSION, Client, ClientEvent, ClientEventBus, ClientLifecycleGuard, ClosableDomain, CorruptedDataError, CorruptedDataSource, CryptoService as Crypto, CustomError, CustomErrorCode, DECIMAL_REGEX, DEFAULT_ASSET, DEFAULT_AUTO_LOCK_MS, DEFAULT_BIP_44_PATH_OPTIONS, DEFAULT_DRAIN_TIMEOUT_MS, DEFAULT_NODE_API_PROFILE, DEFAULT_NODE_STORAGE_DIR, DEFAULT_PHLO_LIMIT, DEFAULT_PHLO_PRICE, DEFAULT_REQUEST_TIMEOUT, DEPLOY_STATUS_POLLING_TIMEOUT, DIGITS_ONLY_REGEX, DeployService, DeployStatus, DeployStatusPoller, DeployTimeoutError, DisposableItemManager, DomainClosedError, DuplicateAccountError, DuplicateWalletError, ExportFormat, ExportKeyfileService, GasFee, HDWalletOnlyOperationError, HEX_BYTE_PADDING, HEX_RADIX, HttpResponseParser, INSENSITIVE_CACHE_TABLE_KEY, INTEGER_REGEX, INVALID_BLOCK_NUMBER, ImportKeyfileService, IndexerClient, InsensitiveCacheStorageRepository, InvalidKeyfileError, InvalidKeyfilePasswordError, InvalidPasswordError, ItemManager, KeyDerivationService as KeyDerivation, KeyDerivationError, KeyFingerprintService, KeyfileImportAccountStatus, KeyfileSerializer, KeyfileTypes, KeyfileWalletNotFoundError, KeysManager, LastAccountRemovalError, LifecycleGuard, MnemonicService as Mnemonic, MnemonicStrength, NATIVE_TOKEN_DECIMALS_AMOUNT, NETWORK_CONFIG_FIELDS, NETWORK_URL_FIELDS, NODE_API_PROFILES, NODE_API_PROFILE_DESCRIPTORS, NON_NEGATIVE_DECIMAL_REGEX, NON_NEGATIVE_INTEGER_REGEX, NetworkBusyError, NetworkBusyRegistry, NetworkConfigProvider, NodeApiAdapter, NodeApiProfile, NodeApiProfileStability, NodeApiProvider, NodeStorage, ObserverClient, POWER_BASE, PRIVATE_KEY_LENGTH, RESERVATION_EXPIRATION_TIME, RUST_FAULT_TOLERANCE_THRESHOLD, RequirePassword, ReservationAction, ReservationActionInProgressError, ReservationAdapter, ReservationAdapterManager, SCALA_FAULT_TOLERANCE_THRESHOLD, SIGNERS_DATA_KEY, SIGNER_KEY_PREFIX, STORAGE_METADATA_DATA_KEY, STORAGE_MIGRATIONS, STORAGE_SCHEMA_RECORD_ID, SecretsProvider, Signer, SignerService, SignersStorageRepository, SigningSession, StorageBootstrap, StorageManager, StorageMetadataStorageRepository, StorageMigrationChainError, StorageMigrationChainViolation, StorageMigrationFailedError, StorageMigrationInterruptedError, StorageMigrationInterruptionReason, StorageMigrationRollbackError, StorageMigrationRunner, StorageOperation, StorageOperationError, StorageSchemaError, StorageVersionDowngradeError, TRANSACTIONS_CSV_HEADERS, TRANSACTION_DETECTED_BY_TYPES, TRANSACTION_RESERVATIONS_DATA_KEY, TRANSACTION_RESERVATION_KINDS, TRANSACTION_STATUSES, TRANSACTION_TYPES, TransactionReservationsStorageRepository, TransactionService, UnknownAccountError, UnknownErrorReason, UnsupportedEncryptionVersionError, ValidatorClient, Wallet, WalletAction, WalletActionInProgressError, WalletImportService, WalletLockedError, WalletManager, WalletOperationCancelledError, WalletPersistenceService, WalletTypes, WalletUniquenessService, WalletsService as Wallets, arrayBufferToBase64, base64ToArrayBuffer, bigIntToBuffer, bufferToBigInt, buildUrl, decodeBase16, decodeBase58, encodeBase16, encodeBase58, ensureValid, fromAtomicAmount, fromAtomicAmountToNumber, genRandomHex, generateRandomId, getErrorMessage, isAddress, isByteIndexedRecord, isCustomCreateHDWalletOptions, isEncryptedData, isErrorWithMessage, isIntegerInRange, isKeyfileAccount, isKeyfileWalletAccount, isNetworkConfigChanged, isNodeApiProfile, isPrivateKeySecretData, isPrivateKeyValid, isPromiseLike, isRecord, isRecordWithMessage, isSameAddress, isSerializedDecimal, isSerializedInteger, isSerializedReservationPrivateData, isStoredSecret, isValidByte, isValidUrl, isValueInConst, normalizeAddress, parseAtomicAmount, parseDecryptedJson, resolveTransferType, runProtected, selectByField, setupBufferPolyfill, toAtomicAmount, toUint8Array, validateAccountName, validateAddress, validateDeployPayload, validateNodeApiProfile, validatePositiveAmount, validatePrivateKey, validateReservationPayload, validateUrl, withSchemaVersion };
export type { Address, AddressValidationResult, AssetId, Assets, CreateWalletOptions, CryptoConfig, DeployData, EncryptedData, IAccountHDData, IAccountKeyfile, IAccountMetadata, IAccountOptions, IAccountRecord, IAccountStorageRecord, IApiClients, IAssetOptions, IAutoTimerOptions, IBalanceData, IBalanceResponse, IBaseHDWalletPrivateKeyData, IBip44PathOptions, IBlockDto, IClientEventDispatcher, IClientEventMap, IClientEventSource, ICreateClientFlags, ICreateClientOptions, ICreateHDWalletOptions, ICreateHDWalletParams, ICreateHDWalletPayload, ICreatePrivateKeyWalletPayload, ICreateReservationAdapterManagerOptions, ICreatedAccountData, IDecodeEncryptedFieldConfig, IDeployConfirmedResult, IDeployInfo, IDeployPayload, IDeployRequest, IDeployReservationMeta, IDeployStatusResult, IDeployWatchCallbacks, IDeployWatchHandle, IDeployWatchOptions, IDerivedAccount, IDisposable, IErrorContext, IExploratoryDeployClient, IFieldSelection, IFullWalletRecord, IGetBlocksParams, IGetWalletFromStorageOptions, IHDSecret, IHDSecretRecord, IHDSignerEncryptedFields, IHDWalletPrivateKeyDataFromMnemonic, IHDWalletPrivateKeyDataFromSeed, IImportKeyfileWalletPayload, IImportWalletKeyfileOptions, IInsensitiveCacheRecord, IKeyfileAccount, IKeyfileAccountsImportPlan, IKeyfileAccountsImportResult, IKeyfileEnvelope, IKeyfileImportAccountPreview, IKeyfileImportPlan, IKeyfileImportPreview, IKeyfileWallet, IKeyfileWalletAccount, INetworkConfig, INetworkContext, INetworkEndpoints, INetworkOperationOptions, INetworkRecord, INetworkUpdate, INodeApiProfileDescriptor, IPasswordCredentials, IPersistedNetworkRecord, IPortfolioOptions, IPrivateKeyCredentials, IPrivateKeySignerEncryptedFields, IPrivateKeyWithCredentials, IPublicWalletRecord, IReservedOperationResult, IRestoreWalletPayload, ISaveAccountToStorageOptions, ISaveSignerToStorageOptions, ISaveTransactionReservationsOptions, ISaveWalletToStorageOptions, ISchemeVersionRecord, ISeedCredentials, ISerializedTransactionReservationPrivateData, ISessionPolicy, ISignDeployRequest, ISignedMessageResponse, ISignerOptions, ISignerRecord, ISignerStorageRecord, ISigningSessionOptions, ISigningSessionSecrets, IStorageBootstrapOptions, IStorageMetadataRecord, IStorageMigration, IStorageMigrationRunnerOptions, IStoredPrivateKeySecret, ITableRecord, ITableService, ITransactionReservation, ITransactionReservationDetails, ITransactionReservationPrivateData, ITransactionReservationsStorageRecord, ITransactionsHistoryOptions, ITransferDetails, ITransferPayload, ITransferRequest, ITransferReservationMeta, IUrlParams, IUrlValue, IWalletKeyfile, IWalletMetadata, IWalletOptions, IWalletRecordEncryptedFields, IWalletStorageData, KeyPair, NetworkId, NetworkName, SignedResult, SigningRequest, TAxiosClientConfig, TBlocksView, TClientEventListener, TClientEventListenerErrorHandler, TClientEventName, TCreateAccountPayload, TCreateHDPathWalletOptions, TDecryptedSecret, TDeployDetails, TDiscardWallet, TEditableAccountOptions, TFingerprintSecret, THDSigningContext, THistorySource, TNetworkBusyListener, TNetworksConfig, TPKSigningContext, TReservationsByWallet, TSecretsProviderInterface, TSerializedTransaction, TSerializedTransactionReservationDetails, TSigningContext, TStoredSecret, TTransactionReservationMeta, TTransactionReservationRequest, TUnsubscribe, Transaction, TransactionDetectedBy, TransactionReservationKind, TransactionStatus, TransactionType, WalletMeta };
