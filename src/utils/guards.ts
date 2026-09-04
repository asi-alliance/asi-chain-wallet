export const isPlainObject = <TValue = unknown>(
    value: unknown,
): value is Record<string, TValue> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export const isNotEmptyPlainObject = <TValue = unknown>(
    value: unknown,
): value is Record<string, TValue> =>
    isPlainObject<TValue>(value) && Object.keys(value).length > 0;