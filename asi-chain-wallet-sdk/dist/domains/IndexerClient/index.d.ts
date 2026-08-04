import BaseGraphQLClient from "@domains/BaseGraphQLClient";
import { Pagination } from "../../services/GraphqlParser/queryOptions";
import { TransactionHistoryQueryData } from "../../services/GraphqlParser";
export default class IndexerClient extends BaseGraphQLClient {
    getTransactionHistory(address: string, publicKey: string, pagination?: Pagination): Promise<TransactionHistoryQueryData>;
}
