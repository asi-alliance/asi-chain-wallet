import { useEffect } from "react";

let activeLocksCount: number = 0;
let overflowBeforeLock: string = "";

export const useBodyScrollLock = (active: boolean): void => {
    useEffect(() => {
        if (!active) {
            return;
        }

        if (activeLocksCount === 0) {
            overflowBeforeLock = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }

        activeLocksCount += 1;

        return () => {
            activeLocksCount -= 1;

            if (activeLocksCount === 0) {
                document.body.style.overflow = overflowBeforeLock;
            }
        };
    }, [active]);
};
