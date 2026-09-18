import Asset from "@domains/Asset";
import NodeApiProvider from "@domains/NodeApiProvider";
import { Address } from "@domains/Wallet";
import DeployService from "@services/DeployService";
export interface IBalanceData {
    amount: bigint;
    asset: Asset;
}
export default class AssetsService {
    private readonly deployService;
    private readonly nodeApiProvider;
    constructor(deployService: DeployService, nodeApiProvider?: NodeApiProvider);
    private get terms();
    getBalance(address: Address, asset: Asset): Promise<IBalanceData>;
}
