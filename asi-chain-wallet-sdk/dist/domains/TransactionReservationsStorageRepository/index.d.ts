import { NetworkId } from "@domains/Network";
import { ITableRecord } from "@domains/TableService";
import { IStorageFabricOptions } from "@fabrics/storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
import { EncryptedData } from "@services/Crypto";
declare const TRANSACTION_RESERVATIONS_DATA_KEY: string;
export interface ITransactionReservationsStorageRecord extends ITableRecord {
    networkId: NetworkId;
    signerId: string;
    encryptedData: EncryptedData;
    createdAt: number;
    updatedAt?: number;
}
export declare class TransactionReservationsStorageRepository extends BaseStorageRepository<ITransactionReservationsStorageRecord> {
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
export { TRANSACTION_RESERVATIONS_DATA_KEY };
