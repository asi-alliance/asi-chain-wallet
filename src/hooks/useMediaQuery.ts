import { useCallback, useSyncExternalStore } from "react";

export const useMediaQuery = (query: string): boolean => {
    const subscribe = useCallback(
        (onChange: () => void): (() => void) => {
            const media: MediaQueryList = window.matchMedia(query);

            media.addEventListener("change", onChange);

            return () => media.removeEventListener("change", onChange);
        },
        [query],
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
    );
};
