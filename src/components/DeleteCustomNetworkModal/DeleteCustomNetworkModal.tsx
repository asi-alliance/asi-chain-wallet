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

const ErrorRow = styled.div`
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 6px;
    color: ${({ theme }) => theme.error};
    background: ${({ theme }) => `${theme.error}15`};
    border: 1px solid ${({ theme }) => theme.error};
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
`;

interface DeleteCustomNetworkModalProps {
    isOpen: boolean;
    networkName: string;
    isDeleting: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteCustomNetworkModal: React.FC<
    DeleteCustomNetworkModalProps
> = ({ isOpen, networkName, isDeleting, error, onConfirm, onCancel }) => (
    <ModalWindow
        isOpen={isOpen}
        onClose={onCancel}
        title="Delete Custom Network"
        maxWidth="480px"
    >
        <WarningRow>
            <IconWrapper>
                <WarningIcon size={24} />
            </IconWrapper>
            <span>
                This removes "{networkName}" from this device. Accounts and
                wallets stay untouched, but you will have to add the network
                again to use it.
            </span>
        </WarningRow>

        {error && <ErrorRow>{error}</ErrorRow>}

        <Actions>
            <Button
                id="delete-network-cancel-button"
                variant="secondary"
                onClick={onCancel}
                disabled={isDeleting}
            >
                Cancel
            </Button>
            <Button
                id="delete-network-confirm-button"
                variant="danger"
                onClick={onConfirm}
                loading={isDeleting}
            >
                Delete Network
            </Button>
        </Actions>
    </ModalWindow>
);
