import { Card, CardContent, CardHeader, CardTitle } from "components/Card";
import React, { createContext, useContext, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: ${({ theme }) => theme.zIndices.modal};
    --modal-z-index: ${({ theme }) => theme.zIndices.modal};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${({ theme }) => theme.layout.gutterMobile};
    background: ${({ theme }) => theme.overlay};
`;

const ModalContainer = styled.div<{ $maxWidth: string }>`
    width: 100%;
    max-width: ${({ $maxWidth }) => $maxWidth};
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.card};
    box-shadow: ${({ theme }) => theme.shadowLarge};
    outline: none;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        max-width: 320px;
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.surface};
        border-radius: ${({ theme }) => theme.radii.xs};
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.border};
        border-radius: ${({ theme }) => theme.radii.xs};
    }
`;

const ModalContent = styled.div`
    padding: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: ${({ theme }) => theme.layout.gutterMobile};
    }
`;

const StyledCard = styled(Card)`
    padding: 0;
    border: 0;
    box-shadow: none;
    overflow: visible;
`;

const StyledCardHeader = styled(CardHeader)`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    padding: 0;
    border-bottom: 0;
`;

const ModalHeading = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.xl};
`;

const CloseButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border: 0;
    border-radius: ${({ theme }) => theme.radii.md};
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    font-size: 28px;
    line-height: 1;

    &:hover {
        background: ${({ theme }) => theme.hoverSurface};
    }
`;

const TitlelessModalHeader = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StyledCardContent = styled(CardContent)`
    padding: 0;
    border: 0;
