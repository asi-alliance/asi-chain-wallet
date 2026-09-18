import { IBlockDto } from "@domains/ObserverClient";
import NodeApiProvider from "@domains/NodeApiProvider";
export default class BlockService {
    private readonly nodeApiProvider;
    constructor(nodeApiProvider?: NodeApiProvider);
    private get api();
    getBlock(blockHash: string): Promise<string>;
    getLatestBlock(): Promise<IBlockDto>;
    getLatestBlockNumber(): Promise<number>;
    isValidatorActive(): Promise<boolean>;
}
