type AssetId = string;
type Assets = Map<AssetId, Asset>;
export type { AssetId, Assets };
export interface IAssetOptions {
    id: string;
    name: string;
    decimals?: number;
    contractAddress?: string;
}
export default class Asset {
    private readonly id;
    private readonly name;
    private readonly decimals;
    private readonly contractAddress;
    constructor({ id, name, decimals, contractAddress }: IAssetOptions);
    getId(): string;
    getName(): string;
    getDecimals(): number;
    getContractAddress(): string | null;
}
export declare const DEFAULT_ASSET: Asset;
