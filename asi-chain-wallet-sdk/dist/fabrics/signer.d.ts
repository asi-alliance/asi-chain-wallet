import SecretsProvider, { TDecryptedSecret } from "@domains/SecretsProvider";
import Signer, { ISignerRecord, WalletTypes } from "@domains/Signer";
export interface ICreateImportedSignerPayload {
    secret: TDecryptedSecret;
    passwordProvider: SecretsProvider;
}
export type TCreateSignerPayload = {
    id: string;
    type: WalletTypes.PRIVATE_KEY;
    secretProvider: SecretsProvider;
} | {
    id: string;
    type: WalletTypes.HD;
    secretProvider: SecretsProvider;
};
export declare const createSigner: (payload: TCreateSignerPayload) => Promise<Signer>;
export declare const createImportedSigner: ({ secret, passwordProvider, }: ICreateImportedSignerPayload) => Promise<Signer>;
export declare const restoreSigner: ({ id, type, encryptedData, encryptedDataKey, fingerprint, }: ISignerRecord) => Signer;
