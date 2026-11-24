import { useState } from "react";
import { useSelector } from "react-redux";
import { selectHasOperationInProgress } from "store/NetworkActivity";

export interface IOperationGuardPrompt {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export interface IUseOperationGuard<TArgs extends unknown[]> {
    run: (...args: TArgs) => void;
    prompt: IOperationGuardPrompt;
}

export const useOperationGuard = <TArgs extends unknown[]>(
    action: (...args: TArgs) => void,
): IUseOperationGuard<TArgs> => {
    const hasOperationInProgress = useSelector(selectHasOperationInProgress);
    const [pendingArgs, setPendingArgs] = useState<TArgs | null>(null);

    const run = (...args: TArgs): void => {
        if (!hasOperationInProgress) {
            action(...args);

            return;
        }

        setPendingArgs(args);
    };

    const confirm = (): void => {
        if (!pendingArgs) {
            return;
        }

        setPendingArgs(null);
        action(...pendingArgs);
    };

    return {
        run,
        prompt: {
            isOpen: pendingArgs !== null,
            onConfirm: confirm,
            onCancel: () => setPendingArgs(null),
        },
    };
};
