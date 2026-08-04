import SecretsProvider from "@domains/SecretsProvider";
import Signer, { ISignerRecord, WalletTypes } from "@domains/Signer";
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
export declare const restoreSigner: ({ id, type, encryptedData, encryptedDataKey, }: ISignerRecord) => Signer;
