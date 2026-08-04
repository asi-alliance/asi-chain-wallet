import Asset from "@domains/Asset";
import { Address } from "@domains/Wallet";
import DeployService from "@services/DeployService";
export interface IBalanceData {
    amount: bigint;
    asset: Asset;
}
export default class AssetsService {
    private readonly deployService;
    constructor(deployService: DeployService);
    getBalance(address: Address, asset: Asset): Promise<IBalanceData>;
}
