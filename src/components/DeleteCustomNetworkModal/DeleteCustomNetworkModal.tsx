import React from "react";
import styled from "styled-components";
import { Button } from "components";
import { ModalWindow } from "components/ModalWindow";
import { WarningIcon } from "components/Icons";

const WarningRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const IconWrapper = styled.div`
    color: ${({ theme }) => theme.danger};
    flex-shrink: 0;
`;

const ErrorRow = styled.div`
    margin-top: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.dangerText};
    background: ${({ theme }) => `${theme.danger}15`};
    border: 1px solid ${({ theme }) => theme.danger};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column-reverse;
    }
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
        dismissible={!isDeleting}
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

        {error && <ErrorRow role="alert">{error}</ErrorRow>}

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
