import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { ImportPkWalletForm } from "components/ImportPkWalletForm";

interface ImportPkWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const ImportPkWalletModal: React.FC<ImportPkWalletModalProps> = ({
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
        <ModalWindow
            isOpen={isOpen}
            onClose={onCancel}
            title="Import Private Key"
        >
            <ImportPkWalletForm onSuccess={handleSuccess} onCancel={onCancel} />
        </ModalWindow>
    );
};