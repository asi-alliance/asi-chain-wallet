import Wallet from "@domains/Wallet";
import LifecycleGuard from "@domains/LifecycleGuard";
export type TDiscardWallet = (wallet: Wallet) => void;
export default class ClientLifecycleGuard extends LifecycleGuard {
    private readonly discardWallet;
    constructor(discardWallet: TDiscardWallet);
    runWalletPublication(operation: () => Promise<Wallet>): Promise<Wallet>;
    runAccountsUpdate<T>(signerId: string, operation: () => Promise<T>): Promise<T>;
}
