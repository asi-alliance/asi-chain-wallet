export declare const encodeBase58: (hex: string) => string;
export declare const decodeBase58: (value: string) => Uint8Array;
export declare const decodeBase16: (hex: string) => Uint8Array;
export declare const encodeBase16: (bytes: Uint8Array) => string;
export declare const arrayBufferToBase64: (buffer: ArrayBuffer) => string;
export declare const base64ToArrayBuffer: (base64: string) => ArrayBuffer;
export declare const bufferToBigInt: (buffer: Uint8Array) => bigint;
export declare const bigIntToBuffer: (num: bigint) => Uint8Array;
