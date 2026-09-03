import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Card, CardHeader, CardTitle, CardContent } from "components/Card";

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

const ModalContainer = styled.div<{ $maxWidth: string }>`
    background: ${({ theme }) => theme.card};
    border-radius: 12px;
    width: 90%;
    max-width: ${({ $maxWidth }) => $maxWidth};
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

let openModalsCount = 0;

interface ModalWindowProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    maxWidth?: string;
    dismissible?: boolean;
    children: React.ReactNode;
}

export const ModalWindow: React.FC<ModalWindowProps> = ({
    isOpen,
    onClose,
    title,
    maxWidth = "705px",
    dismissible = true,
    children,
}) => {
    useEffect(() => {
        if (!isOpen || !dismissible) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, dismissible, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        openModalsCount += 1;
        document.body.style.overflow = "hidden";

        return () => {
            openModalsCount -= 1;

            if (openModalsCount === 0) {
                document.body.style.overflow = previousOverflow;
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <Overlay onClick={dismissible ? onClose : undefined}>
            <ModalContainer
                $maxWidth={maxWidth}
                onClick={(event) => event.stopPropagation()}
            >
                <ModalContent>
                    {title ? (
                        <StyledCard>
                            <StyledCardHeader>
                                <CardTitle>{title}</CardTitle>
                            </StyledCardHeader>
                            <StyledCardContent>{children}</StyledCardContent>
                        </StyledCard>
                    ) : (
                        children
                    )}
                </ModalContent>
            </ModalContainer>
        </Overlay>,
        document.body,
    );
};