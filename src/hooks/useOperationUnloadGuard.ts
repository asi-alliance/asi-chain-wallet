import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectHasOperationInProgress } from "store/NetworkActivity";

export const useOperationUnloadGuard = (): void => {
    const hasOperationInProgress = useSelector(selectHasOperationInProgress);

    useEffect(() => {
        if (!hasOperationInProgress) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasOperationInProgress]);
};
