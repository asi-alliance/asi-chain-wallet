import Account from "@domains/Account";
import { INetworkRecord, NetworkId } from "@domains/Network";
import { TReservationsByWallet } from "@domains/Transaction";
import Wallet from "@domains/Wallet";
export declare enum ClientEvent {
    WALLETS_CHANGED = "walletsChanged",
    ACCOUNTS_CHANGED = "accountsChanged",
    NETWORK_CHANGED = "networkChanged",
    RESERVATIONS_CHANGED = "reservationsChanged",
    NETWORK_BUSY_CHANGED = "networkBusyChanged",
    WALLET_LOCKED = "walletLocked"
}
export interface IClientEventMap {
    [ClientEvent.WALLETS_CHANGED]: [wallets: Wallet[]];
    [ClientEvent.ACCOUNTS_CHANGED]: [walletId: string, accounts: Account[]];
    [ClientEvent.NETWORK_CHANGED]: [network: INetworkRecord];
    [ClientEvent.RESERVATIONS_CHANGED]: [
        reservationsByWallet: TReservationsByWallet
    ];
    [ClientEvent.NETWORK_BUSY_CHANGED]: [networkId: NetworkId, isBusy: boolean];
    [ClientEvent.WALLET_LOCKED]: [walletId: string];
}
export type TClientEventName = keyof IClientEventMap;
export type TClientEventListener<TName extends TClientEventName> = (...payload: IClientEventMap[TName]) => void | Promise<void>;
export type TUnsubscribe = () => void;
export type TClientEventListenerErrorHandler = (name: TClientEventName, error: unknown) => void | Promise<void>;
export interface IClientEventSource {
    on<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): TUnsubscribe;
    off<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): void;
}
export default class ClientEventBus implements IClientEventSource {
    private readonly listeners;
    private readonly onListenerError?;
    private readonly source;
    constructor(onListenerError?: TClientEventListenerErrorHandler);
    private createSource;
    getSource(): IClientEventSource;
    on<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): TUnsubscribe;
    off<TName extends TClientEventName>(name: TName, listener: TClientEventListener<TName>): void;
    private reportListenerError;
    private notify;
    emit<TName extends TClientEventName>(name: TName, ...payload: IClientEventMap[TName]): void;
    clear(): void;
}
