import Signer, { ISignerRecord, WalletTypes } from "@domains/Signer";
import { ISigningSessionOptions } from "@domains/SigningSession";
import Account, { IAccountRecord, TCreateAccountPayload, TEditableAccountOptions } from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
import Bip44Path from "@domains/Bip44Path";
import { ICreatedAccountData } from "@services/AccountManager";
import { ITransferDetails, TDeployDetails } from "@services/TransactionService";
import { SignedResult } from "@services/Signer";
import { EncryptedData } from "@services/Crypto";
type AddressBrand = {
    readonly __brand: unique symbol;
};
export type Address = `1111${string & AddressBrand}`;
export declare const ACCOUNT_KEY_PREFIX: string;
export interface IWalletOptions {
    id?: string;
    type: WalletTypes;
    signer: Signer;
    accounts: Map<string, Account>;
}
export type TCreateHDPathWalletOptions = {
    customHDPath: Bip44Path;
} | {
    index: number;
};
export interface ICreateHDWalletOptions {
    pathOptions: TCreateHDPathWalletOptions;
    accountOptions: TCreateAccountPayload;
}
export interface IRestoreWalletPayload {
    signerRecord: ISignerRecord;
    accountRecords: IAccountRecord[];
}
export interface IImportKeyfileWalletPayload {
    walletType: WalletTypes;
    encryptedSecret: EncryptedData;
    accounts: TCreateAccountPayload[];
}
export default class Wallet {
    private readonly id;
    private readonly type;
    private readonly signer;
    private readonly accountManager;
    private readonly accountOperationsGuard;
    private constructor();
    getId(): string;
    getType(): WalletTypes;
    getSigner(): Signer;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISigningSessionOptions): Promise<void>;
    lock(): void;
    isPasswordValid(passwordProvider: SecretsProvider): Promise<boolean>;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getAccount(id: string): Account;
    runAccountOperation<TResult>(accountId: string, operation: (account: Account) => Promise<TResult>): Promise<TResult>;
    private getDerivationIndex;
    deriveAccount(payload: Omit<TCreateAccountPayload, "index">, passwordProvider: SecretsProvider): Promise<ICreatedAccountData>;
    addAccounts(accounts: Account[]): void;
    removeAccount(id: string): Account;
    updateAccount(id: string, payload: TEditableAccountOptions): void;
    static createPk(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Wallet>;
    static createHD(options: ICreateHDWalletOptions, secretProvider: SecretsProvider): Promise<Wallet>;
    static importKeyfile({ walletType, encryptedSecret, accounts }: IImportKeyfileWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    static restore(payload: IRestoreWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    transfer(accountId: string, payload: ITransferDetails, passwordProvider?: SecretsProvider): Promise<string>;
    deploy(accountId: string, payload: TDeployDetails, passwordProvider?: SecretsProvider): Promise<string>;
    signDeploy(accountId: string, payload: TDeployDetails, passwordProvider?: SecretsProvider): Promise<SignedResult>;
}
export {};
