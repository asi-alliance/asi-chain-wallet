import type { IPrivateKeyCredentials, ISeedCredentials } from "@domains/SecretsProvider";
export type TFingerprintSecret = IPrivateKeyCredentials | ISeedCredentials;
export default class KeyFingerprintService {
    static fromPublicKey(publicKey: Uint8Array): string;
    static fromPrivateKey(privateKey: Uint8Array): string;
    static fromMnemonic(mnemonic: string): Promise<string>;
    static fromSecret(secret: TFingerprintSecret): Promise<string>;
}
