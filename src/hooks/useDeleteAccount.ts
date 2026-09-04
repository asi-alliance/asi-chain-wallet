import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import { removeAccount } from "store/WalletsStore/thunks";

export interface IUseDeleteAccount {
    isOpen: boolean;
    isDeleting: boolean;
    error: string;
    open: () => void;
    close: () => void;
    confirm: () => Promise<void>;
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

    const open = () => {
        setError("");
        setIsOpen(true);
    };

    const close = () => setIsOpen(false);

    const confirm = async () => {
        if (!walletId) {
            setError("Unlock the wallet before removing its accounts");

            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            await dispatch(removeAccount({ walletId, accountId })).unwrap();

            setIsOpen(false);
        } catch (removeError: unknown) {
            setError(
                getErrorMessage(
                    removeError,
                    FALLBACK_REMOVE_ACCOUNT_ERROR_MESSAGE,
                ),
            );
        } finally {
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
