import { ITransactionReservationsManagerOptions } from "@services/TransactionReservationsManager";
import { ITransactionReservation } from "@domains/Transaction";
import Wallet from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import { IBalanceData } from "@services/AssetsService";
import Account from "@domains/Account";
import { ITransferDetails } from "@services/TransactionService";
export default class ReservationAdapter {
    private readonly reservationsManager;
    constructor(reservations: ITransactionReservation[], reservationsManagerOptions?: Omit<ITransactionReservationsManagerOptions, "onConfirmed" | "onExpired">);
    static create(wallet: Wallet, reservationsManagerOptions?: Omit<ITransactionReservationsManagerOptions, "onConfirmed" | "onExpired">): Promise<ReservationAdapter>;
    private getReservedAmount;
    getBalance(account: Account): Promise<IBalanceData>;
    getReservations(): ITransactionReservation[];
    dispose(): void;
    private persistReservation;
    validateSufficientBalance(account: Account, amount: bigint): Promise<boolean>;
    transfer(wallet: Wallet, details: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
}
