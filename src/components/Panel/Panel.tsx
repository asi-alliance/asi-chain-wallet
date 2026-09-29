import {
    CSSProperties,
    FC,
    KeyboardEvent as ReactKeyboardEvent,
    ReactNode,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import styled, { useTheme } from "styled-components";
import { ExpandIcon, FilterIcon } from "components/Icons";

const PanelWrapper = styled.div<{
    $disabled: boolean;
    $variant: "default" | "column";
}>`
    position: relative;
    min-width: ${({ $variant }) => ($variant === "column" ? "0" : "150px")};
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
`;

const PanelButton = styled.button<{
    $hasAdditionalLabel: boolean;
    $isOpen: boolean;
    $inlineOnMobile: boolean;
    $variant: "default" | "column";
    $active: boolean;
}>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: ${({ $variant }) => ($variant === "column" ? "auto" : "100%")};
    min-width: ${({ $variant }) => ($variant === "column" ? "0" : "150px")};
    height: ${({ $variant, theme }) =>
        $variant === "column" ? "auto" : theme.sizes.control.field};
    padding: ${({ $variant, theme }) =>
        $variant === "column"
            ? `${theme.spacing.xs} 0`
            : `${theme.spacing.md} ${theme.spacing["2xl"]}`};
    gap: ${({ theme }) => theme.spacing.md};
    border: ${({ $variant, theme }) =>
        $variant === "column"
            ? "0"
            : `${theme.control.borderWidth} solid ${theme.control.fieldBorder}`};
    border-bottom-color: ${({ $variant, $isOpen, theme }) =>
        $variant === "column"
            ? "transparent"
            : $isOpen
              ? "transparent"
              : theme.control.fieldBorder};
    border-radius: ${({ $variant, $isOpen, theme }) =>
        $variant === "column"
            ? theme.radii.sm
            : $isOpen
              ? `${theme.radii.md} ${theme.radii.md} 0 0`
              : theme.radii.md};
    background: ${({ $variant, theme }) =>
        $variant === "column" ? "transparent" : theme.control.fieldBackground};
    color: ${({ $variant, $active, theme }) =>
        $variant === "column" && $active
            ? theme.actionText
            : theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: ${({ $variant, theme }) =>
            $variant === "column" ? "transparent" : theme.primary};
        border-bottom-color: ${({ $variant, $isOpen, theme }) =>
            $variant === "column"
                ? "transparent"
                : $isOpen
                  ? "transparent"
                  : theme.primary};
        background: ${({ theme }) => theme.hoverSurface};
        color: ${({ $variant, theme }) =>
            $variant === "column" ? theme.actionText : theme.text.primary};
    }

    &:focus-visible {
        outline: none;
        border-color: ${({ $variant, theme }) =>
            $variant === "column" ? "transparent" : theme.primary};
        border-bottom-color: ${({ $variant, $isOpen, theme }) =>
            $variant === "column"
                ? "transparent"
                : $isOpen
                  ? "transparent"
                  : theme.primary};
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 1;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        height: ${({ $variant, $hasAdditionalLabel, theme }) =>
            $variant === "column"
                ? "auto"
                : $hasAdditionalLabel
                  ? "auto"
                  : theme.sizes.control.field};
        width: ${({ $variant }) => ($variant === "column" ? "auto" : "100%")};
        border-bottom-color: ${({ $variant, $inlineOnMobile, $isOpen, theme }) =>
            $variant === "column"
                ? "transparent"
                : $inlineOnMobile && $isOpen
                  ? "transparent"
                  : theme.control.fieldBorder};
        border-radius: ${({ $variant, $inlineOnMobile, $isOpen, theme }) =>
            $variant === "column"
                ? theme.radii.sm
                : $inlineOnMobile && $isOpen
                  ? `${theme.radii.md} ${theme.radii.md} 0 0`
                  : theme.radii.md};
    }
`;

const ColumnIconWrapper = styled.span<{ $active: boolean; $isOpen: boolean }>`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: ${({ $active, $isOpen, theme }) =>
        $active || $isOpen ? theme.actionText : theme.text.secondary};
`;

const PanelHeader = styled.span`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    min-width: 0;
    gap: ${({ theme }) => theme.spacing.lg};
`;

const PanelTitle = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const PanelAdditionalLabel = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: block;
    }
`;

const ArrowIconWrapper = styled.span<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transform: ${({ $isOpen }) =>
        $isOpen ? "rotate(180deg)" : "rotate(0deg)"};
    transition: transform ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};
