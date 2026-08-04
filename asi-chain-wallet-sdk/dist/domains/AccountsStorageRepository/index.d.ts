import { IStorageFabricOptions } from "@fabrics/Storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
import { ITableRecord } from "@domains/TableService";
import { EncryptedData } from "@services/Crypto";
import { WalletTypes } from "@domains/Signer";
declare const ACCOUNTS_DATA_KEY: string;
export interface IPublicWalletRecord extends ITableRecord {
    name: string;
    type: WalletTypes;
}
export interface IWalletRecordEncryptedFields {
    keyData: string;
    depth: number | null;
    HDPath: string | null;
}
export interface IFullWalletRecord extends IPublicWalletRecord, ITableRecord {
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
export interface IAccountStorageRecord extends ITableRecord {
    signerId: string;
    name: string;
    index: number | null;
    createdAt: number;
    updatedAt?: number;
}
export declare class AccountsStorageRepository extends BaseStorageRepository<IAccountStorageRecord> {
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
export { ACCOUNTS_DATA_KEY };
