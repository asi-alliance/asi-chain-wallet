import ApiClientManager from "@domains/ApiClientManager";
import { Pagination } from "@services/GraphqlParser/queryOptions";
import { Transaction } from "@domains/Transaction";
import { NetworkId } from "@domains/Network";
export default class AccountDataService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination, networkId?: NetworkId): Promise<Transaction[]>;
}
