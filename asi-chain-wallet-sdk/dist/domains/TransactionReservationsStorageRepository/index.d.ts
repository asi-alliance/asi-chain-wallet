import { NetworkId } from "@domains/Network";
import { ITableRecord } from "@domains/TableService";
import { IStorageFabricOptions } from "@fabrics/Storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
import { ITransactionReservationPrivateData } from "@domains/Transaction";
declare const TRANSACTION_RESERVATIONS_DATA_KEY: string;
export interface ITransactionReservationsStorageRecord extends ITableRecord {
    networkId: NetworkId;
    signerId: string;
    privateData: ITransactionReservationPrivateData;
    createdAt: number;
    updatedAt?: number;
}
export declare class TransactionReservationsStorageRepository extends BaseStorageRepository<ITransactionReservationsStorageRecord> {
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
export { TRANSACTION_RESERVATIONS_DATA_KEY };
