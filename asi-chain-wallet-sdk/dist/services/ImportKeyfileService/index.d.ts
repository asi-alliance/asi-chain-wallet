import SecretsProvider, { TDecryptedSecret } from "@domains/SecretsProvider";
import { WalletTypes } from "@domains/Signer";
import type { IImportKeyfileWalletPayload } from "@domains/Wallet";
import type { IKeyfileWalletAccount } from "@services/KeyfileSerializer";
import { EncryptedData } from "@services/Crypto";
import type { IWalletKeyfile } from "@services/ExportKeyfileService";
export interface IImportWalletKeyfileOptions {
    accountIndexes?: number[];
}
export default class ImportKeyfileService {
    static fromJSON(source: string): unknown;
    private static validateWalletKeyfile;
    private static validateWalletKeyfileAccounts;
    static parseWalletKeyfile(source: unknown): IWalletKeyfile;
    static decryptKeyfileAccounts(keyfile: IWalletKeyfile, passwordProvider: SecretsProvider): Promise<IKeyfileWalletAccount[]>;
    private static selectAccounts;
    static toImportPayload(keyfile: IWalletKeyfile, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IImportKeyfileWalletPayload>;
    static decryptKeyfileSecret(walletType: WalletTypes, encryptedSecret: EncryptedData, passwordProvider: SecretsProvider): Promise<TDecryptedSecret>;
}
