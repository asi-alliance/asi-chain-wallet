export declare enum MnemonicStrength {
    TWELVE_WORDS = 128,
    TWENTY_FOUR_WORDS = 256
}
export default class MnemonicService {
    static generateMnemonic(strength?: MnemonicStrength): string;
    static generateMnemonicArray(strength?: MnemonicStrength): string[];
    static isMnemonicValid(mnemonic: string): boolean;
    static mnemonicToWordArray(mnemonic: string): string[];
    static wordArrayToMnemonic(words: string[]): string;
    static mnemonicToSeed(mnemonic: string | string[], passphrase?: string): Promise<Uint8Array>;
}
