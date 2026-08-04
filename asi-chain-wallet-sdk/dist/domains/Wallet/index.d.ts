import Signer, { ISignerRecord, ISignerUnlockOptions, WalletTypes } from "@domains/Signer";
import Account, { IAccountRecord, TCreateAccountPayload, TEditableAccountOptions } from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
import Bip44Path from "@domains/Bip44Path";
import { ICreatedAccountData } from "@services/AccountManager";
import { ITransferDetails } from "@services/TransactionService";
type AddressBrand = {
    readonly __brand: unique symbol;
};
export type Address = `1111${string & AddressBrand}`;
export interface IWalletOptions {
    id?: string;
    type: WalletTypes;
    signer: Signer;
    accounts: Map<string, Account>;
    activeAccount?: Account;
}
export type TCreateHDPathWalletOptions = {
    customHDPath: Bip44Path;
} | {
    index: number;
};
export interface ICreateHDWalletOptions {
    mnemonic: string;
    pathOptions: TCreateHDPathWalletOptions;
    accountOptions: TCreateAccountPayload;
}
export interface IRestoreWalletPayload {
    signerRecord: ISignerRecord;
    accountRecords: IAccountRecord[];
}
export default class Wallet {
    private readonly id;
    private readonly type;
    private readonly signer;
    private readonly accountManager;
    private constructor();
    getId(): string;
    getType(): WalletTypes;
    getSigner(): Signer;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISignerUnlockOptions): Promise<void>;
    lock(): void;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getActiveAccount(): Account | null;
    setActiveAccount(id: string): void;
    private getDerivationIndex;
    deriveAccount(payload: Omit<TCreateAccountPayload, "index">, passwordProvider: SecretsProvider): Promise<ICreatedAccountData>;
    removeAccount(id: string): Account;
    updateAccount(id: string, payload: TEditableAccountOptions): void;
    static createPk(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Wallet>;
    static createHD(options: ICreateHDWalletOptions, passwordProvider: SecretsProvider): Promise<Wallet>;
    static restore(payload: IRestoreWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    transfer(payload: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
}
export {};
