import React from "react";
import styled from "styled-components";

export type WordCount = 12 | 24;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Label = styled.span`
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const Segments = styled.div`
    display: inline-flex;
    overflow: hidden;
    width: fit-content;
    max-width: 100%;
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
`;

const Segment = styled.button<{ $active: boolean }>`
    min-height: ${({ theme }) => theme.sizes.control.field};
    padding: 0 ${({ theme }) => theme.spacing["2xl"]};
    border: none;
    background: ${({ $active, theme }) =>
        $active ? theme.primary : theme.surface};
    color: ${({ $active, theme }) =>
        $active ? theme.text.inverse : theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    cursor: pointer;

    &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 4px ${({ theme }) => theme.focusRing};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

const WORD_COUNTS: WordCount[] = [12, 24];

interface WordCountToggleProps {
    value: WordCount;
    onChange: (value: WordCount) => void;
    disabled?: boolean;
    label?: string;
}

export const WordCountToggle: React.FC<WordCountToggleProps> = ({
    value,
    onChange,
    disabled = false,
    label = "Recovery phrase length",
}) => {
    return (
        <Wrapper>
            <Label id="word-count-toggle-label">{label}</Label>
            <Segments role="group" aria-labelledby="word-count-toggle-label">
                {WORD_COUNTS.map((count) => (
                    <Segment
                        key={count}
                        type="button"
                        $active={value === count}
                        disabled={disabled}
                        aria-pressed={value === count}
                        onClick={() => onChange(count)}
                    >
                        {count} words
                    </Segment>
                ))}
            </Segments>
        </Wrapper>
    );
};
