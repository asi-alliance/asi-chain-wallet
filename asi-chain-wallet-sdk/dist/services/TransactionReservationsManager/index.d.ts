import { IDisposable } from "./../DisposableItemManager/index";
import { ITransactionReservation } from "@domains/Transaction";
import { IDeployWatchCallbacks, IDeployWatchOptions } from "@services/DeployStatusPoller";
export interface ITransactionReservationsManagerOptions {
    onConfirmed?: (reservation: ITransactionReservation) => void;
    onExpired?: (reservation: ITransactionReservation) => void;
    onFailed?: (reservation: ITransactionReservation, error: Error) => void;
    watchCallbacks?: IDeployWatchCallbacks;
    watchOptions?: IDeployWatchOptions;
}
export default class TransactionReservationsManager implements IDisposable {
    private readonly reservations;
    private readonly watchers;
    private readonly expirationTimers;
    private readonly onConfirmed?;
    private readonly onExpired?;
    private readonly onFailed?;
    private readonly watchCallbacks?;
    private readonly watchOptions?;
    constructor(reservations: ITransactionReservation[], options?: ITransactionReservationsManagerOptions);
    add(reservation: ITransactionReservation): void;
    remove(id: string): boolean;
    get(id: string): ITransactionReservation | null;
    getAll(): ITransactionReservation[];
    getByAccountId(accountId: string): ITransactionReservation[];
    dispose(): void;
    private track;
    private watch;
    private scheduleExpiration;
    private stopWatch;
    private clearExpiration;
    private handleConfirmed;
    private handleExpired;
    private handleFailed;
}
