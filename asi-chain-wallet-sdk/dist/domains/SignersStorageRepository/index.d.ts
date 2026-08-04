import { IStorageFabricOptions } from "@fabrics/Storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
import { EncryptedData } from "@services/Crypto";
import { ITableRecord } from "@domains/TableService";
import { WalletTypes } from "@domains/Signer";
declare const SIGNERS_DATA_KEY: string;
export interface IPrivateKeySignerEncryptedFields {
    keyData: Uint8Array;
}
export interface IHDSignerEncryptedFields {
    seed: string;
    rootHDPath: string;
}
export interface ISignerStorageRecord extends ITableRecord {
    type: WalletTypes;
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
export declare class SignersStorageRepository extends BaseStorageRepository<ISignerStorageRecord> {
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
export { SIGNERS_DATA_KEY };
