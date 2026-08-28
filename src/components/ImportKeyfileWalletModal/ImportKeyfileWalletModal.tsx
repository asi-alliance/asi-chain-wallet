import React from "react";
import { ModalWindow } from "components/ModalWindow";
import {
    IKeyfileAccountsImportOutcome,
    ImportKeyfileWalletForm,
} from "components/ImportKeyfileWalletForm";

interface ImportKeyfileWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onWalletImported?: () => void;
    onAccountsImported?: (outcome: IKeyfileAccountsImportOutcome) => void;
}

export const ImportKeyfileWalletModal: React.FC<
    ImportKeyfileWalletModalProps
> = ({ isOpen, onClose, onCancel, onWalletImported, onAccountsImported }) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title="Import Wallet from Keyfile"
    >
        <ImportKeyfileWalletForm
            onWalletImported={() => {
                onWalletImported?.();
                onClose();
            }}
            onAccountsImported={(outcome: IKeyfileAccountsImportOutcome) => {
                onAccountsImported?.(outcome);
                onClose();
            }}
            onCancel={onCancel}
        />
    </ModalWindow>
);