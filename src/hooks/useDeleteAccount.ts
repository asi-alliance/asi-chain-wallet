import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { useRef, useState } from "react";
import { useAppDispatch } from "store/hooks";
import { removeAccount } from "store/WalletsStore/thunks";

export interface IUseDeleteAccount {
    isOpen: boolean;
    isDeleting: boolean;
    error: string;
    open: () => void;
    /** Returns false when close is ignored because a delete is in flight. */
    close: () => boolean;
    /** Returns true when the account was removed. */
    confirm: () => Promise<boolean>;
}

const FALLBACK_REMOVE_ACCOUNT_ERROR_MESSAGE: string =
    "Failed to remove account";

export const useDeleteAccount = (
    walletId: string | undefined,
    accountId: string,
): IUseDeleteAccount => {
    const dispatch = useAppDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    // Sync guard for double-click before React re-renders with isDeleting.
    const isDeletingRef = useRef(false);

    const open = () => {
        setError("");
        setIsOpen(true);
    };

    const close = (): boolean => {
        if (isDeletingRef.current) {
            return false;
        }

        setIsOpen(false);
        setError("");

        return true;
    };

    const confirm = async (): Promise<boolean> => {
        if (isDeletingRef.current) {
            return false;
        }

        if (!walletId) {
            setError("Unlock the wallet before removing its accounts");

            return false;
        }

        isDeletingRef.current = true;
        setIsDeleting(true);
        setError("");

        try {
            await dispatch(removeAccount({ walletId, accountId })).unwrap();

            setIsOpen(false);

            return true;
        } catch (removeError: unknown) {
            setError(
                getErrorMessage(
                    removeError,
                    FALLBACK_REMOVE_ACCOUNT_ERROR_MESSAGE,
                ),
            );

            return false;
        } finally {
            isDeletingRef.current = false;
            setIsDeleting(false);
        }
    };

    return {
        isOpen,
        isDeleting,
        error,
        open,
        close,
        confirm,
    };
};
