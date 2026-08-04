import Wallet from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import ReservationAdapter from "@domains/ReservationAdapter";
import ReservationAdapterManager from "@services/ReservationAdapterManager";
import { IClientEventDispatcher } from "@domains/Client";
export interface IAddReservationAdapterToManagerOptions {
    reservationAdapterManager: ReservationAdapterManager;
    wallet: Wallet;
    passwordProvider: SecretsProvider;
    eventDispatcher?: IClientEventDispatcher;
}
export declare const createReservationAdapter: ({ reservationAdapterManager, wallet, passwordProvider, eventDispatcher, }: IAddReservationAdapterToManagerOptions) => Promise<ReservationAdapter>;
