import type { Address } from "@domains/Wallet";
import type { IErrorContext } from "@domains/CustomError";
import type { TCreateTransactionReservationPayload } from "@fabrics/transactionReservation";
import type { TDeployDetails } from "@services/TransactionService";
export declare const validateAccountName: (name: string, maxLength?: number) => {
    isValid: boolean;
    error?: string;
};
export declare enum AddressValidationErrorCode {
    INVALID_PREFIX = "INVALID_PREFIX",
    INVALID_LENGTH = "INVALID_LENGTH",
    INVALID_ALPHABET = "INVALID_ALPHABET",
    INVALID_BASE58 = "INVALID_BASE58",
    INVALID_HEX_LENGTH = "INVALID_HEX_LENGTH",
    INVALID_CHAIN_PREFIX = "INVALID_CHAIN_PREFIX",
    INVALID_CHECKSUM = "INVALID_CHECKSUM",
    NON_CANONICAL = "NON_CANONICAL"
}
export interface AddressValidationResult {
    isValid: boolean;
    errorCode?: AddressValidationErrorCode;
}
export declare const validateAddress: (address: string) => AddressValidationResult;
export declare const isAddress: (address: string) => address is Address;
export declare const validateUrl: (url: string) => {
    isValid: boolean;
    error?: string;
};
export declare const isValidUrl: (url: string) => boolean;
export declare const validateNodeApiProfile: (profile: unknown) => {
    isValid: boolean;
    error?: string;
};
export declare const ensureValid: ({ isValid, error }: {
    isValid: boolean;
    error?: string;
}, { context }: IErrorContext) => void;
export declare const validatePositiveAmount: (amount: bigint) => {
    isValid: boolean;
    error?: string;
};
export declare const validateReservationPayload: (payload: TCreateTransactionReservationPayload) => {
    isValid: boolean;
    error?: string;
};
export declare const validateDeployPayload: ({ term, phloLimit, phloPrice, shardId, }: TDeployDetails) => {
    isValid: boolean;
    error?: string;
};
