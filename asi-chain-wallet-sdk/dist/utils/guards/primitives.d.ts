export declare const isRecord: (value: unknown) => value is Record<string, unknown>;
export declare const isValidByte: (value: unknown) => value is number;
export declare const isByteIndexedRecord: (value: object) => value is Record<string, number>;
export declare const isValueInConst: <const T extends readonly string[]>(value: unknown, values: T) => value is T[number];
export declare const isSerializedDecimal: (value: unknown) => value is string;
export declare const isSerializedInteger: (value: unknown) => value is string;
export declare const isRecordWithMessage: (value: unknown) => value is {
    message: string;
};
export declare const isErrorWithMessage: (value: unknown) => value is Error;
export declare const isPromiseLike: (value: unknown) => value is PromiseLike<unknown>;
