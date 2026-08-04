export declare const NATIVE_TOKEN_DECIMALS_AMOUNT: number;
export declare const DEFAULT_PHLO_LIMIT: number;
export declare const DEFAULT_PHLO_PRICE: number;
export declare const DEFAULT_NODE_STORAGE_DIR: string;
export declare const ASI_WALLET_KEYFILE: string;
export declare const ASI_WALLET_KEYFILE_VERSION: number;
export declare const ExportFormat: {
    readonly JSON: "json";
    readonly CSV: "csv";
};
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
export declare const TRANSACTIONS_CSV_HEADERS: string[];
export declare const GasFee: {
    MIN: bigint;
    MAX: bigint;
};
export declare const DEPLOY_STATUS_POLLING_TIMEOUT: number;
export declare const RESERVATION_EXPIRATION_TIME: number;
export declare const RequirePassword: {
    readonly ONCE_PER_SESSION: "once-per-session";
    readonly EVERY_SIGNATURE: "every-signature";
};
export type RequirePassword = (typeof RequirePassword)[keyof typeof RequirePassword];
export declare const DEFAULT_AUTO_LOCK_MS: number;
