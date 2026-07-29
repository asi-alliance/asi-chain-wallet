import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { DeriveAccountForm } from "components/DeriveAccountForm";

interface DeriveAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const DeriveAccountModal: React.FC<DeriveAccountModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const handleSuccess = () => {
        onSuccess?.();
        onClose();
    };

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose} title="Create Account">
            <DeriveAccountForm onSuccess={handleSuccess} onCancel={onClose} />
        </ModalWindow>
    );
};