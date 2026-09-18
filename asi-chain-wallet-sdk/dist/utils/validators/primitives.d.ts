export declare const isIntegerInRange: (value: number, min: number, max: number) => boolean;
export declare const validatePrivateKey: (privateKey: Uint8Array) => {
    isValid: boolean;
    error?: string;
};
export declare const isPrivateKeyValid: (privateKey: Uint8Array) => boolean;
