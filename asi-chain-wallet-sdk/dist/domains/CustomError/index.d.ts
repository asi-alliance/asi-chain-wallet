import { NetworkId } from "@domains/Network";
import type { Address } from "@domains/Wallet";
export declare enum CustomErrorCode {
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
export declare enum WalletAction {
    OPEN = "OPEN",
    DERIVE_ACCOUNT = "DERIVE_ACCOUNT",
    SAVE_ACCOUNTS = "SAVE_ACCOUNTS"
}
export declare enum ReservationAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    REMOVE = "REMOVE",
    TRANSFER = "TRANSFER",
    DEPLOY = "DEPLOY",
    NETWORK_CLEANUP = "NETWORK_CLEANUP"
}
export declare enum StorageMigrationChainViolation {
    DUPLICATE_VERSION = "DUPLICATE_VERSION",
    VERSION_OUT_OF_RANGE = "VERSION_OUT_OF_RANGE",
    MISSING_MIGRATION = "MISSING_MIGRATION"
}
export declare enum StorageMigrationInterruptionReason {
    ROLLBACK_FAILED = "ROLLBACK_FAILED",
    MIGRATION_NOT_RESUMABLE = "MIGRATION_NOT_RESUMABLE",
    MIGRATION_NOT_FOUND = "MIGRATION_NOT_FOUND"
}
export declare enum UnknownErrorReason {
    STORAGE = "browser storage did not report a reason",
    STORAGE_MIGRATION = "the storage migration did not report a reason",
    NODE_API = "node api did not report a reason",
    GRAPHQL_API = "graphql api did not report a reason",
    CRYPTO = "the crypto engine did not report a reason"
}
export declare enum CorruptedDataSource {
    ENCRYPTED_SALT = "the salt of the encrypted payload",
    ENCRYPTED_IV = "the initialization vector of the encrypted payload",
    ENCRYPTED_CONTENT = "the content of the encrypted payload",
    WALLET_SECRET = "the decrypted wallet secret",
    RESERVATION_DATA = "the decrypted transaction reservation"
}
export declare enum StorageOperation {
    OPEN_DATABASE = "open the database",
    CREATE_TABLE = "create the table",
    DROP_TABLE = "drop the table",
    RUN_TRANSACTION = "run a transaction on the table",
    FINISH_TRANSACTION = "finish an aborted transaction on the table"
}
export declare enum ApiSource {
    NODE = "node api",
    GRAPHQL = "graphql api"
}
export interface IErrorContext {
    context: string;
}
export declare class CustomError extends Error {
    readonly code: CustomErrorCode;
    readonly status: number;
    constructor(code: CustomErrorCode, message: string, status: number);
}
export declare class WalletLockedError extends CustomError {
    constructor(message?: string);
}
export declare class WalletOperationCancelledError extends CustomError {
    readonly signerId: string;
    constructor(signerId: string, message?: string);
}
export declare class InvalidPasswordError extends CustomError {
    readonly details: string | null;
    constructor(details?: string | null);
}
export declare class CorruptedDataError extends CustomError {
    readonly source: CorruptedDataSource;
    constructor(source: CorruptedDataSource, message?: string);
}
export declare class UnsupportedEncryptionVersionError extends CustomError {
    readonly version: number;
    readonly supportedVersion: number;
    constructor(version: number, supportedVersion: number, message?: string);
}
export declare class KeyDerivationError extends CustomError {
    readonly reason: string;
    constructor(reason: string);
}
export declare class StorageOperationError extends CustomError {
    readonly operation: StorageOperation;
    readonly target: string;
    readonly reason: string;
    constructor(operation: StorageOperation, target: string, reason: string);
}
export declare class ApiRequestError extends CustomError {
    readonly source: ApiSource;
    readonly operation: string;
    readonly reason: string;
    constructor(source: ApiSource, operation: string, reason: string);
}
export declare class DeployTimeoutError extends CustomError {
    readonly deployId: string;
    readonly timeoutMs: number;
    constructor(deployId: string, timeoutMs: number, message?: string);
}
export declare class DomainClosedError extends CustomError {
    readonly domainName: string;
    constructor(domainName: string, message?: string);
}
export declare class DuplicateWalletError extends CustomError {
    readonly existingSignerId: string;
    constructor(existingSignerId: string, message?: string);
}
export declare class DuplicateAccountError extends CustomError {
    readonly existingSignerId: string;
    readonly existingAccountId: string;
    constructor(existingSignerId: string, existingAccountId: string, message?: string);
}
export declare class WalletActionInProgressError extends CustomError {
    readonly action: WalletAction;
    readonly signerId: string;
    constructor(action: WalletAction, signerId: string, message?: string);
}
export declare class ReservationActionInProgressError extends CustomError {
    readonly action: ReservationAction;
    readonly networkId: NetworkId;
    readonly accountId?: string;
    constructor(action: ReservationAction, networkId: NetworkId, accountId?: string, message?: string);
}
export declare class HDWalletOnlyOperationError extends CustomError {
    readonly operation: string;
    constructor(operation: string, message?: string);
}
export declare class LastAccountRemovalError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
export declare class AccountBusyError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
export declare class UnknownAccountError extends CustomError {
    readonly walletId: string;
    readonly accountId: string;
    constructor(walletId: string, accountId: string, message?: string);
}
export declare class InvalidKeyfileError extends CustomError {
    constructor(message?: string);
}
export declare class InvalidKeyfilePasswordError extends CustomError {
    constructor(message?: string);
}
export declare class KeyfileWalletNotFoundError extends CustomError {
    constructor(message?: string);
}
export declare class NetworkBusyError extends CustomError {
    readonly networkId: NetworkId;
    constructor(networkId: NetworkId, message?: string);
}
export declare class StorageSchemaError extends CustomError {
    readonly isStorageIntact: boolean;
    constructor(code: CustomErrorCode, message: string, status: number, isStorageIntact: boolean);
}
export declare class StorageVersionDowngradeError extends StorageSchemaError {
    readonly storedVersion: number;
    readonly supportedVersion: number;
    constructor(storedVersion: number, supportedVersion: number, message?: string);
}
export declare class StorageMigrationChainError extends CustomError {
    readonly violation: StorageMigrationChainViolation;
    readonly versions: number[];
    constructor(violation: StorageMigrationChainViolation, versions: number[], message?: string);
}
export declare class StorageMigrationFailedError extends StorageSchemaError {
    readonly failedVersion: number;
    readonly description: string;
    readonly storedVersion: number;
    readonly migrationError: unknown;
    constructor(failedVersion: number, description: string, storedVersion: number, migrationError: unknown, message?: string);
}
export declare class StorageMigrationInterruptedError extends StorageSchemaError {
    readonly pendingVersion: number;
    readonly reason: StorageMigrationInterruptionReason;
    constructor(pendingVersion: number, reason: StorageMigrationInterruptionReason, message?: string);
}
export declare class StorageMigrationRollbackError extends StorageSchemaError {
    readonly failedVersion: number;
    readonly failures: string[];
    readonly migrationError: unknown;
    constructor(failedVersion: number, failures: string[], migrationError: unknown, message?: string);
}
export declare class BalanceUnavailableError extends CustomError {
    readonly address: Address;
    readonly reason: string;
    constructor(address: Address, reason: string);
}
