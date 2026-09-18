import Account from "@domains/Account";
import ItemManager from "@services/ItemManager";
import Wallet, { IImportKeyfileWalletPayload } from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import { WalletTypes } from "@domains/Signer";
export interface IAccountMetadata {
    id: string;
    name: string;
    index: number | null;
}
export interface IWalletMetadata {
    signerId: string;
    type: WalletTypes;
    accounts: IAccountMetadata[];
}
export interface ICreateHDWalletParams {
    accountName: string;
    index?: number;
}
export interface IDerivedAccount {
    accountId: string;
    account: Account;
}
export default class WalletManager extends ItemManager<Wallet> {
    private static readonly operationsGuard;
    createHD({ accountName, index }: ICreateHDWalletParams, secretProvider: SecretsProvider): Promise<Wallet>;
    createPrivateKey(accountName: string, secretProvider: SecretsProvider): Promise<Wallet>;
    getBySignerId(signerId: string): Wallet | null;
    importKeyfile(payload: IImportKeyfileWalletPayload, passwordProvider: SecretsProvider): Promise<Wallet>;
    open(signerId: string, passwordProvider: SecretsProvider): Promise<Wallet>;
    delete(id: string): Promise<Wallet>;
    deriveAccount(walletId: string, accountName: string, passwordProvider: SecretsProvider): Promise<IDerivedAccount>;
    removeAccount(walletId: string, accountId: string): Promise<Account>;
    renameAccount(walletId: string, accountId: string, name: string): Promise<void>;
    getAccount(walletId: string, accountId: string): Account;
    getPublicWalletsMetadata(): Promise<IWalletMetadata[]>;
    count(): Promise<number>;
    countInStorage(): Promise<number>;
    private persist;
}
