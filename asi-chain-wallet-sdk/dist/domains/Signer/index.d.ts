import type SecretsProvider from "@domains/SecretsProvider";
import type { IHDSecret, IPrivateKeyCredentials } from "@domains/SecretsProvider";
import { EncryptedData } from "@services/Crypto";
export declare enum WalletTypes {
    PRIVATE_KEY = "private-key",
    HD = "hd"
}
export interface ISignerOptions {
    id: string;
    encryptedSecret: EncryptedData;
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
export type TDecryptedSecret = IPrivateKeyCredentials | IHDSecret;
export interface ISignerUnlockOptions {
    autoLockMs?: number;
    onAutoLock?: () => void;
}
export interface ISignerRecord {
    id: string;
    type: WalletTypes;
    encryptedData: EncryptedData;
}
export default abstract class Signer {
    protected readonly id: string;
    protected encryptedSecret: EncryptedData;
    private session;
    constructor({ id, encryptedSecret }: ISignerOptions);
    getId(): string;
    getEncryptedSecret(): EncryptedData;
    isUnlocked(): boolean;
    unlock(passwordProvider: SecretsProvider, options?: ISignerUnlockOptions): Promise<void>;
    protected resolveSecret(signingContext: TSigningContext): Promise<{
        secret: TDecryptedSecret;
        ephemeral: boolean;
    }>;
    lock(): void;
    abstract sign(payload: string, signingContext: TSigningContext): Promise<ISignedMessageResponse>;
}
