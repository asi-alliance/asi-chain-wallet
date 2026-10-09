import { FC, ReactNode, useId } from "react";
import styled from "styled-components";
import { ExpandIcon } from "components/Icons";

const DisclosureWrapper = styled.div`
    position: relative;
    min-width: 150px;
`;

const DisclosureButton = styled.button<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-width: 150px;
    height: ${({ theme }) => theme.sizes.control.field};
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing["2xl"]}`};
    gap: ${({ theme }) => theme.spacing.md};
    border: ${({ theme }) =>
        `${theme.control.borderWidth} solid ${theme.control.fieldBorder}`};
    border-bottom-color: ${({ $isOpen, theme }) =>
        $isOpen ? "transparent" : theme.control.fieldBorder};
    border-radius: ${({ $isOpen, theme }) =>
        $isOpen ? `${theme.radii.md} ${theme.radii.md} 0 0` : theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;

    &:hover {
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
`;

const DisclosureTitle = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

const DisclosureContent = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    overflow: hidden;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-top: 0;
    border-radius: ${({ theme }) => `0 0 ${theme.radii.md} ${theme.radii.md}`};
    background: ${({ theme }) => theme.control.fieldBackground};
`;

interface IDisclosureProps {
    header: string;
    expanded: boolean;
    onToggle: (expanded: boolean) => void;
    children: ReactNode;
}

export const Disclosure: FC<IDisclosureProps> = ({
    header,
    expanded,
    onToggle,
    children,
}) => {
    const contentId = `disclosure-${useId().replace(/:/g, "")}-content`;

    return (
        <DisclosureWrapper>
            <DisclosureButton
                type="button"
                $isOpen={expanded}
                aria-expanded={expanded}
                aria-controls={contentId}
                onClick={() => onToggle(!expanded)}
            >
                <DisclosureTitle>{header}</DisclosureTitle>
                <ArrowIconWrapper $isOpen={expanded} aria-hidden="true">
                    <ExpandIcon size={16} />
                </ArrowIconWrapper>
            </DisclosureButton>
            <DisclosureContent id={contentId} hidden={!expanded}>
                {children}
            </DisclosureContent>
        </DisclosureWrapper>
    );
};
