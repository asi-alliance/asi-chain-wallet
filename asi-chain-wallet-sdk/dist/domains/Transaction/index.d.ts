import { NetworkId } from "@domains/Network";
import { ITableRecord } from "@domains/TableService";
export declare const TRANSACTION_STATUSES: readonly ["pending", "completed", "failed"];
export declare const TRANSACTION_TYPES: readonly ["send", "receive", "deploy"];
export declare const TRANSACTION_DETECTED_BY_TYPES: readonly ["balance_change", "manual", "auto"];
export declare const TRANSACTION_RESERVATION_KINDS: readonly ["transfer", "deploy"];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionDetectedBy = (typeof TRANSACTION_DETECTED_BY_TYPES)[number];
export type TransactionReservationKind = (typeof TRANSACTION_RESERVATION_KINDS)[number];
export interface Transaction {
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
export type TSerializedTransaction = Omit<Transaction, "timestamp"> & {
    timestamp: string;
};
export interface ITransactionReservationDetails {
    deployId: string;
    timestamp: Date;
    from: string;
    to?: string;
    amount?: string;
    gasCost?: string;
    contractCode?: string;
}
export type TSerializedTransactionReservationDetails = Omit<ITransactionReservationDetails, "timestamp"> & {
    timestamp: string;
};
export interface ITransactionReservationPrivateData {
    accountId: string;
    pendingAmount: string;
    expirationTime: number;
    kind: TransactionReservationKind;
    details: ITransactionReservationDetails;
}
export interface ISerializedTransactionReservationPrivateData extends Omit<ITransactionReservationPrivateData, "details"> {
    details: TSerializedTransactionReservationDetails;
}
export interface ITransactionReservation extends ITransactionReservationPrivateData, ITableRecord {
    networkId: NetworkId;
}
export type TReservationsByWallet = Record<string, ITransactionReservation[]>;
