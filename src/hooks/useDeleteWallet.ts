import { getErrorMessage } from "@asichain/asi-wallet-sdk";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useAppDispatch } from "store/hooks";
import { removeWallet } from "store/WalletsStore/thunks";

export interface IUseDeleteWalletOptions {
    onSuccess?: () => void | Promise<void>;
}

export interface IUseDeleteWallet {
    isOpen: boolean;
    isDeleting: boolean;
    error: string;
    open: () => void;
    /** Returns false when close is ignored because a delete is in flight. */
    close: () => boolean;
    confirm: () => Promise<void>;
}

const FALLBACK_DELETE_WALLET_ERROR_MESSAGE = "Failed to delete wallet";

type DeleteWalletUiState = {
    isOpen: boolean;
    isDeleting: boolean;
};

const deleteWalletUiStates = new Map<string, DeleteWalletUiState>();
const deleteWalletUiListeners = new Set<() => void>();

const notifyDeleteWalletUiListeners = (): void => {
    deleteWalletUiListeners.forEach((listener) => listener());
};

const subscribeDeleteWalletUi = (listener: () => void): (() => void) => {
    deleteWalletUiListeners.add(listener);

    return () => {
        deleteWalletUiListeners.delete(listener);
    };
};

const getIsAnyWalletDeleteInProgress = (): boolean =>
    Array.from(deleteWalletUiStates.values()).some(
        (state) => state.isOpen || state.isDeleting,
    );

/** True while any DeleteWallet modal is open or a removeWallet call is in flight. */
export const useIsAnyWalletDeleteInProgress = (): boolean =>
    useSyncExternalStore(
        subscribeDeleteWalletUi,
        getIsAnyWalletDeleteInProgress,
        () => false,
    );

export const useDeleteWallet = (
    walletId: string | undefined,
    options?: IUseDeleteWalletOptions,
): IUseDeleteWallet => {
    const dispatch = useAppDispatch();
    const instanceId = useId();

    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    // Sync guard for double-click before React re-renders with isDeleting.
    const isDeletingRef = useRef(false);

    useEffect(() => {
        deleteWalletUiStates.set(instanceId, { isOpen, isDeleting });
        notifyDeleteWalletUiListeners();

        return () => {
            deleteWalletUiStates.delete(instanceId);
            notifyDeleteWalletUiListeners();
        };
    }, [instanceId, isOpen, isDeleting]);

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

    const confirm = async () => {
        if (isDeletingRef.current) {
            return;
        }

        if (!walletId) {
            setError("Unlock the wallet before deleting it");

            return;
        }

        isDeletingRef.current = true;
        setIsDeleting(true);
        setError("");

        try {
            await dispatch(removeWallet({ walletId })).unwrap();
        } catch (deleteError: unknown) {
            setError(
                getErrorMessage(
                    deleteError,
                    FALLBACK_DELETE_WALLET_ERROR_MESSAGE,
                ),
            );
            isDeletingRef.current = false;
            setIsDeleting(false);

            return;
        }

        // removeWallet already succeeded — do not surface onSuccess failures as
        // a delete error. Keep open/deleting until the host unmounts when
        // onSuccess navigates away; clearing here races empty-state on /accounts.
        try {
            await options?.onSuccess?.();
        } catch {
            // Session cleanup/navigation is best-effort after a successful remove.
        } finally {
            if (!options?.onSuccess) {
                isDeletingRef.current = false;
                setIsDeleting(false);
                setIsOpen(false);
            }
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
