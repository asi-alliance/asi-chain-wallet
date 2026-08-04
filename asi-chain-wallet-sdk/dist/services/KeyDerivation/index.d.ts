import Bip44Path, { IBip44PathOptions } from "@domains/Bip44Path";
import { type BIP32Interface } from "bip32";
export default class KeyDerivationService {
    static deriveKeyFromMnemonic(mnemonic: string | string[], bip44path: string | Bip44Path): Promise<Uint8Array>;
    static derivePrivateKey(masterNode: BIP32Interface, path: Bip44Path): Uint8Array;
    static mnemonicToSeed(mnemonicWords: string[] | string, passphrase?: string): Promise<Uint8Array>;
    static seedToMasterNode(seed: any): BIP32Interface;
    static deriveNextKeyFromMnemonic(mnemonicWords: string[], currentIndex: number, options?: Omit<IBip44PathOptions, "index">): Promise<Uint8Array>;
}
