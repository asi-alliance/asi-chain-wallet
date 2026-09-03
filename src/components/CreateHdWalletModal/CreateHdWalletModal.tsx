import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { CreateHdWalletForm } from "components/CreateHdWalletForm";

interface CreateHdWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSuccess?: () => void;
}

export const CreateHdWalletModal: React.FC<CreateHdWalletModalProps> = ({
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
        <ModalWindow isOpen={isOpen} onClose={onCancel} title="Create Wallet">
            <CreateHdWalletForm onSuccess={handleSuccess} onCancel={onCancel} />
        </ModalWindow>
    );
};