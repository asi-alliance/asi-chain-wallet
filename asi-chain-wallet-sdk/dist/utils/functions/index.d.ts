export declare const genRandomHex: (size: number) => string;
export declare const generateRandomId: () => string;
export declare const toAtomicAmount: (amount: number | string, decimals: number) => bigint;
export declare const fromAtomicAmountToNumber: (atomicAmount: bigint, decimals: number) => number;
export declare const fromAtomicAmount: (atomicAmount: bigint, decimals: number) => string;
export declare const toUint8Array: (value: unknown) => Uint8Array;
export type IUrlValue = string | number | boolean | undefined;
export interface IUrlParams {
    path?: Record<string, IUrlValue>;
    query?: Record<string, IUrlValue | undefined | null>;
}
export declare const buildUrl: (pathPrefix: string, params?: IUrlParams) => string;
/**
 * @returns address in the format accepted within the SDK application
 */
export declare function normalizeAddress(address: string | undefined): string;
