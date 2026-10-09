import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { useRef, useState } from "react";
import { useAppDispatch } from "store/hooks";
import { removeAccount } from "store/WalletsStore/thunks";

export interface IAccountDeleteTarget {
    walletId: string;
    accountId: string;
    accountName: string;
}

export interface IUseDeleteAccount {
    target: IAccountDeleteTarget | null;
    isOpen: boolean;
    isDeleting: boolean;
    error: string;
    open: (target: IAccountDeleteTarget) => void;
    close: () => void;
    confirm: () => Promise<void>;
}

const FALLBACK_REMOVE_ACCOUNT_ERROR_MESSAGE: string =
    "Failed to remove account";

export const useDeleteAccount = (): IUseDeleteAccount => {
    const dispatch = useAppDispatch();

    const [target, setTarget] = useState<IAccountDeleteTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    // Sync guard for double-click before React re-renders with isDeleting.
    const isDeletingRef = useRef(false);

    const open = (nextTarget: IAccountDeleteTarget): void => {
        setError("");
        setTarget(nextTarget);
    };

    const close = (): void => {
        if (isDeletingRef.current) {
            return;
        }

        setTarget(null);
        setError("");
    };

    const confirm = async (): Promise<void> => {
        if (!target || isDeletingRef.current) {
            return;
        }

        isDeletingRef.current = true;
        setIsDeleting(true);
        setError("");

        try {
            await dispatch(
                removeAccount({
                    walletId: target.walletId,
                    accountId: target.accountId,
                }),
            ).unwrap();

            setTarget(null);
        } catch (removeError: unknown) {
            setError(
                getErrorMessage(
                    removeError,
                    FALLBACK_REMOVE_ACCOUNT_ERROR_MESSAGE,
                ),
            );
        } finally {
            isDeletingRef.current = false;
            setIsDeleting(false);
        }
    };

    return {
        target,
        isOpen: target !== null,
        isDeleting,
        error,
        open,
        close,
        confirm,
    };
};
