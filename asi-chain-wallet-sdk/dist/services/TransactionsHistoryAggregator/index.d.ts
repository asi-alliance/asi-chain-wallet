import { Transaction } from "@domains/Transaction";
import { NetworkId } from "@domains/Network";
import { Pagination } from "@services/GraphqlParser/queryOptions";
export interface ITransactionsHistoryWindow {
    pendingTransactions: Transaction[];
    executedPagination: Pagination;
    pageOffset: number;
    pageLimit?: number;
}
export default class TransactionsHistoryAggregator {
    static paginatePendingTransactions(pending: Transaction[], networkId: NetworkId, pagination?: Pagination): Transaction[];
    static createHistoryWindow(pending: Transaction[], networkId: NetworkId, pagination?: Pagination): ITransactionsHistoryWindow;
    static mergeHistoryPage(historyWindow: ITransactionsHistoryWindow, executed: Transaction[]): Transaction[];
}
