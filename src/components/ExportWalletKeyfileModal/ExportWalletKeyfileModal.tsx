import React, { useState } from "react";
import { ExportFormat, IWalletKeyfile } from "@asichain/asi-wallet-sdk";
import { PasswordModal } from "components";
import { SdkWalletService } from "sdk";
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
    const [error, setError] = useState("");

    const handleClose = (): void => {
        setError("");
        onClose();
    };

    const handleConfirm = async (password: string): Promise<void> => {
        setLoading(true);
        setError("");

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
            setError(
                (exportError as Error)?.message ??
                    "Failed to export wallet keyfile",
            );
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
            error={error}
        />
    );
};
