import ApiClientManager from "@domains/ApiClientManager";
import NodeApiProvider from "@domains/NodeApiProvider";
import { Pagination } from "@services/GraphqlParser/queryOptions";
import { Transaction } from "@domains/Transaction";
import { NetworkId } from "@domains/Network";
export default class AccountDataService {
    private readonly nodeApiProvider;
    private readonly apiClientManager;
    constructor(nodeApiProvider?: NodeApiProvider, apiClientManager?: ApiClientManager);
    private get api();
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination, networkId?: NetworkId): Promise<Transaction[]>;
}
