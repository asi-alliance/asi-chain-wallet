import { NetworkId } from "@domains/Network";
import { ReservationAction } from "@domains/CustomError";
import ConcurrentOperationGuardService from "@services/ConcurrentOperationGuard";
export declare const RESERVATION_KEY_PREFIX: string;
export declare const DEPLOY_KEY_PREFIX: string;
export declare const NETWORK_KEY_PREFIX: string;
export interface IReservationOperationTarget {
    accountId: string;
    networkId: NetworkId;
    deployId?: string;
    reservationId?: string;
}
export interface IReservationOperationOwner {
    action: ReservationAction;
    networkId: NetworkId;
    accountId?: string;
}
export default class ReservationOperationGuardService extends ConcurrentOperationGuardService<IReservationOperationOwner> {
    private static instance;
    static getInstance(): ReservationOperationGuardService;
    private getAccountKey;
    private getDeployKey;
    private getReservationKey;
    private getNetworkKey;
    hasNetworkScope(networkId: NetworkId): boolean;
    private getGuardedKeys;
    private createConflictError;
    runReservationAction<T>(action: ReservationAction, target: IReservationOperationTarget, operation: () => Promise<T>): Promise<T>;
    runNetworkReservationAction<T>(action: ReservationAction, networkId: NetworkId, operation: () => Promise<T>): Promise<T>;
}
