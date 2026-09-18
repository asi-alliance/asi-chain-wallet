import Account from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
import Wallet from "@domains/Wallet";
import { WalletTypes } from "@domains/Signer";
import { EncryptedData } from "@services/Crypto";
export interface IKeyfileAccount {
    name: string;
    address: string;
    index: number | null;
}
export interface IKeyfileWalletAccount {
    name: string;
    index: number | null;
}
export interface IKeyfileWallet {
    walletType: WalletTypes;
    encryptedPrivateData: EncryptedData;
    encryptedAccounts: EncryptedData;
}
export default class KeyfileSerializer {
    static serializeAccount: (account: Account) => IKeyfileAccount;
    static serializeWalletAccount: (account: Account) => IKeyfileWalletAccount;
    static serializeWallet: (wallet: Wallet, passwordProvider: SecretsProvider) => Promise<IKeyfileWallet>;
}
