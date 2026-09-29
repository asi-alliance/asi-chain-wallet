import React from "react";
import styled from "styled-components";
import { Button } from "components";
import { ModalWindow } from "components/ModalWindow";
import { WarningIcon } from "components/Icons";

const WarningRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: ${({ theme }) => theme.text.primary};
    font-size: 14px;
    line-height: 1.5;
`;

const IconWrapper = styled.div`
    color: ${({ theme }) => theme.danger};
    flex-shrink: 0;
`;

const ErrorMessage = styled.div`
    color: ${({ theme }) => theme.danger};
    font-size: 14px;
    margin-top: 16px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
`;

interface DeleteWalletModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
    error?: string;
    title?: string;
    message?: string;
    confirmLabel?: string;
    /** Prefix for control ids when multiple delete-wallet modals can mount. */
    idPrefix?: string;
}

const DEFAULT_MESSAGE =
    "This removes the wallet and all of its accounts from this device. Make sure your Secret Recovery Phrase or private key is backed up — without it this wallet cannot be restored.";

export const DeleteWalletModal: React.FC<DeleteWalletModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    isDeleting = false,
    error,
    title = "Delete Wallet",
    message = DEFAULT_MESSAGE,
    confirmLabel = "Delete Wallet",
    idPrefix = "",
}) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title={title}
        maxWidth="480px"
        dismissible={!isDeleting}
    >
        <WarningRow>
            <IconWrapper>
                <WarningIcon size={24} />
            </IconWrapper>
            <span>{message}</span>
        </WarningRow>
        {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        <Actions>
            <Button
                id={`${idPrefix}delete-wallet-cancel-button`}
                variant="secondary"
                onClick={onCancel}
                disabled={isDeleting}
            >
                Cancel
            </Button>
            <Button
                id={`${idPrefix}delete-wallet-confirm-button`}
                variant="danger"
                onClick={onConfirm}
                loading={isDeleting}
            >
                {confirmLabel}
            </Button>
        </Actions>
    </ModalWindow>
);
