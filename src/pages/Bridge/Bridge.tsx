import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { RootState } from "store";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    PasswordInput,
    TransactionConfirmationModal,
} from "components";
import { AccountSelector } from "components/AccountSelector";
import { AccountSelectorLabelMods } from "components/AccountSelector/AccountSelector";
import { TextSecondaryBlock } from "styles/sharedStyledComponents";
import { AccountBalance } from "components/AccountBalance";
import { DefaultTheme } from "styled-components/dist/types";
import { ContentPasteIcon, ExploreIcon, HistoryIcon } from "components/Icons";

const BridgeContainer = styled.div`
    max-width: 946px;
    margin: 0 auto;
`;

const FormGroup = styled.div`
    margin-bottom: 24px;
`;

const InputFormGroup = styled(FormGroup)`
    margin-bottom: 36px;

    @media (max-width: 768px) {
        margin-bottom: 20px;
    }
`;

const BalanceInfo = styled.div`
    margin-bottom: 36px;
    display: flex;
    justify-content: center;

    @media (max-width: 768px) {
        margin-bottom: 49px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
`;

const ErrorMessage = styled.div`
    background: ${({ theme }) => theme.danger};
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
    background: ${({ theme }) => theme.success};
    color: ${({ theme }) => theme.text.inverse};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-all;
    box-shadow: ${({ theme }) => theme.shadowLarge};

    * {
        color: ${({ theme }) => theme.text.inverse} !important;
    }

    .deploy-id {
        font-size: 12px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid ${({ theme }) => `${theme.text.inverse}20`};
        color: ${({ theme }) => theme.text.inverse};
        opacity: 0.8;
    }
`;

const InfoMessage = styled.div`
    background: ${({ theme }) => `${theme.primary}20`};
    color: ${({ theme }) => theme.text.primary};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
`;

const LoadingMessage = styled.div`
    background: ${({ theme }) => `${theme.primary}20`};
    color: ${({ theme }) => theme.primary};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    text-align: center;

    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid ${({ theme }) => theme.primary};
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

const QRScannerModal = styled.div<{ $isOpen: boolean }>`
    display: ${({ $isOpen }) => ($isOpen ? "flex" : "none")};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
`;

const QRScannerContent = styled.div`
    background: ${({ theme }) => theme.background};
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
`;

const QRScannerHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const QRScannerTitle = styled.h3`
    margin: 0;
    color: ${({ theme }) => theme.text.primary};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${({ theme }) => theme.text.secondary};

    &:hover {
        color: ${({ theme }) => theme.text.primary};
    }
`;

const VideoContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    border-radius: 8px;
    overflow: hidden;
    background: ${({ theme }) => theme.surface};
`;

const Video = styled.video`
    width: 100%;
    height: auto;
    display: block;
`;

const InputWithButton = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-end;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 0;
`;

const AccountSelectorWithMarginBottom = styled(AccountSelector)`
    margin-bottom: 36px;

    @media (max-width: 768px) {
        margin-bottom: 15px;
    }
`;

const BridgeCardContent = styled(CardContent)`
    padding: 0 159px;
