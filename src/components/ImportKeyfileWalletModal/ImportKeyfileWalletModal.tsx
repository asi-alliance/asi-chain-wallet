import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { ImportKeyfileWalletForm } from "components/ImportKeyfileWalletForm";

interface ImportKeyfileWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const ImportKeyfileWalletModal: React.FC<
    ImportKeyfileWalletModalProps
> = ({ isOpen, onClose, onCancel, onSuccess }) => {
    const handleSuccess = () => {
        onSuccess?.();
        onClose();
    };

    return (
        <ModalWindow
            isOpen={isOpen}
            onClose={onCancel}
            title="Import Wallet from Keyfile"
        >
            <ImportKeyfileWalletForm
                onSuccess={handleSuccess}
                onCancel={onCancel}
            />
        </ModalWindow>
    );
};