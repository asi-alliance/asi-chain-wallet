import React, { ClipboardEvent, KeyboardEvent } from "react";
import styled from "styled-components";

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const WordWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    padding: 4px 8px;
    background: ${({ theme }) => theme.surface};

    &:focus-within {
        border-color: ${({ theme }) => theme.primary};
    }
`;

const WordIndex = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: 12px;
    min-width: 18px;
`;

const WordField = styled.input`
    flex: 1;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    font-size: 13px;
`;

const ErrorMessage = styled.div`
    color: ${({ theme }) => theme.danger};
    font-size: 14px;
    margin-top: 8px;
`;

const sanitizeWord = (raw: string): string =>
    raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

interface MnemonicInputProps {
    words: string[];
    wordCount: number;
    onWordsChange: (words: string[]) => void;
    error?: string;
    disabled?: boolean;
}

export const MnemonicInput: React.FC<MnemonicInputProps> = ({
    words,
    wordCount,
    onWordsChange,
    error,
    disabled = false,
}) => {
    const handleWordChange = (index: number, rawValue: string) => {
        const next = [...words];
        next[index] = sanitizeWord(rawValue);
        onWordsChange(next);
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData("text");
        const parts = text.split(/\s+/).map(sanitizeWord).filter(Boolean);

        if (parts.length <= 1) {
            return;
        }

        event.preventDefault();

        const next = Array.from({ length: wordCount }, () => "");

        for (let i = 0; i < wordCount && i < parts.length; i += 1) {
            next[i] = parts[i];
        }

        onWordsChange(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    };

    return (
        <div>
            <Grid>
                {Array.from({ length: wordCount }, (_, index) => (
                    <WordWrapper key={index}>
                        <WordIndex>{index + 1}.</WordIndex>
                        <WordField
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={disabled}
                            value={words[index] ?? ""}
                            onChange={(event) =>
                                handleWordChange(index, event.target.value)
                            }
                            onPaste={(event) => handlePaste(index, event)}
                            onKeyDown={handleKeyDown}
                        />
                    </WordWrapper>
                ))}
            </Grid>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </div>
    );
};
