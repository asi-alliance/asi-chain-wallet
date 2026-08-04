import AccountDataService from "@services/AccountDataService";
import AssetsService from "@services/AssetsService";
import BlockService from "@services/BlockService";
import DeployService from "@services/DeployService";
import DeployStatusPoller from "@services/DeployStatusPoller";
import TransactionService from "@services/TransactionService";
import ApiClientManager from "@domains/ApiClientManager";
export default class ApiServiceRegistry {
    private static instance;
    readonly deploy: DeployService;
    readonly blocks: BlockService;
    readonly accountData: AccountDataService;
    readonly assets: AssetsService;
    readonly transactions: TransactionService;
    readonly poller: DeployStatusPoller;
    private constructor();
    static getInstance(apiClientManager?: ApiClientManager): ApiServiceRegistry;
}
