import { FC, ReactNode, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { useBodyScrollLock, useFocusTrap } from "hooks";

const SheetOverlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: ${({ theme }) => theme.zIndices.modal};
    background: ${({ theme }) => theme.overlay};
`;

const Sheet = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${({ theme }) => theme.zIndices.modal};
    display: flex;
    flex-direction: column;
    max-height: min(85vh, 100%);
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-bottom: 0;
    border-radius: ${({ theme }) =>
        `${theme.radii.lg} ${theme.radii.lg} 0 0`};
    background: ${({ theme }) => theme.surface};
    box-shadow: ${({ theme }) => theme.shadowLarge};
    outline: none;
`;

const SheetHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.lg};
    padding: ${({ theme }) => theme.spacing.xl};
    border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SheetTitle = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const SheetCloseButton = styled.button`
    flex: none;
    width: ${({ theme }) => theme.sizes.iconButton.medium};
    height: ${({ theme }) => theme.sizes.iconButton.medium};
    border: 0;
    border-radius: ${({ theme }) => theme.radii.md};
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.xl};
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.primary};
        outline-offset: 2px;
    }
`;

const SheetBody = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    overflow-y: auto;
`;

interface IBottomSheetProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    id?: string;
    overlayTestId?: string;
    children: ReactNode;
}

export const BottomSheet: FC<IBottomSheetProps> = ({
    isOpen,
    title,
    onClose,
    id,
    overlayTestId,
    children,
}) => {
    const titleId = `bottom-sheet-${useId().replace(/:/g, "")}-title`;
    const sheetRef = useRef<HTMLDivElement>(null);

    useBodyScrollLock(isOpen);
    useFocusTrap(sheetRef, {
        active: isOpen,
        initialFocusRef: sheetRef,
        onEscape: onClose,
    });

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <>
            <SheetOverlay data-testid={overlayTestId} onClick={onClose} />
            <Sheet
                ref={sheetRef}
                id={id}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <SheetHeader>
                    <SheetTitle id={titleId}>{title}</SheetTitle>
                    <SheetCloseButton
                        type="button"
                        aria-label={`Close ${title}`}
                        onClick={onClose}
                    >
                        ×
                    </SheetCloseButton>
                </SheetHeader>
                <SheetBody>{children}</SheetBody>
            </Sheet>
        </>,
        document.body,
    );
};
