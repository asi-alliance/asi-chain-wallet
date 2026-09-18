import { IBlockDto, IGetBlocksParams } from "@domains/ObserverClient";
import { NodeApiProfile } from "@domains/NodeApiProfile";
import { IDeployInfo, IDeployStatusResult } from "@domains/Deploy";
import type { IApiClients } from "@domains/ApiClientManager";
import type { TransactionHistoryQueryData } from "@services/GraphqlParser";
import type { Pagination } from "@services/GraphqlParser/queryOptions";
import type { SignedResult } from "@services/Signer";
export interface IExploratoryDeployClient {
    submitExploratoryDeploy(body: unknown): Promise<unknown>;
}
export default abstract class NodeApiAdapter {
    protected readonly clients: IApiClients;
    constructor(clients: IApiClients);
    abstract getProfile(): NodeApiProfile;
    submitDeploy(deploy: SignedResult): Promise<unknown>;
    protected getExploreDeployClient(): IExploratoryDeployClient;
    protected buildExploreDeployBody(term: string): unknown;
    exploreDeploy(term: string): Promise<unknown>;
    getDeploy(deployHash: string): Promise<unknown>;
    isDeployFinalized(deploy: IDeployInfo): boolean;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
    getBlock(blockHash: string): Promise<IBlockDto>;
    getBlocks(params?: IGetBlocksParams): Promise<IBlockDto[]>;
    getValidatorStatus(): Promise<unknown>;
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination): Promise<TransactionHistoryQueryData>;
}
