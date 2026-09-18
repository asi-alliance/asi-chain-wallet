import SecretsProvider from "@domains/SecretsProvider";
import type { Address, IImportKeyfileWalletPayload } from "@domains/Wallet";
import { WalletTypes } from "@domains/Signer";
import { IImportWalletKeyfileOptions } from "@services/ImportKeyfileService";
export declare enum KeyfileImportAccountStatus {
    NEW = "new",
    ALREADY_IMPORTED = "already-imported"
}
export interface IKeyfileImportAccountPreview {
    name: string;
    index: number | null;
    address: Address;
    status: KeyfileImportAccountStatus;
    existingAccountId: string | null;
}
export interface IKeyfileImportPreview {
    walletType: WalletTypes;
    existingSignerId: string | null;
    isExistingWalletOpen: boolean;
    accounts: IKeyfileImportAccountPreview[];
}
export interface IKeyfileImportPlan {
    payload: IImportKeyfileWalletPayload;
    secretProvider: SecretsProvider;
}
export interface IKeyfileAccountsImportPlan extends IKeyfileImportPlan {
    signerId: string;
}
export interface IKeyfileAccountsImportResult {
    signerId: string;
    importedAccountIds: string[];
}
export default class WalletImportService {
    private static resolveKeyfileImport;
    static prepareKeyfileImport(source: unknown, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IKeyfileImportPlan>;
    static prepareKeyfileAccountsImport(source: unknown, passwordProvider: SecretsProvider, options?: IImportWalletKeyfileOptions): Promise<IKeyfileAccountsImportPlan>;
    static previewKeyfileImport(source: unknown, passwordProvider: SecretsProvider): Promise<Omit<IKeyfileImportPreview, "isExistingWalletOpen">>;
}
