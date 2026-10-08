import React, {
    ChangeEvent,
    ClipboardEvent,
    KeyboardEvent,
    useId,
} from "react";
import styled from "styled-components";

const Wrapper = styled.div`
    width: 100%;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.md};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`;

const WordWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    min-width: 0;
    padding: ${({ theme }) => `calc((${theme.sizes.control.field} - ${theme.typography.lineHeight.sm}) / 2)`}
        ${({ theme }) => theme.control.fieldPadding};
    border: ${({ theme }) => theme.control.borderWidth} solid
        ${({ theme }) => theme.control.fieldBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};

    &:hover:not(:focus-within) {
        border-color: ${({ theme }) => theme.control.fieldHoverBorder};
    }

    &:focus-within {
        border-color: ${({ theme }) => theme.primary};
        box-shadow: 0 0 0 4px ${({ theme }) => theme.focusRing};
    }
`;

const WordIndex = styled.span`
    flex-shrink: 0;
    min-width: 18px;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const WordField = styled.input`
    flex: 1;
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};

    &:disabled {
        cursor: not-allowed;
        color: ${({ theme }) => theme.text.tertiary};
    }
`;

const ErrorMessage = styled.div`
    margin-top: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const sanitizeWord = (raw: string): string =>
    raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

const NON_LATIN_LETTER_REGEX = /[^\P{L}a-zA-Z]/u;

const NON_LATIN_WORDS_ERROR =
    "Recovery phrase words use Latin letters (a-z) only. Check your keyboard layout.";

const splitWords = (raw: string): string[] =>
    raw.toLowerCase().split(/[^a-z]+/).filter(Boolean);

const isKeyboardTyping = (nativeEvent: Event): boolean =>
    nativeEvent instanceof InputEvent &&
    nativeEvent.inputType === "insertText" &&
    (nativeEvent.data ?? "").length <= 1;

interface MnemonicInputProps {
    words: string[];
    wordCount: number;
    onWordsChange: (words: string[]) => void;
    onError: (message: string) => void;
    error?: string;
    disabled?: boolean;
    "aria-label"?: string;
}

export const MnemonicInput: React.FC<MnemonicInputProps> = ({
    words,
    wordCount,
    onWordsChange,
    onError,
    error,
    disabled = false,
    "aria-label": ariaLabel = "Recovery phrase words",
}) => {
    const errorId = useId();

    const placeWords = (index: number, parts: string[]): void => {
        if (parts.length > wordCount) {
            onError(
                `The recovery phrase has ${parts.length} words, but ${wordCount} are expected.`,
            );

            return;
        }

        const startIndex = parts.length === wordCount ? 0 : index;
        const freeFieldsCount = wordCount - startIndex;

        if (parts.length > freeFieldsCount) {
            onError(
                `${parts.length} words do not fit: only ${freeFieldsCount} fields are left starting from word ${startIndex + 1}.`,
            );

            return;
        }

        const next = Array.from(
            { length: wordCount },
            (_, wordIndex) => words[wordIndex] ?? "",
        );

        parts.forEach((part: string, offset: number) => {
            next[startIndex + offset] = part;
        });

        onWordsChange(next);
    };

    const handleWordChange = (
        index: number,
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const rawValue = event.target.value;

        if (NON_LATIN_LETTER_REGEX.test(rawValue)) {
            onError(NON_LATIN_WORDS_ERROR);

            return;
        }

        const parts = splitWords(rawValue);

        if (parts.length > 1 && !isKeyboardTyping(event.nativeEvent)) {
            placeWords(index, parts);

            return;
        }

        const next = [...words];
        next[index] = sanitizeWord(rawValue);
        onWordsChange(next);
    };

    const handlePaste = (
        index: number,
        event: ClipboardEvent<HTMLInputElement>,
    ) => {
        const text = event.clipboardData.getData("text");

        if (NON_LATIN_LETTER_REGEX.test(text)) {
            event.preventDefault();
            onError(NON_LATIN_WORDS_ERROR);

            return;
        }

        const parts = splitWords(text);

        if (parts.length === 1) {
            return;
        }

        event.preventDefault();

        if (!parts.length) {
            return;
        }

        placeWords(index, parts);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    };

    return (
        <Wrapper>
            <Grid role="group" aria-label={ariaLabel} aria-describedby={error ? errorId : undefined}>
                {Array.from({ length: wordCount }, (_, index) => (
                    <WordWrapper key={index}>
                        <WordIndex aria-hidden="true">{index + 1}.</WordIndex>
                        <WordField
                            id={`mnemonic-word-${index + 1}`}
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            disabled={disabled}
                            value={words[index] ?? ""}
                            aria-label={`Word ${index + 1}`}
                            onChange={(event) =>
                                handleWordChange(index, event)
                            }
                            onPaste={(event) => handlePaste(index, event)}
                            onKeyDown={handleKeyDown}
                        />
                    </WordWrapper>
                ))}
            </Grid>
            {error && (
                <ErrorMessage id={errorId} role="alert">
                    {error}
                </ErrorMessage>
            )}
        </Wrapper>
    );
};
