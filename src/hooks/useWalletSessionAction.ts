import { useState } from "react";
import { CustomErrorCode, getErrorMessage } from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "sdk";

const DEFAULT_ERROR_FALLBACK = "Operation failed";
const WALLET_NOT_OPENED_MESSAGE = "Wallet is not opened. Please login again.";

const isWalletLockedError = (error: unknown): boolean =>
    (error as { code?: string } | null)?.code === CustomErrorCode.WALLET_LOCKED;

export interface IPasswordPromptProps {
    isOpen: boolean;
    loading: boolean;
    error: string;
    onConfirm: (password: string) => void;
    onClose: () => void;
}

export interface IWalletSessionActionOptions<TResult> {
    walletId: string | undefined;
    action: (password?: string) => Promise<TResult>;
    onSuccess?: (result: TResult) => void;
    onError?: (message: string) => void;
    errorFallback?: string;
}

export interface IWalletSessionAction {
    run: () => Promise<void>;
    openPasswordPrompt: () => void;
    isRunning: boolean;
    passwordPrompt: IPasswordPromptProps;
}

export const useWalletSessionAction = <TResult>({
    walletId,
    action,
    onSuccess,
    onError,
    errorFallback = DEFAULT_ERROR_FALLBACK,
}: IWalletSessionActionOptions<TResult>): IWalletSessionAction => {
    const [isRunning, setIsRunning] = useState(false);
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const openPasswordPrompt = (): void => {
        setPasswordError("");
        setIsPasswordPromptOpen(true);
    };

    const execute = async (password?: string): Promise<void> => {
        if (!walletId) {
            onError?.(WALLET_NOT_OPENED_MESSAGE);

            return;
        }

        if (
            password === undefined &&
            !SdkWalletService.isWalletUnlocked(walletId)
        ) {
            openPasswordPrompt();

            return;
        }

        setIsRunning(true);
        setPasswordError("");

        try {
            const result: TResult = await action(password);

            setIsPasswordPromptOpen(false);
            onSuccess?.(result);
        } catch (error: unknown) {
            if (password === undefined && isWalletLockedError(error)) {
                openPasswordPrompt();

                return;
            }

            const message: string = getErrorMessage(error, errorFallback);

            if (password === undefined) {
                onError?.(message);

                return;
            }

            setPasswordError(message);
        } finally {
            setIsRunning(false);
        }
    };

    const closePasswordPrompt = (): void => {
        setIsPasswordPromptOpen(false);
        setPasswordError("");
    };

    return {
        run: () => execute(),
        openPasswordPrompt,
        isRunning,
        passwordPrompt: {
            isOpen: isPasswordPromptOpen,
            loading: isRunning && isPasswordPromptOpen,
            error: passwordError,
            onConfirm: (password: string) => {
                execute(password);
            },
            onClose: closePasswordPrompt,
        },
    };
};