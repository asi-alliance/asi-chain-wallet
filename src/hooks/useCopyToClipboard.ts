import { useEffect, useRef, useState } from "react";

export type TCopyStatus = "copied" | "failed";

export interface ICopyResult {
    value: string;
    status: TCopyStatus;
}

export interface IUseCopyToClipboard {
    result: ICopyResult | null;
    isCopying: boolean;
    copy: (value: string) => void;
}

const DEFAULT_COPIED_STATUS_DURATION_MS: number = 2000;

const writeToClipboard = async (value: string): Promise<void> =>
    navigator.clipboard.writeText(value);

export const useCopyToClipboard = (
    copiedStatusDurationMs: number = DEFAULT_COPIED_STATUS_DURATION_MS,
): IUseCopyToClipboard => {
    const [result, setResult] = useState<ICopyResult | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const isCopyingRef = useRef(false);

    useEffect(() => {
        if (result?.status !== "copied") {
            return;
        }

        const timeoutId = window.setTimeout(
            () => setResult(null),
            copiedStatusDurationMs,
        );

        return () => window.clearTimeout(timeoutId);
    }, [result, copiedStatusDurationMs]);

    const copy = (value: string): void => {
        if (isCopyingRef.current) {
            return;
        }

        isCopyingRef.current = true;
        setIsCopying(true);
        setResult(null);

        writeToClipboard(value)
            .then(
                () => setResult({ value, status: "copied" }),
                () => setResult({ value, status: "failed" }),
            )
            .finally(() => {
                isCopyingRef.current = false;
                setIsCopying(false);
            });
    };

    return { result, isCopying, copy };
};
