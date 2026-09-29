import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { CreatePkWalletForm } from "components/CreatePkWalletForm";

interface CreatePkWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const CreatePkWalletModal: React.FC<CreatePkWalletModalProps> = ({
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
            title="Create Private Key Wallet"
            maxWidth="705px"
            dismissible={false}
        >
            <CreatePkWalletForm onSuccess={handleSuccess} onCancel={onCancel} />
        </ModalWindow>
    );
};
