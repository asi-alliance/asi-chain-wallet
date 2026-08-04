import type { Address } from "@domains/Wallet";
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
