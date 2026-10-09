import { isPlainObject } from "./guards";

const getErrorStringField = (
    error: unknown,
    field: "name" | "code",
): string | undefined => {
    if (!isPlainObject(error)) {
        return undefined;
    }

    const value: unknown = error[field];

    return typeof value === "string" ? value : undefined;
};

export const getErrorName = (error: unknown): string | undefined =>
    getErrorStringField(error, "name");

export const getErrorCode = (error: unknown): string | undefined =>
    getErrorStringField(error, "code");
