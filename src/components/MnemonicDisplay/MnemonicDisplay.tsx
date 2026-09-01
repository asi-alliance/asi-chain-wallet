import React, { useState } from "react";
import styled from "styled-components";
import { Button } from "components/Button";
import { Card, CardContent } from "components/Card";

const Container = styled.div`
    max-width: 600px;
    margin: 0 auto;
`;

const SecurityWarning = styled.div`
    background: ${({ theme }) => `${theme.error}15`};
    border: 2px solid ${({ theme }) => theme.error};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    text-align: center;
`;

const WarningIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

const WarningTitle = styled.h3`
    color: ${({ theme }) => theme.error};
    margin: 0 0 12px 0;
    font-weight: 700;
`;

const WarningText = styled.p`
    color: ${({ theme }) => theme.text.primary};
    margin: 0 0 16px 0;
    line-height: 1.5;
`;

const PhraseSection = styled.div`
    margin-bottom: 24px;
`;

const PhraseLabel = styled.label`
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.text.primary};
`;

const PhraseGrid = styled.div<{ $isVisible: boolean }>`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    background: ${({ theme }) => theme.surface};
    border: 2px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    padding: 16px;
    filter: ${({ $isVisible }) => ($isVisible ? "none" : "blur(8px)")};
    transition: filter 0.3s ease;
    user-select: ${({ $isVisible }) => ($isVisible ? "text" : "none")};

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const WordCell = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    font-size: 13px;
    color: ${({ theme }) => theme.text.primary};
    word-break: break-all;
`;

const WordIndex = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-size: 12px;
    min-width: 18px;
`;

const ToggleButton = styled(Button)`
    margin-top: 12px;
    width: 100%;
`;

const CopyButton = styled(Button)`
    margin-top: 12px;
    width: 100%;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 24px;
    align-items: center;
`;

const InfoBox = styled.div`
    background: ${({ theme }) => `${theme.primary}10`};
    border: 1px solid ${({ theme }) => `${theme.primary}30`};
    border-radius: 8px;
    padding: 8px 8px 8px 16px;
    margin-bottom: 24px;
`;

const InfoTitle = styled.h4`
    color: ${({ theme }) => theme.primary};
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
`;

const InfoList = styled.ul`
    margin: 0;
    padding-left: 20px;
    color: ${({ theme }) => theme.text.secondary};
    font-size: 14px;
    line-height: 1.5;
`;

const InfoItem = styled.li`
    margin-bottom: 4px;
`;

interface MnemonicDisplayProps {
    mnemonic: string;
    accountName: string;
    onContinue: () => void;
    onBack?: () => void;
    showBackButton?: boolean;
}

export const MnemonicDisplay: React.FC<MnemonicDisplayProps> = ({
    mnemonic,
    accountName,
    onContinue,
    onBack,
    showBackButton = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const words = mnemonic.trim().split(/\s+/);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(mnemonic);

            setCopied(true);

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy mnemonic:", error);

            const textArea = document.createElement("textarea");

            textArea.value = mnemonic;

            document.body.appendChild(textArea);

            textArea.select();
            document.execCommand("copy");

            document.body.removeChild(textArea);

            setCopied(true);

            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Container>
            <SecurityWarning>
                <WarningIcon>🔐</WarningIcon>
                <WarningTitle>
                    IMPORTANT: Save Your Recovery Phrase
                </WarningTitle>
                <WarningText>
                    This is the only time you'll see your recovery phrase.
                    <strong> Save it somewhere safe!</strong> Anyone with this
                    phrase can access your wallet, and if you lose it you'll
                    lose access forever.
                </WarningText>
            </SecurityWarning>

            <Card>
                <CardContent>
                    <PhraseSection>
                        <PhraseLabel>
                            <h3>Account: {accountName}</h3>
                        </PhraseLabel>
                        <PhraseGrid $isVisible={isVisible}>
                            {words.map((word: string, index: number) => (
                                <WordCell key={`${index}-${word}`}>
                                    <WordIndex>{index + 1}.</WordIndex>
                                    {word}
                                </WordCell>
                            ))}
                        </PhraseGrid>
                        <ToggleButton
                            variant="ghost"
                            size="small"
                            onClick={() => setIsVisible((prev) => !prev)}
                        >
                            {isVisible ? "Hide" : "Show"}
                        </ToggleButton>
                        <CopyButton
                            variant="secondary"
                            onClick={handleCopy}
                            disabled={!isVisible}
                        >
                            {copied ? "✓ Copied!" : "Copy Recovery Phrase"}
                        </CopyButton>
                    </PhraseSection>

                    <InfoBox>
                        <InfoTitle>What to do with your phrase:</InfoTitle>
                        <InfoList>
                            <InfoItem>
                                Write it down on paper and store it safely
                            </InfoItem>
                            <InfoItem>Never share it with anyone</InfoItem>
                            <InfoItem>
                                Don't store it in screenshots or unencrypted
                                files
                            </InfoItem>
                            <InfoItem>
                                Use it to restore your wallet in other browsers
                            </InfoItem>
                            <InfoItem>Keep it offline when possible</InfoItem>
                        </InfoList>
                    </InfoBox>

                    <ActionButtons>
                        <Button
                            onClick={onContinue}
                            style={{ flex: 1, height: "auto" }}
                        >
                            <h3>I've Saved My Phrase</h3>
                        </Button>
                        {showBackButton && onBack && (
                            <Button
                                variant="secondary"
                                onClick={onBack}
                                style={{ flex: 1 }}
                            >
                                <h3>Back</h3>
                            </Button>
                        )}
                    </ActionButtons>
                </CardContent>
            </Card>
        </Container>
    );
};
