import React, { useState } from "react";
import { useCopyToClipboard } from "hooks";
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

const KeySection = styled.div`
    margin: ${({ theme }) => theme.spacing["3xl"]} 0;
`;

const KeyLabel = styled.h3`
    margin: 0 0 ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.md};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const KeyContainer = styled.div`
    position: relative;
    min-height: ${({ theme }) => theme.sizes.control.large};
    padding: ${({ theme }) => theme.spacing.xl};
    padding-right: 88px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.surface};
`;

const KeyValue = styled.div<{ $isVisible: boolean }>`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    word-break: break-all;
    filter: ${({ $isVisible }) => ($isVisible ? "none" : "blur(8px)")};
    transition: filter ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};
    user-select: ${({ $isVisible }) => ($isVisible ? "text" : "none")};

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const ToggleButton = styled(Button)`
    position: absolute;
    top: ${({ theme }) => theme.spacing.md};
    right: ${({ theme }) => theme.spacing.md};
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

interface PrivateKeyDisplayProps {
    privateKey: string;
    accountName: string;
    onContinue: () => void;
    onBack?: () => void;
    showBackButton?: boolean;
    continueLabel?: string;
}

export const PrivateKeyDisplay: React.FC<PrivateKeyDisplayProps> = ({
    privateKey,
    accountName,
    onContinue,
    onBack,
    showBackButton = false,
    continueLabel = "I've Saved My Private Key",
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const clipboard = useCopyToClipboard();
    const copied =
        clipboard.result?.status === "copied" &&
        clipboard.result.value === privateKey;

    const handleCopy = (): void => {
        clipboard.copy(privateKey);
    };

    return (
        <Container>
            <Alert
                tone="danger"
                icon="🔐"
                style={{ alignItems: "flex-start" }}
            >
                <WarningTitle>IMPORTANT: Save Your Private Key</WarningTitle>
                This is the only time you will see your private key in plain
                text. Save it somewhere safe! If you lose this key, you lose
                access to the account forever.
            </Alert>

            <KeySection>
                <AccountLabel>Account: {accountName || "—"}</AccountLabel>
                <KeyLabel id="private-key-label">Private key</KeyLabel>
                <KeyContainer>
                    <KeyValue
                        $isVisible={isVisible}
                        aria-labelledby="private-key-label"
                        aria-hidden={!isVisible}
                    >
                        {privateKey}
                    </KeyValue>
                    <ToggleButton
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => setIsVisible((prev) => !prev)}
                        aria-pressed={isVisible}
                        aria-label={
                            isVisible ? "Hide private key" : "Show private key"
                        }
                    >
                        {isVisible ? "Hide" : "Show"}
                    </ToggleButton>
                </KeyContainer>

                <FormActions>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopy}
                        disabled={!isVisible}
                        aria-label="Copy private key"
                        fullWidth
                    >
                        {copied ? "Copied" : "Copy Private Key"}
                    </Button>
                </FormActions>
            </KeySection>

            <Alert tone="info" icon="ℹ️" style={{ alignItems: "flex-start" }}>
                <InfoTitle>What to do with your private key:</InfoTitle>
                <InfoList>
                    <InfoItem>
                        Write it down on paper and store it safely
                    </InfoItem>
                    <InfoItem>Never share it with anyone</InfoItem>
                    <InfoItem>
                        Don&apos;t store it in screenshots or unencrypted files
                    </InfoItem>
                    <InfoItem>
                        Use it to import your wallet in other browsers
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
