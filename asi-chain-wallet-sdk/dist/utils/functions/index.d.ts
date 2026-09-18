import { INetworkConfig } from "@domains/Network";
import { TransactionType } from "@domains/Transaction";
import { CorruptedDataSource } from "@domains/CustomError";
import { ITableRecord } from "@domains/TableService";
export declare const genRandomHex: (size: number) => string;
export declare const generateRandomId: () => string;
export declare const toAtomicAmount: (amount: number | string, decimals: number) => bigint;
export declare const fromAtomicAmountToNumber: (atomicAmount: bigint, decimals: number) => number;
export declare const fromAtomicAmount: (atomicAmount: bigint, decimals: number) => string;
export declare const parseAtomicAmount: (value: unknown) => bigint | null;
export type IUrlValue = string | number | boolean | undefined;
export interface IUrlParams {
    path?: Record<string, IUrlValue>;
    query?: Record<string, IUrlValue | undefined | null>;
}
export declare const buildUrl: (pathPrefix: string, params?: IUrlParams) => string;
export declare function normalizeAddress(address: string | undefined): string;
export declare function isSameAddress(address: string | undefined, other: string | undefined): boolean;
export declare function resolveTransferType(from: string, viewerAddress: string): TransactionType;
export declare const getErrorMessage: (error: unknown, fallback: string) => string;
export declare const parseDecryptedJson: <T>(payload: string, source: CorruptedDataSource, isExpectedStructure: (value: unknown) => value is T) => T;
export declare const runProtected: (run: () => void | Promise<void>, onFailure: (error: unknown) => void) => void;
export interface IFieldSelection<T, V> {
    selected: T[];
    missingValues: V[];
}
export declare const selectByField: <T, K extends keyof T>(items: T[], field: K, values: readonly T[K][]) => IFieldSelection<T, T[K]>;
export declare const isNetworkConfigChanged: (current: INetworkConfig, update?: Partial<INetworkConfig>) => boolean;
export declare const withSchemaVersion: <T extends ITableRecord>(record: T) => T;
