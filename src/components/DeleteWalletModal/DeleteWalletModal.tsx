import React from "react";
import styled from "styled-components";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "components";
import { WarningIcon } from "components/Icons";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background: ${({ theme }) => theme.card};
    border-radius: 12px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalContent = styled.div`
    padding: 24px;
`;

const StyledCard = styled(Card)`
    box-shadow: none;
    padding: 0;
    border: none;
`;

const StyledCardHeader = styled(CardHeader)`
    padding: 0 0 16px 0;
    border: none;
`;

const StyledCardContent = styled(CardContent)`
    padding: 0;
    border: none;
`;

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
}) => {
    if (!isOpen) return null;

    return (
        <Overlay onClick={onCancel}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalContent>
                    <StyledCard>
                        <StyledCardHeader>
                            <CardTitle>Delete Wallet</CardTitle>
                        </StyledCardHeader>
                        <StyledCardContent>
                            <WarningRow>
                                <IconWrapper>
                                    <WarningIcon size={24} />
                                </IconWrapper>
                                <span>
                                    This removes the wallet and all of its
                                    accounts from this device. Make sure your
                                    Secret Recovery Phrase or private key is
                                    backed up — without it this wallet cannot be
                                    restored.
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
                        </StyledCardContent>
                    </StyledCard>
                </ModalContent>
            </ModalContainer>
        </Overlay>
    );
};