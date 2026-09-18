import type SecretsProvider from "@domains/SecretsProvider";
import type { TDecryptedSecret } from "@domains/SecretsProvider";
import { EncryptedData } from "@services/Crypto";
import { ISigningSessionOptions } from "@domains/SigningSession";
export declare const SIGNER_KEY_PREFIX: string;
export declare enum WalletTypes {
    PRIVATE_KEY = "private-key",
    HD = "hd"
}
export interface ISignerOptions {
    id: string;
    encryptedSecret: EncryptedData;
    encryptedDataKey: EncryptedData;
    fingerprint: string;
}
export type TPKSigningContext = {
    passwordProvider?: SecretsProvider;
};
export type THDSigningContext = {
    passwordProvider?: SecretsProvider;
    index: number;
};
export type ISignedMessageResponse = {
    signature: Uint8Array;
    publicKey: Uint8Array;
};
export type TSigningContext = TPKSigningContext | THDSigningContext;
export interface ISignerRecord {
    id: string;
    type: WalletTypes;
    encryptedData: EncryptedData;
    encryptedDataKey: EncryptedData;
    fingerprint: string;
}
export default abstract class Signer {
    protected readonly id: string;
    protected encryptedSecret: EncryptedData;
    protected encryptedDataKey: EncryptedData;
    private readonly fingerprint;
    private readonly session;
    constructor({ id, encryptedSecret, encryptedDataKey, fingerprint, }: ISignerOptions);
    getId(): string;
    getFingerprint(): string;
    getEncryptedSecret(): EncryptedData;
    getEncryptedDataKey(): EncryptedData;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISigningSessionOptions): Promise<void>;
    resolveDataKey(passwordProvider?: SecretsProvider): Promise<string>;
    protected resolveSecret(signingContext: TSigningContext): Promise<{
        secret: TDecryptedSecret;
        ephemeral: boolean;
    }>;
    lock(): void;
    isPasswordValid(passwordProvider: SecretsProvider): Promise<boolean>;
    abstract sign(payload: string, signingContext: TSigningContext): Promise<ISignedMessageResponse>;
}
