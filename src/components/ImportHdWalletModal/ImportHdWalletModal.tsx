import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { ImportHdWalletForm } from "components/ImportHdWalletForm";

interface ImportHdWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const ImportHdWalletModal: React.FC<ImportHdWalletModalProps> = ({
    isOpen,
    onClose,
    onCancel,
    onSuccess,
}) => {
    const handleSuccess = () => {
        onSuccess?.();
        onClose();
    };

    return (
        <ModalWindow isOpen={isOpen} onClose={onCancel} title="Import Wallet">
            <ImportHdWalletForm onSuccess={handleSuccess} onCancel={onCancel} />
        </ModalWindow>
    );
};