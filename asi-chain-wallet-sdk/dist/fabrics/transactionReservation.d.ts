import Account from "@domains/Account";
import { ITransactionReservationsStorageRecord } from "@domains/TransactionReservationsStorageRepository";
import { NetworkId } from "@domains/Network";
import { Address } from "@domains/Wallet";
import { ISerializedTransactionReservationPrivateData, ITransactionReservation } from "@domains/Transaction";
export interface ICreateTransactionReservationPayload {
    deployId: string;
    networkId: NetworkId;
    account: Account;
    details: {
        to: Address;
        amount: bigint;
    };
}
export default class TransactionReservationFabric {
    static create({ deployId, networkId, account, details, }: ICreateTransactionReservationPayload): ITransactionReservation;
    static toPrivateData({ accountId, pendingAmount, expirationTime, transaction, }: ITransactionReservation): ISerializedTransactionReservationPrivateData;
    static fromStorage(record: ITransactionReservationsStorageRecord, privateData: ISerializedTransactionReservationPrivateData): ITransactionReservation;
}
