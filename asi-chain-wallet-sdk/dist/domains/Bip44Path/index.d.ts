export interface IBip44PathOptions {
    coinType: number;
    account?: number;
    change?: number;
    index?: number;
}
export default class Bip44Path {
    private static readonly BIP44_PURPOSE;
    private static readonly MIN_CHANGE;
    private static readonly MAX_CHANGE;
    private static readonly PATH_COMPONENTS_COUNT;
    private static readonly PURPOSE_INDEX;
    private static readonly COIN_TYPE_INDEX;
    private static readonly ACCOUNT_INDEX;
    private static readonly CHANGE_INDEX;
    private static readonly INDEX_COMPONENT_INDEX;
    private static readonly DECIMAL_RADIX;
    private coinType;
    private account;
    private change;
    private index;
    constructor({ coinType, account, change, index, }: IBip44PathOptions);
    static parse(pathString: string): Bip44Path;
    toString(): string;
    getCoinType(): number;
    getAccount(): number;
    getChange(): number;
    getIndex(): number;
    setCoinType(value: number): void;
    setAccount(value: number): void;
    setChange(value: number): void;
    setIndex(value: number): void;
    static fromOptions(options: IBip44PathOptions): Bip44Path;
    toOptions(): IBip44PathOptions;
    clone(): Bip44Path;
    nextIndex(): Bip44Path;
}
