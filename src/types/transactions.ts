export interface Transaction {
    id: string;
    deployId: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: "pending" | "completed" | "failed";
    blockNumber?: number;
    error?: string;
    gasCost?: string;
}

export interface IPagination {
    limit?: number;
    offset?: number;
}
