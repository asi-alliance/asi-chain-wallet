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
import { BottomSheet } from "components/BottomSheet";
import { useMediaQuery } from "hooks";

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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        justify-content: center;
        width: 100%;
        height: ${({ theme }) => theme.sizes.control.medium};
        padding: ${({ theme }) => `0 ${theme.spacing.md}`};
        border: ${({ $active, theme }) =>
            `${theme.control.borderWidth} solid ${
                $active ? theme.primary : theme.control.neutralBorder
            }`};
        border-radius: ${({ theme }) => theme.radii.md};
        background: ${({ $active, theme }) =>
            $active ? theme.primary : theme.surface};
        color: ${({ $active, theme }) =>
            $active ? theme.text.inverse : theme.control.neutralText};

        &:hover {
            border-color: ${({ $active, theme }) =>
                $active ? theme.primaryDark : theme.primary};
            background: ${({ $active, theme }) =>
                $active ? theme.primaryDark : theme.surface};
            color: ${({ $active, theme }) =>
                $active ? theme.text.inverse : theme.actionText};
        }
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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: none;
    }
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
    const contentId = `filter-popover-${useId().replace(/:/g, "")}-content`;
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
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
        if (!isDropdownOpen) {
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
    }, [isDropdownOpen]);

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
            <BottomSheet
                isOpen={isSheetOpen}
                title={dialogTitle}
                onClose={closeWithFocusRestore}
                id={contentId}
                overlayTestId={`${id}-overlay`}
            >
                {children}
            </BottomSheet>
        </FilterPopoverWrapper>
    );
};
