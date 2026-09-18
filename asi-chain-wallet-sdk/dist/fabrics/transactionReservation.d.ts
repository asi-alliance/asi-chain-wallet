import Account from "@domains/Account";
import { ITransactionReservationsStorageRecord } from "@domains/TransactionReservationsStorageRepository";
import { NetworkId } from "@domains/Network";
import { Address } from "@domains/Wallet";
import { ISerializedTransactionReservationPrivateData, ITransactionReservation, Transaction, TransactionReservationKind } from "@domains/Transaction";
interface IReservationPayload {
    deployId: string;
    networkId: NetworkId;
    account: Account;
    pendingAmount: bigint;
    kind: TransactionReservationKind;
    gasCost?: bigint;
}
export interface ICreateTransferReservationPayload extends IReservationPayload {
    kind: "transfer";
    details: {
        to: Address;
        amount: bigint;
    };
}
export interface ICreateDeployReservationPayload extends IReservationPayload {
    kind: "deploy";
    term?: string;
}
export type TCreateTransactionReservationPayload = ICreateTransferReservationPayload | ICreateDeployReservationPayload;
interface IReservationMeta {
    deployId: string;
    pendingAmount: bigint;
    gasCost: bigint;
}
export interface ITransferReservationMeta extends IReservationMeta {
    kind: "transfer";
    to: Address;
    amount: bigint;
}
export interface IDeployReservationMeta extends IReservationMeta {
    kind: "deploy";
    term?: string;
}
export type TTransactionReservationMeta = ITransferReservationMeta | IDeployReservationMeta;
export default class TransactionReservationFabric {
    private static build;
    static toCreatePayload(meta: TTransactionReservationMeta, account: Account, networkId: NetworkId): TCreateTransactionReservationPayload;
    static createTransfer(payload: ICreateTransferReservationPayload, id?: string): ITransactionReservation;
    static createDeploy(payload: ICreateDeployReservationPayload, id?: string): ITransactionReservation;
    static create(payload: TCreateTransactionReservationPayload, id?: string): ITransactionReservation;
    static toPendingTransaction({ networkId, kind, details }: ITransactionReservation, viewerAddress: Address): Transaction;
    static toPrivateData({ accountId, pendingAmount, expirationTime, kind, details, }: ITransactionReservation): ISerializedTransactionReservationPrivateData;
    static fromStorage(record: ITransactionReservationsStorageRecord, privateData: ISerializedTransactionReservationPrivateData): ITransactionReservation;
}
export {};
