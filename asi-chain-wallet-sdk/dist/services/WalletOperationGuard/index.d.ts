import Wallet from "@domains/Wallet";
import { WalletAction } from "@domains/CustomError";
import ConcurrentOperationGuardService from "@services/ConcurrentOperationGuard";
export interface ISignerOperationOwner {
    signerId: string;
}
export interface IAccountOperationOwner extends ISignerOperationOwner {
    accountId: string;
}
export type TWalletOperationOwner = ISignerOperationOwner | IAccountOperationOwner;
export default class WalletOperationGuardService extends ConcurrentOperationGuardService<TWalletOperationOwner> {
    private static instance;
    static getInstance(): WalletOperationGuardService;
    private getSignerKey;
    private getAccountKey;
    private getActionKey;
    private getFingerprintReservations;
    private createDuplicateError;
    runWalletCreation<T>(wallet: Wallet, operation: () => Promise<T>): Promise<T>;
    runWalletAction<T>(action: WalletAction, signerId: string, operation: () => Promise<T>): Promise<T>;
}
