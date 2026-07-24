import { useCallback } from "react";
import { useDisconnect } from "wagmi";

const CROSS_NETWORK_STORAGE_PREFIXES = [
    "wagmi",
    "walletconnect",
    "wc@2",
    "WCM_",
    "@w3m",
    "rk-",
];

interface ClearCrossNetworksOptions {
    onCardanoClear?: () => void;
    onCosmosClear?: () => void;
}

export const useClearCrossNetworksData = ({
    onCardanoClear,
    onCosmosClear,
}: ClearCrossNetworksOptions = {}): (() => void) => {
    const { disconnect } = useDisconnect();

    return useCallback(() => {
        try {
            disconnect();
        } catch {
            /* no active EVM connection */
        }

        if (typeof window !== "undefined") {
            Object.keys(window.localStorage)
                .filter((key) =>
                    CROSS_NETWORK_STORAGE_PREFIXES.some((prefix) =>
                        key.startsWith(prefix),
                    ),
                )
                .forEach((key) => window.localStorage.removeItem(key));
        }

        onCardanoClear?.();
        onCosmosClear?.();
    }, [disconnect, onCardanoClear, onCosmosClear]);
};
