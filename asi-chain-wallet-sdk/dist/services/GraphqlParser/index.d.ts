import { NetworkId } from "@domains/Network";
import { Pagination } from "./queryOptions";
import { Transaction } from "@domains/Transaction";
interface GraphqlEnvelope<TData> {
    data?: TData;
    errors?: unknown[];
}
export interface TransactionHistoryQueryData {
    transfers?: RawTransfer[];
    deployments?: RawDeployment[];
}
export interface RawTransfer {
    deploy_id: string;
    block_number?: number | string;
    block_hash?: string;
    from_address?: string;
    to_address?: string;
    amount_asi?: number | string;
    timestamp?: number | string;
    from_public_key?: string;
    network_name?: string;
}
export interface RawDeployment {
    deploy_id: string;
    block_number?: number | string;
    deployer?: string;
    timestamp?: number | string;
    block?: {
        block_hash?: string;
    };
}
/**
 * Access to indexer GraphQL API.
 */
export declare class GraphqlParser {
    static isRecord(value: unknown): value is Record<string, unknown>;
    static isDefined<T>(value: T | undefined): value is T;
    static createTransactionHistoryRequest(address: string, publicKey: string, pagination?: Pagination): {
        query: string;
        variables: Record<string, number | string | undefined>;
    };
    static mapTransactionHistory(data: TransactionHistoryQueryData | undefined, address: string, networkId: NetworkId): Transaction[];
    static unwrapGraphqlEnvelope<TData>(response: unknown): GraphqlEnvelope<TData>;
    static isRecoverableNetworkError(error: any): boolean;
}
export {};
