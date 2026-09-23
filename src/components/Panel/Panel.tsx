import { ExpandIcon } from "components/Icons";
import { CSSProperties, FC, ReactNode, useId, useState } from "react";
import styled from "styled-components";

const PanelWrapper = styled.div<{ $disabled: boolean }>`
    position: relative;
    min-width: 150px;
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
`;

const PanelButton = styled.button<{
    $hasAdditionalLabel: boolean;
    $isOpen: boolean;
}>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-width: 150px;
    height: ${({ theme }) => theme.sizes.control.field};
    padding: ${({ theme }) =>
        `${theme.spacing.md} ${theme.spacing["2xl"]}`};
    gap: ${({ theme }) => theme.spacing.md};
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-bottom-color: ${({ $isOpen, theme }) =>
        $isOpen ? "transparent" : theme.control.fieldBorder};
    border-radius: ${({ $isOpen, theme }) =>
        $isOpen
            ? `${theme.radii.md} ${theme.radii.md} 0 0`
            : theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.primary};
        border-bottom-color: ${({ $isOpen, theme }) =>
            $isOpen ? "transparent" : theme.primary};
        background: ${({ theme }) => theme.hoverSurface};
    }

    &:focus-visible {
        outline: none;
        border-color: ${({ theme }) => theme.primary};
        border-bottom-color: ${({ $isOpen, theme }) =>
            $isOpen ? "transparent" : theme.primary};
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 1;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        height: ${({ $hasAdditionalLabel, theme }) =>
            $hasAdditionalLabel ? "auto" : theme.sizes.control.field};
    }
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

const PanelContent = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-top: 0;
    border-radius: 0 0 ${({ theme }) => theme.radii.md}
        ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
`;

export interface IPanelOption {
    id: string | number;
    value: string;
    label: string;
    additionalLabel?: string;
}

export interface IPanelProps {
    header?: string;
    additionalLabel?: string;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onToggle?: (expanded: boolean) => void;
}

export const Panel: FC<IPanelProps> = ({
    header,
    additionalLabel,
    disabled = false,
    className = "",
    style,
    children,
    defaultExpanded = false,
    expanded: controlledExpanded,
    onToggle,
}) => {
    const [isOpen, setIsOpen] = useState(defaultExpanded);
    const generatedId = useId().replace(/:/g, "");
    const contentId = `panel-${generatedId}-content`;
    const isControlled = controlledExpanded !== undefined;
    const isExpanded = isControlled ? controlledExpanded : isOpen;

    const togglePanel = (): void => {
        const nextExpanded = !isExpanded;
        if (!isControlled) setIsOpen(nextExpanded);
        onToggle?.(nextExpanded);
    };

    return (
        <PanelWrapper
            className={`panel-wrapper ${className}`}
            $disabled={disabled}
            style={style}
        >
            <PanelButton
                type="button"
                disabled={disabled}
                $hasAdditionalLabel={!!additionalLabel}
                $isOpen={isExpanded}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={togglePanel}
            >
                <PanelHeader>
                    <PanelTitle>{header}</PanelTitle>
                    {additionalLabel && (
                        <PanelAdditionalLabel>
                            {additionalLabel}
                        </PanelAdditionalLabel>
                    )}
                </PanelHeader>
                <ArrowIconWrapper $isOpen={isExpanded} aria-hidden="true">
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </PanelButton>

            <PanelContent id={contentId} hidden={!isExpanded}>
                {children}
            </PanelContent>
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
