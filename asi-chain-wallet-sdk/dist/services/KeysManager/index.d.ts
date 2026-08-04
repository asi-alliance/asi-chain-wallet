import Bip44Path from "@domains/Bip44Path";
import { TCreateHDPathWalletOptions } from "@domains/Wallet";
export type KeyPair = {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
};
export interface IBaseHDWalletPrivateKeyData {
    path: Bip44Path;
    privateKey: Uint8Array;
}
export interface IHDWalletPrivateKeyDataFromMnemonic extends IBaseHDWalletPrivateKeyData {
    seed: Uint8Array;
}
export interface IHDWalletPrivateKeyDataFromSeed extends IBaseHDWalletPrivateKeyData {
    index: number;
}
export default class KeysManager {
    static generateRandomKey(length?: number): Uint8Array;
    static generateKeyPair(keyLength?: number): KeyPair;
    static getKeyPairFromPrivateKey(privateKey: Uint8Array): KeyPair;
    static getPublicKeyFromPrivateKey(privateKey: Uint8Array): Uint8Array;
    static convertKeyToHex(key: Uint8Array): string;
    static getInitialHDPathFromOptions(hdWalletOptions: TCreateHDPathWalletOptions): Promise<Bip44Path>;
    static getPrivateDataFromSeed(seed: Uint8Array, path: Bip44Path): Promise<IHDWalletPrivateKeyDataFromSeed>;
}
