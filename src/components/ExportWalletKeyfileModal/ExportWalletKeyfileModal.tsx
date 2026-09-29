import React, { useState } from "react";
import { ExportFormat, IWalletKeyfile, getErrorMessage } from "@asichain/asi-wallet-sdk";
import { PasswordModal } from "components";
import { isInvalidPasswordError, SdkWalletService } from "sdk";
import { downloadExport } from "utils/fileDownload";

interface ExportWalletKeyfileModalProps {
    isOpen: boolean;
    walletId: string;
    onClose: () => void;
}

export const ExportWalletKeyfileModal: React.FC<
    ExportWalletKeyfileModalProps
> = ({ isOpen, walletId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [formError, setFormError] = useState("");

    const handleClose = (): void => {
        setPasswordError("");
        setFormError("");
        onClose();
    };

    const handleConfirm = async (password: string): Promise<void> => {
        if (loading) {
            return;
        }

        setLoading(true);
        setPasswordError("");
        setFormError("");

        try {
            const keyfile: IWalletKeyfile =
                await SdkWalletService.exportWalletKeyfile(walletId, password);

            downloadExport(
                `asi-wallet-${walletId}`,
                JSON.stringify(keyfile, null, 2),
                ExportFormat.JSON,
            );

            handleClose();
        } catch (exportError: unknown) {
            const message = getErrorMessage(
                exportError,
                "Failed to export wallet keyfile",
            );

            if (isInvalidPasswordError(exportError)) {
                setPasswordError(message);
            } else {
                setFormError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <PasswordModal
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title="Export Wallet Keyfile"
            description="Enter your wallet password to export the keyfile. Anyone with this file and its password controls the wallet."
            loading={loading}
            error={passwordError}
            formError={formError}
        />
    );
};
