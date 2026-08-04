export declare enum CustomErrorCode {
    WALLET_LOCKED = "WALLET_LOCKED"
}
export declare class CustomError extends Error {
    readonly code: CustomErrorCode;
    readonly status: number;
    constructor(code: CustomErrorCode, message: string, status: number);
}
export declare class WalletLockedError extends CustomError {
    constructor(message?: string);
}
