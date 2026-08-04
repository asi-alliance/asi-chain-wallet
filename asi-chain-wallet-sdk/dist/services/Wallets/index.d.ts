import { Address } from "@domains/Wallet";
export interface CreateWalletOptions {
    name?: string;
}
export interface WalletMeta {
    address: string;
    privateKey: Uint8Array;
    publicKey?: Uint8Array;
    mnemonic?: string;
}
export default class WalletsService {
    static createWallet(privateKey?: Uint8Array, options?: CreateWalletOptions): WalletMeta;
    static createFirstWalletWithMnemonic(mnemonic?: string, index?: number): Promise<WalletMeta>;
    static deriveAddressFromPrivateKey(privateKey: Uint8Array): Address;
    static deriveAddressFromPublicKey(publicKey: Uint8Array): Address;
}
