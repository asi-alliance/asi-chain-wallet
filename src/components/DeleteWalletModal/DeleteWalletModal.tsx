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
}

export const DeleteWalletModal: React.FC<DeleteWalletModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    isDeleting = false,
}) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title="Delete Wallet"
        maxWidth="480px"
    >
        <WarningRow>
            <IconWrapper>
                <WarningIcon size={24} />
            </IconWrapper>
            <span>
                This removes the wallet and all of its accounts from this device.
                Make sure your Secret Recovery Phrase or private key is backed up
                — without it this wallet cannot be restored.
            </span>
        </WarningRow>
        <Actions>
            <Button
                id="delete-wallet-cancel-button"
                variant="secondary"
                onClick={onCancel}
                disabled={isDeleting}
            >
                Cancel
            </Button>
            <Button
                id="delete-wallet-confirm-button"
                variant="danger"
                onClick={onConfirm}
                loading={isDeleting}
            >
                Delete Wallet
            </Button>
        </Actions>
    </ModalWindow>
);