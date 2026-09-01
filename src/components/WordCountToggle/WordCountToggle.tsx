import React from "react";
import styled from "styled-components";

export type WordCount = 12 | 24;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
`;

const Label = styled.span`
    font-weight: 600;
    font-size: 14px;
    color: ${({ theme }) => theme.text.primary};
`;

const Segments = styled.div`
    display: inline-flex;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
`;

const Segment = styled.button<{ $active: boolean }>`
    padding: 8px 20px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    background: ${({ $active, theme }) =>
        $active ? theme.primary : theme.surface};
    color: ${({ $active, theme }) =>
        $active ? theme.background : theme.text.secondary};
    transition:
        background 0.2s ease,
        color 0.2s ease;

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
            <Label>{label}</Label>
            <Segments>
                {WORD_COUNTS.map((count) => (
                    <Segment
                        key={count}
                        type="button"
                        $active={value === count}
                        disabled={disabled}
                        onClick={() => onChange(count)}
                    >
                        {count} words
                    </Segment>
                ))}
            </Segments>
        </Wrapper>
    );
};