`;

const FOCUSABLE_ELEMENTS = [
    'a[href]:not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'input:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    'select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"]):not([hidden])',
].join(",");

const isAvailableForFocus = (element: HTMLElement): boolean => {
    if (
        !element.isConnected ||
        element.matches(':disabled, input[type="hidden"]') ||
        element.closest('[hidden], [inert], [aria-hidden="true"]')
    ) {
        return false;
    }
    for (
        let ancestor: HTMLElement | null = element;
        ancestor;
        ancestor = ancestor.parentElement
    ) {
        const style = window.getComputedStyle(ancestor);
        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse"
        ) {
            return false;
        }
    }
    return true;
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)).filter(
        isAvailableForFocus,
    );

const modalStack: string[] = [];
const modalParents = new Map<string, string | null>();
const ModalParentContext = createContext<string | null>(null);
const backgroundPortals = new Map<HTMLElement, boolean>();
let portalObserver: MutationObserver | null = null;

const syncBackgroundPortals = (): void => {
    document.querySelectorAll<HTMLElement>('body > [role="listbox"]').forEach((portal) => {
        if (!backgroundPortals.has(portal)) backgroundPortals.set(portal, portal.hasAttribute("inert"));
        portal.setAttribute("inert", "");
    });
};

const syncModalLayers = (): void => {
    modalStack.forEach((id, index) => {
        const overlay = document.getElementById(`${id}-overlay`);
        if (!overlay) return;
        const inactive = index !== modalStack.length - 1;
        overlay.toggleAttribute("inert", inactive);
        overlay.setAttribute("aria-hidden", String(inactive));
        overlay.style.zIndex = `calc(var(--modal-z-index) + ${index})`;
    });
};
let previousBodyOverflow = "";
let backgroundRoot: HTMLElement | null = null;
let backgroundWasInert = false;
let initialModalOpener: HTMLElement | null = null;

const isTopModal = (id: string): boolean =>
    modalStack[modalStack.length - 1] === id;

const isOwnedPortal = (modal: HTMLElement, target: Node): boolean => {
    const element = target instanceof Element ? target : target.parentElement;
    const listbox = element?.closest<HTMLElement>('[role="listbox"][id]');
    if (!listbox?.id) return false;
    return Array.from(modal.querySelectorAll<HTMLElement>("[aria-controls]")).some(
        (control) => control.getAttribute("aria-controls") === listbox.id,
    );
};

export interface ModalWindowProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    maxWidth?: string;
    dismissible?: boolean;
    children: React.ReactNode;
    "aria-label"?: string;
}

export const ModalWindow: React.FC<ModalWindowProps> = ({
    isOpen,
    onClose,
    title,
    maxWidth = "800px",
    dismissible = true,
    children,
    "aria-label": ariaLabel,
}) => {
    const parentModalId = useContext(ModalParentContext);
    const modalRef = useRef<HTMLDivElement>(null);
    const generatedId = useId().replace(/:/g, "");
    const modalId = `modal-${generatedId}`;
    const titleId = `modal-title-${generatedId}`;
    const onCloseRef = useRef(onClose);
    const dismissibleRef = useRef(dismissible);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);
    const wasOpenRef = useRef(false);
    // Capture before committing children: native autoFocus runs before effects.
    if (isOpen && !wasOpenRef.current) {
        previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }
    wasOpenRef.current = isOpen;
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;

    useEffect(() => {
        if (!isOpen) return;

        const focusTimer = window.setTimeout(() => {
            if (!isTopModal(modalId)) return;
            const firstFocusable =
                modalRef.current && getFocusableElements(modalRef.current)[0];
            (firstFocusable ?? modalRef.current)?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (!isTopModal(modalId)) return;

            if (event.key === "Escape" && dismissibleRef.current) {
                event.preventDefault();
                event.stopPropagation();
                onCloseRef.current();
                return;
            }

            if (event.key !== "Tab" || !modalRef.current) return;

            const focusableElements = getFocusableElements(modalRef.current);
            if (!focusableElements.length) {
                event.preventDefault();
                modalRef.current.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const handleFocusIn = (event: FocusEvent): void => {
            const modal = modalRef.current;
            if (
                !modal ||
                !isTopModal(modalId) ||
                modal.contains(event.target as Node) ||
                isOwnedPortal(modal, event.target as Node)
            ) {
                return;
            }
            const firstFocusable = getFocusableElements(modal)[0];
            (firstFocusable ?? modal).focus();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", handleFocusIn);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", handleFocusIn);
        };
    }, [isOpen, modalId]);

    useEffect(() => {
        if (!isOpen) return;

        if (modalStack.length === 0) {
            initialModalOpener = previousActiveElementRef.current;
            previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            backgroundRoot = document.getElementById("root");
            backgroundWasInert = backgroundRoot?.inert ?? false;
            if (backgroundRoot) backgroundRoot.inert = true;
            syncBackgroundPortals();
            portalObserver = new MutationObserver(syncBackgroundPortals);
            portalObserver.observe(document.body, { childList: true });
        }
        modalParents.set(modalId, parentModalId);
        // Child effects run first when nested dialogs open together.
        const childIndex = modalStack.findIndex((id) => modalParents.get(id) === modalId);
        modalStack.splice(childIndex < 0 ? modalStack.length : childIndex, 0, modalId);
        syncModalLayers();

        return () => {
            const wasTopModal = isTopModal(modalId);
            const index = modalStack.lastIndexOf(modalId);
            if (index >= 0) modalStack.splice(index, 1);
            modalParents.delete(modalId);
            syncModalLayers();
            if (modalStack.length === 0) {
                portalObserver?.disconnect();
                portalObserver = null;
                backgroundPortals.forEach((wasInert, portal) => portal.toggleAttribute("inert", wasInert));
                backgroundPortals.clear();
                document.body.style.overflow = previousBodyOverflow;
                if (backgroundRoot) backgroundRoot.inert = backgroundWasInert;
                backgroundRoot = null;
                const opener = previousActiveElementRef.current;
                if (opener && isAvailableForFocus(opener)) {
                    opener.focus();
                } else if (
                    initialModalOpener && isAvailableForFocus(initialModalOpener)
                ) {
                    initialModalOpener.focus();
                }
                initialModalOpener = null;
            } else if (wasTopModal) {
                const activeModal = document.getElementById(
                    modalStack[modalStack.length - 1],
                );
                const opener = previousActiveElementRef.current;
                if (
                    activeModal &&
                    opener &&
                    isAvailableForFocus(opener) &&
                    (activeModal.contains(opener) ||
                        isOwnedPortal(activeModal, opener))
                ) {
                    opener.focus();
                } else {
                    const firstFocusable =
                        activeModal && getFocusableElements(activeModal)[0];
                    (firstFocusable ?? activeModal)?.focus();
                }
            }
        };
    }, [isOpen, modalId, parentModalId]);

    if (!isOpen) return null;

    return createPortal(
        <ModalParentContext.Provider value={modalId}>
        <Overlay
            id={`${modalId}-overlay`}
            data-modal-overlay
            onMouseDown={
                dismissible
                    ? () => isTopModal(modalId) && onCloseRef.current()
                    : undefined
            }
        >
            <ModalContainer
                id={modalId}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : (ariaLabel ?? "Dialog")}
                tabIndex={-1}
                $maxWidth={maxWidth}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <ModalContent>
                    {!title && dismissible && (
                        <TitlelessModalHeader>
                            <CloseButton
                                type="button"
                                aria-label="Close dialog"
                                onClick={() => onCloseRef.current()}
                            >
                                <span aria-hidden="true">×</span>
                            </CloseButton>
                        </TitlelessModalHeader>
                    )}
                    {title ? (
                        <StyledCard>
                            <StyledCardHeader>
                              <ModalHeading>
                                <CardTitle id={titleId}>{title}</CardTitle>
                                {dismissible && (
                                    <CloseButton
                                        type="button"
                                        aria-label="Close dialog"
                                        onClick={() => onCloseRef.current()}
                                    >
                                        <span aria-hidden="true">×</span>
                                    </CloseButton>
                                )}
                              </ModalHeading>
                            </StyledCardHeader>
                            <StyledCardContent>{children}</StyledCardContent>
                        </StyledCard>
                    ) : (
                        children
                    )}
                </ModalContent>
            </ModalContainer>
        </Overlay>
        </ModalParentContext.Provider>,
        document.body,
    );
};
