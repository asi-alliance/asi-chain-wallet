import { IBlockDto } from "@domains/ObserverClient";
import ApiClientManager from "@domains/ApiClientManager";
export default class BlockService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    getBlock(blockHash: string): Promise<string>;
    getLatestBlock(): Promise<IBlockDto>;
    getLatestBlockNumber(): Promise<number>;
    isValidatorActive(): Promise<boolean>;
}
