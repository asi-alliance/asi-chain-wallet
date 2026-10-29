import { TransactionStatus, TransactionType } from "@asichain/asi-wallet-sdk";

export interface Transaction {
    id: string;
    deployId: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: TransactionStatus;
    type: TransactionType;
    blockNumber?: number;
    error?: string;
}

export interface IPagination {
    limit?: number;
    offset?: number;
}
