import React from "react";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardContent } from "components";
import { CreateAccountForm } from "components/CreateAccountForm";

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
    max-width: 705px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: 4px;
    }
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
    padding: 0 6px;
    border: none;
`;

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    if (!isOpen) return null;

    const handleSuccess = (accountName: string) => {
        onSuccess?.();
        onClose();
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalContent>
                    <StyledCard>
                        <StyledCardHeader>
                            <CardTitle>
                                <h1>Create Account</h1>
                            </CardTitle>
                        </StyledCardHeader>
                        <StyledCardContent>
                            <CreateAccountForm
                                onSuccess={handleSuccess}
                                onCancel={onClose}
                            />
                        </StyledCardContent>
                    </StyledCard>
                </ModalContent>
            </ModalContainer>
        </Overlay>
    );
};
