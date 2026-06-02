import { ExpandIcon } from "components/Icons";
import { FC, useState, CSSProperties, ReactNode } from "react";
import styled from "styled-components";

const PanelWrapper = styled.div<{ disabled?: boolean }>`
    position: relative;
    min-width: 150px;

    ${({ disabled, theme }) =>
        disabled &&
        `
        opacity: 0.4;
        cursor: not-allowed;
        background: ${theme.inputBg};
    `}
`;

const PanelButton = styled.div<{
    disabled?: boolean;
    hasAdditionalLabel?: boolean;
    isOpen?: boolean;
}>`
    padding: 10px 20px;
    height: 44px;
    border: 1px solid ${({ theme }) => theme.border};
    border-bottom: none;
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 16px;
    min-width: 150px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-radius: ${({ isOpen }) => (isOpen ? "6px 6px 0 0" : "6px")};

    ${({ disabled, theme }) =>
        disabled &&
        `
         opacity: 0.4;
        cursor: not-allowed;
        background: ${theme.inputBg};

    `}

    &:hover:not(:disabled) {
        background: ${({ theme }) => `${theme.text.primary}08`};
    }

    @media (max-width: 768px) {
        height: ${({ hasAdditionalLabel }) =>
            hasAdditionalLabel ? "auto" : "44px"};
    }
`;

const PanelHeader = styled.div`
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 13px;
`;

const PanelTitle = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const PanelAdditionalLabel = styled.span`
    @media (max-width: 768px) {
        display: block;
    }
`;

const ArrowIconWrapper = styled.div<{ isOpen: boolean }>`
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
`;

const PanelContent = styled.div<{ isOpen: boolean }>`
    border: 1px solid ${({ theme }) => theme.border};
    border-top: none;
    border-radius: 0 0 6px 6px;
    background: ${({ theme }) => theme.surface};
    padding: ${({ isOpen }) => (isOpen ? "16px" : "0")};
    max-height: ${({ isOpen }) => (isOpen ? "auto" : "0")};
    overflow: hidden;
    transition: all 0.2s ease;
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

    const isControlled = controlledExpanded !== undefined;
    const isExpanded = isControlled ? controlledExpanded : isOpen;

    const togglePanel = () => {
        if (!disabled) {
            const newExpandedState = !isExpanded;
            if (!isControlled) {
                setIsOpen(newExpandedState);
            }
            onToggle?.(newExpandedState);
        }
    };

    return (
        <PanelWrapper
            className={`panel-wrapper ${className}`}
            disabled={disabled}
            style={style}
        >
            <PanelButton
                hasAdditionalLabel={!!additionalLabel}
                isOpen={isExpanded}
                onClick={togglePanel}
                disabled={disabled}
            >
                <PanelHeader>
                    <PanelTitle className="text-ellipsis">{header}</PanelTitle>
                    {additionalLabel && (
                        <PanelAdditionalLabel className="text-4 text-light">
                            {additionalLabel}
                        </PanelAdditionalLabel>
                    )}
                </PanelHeader>
                <ArrowIconWrapper isOpen={isExpanded}>
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </PanelButton>

            <PanelContent isOpen={isExpanded}>{children}</PanelContent>
        </PanelWrapper>
    );
};

export const AdaptivePanel: FC<IPanelProps> = (props) => {
    return (
        <AdaptivePanelWrapper className="adaptive-panel-wrapper">
            <Panel {...props} />
        </AdaptivePanelWrapper>
    );
};

const AdaptivePanelWrapper = styled.div`
    @media (max-width: 768px) {
        width: 100%;

        .panel-wrapper {
            width: 100%;
            min-width: auto;
        }

        .panel-wrapper > div:first-child {
            font-size: 12px !important;
        }

        .panel-wrapper > div:first-child > div:first-child {
            font-size: 12px !important;
        }

        .panel-wrapper > div:first-child > div svg {
            width: 14px !important;
            height: 14px !important;
        }
    }
`;
