import { ITransactionReservationsManagerOptions } from "@services/TransactionReservationsManager";
import { ITransactionReservation, Transaction } from "@domains/Transaction";
import Wallet from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import { NetworkId } from "@domains/Network";
import { IDeployWatchCallbacks } from "@services/DeployStatusPoller";
import { IBalanceData } from "@services/AssetsService";
import Account from "@domains/Account";
import { ITransferDetails, TDeployDetails } from "@services/TransactionService";
import { TCreateTransactionReservationPayload } from "@fabrics/transactionReservation";
export interface IReservedOperationResult {
    deployId: string;
    subscribe: (callbacks: IDeployWatchCallbacks) => () => void;
}
export default class ReservationAdapter {
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
