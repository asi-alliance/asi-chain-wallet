import BaseHttpClient from "@domains/BaseHttpClient";
export interface IBalanceResponse {
    balance: number;
}
export interface IBlockDto {
    blockInfo: string;
    blockNumber: number;
}
export type TBlocksView = "summary" | "full";
export interface IGetBlocksParams {
    start?: number;
    end?: number;
    view?: TBlocksView;
}
export default class ObserverClient extends BaseHttpClient {
    getDeploy(deployHash: string): Promise<unknown>;
    getBlock(blockHash: string): Promise<IBlockDto>;
    getBlocks(params?: IGetBlocksParams): Promise<IBlockDto[]>;
}