`;

export const Bridge: React.FC = () => {
    const navigate = useNavigate();
    const selectedAccount = useSelector(
        (state: RootState) => state.wallet.selectedAccount,
    );

    const { unlockedAccounts, requirePasswordForTransaction } = useSelector(
        (state: RootState) => state.auth,
    );

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [password, setPassword] = useState("");
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copied, setCopied] = useState(false);

    const [txHash] = useState("");
    const [isWaitingForBalance] = useState(false);
    const [error] = useState("");
    const [validationError] = useState("");
    const [passwordError] = useState("");
    const [addressError] = useState("");
    const [scanError] = useState("");
    const [estimatedFee] = useState("");
    const [isLoading] = useState(false);

    const isAccountUnlocked =
        selectedAccount &&
        unlockedAccounts.some((a) => a.id === selectedAccount.id);
    const needsPassword = !isAccountUnlocked || requirePasswordForTransaction;

    const handleClearAll = (): void => {
        setRecipient("");
        setAmount("");
        setPassword("");
    };

    if (!selectedAccount) {
        return (
            <BridgeContainer>
                <Card>
                    <BridgeCardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select Account
                        </Button>
                    </BridgeCardContent>
                </Card>
            </BridgeContainer>
        );
    }

    return (
        <BridgeContainer>
            <Card style={{ paddingBottom: "36px" }}>
                <CardHeader>
                    <CardTitle>Bridge</CardTitle>
                </CardHeader>
                <BridgeCardContent>
                    {txHash && !isWaitingForBalance && (
                        <SuccessMessage>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <div>
                                        Transaction completed successfully!
                                    </div>
                                    <div className="deploy-id">
                                        Deploy ID: {txHash}
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    style={{
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                txHash,
                                            );
                                            setCopied(true);
                                            setTimeout(
                                                () => setCopied(false),
                                                1500,
                                            );
                                        } catch {}
                                    }}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                        </SuccessMessage>
                    )}

                    {txHash && isWaitingForBalance && (
                        <LoadingMessage>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <span className="spinner"></span>
                                    Transaction sent! Waiting for balance
                                    update...
                                </div>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    style={{
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                txHash,
                                            );
                                            setCopied(true);
                                            setTimeout(
                                                () => setCopied(false),
                                                1500,
                                            );
                                        } catch {}
                                    }}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    marginTop: "8px",
                                    wordBreak: "break-all",
                                }}
                            >
                                Deploy ID: {txHash}
                            </div>
                        </LoadingMessage>
                    )}

                    {(error || validationError || passwordError) && (
                        <ErrorMessage>
                            {error || validationError || passwordError}
                        </ErrorMessage>
                    )}

                    <AccountSelectorWithMarginBottom
                        fullWidth
                        labelMode={AccountSelectorLabelMods.FULL}
                    />

                    <BalanceInfo className="balance-info">
                        <AccountBalance account={selectedAccount} />
                    </BalanceInfo>

                    {!isAccountUnlocked && (
                        <InfoMessage>
                            Account is locked. You'll need to enter your
                            password to send the transaction.
                        </InfoMessage>
                    )}

                    <InputFormGroup>
                        <InputWithButton className="input-with-button">
                            <Input
                                id="bridge-amount-input"
                                className="bridge-amount-input text-3"
                                label="Amount"
                                labelStyle={{
                                    fontWeight: "500",
                                }}
                                labelColorSelector={(theme: DefaultTheme) =>
                                    theme.colors.text.primary
                                }
                                wrapperStyle={{
                                    marginBottom: "0",
                                }}
                                style={{
                                    fontSize: "0.75rem",
                                    height: "44px",
                                }}
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                step="0.00000001"
                                min="0"
                                max={selectedAccount.balance}
                                copyable
                                CustomCopyIcon={ContentPasteIcon}
                            />
                            <Button
                                id="bridge-max-amount-button"
                                variant="secondary"
                                style={{
                                    aspectRatio: "1/1",
                                    width: "44px",
                                    alignSelf: "flex-end",
                                    minWidth: "44px",
                                }}
                            >
                                <h3>Max</h3>
                            </Button>
                        </InputWithButton>
                        <TextSecondaryBlock
                            style={{
                                marginTop: "4px",
                                fontSize: "12px",
                            }}
                        >
                            8 decimal places (1 ASI = 1.00000000)
                        </TextSecondaryBlock>
                    </InputFormGroup>

                    <InputFormGroup>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                            }}
                        >
                            ETH recipient address (0x...)
                        </label>
                        <InputWithButton className="input-with-button">
                            <div style={{ flex: 1 }}>
                                <Input
                                    id="bridge-recipient-input"
                                    className="bridge-recipient-input text-3"
                                    type="text"
                                    value={recipient}
                                    onChange={(e) =>
                                        setRecipient(e.target.value)
                                    }
                                    placeholder={`Enter address`}
                                    wrapperStyle={{
                                        marginBottom: "0",
                                    }}
                                    style={{
                                        width: "100%",
                                        fontSize: "0.75rem",
                                        height: "44px",
                                        border: `2px solid ${
                                            addressError ? "#ff4d4f" : "#e0e0e0"
                                        }`,
                                        borderRadius: "8px",
                                        background: "transparent",
                                        color: "inherit",
                                        outline: "none",
                                    }}
                                    copyable
                                    CustomCopyIcon={ContentPasteIcon}
                                />
                            </div>
                            <ButtonGroup>
                                <Button
                                    id="bridge-qr-scan-button"
                                    variant="icon-button-black"
                                    onClick={() => setShowQRScanner(true)}
                                    style={{
                                        aspectRatio: "1/1",
                                        width: "44px",
                                        alignSelf: "flex-end",
                                        minWidth: "auto",
                                        borderWidth: "2px",
                                    }}
                                >
                                    <ExploreIcon />
                                </Button>
                            </ButtonGroup>
                        </InputWithButton>
                        {addressError && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    color: "#ff4d4f",
                                    fontSize: "14px",
                                }}
                            >
                                {addressError}
                            </div>
                        )}
                        {scanError && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    color: "#ff4d4f",
                                    fontSize: "14px",
                                }}
                            >
                                {scanError}
                            </div>
                        )}
                    </InputFormGroup>

                    {needsPassword && (
                        <FormGroup>
                            <PasswordInput
                                id="bridge-password-input"
                                data-testid="bridge-password-input"
                                data-cy="bridge-password-input"
                                label={
                                    requirePasswordForTransaction
                                        ? "Transaction Password"
                                        : "Account Password"
                                }
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                placeholder="Enter password"
                            />
                        </FormGroup>
                    )}

                    <ActionButtons>
                        <Button
                            id="bridge-transaction-button"
                            onClick={() => setShowConfirmation(true)}
                            loading={isLoading}
                            disabled={
                                !recipient ||
                                !amount ||
                                (needsPassword && !password) ||
                                !!validationError ||
                                !!addressError
                            }
                            style={{ minWidth: "220px", height: "44px" }}
                        >
                            <h3>Lock on ASI Chain</h3>
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            style={{ minWidth: "170px", height: "44px" }}
                        >
                            <h3>Clear all</h3>
                        </Button>
                        <Button
                            id="history-button"
                            title="View transaction history"
                            onClick={() => {
                                navigate("/history");
                            }}
                            variant="icon-button-black"
                            fullWidth={false}
                            secondaryHover
                        >
                            <HistoryIcon />
                        </Button>
                    </ActionButtons>
                </BridgeCardContent>
            </Card>

            <QRScannerModal $isOpen={showQRScanner}>
                <QRScannerContent>
                    <QRScannerHeader>
                        <QRScannerTitle>Scan QR Code</QRScannerTitle>
                        <CloseButton onClick={() => setShowQRScanner(false)}>
                            ×
                        </CloseButton>
                    </QRScannerHeader>

                    {scanError ? (
                        <ErrorMessage>{scanError}</ErrorMessage>
                    ) : (
                        <VideoContainer>
                            <Video />
                        </VideoContainer>
                    )}

                    <div
                        style={{
                            marginTop: "16px",
                            textAlign: "center",
                            color: "#999",
                        }}
                    >
                        <small>
                            Position the QR code within the frame to scan
                        </small>
                    </div>
                </QRScannerContent>
            </QRScannerModal>

            <TransactionConfirmationModal
                isOpen={showConfirmation}
                onClose={() => {
                    setShowConfirmation(false);
                    setPassword("");
                }}
                onConfirm={() => setShowConfirmation(false)}
                amount={amount}
                recipient={recipient}
                senderAddress={selectedAccount?.revAddress || ""}
                senderName={selectedAccount?.name || ""}
                estimatedFee={estimatedFee}
                loading={isLoading}
                requirePasswordForTransaction={requirePasswordForTransaction}
            />
        </BridgeContainer>
    );
};
