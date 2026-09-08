import React from "react";
import { ModalWindow } from "components/ModalWindow";
import { ImportHdWalletForm } from "components/ImportHdWalletForm";

interface ImportAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ImportAccountModal: React.FC<ImportAccountModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => (
    <ModalWindow isOpen={isOpen} onClose={onClose} title="Import Account">
        <ImportHdWalletForm onSuccess={onSuccess} onCancel={onClose} />
    </ModalWindow>
);