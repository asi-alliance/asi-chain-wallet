import { useState } from "react";
import { useAppDispatch } from "store/hooks";
import { removeWallet } from "store/WalletsStore/thunks";

export interface IUseDeleteWalletOptions {
    onSuccess?: () => void | Promise<void>;
}

export interface IUseDeleteWallet {
    isOpen: boolean;
    isDeleting: boolean;
    open: () => void;
    close: () => void;
    confirm: () => Promise<void>;
}

export const useDeleteWallet = (
    walletId: string | undefined,
    options?: IUseDeleteWalletOptions,
): IUseDeleteWallet => {
    const dispatch = useAppDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    const confirm = async () => {
        if (!walletId) {
            throw new Error(
                "useDeleteWallet: walletId is required to delete a wallet",
            );
        }

        setIsDeleting(true);

        try {
            await dispatch(removeWallet({ walletId })).unwrap();

            await options?.onSuccess?.();
        } catch (error: unknown) {
            console.error("DELETE WALLET ERROR: ", (error as Error).message);
        } finally {
            setIsDeleting(false);
            setIsOpen(false);
        }
    };

    return {
        isOpen,
        isDeleting,
        open,
        close,
        confirm,
    };
};
