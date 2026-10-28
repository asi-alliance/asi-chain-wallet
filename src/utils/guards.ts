export const isPlainObject = <TValue = unknown>(
    value: unknown,
): value is Record<string, TValue> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export const isNotEmptyPlainObject = <TValue = unknown>(
    value: unknown,
): value is Record<string, TValue> =>
    isPlainObject<TValue>(value) && Object.keys(value).length > 0;

export const isStringRecord = (
    value: unknown,
): value is Record<string, string> =>
    isPlainObject(value) &&
    Object.values(value).every(
        (item: unknown) => typeof item === "string" && item.length > 0,
    );