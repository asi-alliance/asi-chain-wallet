import SecretsProvider, { IHDSecret, IPrivateKeyCredentials } from "@domains/SecretsProvider";
declare const enum KeyUsage {
    ENCRYPT = "encrypt",
    DECRYPT = "decrypt",
    DERIVATION = "deriveKey"
}
export type CryptoConfig = {
    readonly VERSION: number;
    readonly IV_LENGTH: number;
    readonly SALT_LENGTH: number;
    readonly AUTH_TAG_LENGTH: number;
    readonly DATA_KEY_LENGTH: number;
    readonly KEY_SIZE_BITS: number;
    readonly KEY_IMPORT_FORMAT: "raw" | "pkcs8" | "spki";
    readonly KEY_DERIVATION_ITERATIONS: number;
    readonly KEY_DERIVATION_FUNCTION: string;
    readonly KEY_IMPORT_USAGE: KeyUsage[];
    readonly HASH_FUNCTION: string;
    readonly ALGORITHM: string;
};
export type EncryptedData = {
    data: string;
    salt: string;
    iv: string;
    version: number;
};
export interface IDecodeEncryptedFieldConfig {
    minimalLength?: number;
    length?: number;
}
export default class CryptoService {
    static generateDataKeySecret(): string;
    static encryptWithPassword(data: string, password: string): Promise<EncryptedData>;
    private static decodeEncryptedField;
    static decryptWithPassword(payload: EncryptedData, passphrase: string): Promise<string>;
    static decryptSignerData(signerData: EncryptedData, passwordProvider: SecretsProvider): Promise<IHDSecret | IPrivateKeyCredentials>;
    static deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
}
export {};