`;

const PanelContent = styled.div<{
    $variant: "default" | "column";
    $portaled?: boolean;
}>`
    ${({ $variant, $portaled, theme }) =>
        $variant === "column" && !$portaled
            ? `
        position: absolute;
        top: 100%;
        left: 0;
        z-index: ${theme.zIndices.dropdown};
        min-width: 260px;
        max-width: min(360px, 90vw);
    `
            : ""}
    ${({ $portaled, theme }) =>
        $portaled
            ? `
        z-index: ${theme.zIndices.dropdown};
        min-width: 260px;
        max-width: min(360px, 90vw);
        box-sizing: border-box;
    `
            : ""}
    padding: ${({ theme }) => theme.spacing.xl};
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-top: ${({ $variant, theme }) =>
        $variant === "column"
            ? `${theme.control.borderWidth} solid ${theme.control.fieldBorder}`
            : 0};
    border-radius: ${({ $variant, theme }) =>
        $variant === "column"
            ? theme.radii.md
            : `0 0 ${theme.radii.md} ${theme.radii.md}`};
    background: ${({ theme }) => theme.control.fieldBackground};
    box-shadow: ${({ $variant, theme }) =>
        $variant === "column" ? theme.shadowLarge : "none"};
`;

interface IColumnDropdownPosition {
    top: number;
    left?: number;
    right?: number;
    width: number;
}

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

export interface IPanelOption {
    id: string | number;
    value: string;
    label: string;
    additionalLabel?: string;
}

export interface IPanelProps {
    header?: string;
    dialogTitle?: string;
    additionalLabel?: string;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    defaultExpanded?: boolean;
    inlineOnMobile?: boolean;
    expanded?: boolean;
    onToggle?: (expanded: boolean) => void;
    id?: string;
    variant?: "default" | "column";
    active?: boolean;
    "aria-label"?: string;
    "aria-labelledby"?: string;
}

const useMobileOverlay = (): boolean => {
    const theme = useTheme();
    const getIsMobile = (): boolean =>
        typeof window.matchMedia === "function"
            ? window.matchMedia(`(max-width: ${theme.breakpoints.mobile})`).matches
            : window.innerWidth <= Number.parseFloat(theme.breakpoints.mobile);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== "undefined" ? getIsMobile() : false,
    );

    useEffect(() => {
        if (typeof window.matchMedia !== "function") {
            const sync = (): void => setIsMobile(getIsMobile());
            sync();
            window.addEventListener("resize", sync);
            return () => window.removeEventListener("resize", sync);
        }

        const media = window.matchMedia(
            `(max-width: ${theme.breakpoints.mobile})`,
        );
        const sync = (): void => setIsMobile(media.matches);

        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, [theme.breakpoints.mobile]);

    return isMobile;
};

export const Panel: FC<IPanelProps> = ({
    header,
    dialogTitle,
    additionalLabel,
    disabled = false,
    className = "",
    style,
    children,
    defaultExpanded = false,
    inlineOnMobile = false,
    expanded: controlledExpanded,
    onToggle,
    id,
    variant = "default",
    active = false,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
}) => {
    const [isOpen, setIsOpen] = useState(defaultExpanded);
    const generatedId = useId().replace(/:/g, "");
    const contentId = `panel-${generatedId}-content`;
    const valueId = `panel-${generatedId}-value`;
    const sheetTitleId = `panel-${generatedId}-sheet-title`;
    const isControlled = controlledExpanded !== undefined;
    const isExpanded = isControlled ? controlledExpanded : isOpen;
    const wasExpandedRef = useRef(isExpanded);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const forceFocusRestoreRef = useRef(false);
    const skipFocusRestoreRef = useRef(false);
    const onToggleRef = useRef(onToggle);
    const useOverlay = useMobileOverlay() && !inlineOnMobile;
    const usePortalDropdown = variant === "column" && !useOverlay;
    const [dropdownPosition, setDropdownPosition] =
        useState<IColumnDropdownPosition | null>(null);

    onToggleRef.current = onToggle;

    const setExpanded = (nextExpanded: boolean): void => {
        if (!isControlled) setIsOpen(nextExpanded);
        onToggleRef.current?.(nextExpanded);
    };

    const togglePanel = (): void => {
        setExpanded(!isExpanded);
    };

    const closePanel = (): void => {
        forceFocusRestoreRef.current = true;
        setExpanded(false);
    };

    const updateDropdownPosition = (): void => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const panelWidth = Math.min(320, Math.max(260, window.innerWidth - 32));
        const spaceRight = window.innerWidth - rect.left;
        const alignRight = spaceRight < panelWidth + 16;

        setDropdownPosition({
            top: rect.bottom + 4,
            left: alignRight ? undefined : Math.max(8, rect.left),
            right: alignRight
                ? Math.max(8, window.innerWidth - rect.right)
                : undefined,
            width: panelWidth,
        });
    };

    useLayoutEffect(() => {
        if (!isExpanded || !usePortalDropdown) {
            setDropdownPosition(null);
            return;
        }

        updateDropdownPosition();
        const sync = (): void => updateDropdownPosition();
        window.addEventListener("resize", sync);
        // Capture scroll from overflow ancestors (e.g. history table).
        window.addEventListener("scroll", sync, true);
        return () => {
            window.removeEventListener("resize", sync);
            window.removeEventListener("scroll", sync, true);
        };
    }, [isExpanded, usePortalDropdown]);

    useEffect(() => {
        if (!isExpanded || !usePortalDropdown) return;

        const handlePointerDown = (event: MouseEvent): void => {
            const target = event.target as Node;
            if (
                wrapperRef.current?.contains(target) ||
                contentRef.current?.contains(target)
            ) {
                return;
            }
            // Closing because another control received the pointer — do not steal focus back.
            skipFocusRestoreRef.current = true;
            setExpanded(false);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isExpanded, usePortalDropdown]);

    // Restore focus to the trigger when the panel dismisses (Apply, Escape, overlay).
    // Defer past the closing key's keyup so Enter from Search/Apply does not re-open.
    useEffect(() => {
        if (!wasExpandedRef.current || isExpanded) {
            wasExpandedRef.current = isExpanded;
            return;
        }

        wasExpandedRef.current = isExpanded;

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
            !contentRef.current?.contains(activeElement);
        const shouldRestoreFocus =
            forceFocusRestoreRef.current || !focusMovedElsewhere;
        forceFocusRestoreRef.current = false;

        if (!shouldRestoreFocus) return;

        const focusTimer = window.setTimeout(() => {
            buttonRef.current?.focus();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [isExpanded]);

    useEffect(() => {
        if (!isExpanded || !useOverlay) return;

        const focusTimer = window.setTimeout(() => {
            sheetRef.current?.focus();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [isExpanded, useOverlay]);

    useEffect(() => {
        if (!isExpanded) return;

        const previousOverflow = document.body.style.overflow;
        if (useOverlay) {
            document.body.style.overflow = "hidden";
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                forceFocusRestoreRef.current = true;
                if (!isControlled) setIsOpen(false);
                onToggleRef.current?.(false);
                return;
            }

            // Keep keyboard focus inside the mobile sheet while it is open.
            if (
                !useOverlay ||
                event.key !== "Tab" ||
                !sheetRef.current
            ) {
                return;
            }

            const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            const nodes = Array.from(focusable).filter(
                (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
            );

            if (nodes.length === 0) {
                event.preventDefault();
                sheetRef.current.focus();
                return;
            }

            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (event.shiftKey && (active === first || active === sheetRef.current)) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        // Match ModalWindow/MobileNavDrawer: Tab wrap alone does not cover focus
        // that leaves the dialog (e.g. header controls). Pull it back on focusin.
        const handleFocusIn = (event: FocusEvent): void => {
            if (!useOverlay) return;

            const sheet = sheetRef.current;
            if (!sheet || sheet.contains(event.target as Node)) {
                return;
            }

            const focusable = sheet.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            const nodes = Array.from(focusable).filter(
                (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
            );
            (nodes[0] ?? sheet).focus();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", handleFocusIn);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", handleFocusIn);
            if (useOverlay) {
                document.body.style.overflow = previousOverflow;
            }
        };
    }, [isExpanded, isControlled, useOverlay]);

    const handleTriggerKeyDown = (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ): void => {
        if (event.key === "Escape" && isExpanded) {
            event.preventDefault();
            event.stopPropagation();
            closePanel();
        }
    };

    // Include the visible applied value in the accessible name (label + header).
    const triggerLabelledBy = [
        ariaLabelledBy,
        header ? valueId : undefined,
    ]
        .filter(Boolean)
        .join(" ");

    // Explicit aria-label wins so column filters can keep a short visible header
    // while exposing the applied value in the accessible name.
    const accessibleNameProps = ariaLabel
        ? { "aria-label": ariaLabel }
        : triggerLabelledBy
          ? { "aria-labelledby": triggerLabelledBy }
          : { "aria-label": header };

    const trigger = (
        <PanelButton
            id={id}
            ref={buttonRef}
            type="button"
            disabled={disabled}
            $hasAdditionalLabel={!!additionalLabel}
            $isOpen={isExpanded && !useOverlay}
            $inlineOnMobile={inlineOnMobile}
            $variant={variant}
            $active={active}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            aria-haspopup={useOverlay ? "dialog" : undefined}
            onClick={togglePanel}
            onKeyDown={handleTriggerKeyDown}
            {...accessibleNameProps}
        >
            <PanelHeader>
                <PanelTitle id={header ? valueId : undefined}>{header}</PanelTitle>
                {additionalLabel && (
                    <PanelAdditionalLabel>
                        {additionalLabel}
                    </PanelAdditionalLabel>
                )}
            </PanelHeader>
            {variant === "column" ? (
                <ColumnIconWrapper
                    $active={active}
                    $isOpen={isExpanded}
                    aria-hidden="true"
                >
                    <FilterIcon size={14} />
                </ColumnIconWrapper>
            ) : (
                <ArrowIconWrapper $isOpen={isExpanded} aria-hidden="true">
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            )}
        </PanelButton>
    );

    const sheet =
        useOverlay &&
        isExpanded &&
        createPortal(
            <>
                <SheetOverlay
                    data-testid={`${id ?? contentId}-overlay`}
                    onClick={closePanel}
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
                        <SheetTitle id={sheetTitleId}>
                            {dialogTitle ?? header ?? ariaLabel ?? "Filter"}
                        </SheetTitle>
                        <SheetCloseButton
                            type="button"
                            aria-label={`Close ${dialogTitle ?? "filter"}`}
                            onClick={closePanel}
                        >
                            ×
                        </SheetCloseButton>
                    </SheetHeader>
                    <SheetBody>{children}</SheetBody>
                </Sheet>
            </>,
            document.body,
        );

    const columnDropdown =
        usePortalDropdown &&
        isExpanded &&
        dropdownPosition &&
        createPortal(
            <PanelContent
                ref={contentRef}
                id={contentId}
                $variant="column"
                $portaled
                style={{
                    position: "fixed",
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    right: dropdownPosition.right,
                    width: dropdownPosition.width,
                }}
            >
                {children}
            </PanelContent>,
            document.body,
        );

    return (
        <PanelWrapper
            className={`panel-wrapper ${className}`}
            $disabled={disabled}
            $variant={variant}
            ref={wrapperRef}
            style={style}
        >
            {trigger}
            {!useOverlay && !usePortalDropdown && (
                <PanelContent
                    id={contentId}
                    hidden={!isExpanded}
                    $variant={variant}
                >
                    {children}
                </PanelContent>
            )}
            {columnDropdown}
            {sheet}
        </PanelWrapper>
    );
};

export const AdaptivePanel: FC<IPanelProps> = (props) => (
    <AdaptivePanelWrapper className="adaptive-panel-wrapper">
        <Panel {...props} />
    </AdaptivePanelWrapper>
);

const AdaptivePanelWrapper = styled.div`
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;

        .panel-wrapper {
            width: 100%;
            min-width: 0;
        }
    }
`;
