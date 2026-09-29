import React, { useState } from "react";
import styled from "styled-components";
import { Alert, Button, FormActions } from "components";

const Container = styled.div`
    width: 100%;
    max-width: ${({ theme }) => theme.layout.contentNarrow};
    margin: 0 auto;
`;

const WarningTitle = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-weight: ${({ theme }) => theme.typography.weight.bold};
`;

const InfoTitle = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
`;

const AccountLabel = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

const PhraseSection = styled.div`
    margin: ${({ theme }) => theme.spacing["3xl"]} 0;
`;

const PhraseLabel = styled.h3`
    margin: 0 0 ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const PhraseGrid = styled.div<{ $isVisible: boolean }>`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
    padding: ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.surface};
    filter: ${({ $isVisible }) => ($isVisible ? "none" : "blur(8px)")};
    transition: filter ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};
    user-select: ${({ $isVisible }) => ($isVisible ? "text" : "none")};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const WordCell = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    min-width: 0;
    padding: ${({ theme }) => theme.spacing.md}
        ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    word-break: break-all;
`;

const WordIndex = styled.span`
    flex-shrink: 0;
    min-width: 18px;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const InfoList = styled.ul`
    margin: ${({ theme }) => theme.spacing.md} 0 0;
    padding-left: ${({ theme }) => theme.spacing["2xl"]};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const InfoItem = styled.li`
    margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

interface MnemonicDisplayProps {
    mnemonic: string;
    accountName: string;
    onContinue: () => void;
    onBack?: () => void;
    showBackButton?: boolean;
    continueLabel?: string;
}

export const MnemonicDisplay: React.FC<MnemonicDisplayProps> = ({
    mnemonic,
    accountName,
    onContinue,
    onBack,
    showBackButton = false,
    continueLabel = "I've Saved My Phrase",
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const words = (mnemonic ?? "").trim().split(/\s+/).filter(Boolean);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(mnemonic);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = mnemonic;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Container>
            <Alert
                tone="danger"
                icon="🔐"
                style={{ alignItems: "flex-start" }}
            >
                <WarningTitle>IMPORTANT: Save Your Recovery Phrase</WarningTitle>
                This is the only time you will see your recovery phrase. Save it
                somewhere safe! Anyone with this phrase can access your wallet,
                and if you lose it you will lose access forever.
            </Alert>

            <PhraseSection>
                <AccountLabel>Account: {accountName || "—"}</AccountLabel>
                <PhraseLabel id="recovery-phrase-label">
                    Recovery phrase
                </PhraseLabel>
                <PhraseGrid
                    $isVisible={isVisible}
                    role="list"
                    aria-labelledby="recovery-phrase-label"
                    aria-hidden={!isVisible}
                >
                    {words.map((word: string, index: number) => (
                        <WordCell key={`${index}-${word}`} role="listitem">
                            <WordIndex>{index + 1}.</WordIndex>
                            {word}
                        </WordCell>
                    ))}
                </PhraseGrid>

                <FormActions>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsVisible((prev) => !prev)}
                        aria-pressed={isVisible}
                        aria-label={
                            isVisible
                                ? "Hide recovery phrase"
                                : "Show recovery phrase"
                        }
                        fullWidth
                    >
                        {isVisible ? "Hide" : "Show"}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopy}
                        disabled={!isVisible}
                        aria-label="Copy recovery phrase"
                        fullWidth
                    >
                        {copied ? "Copied" : "Copy Recovery Phrase"}
                    </Button>
                </FormActions>
            </PhraseSection>

            <Alert tone="info" icon="ℹ️" style={{ alignItems: "flex-start" }}>
                <InfoTitle>What to do with your phrase:</InfoTitle>
                <InfoList>
                    <InfoItem>
                        Write it down on paper and store it safely
                    </InfoItem>
                    <InfoItem>Never share it with anyone</InfoItem>
                    <InfoItem>
                        Don&apos;t store it in screenshots or unencrypted files
                    </InfoItem>
                    <InfoItem>
                        Use it to restore your wallet in other browsers
                    </InfoItem>
                    <InfoItem>Keep it offline when possible</InfoItem>
                </InfoList>
            </Alert>

            <FormActions>
                <Button
                    type="button"
                    onClick={onContinue}
                    disabled={!isVisible}
                    fullWidth
                >
                    {continueLabel}
                </Button>
                {showBackButton && onBack && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                        fullWidth
                    >
                        Back
                    </Button>
                )}
            </FormActions>
        </Container>
    );
};
