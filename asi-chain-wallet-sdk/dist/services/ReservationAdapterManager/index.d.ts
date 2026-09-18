import ReservationAdapter from "@domains/ReservationAdapter";
import Wallet, { Address } from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import DisposableItemManager from "@services/DisposableItemManager";
import { NetworkId } from "@domains/Network";
import { ITransactionReservation, Transaction, TReservationsByWallet } from "@domains/Transaction";
import Account from "@domains/Account";
export interface ICreateReservationAdapterManagerOptions {
    onReservationsChanged?: () => void;
    reservationAdapters?: Map<string, ReservationAdapter>;
}
declare class ReservationAdapterManager extends DisposableItemManager<ReservationAdapter> {
    private static readonly operationsGuard;
    private readonly onReservationsChanged;
    constructor({ reservationAdapters, onReservationsChanged, }: ICreateReservationAdapterManagerOptions);
    private readonly notifyReservationsChanged;
    create(wallet: Wallet, passwordProvider?: SecretsProvider): Promise<ReservationAdapter>;
    remove(id: string): ReservationAdapter;
    removeByFilter(filter: (reservationAdapter: ReservationAdapter) => boolean): ReservationAdapter[];
    clear(): void;
    getReservationsByWallet(): TReservationsByWallet;
    getAllReservations(): ITransactionReservation[];
    getIncomingReservations(targetAddress: Address): ITransactionReservation[];
    hasNetworkReservations(networkId: NetworkId): boolean;
    isExclusiveNetwork(networkId: NetworkId): boolean;
    runExclusiveNetworkAction<T>(networkId: NetworkId, operation: () => Promise<T>): Promise<T>;
    removeNetworkReservations(networkId: NetworkId): Promise<void>;
    getPendingTransactions(walletId: string, account: Account): Transaction[];
}
export default ReservationAdapterManager;
