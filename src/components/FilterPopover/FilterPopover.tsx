import {
    FC,
    ReactNode,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import styled, { useTheme } from "styled-components";
import { FilterIcon } from "components/Icons";
import { useBodyScrollLock, useFocusTrap, useMediaQuery } from "hooks";

const FilterPopoverWrapper = styled.div`
    position: relative;
    min-width: 0;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const TriggerButton = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: auto;
    min-width: 0;
    height: auto;
    padding: ${({ theme }) => `${theme.spacing.xs} 0`};
    gap: ${({ theme }) => theme.spacing.md};
    border: 0;
    border-radius: ${({ theme }) => theme.radii.sm};
    background: transparent;
    color: ${({ $active, theme }) =>
        $active ? theme.actionText : theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.hoverSurface};
        color: ${({ theme }) => theme.actionText};
    }

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }
`;

const TriggerTitle = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const FilterIconWrapper = styled.span<{ $highlighted: boolean }>`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: ${({ $highlighted, theme }) =>
        $highlighted ? theme.actionText : theme.text.secondary};
`;

const DropdownContent = styled.div`
    z-index: ${({ theme }) => theme.zIndices.dropdown};
    min-width: 260px;
    max-width: min(360px, 90vw);
    box-sizing: border-box;
    padding: ${({ theme }) => theme.spacing.xl};
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
    box-shadow: ${({ theme }) => theme.shadowLarge};
`;

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

interface IDropdownPosition {
    top: number;
    left?: number;
    right?: number;
    width: number;
}

const getDropdownPosition = (trigger: HTMLElement): IDropdownPosition => {
    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(320, Math.max(260, window.innerWidth - 32));
    const alignRight = window.innerWidth - rect.left < panelWidth + 16;

    return {
        top: rect.bottom + 4,
        left: alignRight ? undefined : Math.max(8, rect.left),
        right: alignRight
            ? Math.max(8, window.innerWidth - rect.right)
            : undefined,
        width: panelWidth,
    };
};

interface IFilterPopoverProps {
    id: string;
    header: string;
    dialogTitle: string;
    active: boolean;
    "aria-label": string;
    expanded: boolean;
    onToggle: (expanded: boolean) => void;
    children: ReactNode;
}

export const FilterPopover: FC<IFilterPopoverProps> = ({
    id,
    header,
    dialogTitle,
    active,
    "aria-label": ariaLabel,
    expanded,
    onToggle,
    children,
}) => {
    const theme = useTheme();
    const generatedId = useId().replace(/:/g, "");
    const contentId = `filter-popover-${generatedId}-content`;
    const sheetTitleId = `filter-popover-${generatedId}-sheet-title`;
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const onToggleRef = useRef(onToggle);
    const wasExpandedRef = useRef(expanded);
    const forceFocusRestoreRef = useRef(false);
    const skipFocusRestoreRef = useRef(false);
    const [dropdownPosition, setDropdownPosition] =
        useState<IDropdownPosition | null>(null);

    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile})`);
    const isSheetOpen = expanded && isMobile;
    const isDropdownOpen = expanded && !isMobile;

    useLayoutEffect(() => {
        onToggleRef.current = onToggle;
    });

    useBodyScrollLock(isSheetOpen);
    useFocusTrap(sheetRef, {
        active: isSheetOpen,
        initialFocusRef: sheetRef,
    });

    const closeWithFocusRestore = (): void => {
        forceFocusRestoreRef.current = true;
        onToggle(false);
    };

    useLayoutEffect(() => {
        const trigger = buttonRef.current;

        if (!isDropdownOpen || !trigger) {
            setDropdownPosition(null);
            return;
        }

        const syncPosition = (): void =>
            setDropdownPosition(getDropdownPosition(trigger));

        syncPosition();
        window.addEventListener("resize", syncPosition);
        // Capture scroll from overflow ancestors (e.g. history table).
        window.addEventListener("scroll", syncPosition, true);

        return () => {
            window.removeEventListener("resize", syncPosition);
            window.removeEventListener("scroll", syncPosition, true);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!isDropdownOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent): void => {
            const target = event.target as Node;

            if (
                wrapperRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }

            // Closing because another control received the pointer — do not steal focus back.
            skipFocusRestoreRef.current = true;
            onToggleRef.current(false);
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!expanded) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            forceFocusRestoreRef.current = true;
            onToggleRef.current(false);
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [expanded]);

    // Restore focus to the trigger when the panel dismisses (Apply, Escape, overlay).
    // Defer past the closing key's keyup so Enter from Search/Apply does not re-open.
    useEffect(() => {
        if (!wasExpandedRef.current || expanded) {
            wasExpandedRef.current = expanded;
            return;
        }

        wasExpandedRef.current = expanded;

        if (skipFocusRestoreRef.current) {
            skipFocusRestoreRef.current = false;
            forceFocusRestoreRef.current = false;
            return;
        }

        const activeElement = document.activeElement;
        const focusMovedElsewhere =
            activeElement instanceof HTMLElement &&
            activeElement !== document.body &&
            !wrapperRef.current?.contains(activeElement) &&
            !sheetRef.current?.contains(activeElement) &&
            !dropdownRef.current?.contains(activeElement);
        const shouldRestoreFocus =
            forceFocusRestoreRef.current || !focusMovedElsewhere;
        forceFocusRestoreRef.current = false;

        if (!shouldRestoreFocus) {
            return;
        }

        const focusTimer = window.setTimeout(() => {
            buttonRef.current?.focus();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [expanded]);

    const sheet =
        isSheetOpen &&
        createPortal(
            <>
                <SheetOverlay
                    data-testid={`${id}-overlay`}
                    onClick={closeWithFocusRestore}
                />
                <Sheet
                    ref={sheetRef}
                    id={contentId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={sheetTitleId}
                    tabIndex={-1}
                >
                    <SheetHeader>
                        <SheetTitle id={sheetTitleId}>{dialogTitle}</SheetTitle>
                        <SheetCloseButton
                            type="button"
                            aria-label={`Close ${dialogTitle}`}
                            onClick={closeWithFocusRestore}
                        >
                            ×
                        </SheetCloseButton>
                    </SheetHeader>
                    <SheetBody>{children}</SheetBody>
                </Sheet>
            </>,
            document.body,
        );

    const dropdown =
        isDropdownOpen &&
        dropdownPosition &&
        createPortal(
            <DropdownContent
                ref={dropdownRef}
                id={contentId}
                style={{
                    position: "fixed",
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    right: dropdownPosition.right,
                    width: dropdownPosition.width,
                }}
            >
                {children}
            </DropdownContent>,
            document.body,
        );

    return (
        <FilterPopoverWrapper ref={wrapperRef}>
            <TriggerButton
                id={id}
                ref={buttonRef}
                type="button"
                $active={active}
                aria-label={ariaLabel}
                aria-expanded={expanded}
                aria-controls={contentId}
                aria-haspopup={isMobile ? "dialog" : undefined}
                onClick={() => onToggle(!expanded)}
            >
                <TriggerTitle>{header}</TriggerTitle>
                <FilterIconWrapper
                    $highlighted={active || expanded}
                    aria-hidden="true"
                >
                    <FilterIcon size={14} />
                </FilterIconWrapper>
            </TriggerButton>
            {dropdown}
            {sheet}
        </FilterPopoverWrapper>
    );
};
