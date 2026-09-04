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

interface IDeleteAccountModalProps {
    isOpen: boolean;
    accountName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
    error?: string;
}

export const DeleteAccountModal: React.FC<IDeleteAccountModalProps> = ({
    isOpen,
    accountName,
    onConfirm,
    onCancel,
    isDeleting = false,
    error,
}) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title="Remove Account"
        maxWidth="480px"
        dismissible={!isDeleting}
    >
        <WarningRow>
            <IconWrapper>
                <WarningIcon size={24} />
            </IconWrapper>
            <span>
                {`This removes the account "${accountName}" from this device. It can be restored only from the Secret Recovery Phrase of its wallet.`}
            </span>
        </WarningRow>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Actions>
            <Button
                id="delete-account-cancel-button"
                variant="secondary"
                onClick={onCancel}
                disabled={isDeleting}
            >
                Cancel
            </Button>
            <Button
                id="delete-account-confirm-button"
                variant="danger"
                onClick={onConfirm}
                loading={isDeleting}
            >
                Remove Account
            </Button>
        </Actions>
    </ModalWindow>
);
