import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface IScreenDimensions {
    width: number;
    height: number;
}

interface IUseScreenResponse extends IScreenDimensions {
    isLaptop: boolean;
    isTablet: boolean;
}

const DEFAULT_DEBOUNCE_IN_MILLISECONDS: number = 100;

export const LAPTOP_SCREEN_WIDTH_IN_PIXELS: number = 768;
export const TABLET_SCREEN_WIDTH_IN_PIXELS: number = 1023;

export function useScreen(
    debounceMs: number = DEFAULT_DEBOUNCE_IN_MILLISECONDS,
): IUseScreenResponse {
    const [dimensions, setDimensions] = useState<IScreenDimensions>(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<number>(Date.now());

    const handleResize = useCallback(() => {
        const now: number = Date.now();
        const timeSinceLastUpdate: number = now - lastUpdateRef.current;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (timeSinceLastUpdate >= debounceMs) {
            lastUpdateRef.current = now;

            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });

            return;
        }

        const remainingTime: number = debounceMs - timeSinceLastUpdate;

        timeoutRef.current = setTimeout(() => {
            lastUpdateRef.current = Date.now();

            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });

            timeoutRef.current = null;
        }, remainingTime);
    }, [debounceMs]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);

        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);

            if (!timeoutRef.current) {
                return;
            }

            clearTimeout(timeoutRef.current);
        };
    }, [handleResize]);

    const isLaptop: boolean = useMemo(
        () => dimensions.width <= LAPTOP_SCREEN_WIDTH_IN_PIXELS,
        [dimensions.width],
    );
    const isTablet: boolean = useMemo(
        () => dimensions.width <= TABLET_SCREEN_WIDTH_IN_PIXELS,
        [dimensions.width],
    );

    return {
        isLaptop,
        isTablet,
        ...dimensions,
    };
}
