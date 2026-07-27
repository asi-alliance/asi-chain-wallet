import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import QrScanner from "qr-scanner";
import { Address } from "@asichain/asi-wallet-sdk";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    selectAccountById,
    selectBalanceByAccountId,
    selectSelectedAccountId,
    selectWalletByAccountId,
    updateAccountBalance,
} from "store/WalletsStore";
import { fetchBalance, sendTransaction } from "store/WalletsStore/thunks";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    TransactionConfirmationModal,
} from "components";
import { getTokenDisplayName } from "../../constants/token";
import { generateRandomGasFee, getGasFeeAsNumber } from "../../constants/gas";
import addressValidation from "utils/AddressValidation";
import { AccountSelector } from "components/AccountSelector";
import { AccountSelectorLabelMods } from "components/AccountSelector/AccountSelector";
import { TextSecondaryBlock } from "styles/sharedStyledComponents";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { DefaultTheme } from "styled-components/dist/types";
import {
    ContentPasteIcon,
    HistoryIcon,
    QRIcon,
    VectorIcon,
} from "components/Icons";
import { unlockAccount } from "store/Auth/thunks";

const SendContainer = styled.div`
    max-width: 600px;
    margin: 0 auto;
`;

const FormGroup = styled.div`
    margin-bottom: 24px;
`;

const RecipientAddressFormGroup = styled(FormGroup)`
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

    /* Force inverse text for all content */
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

export const Send: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedAccountId = useSelector(selectSelectedAccountId);
    const selectedAccount = useSelector((state: RootState) =>
        selectedAccountId ? selectAccountById(state, selectedAccountId) : null,
    );
    const selectedWallet = useSelector((state: RootState) =>
        selectedAccountId
            ? selectWalletByAccountId(state, selectedAccountId)
            : null,
    );
    const balance = useSelector((state: RootState) =>
        selectedAccountId
            ? selectBalanceByAccountId(state, selectedAccountId)
            : "0",
    );
    const isLoading = useSelector(
        (state: RootState) => state.walletsStore.isLoading,
    );
    const error = useSelector((state: RootState) => state.walletsStore.error);

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [txHash, setTxHash] = useState("");
    const [validationError, setValidationError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [isWaitingForBalance, setIsWaitingForBalance] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [scanError, setScanError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [estimatedFee, setEstimatedFee] = useState(generateRandomGasFee());
    const [copied, setCopied] = useState(false);

    const updateEstimatedFee = () => {
        setEstimatedFee(generateRandomGasFee());
    };

    const handleRecipientChange = (value: string) => {
        setRecipient(value);
        updateEstimatedFee();

        if (!value.trim()) {
            setAddressError("");
            return;
        }

        if (value.trim().toLowerCase().startsWith("0x")) {
            setAddressError("Sending to Ethereum addresses is not supported");
            return;
        }

        const validation = addressValidation(value);
        if (!validation.isValid) {
            setAddressError(validation.validationMessages.join(", "));
        } else {
            setAddressError("");
        }
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        updateEstimatedFee();

        if (!value.trim()) {
            setValidationError("");
            return;
        }

        const amountValue = parseFloat(value);
        if (isNaN(amountValue) || amountValue <= 0) {
            return;
        }

        const balanceNum = parseFloat(balance);

        if (amountValue > balanceNum) {
            setValidationError(
                `Insufficient balance. You have ${balanceNum.toFixed(
                    8,
                )} ${getTokenDisplayName()}`,
            );
            return;
        }

        const totalRequired = amountValue + getGasFeeAsNumber();
        if (totalRequired > balanceNum) {
            const maxSendable = Math.max(0, balanceNum - getGasFeeAsNumber());
            const maxRounded = Math.floor(maxSendable * 100000000) / 100000000;
            setValidationError(
                `Amount + fee (${totalRequired.toFixed(
                    8,
                )}) exceeds balance. Max: ${maxRounded.toFixed(
                    8,
                )} ${getTokenDisplayName()}`,
            );
            return;
        }

        setValidationError("");
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    // Fetch balance on mount and when selected account changes
    useEffect(() => {
        if (selectedAccount) {
            dispatch(fetchBalance({ accountId: selectedAccount.id }));
        }
    }, [selectedAccount, dispatch]);

    useEffect(() => {
        if (!selectedAccount) return;

        const interval = setInterval(() => {
            dispatch(fetchBalance({ accountId: selectedAccount.id }));
        }, 30000);

        return () => clearInterval(interval);
    }, [selectedAccount, dispatch]);

    // Initialize QR scanner when modal opens
    useEffect(() => {
        if (showQRScanner && videoRef.current) {
            const qrScanner = new QrScanner(
                videoRef.current,
                (result) => {
                    handleRecipientChange(result.data);
                    setShowQRScanner(false);
                    setScanError("");
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                },
            );

            qrScannerRef.current = qrScanner;
            qrScanner.start().catch((err) => {
                console.error("Failed to start QR scanner:", err);
                setScanError(
                    "Failed to access camera. Please check permissions.",
                );
            });
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        };
    }, [showQRScanner]);

    // Handle paste from clipboard
    const _handlePasteImage = async () => {
        try {
            setScanError("");

            // Check if clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.read) {
                setScanError("Clipboard access not supported in this browser");
                setTimeout(() => setScanError(""), 3000);
                return;
            }

            const clipboardItems = await navigator.clipboard.read();

            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith("image/")) {
                        const blob = await clipboardItem.getType(type);

                        try {
                            const result = await QrScanner.scanImage(blob, {
                                returnDetailedScanResult: true,
                            });

                            if (result.data) {
                                handleRecipientChange(result.data);
                                return;
                            }
                        } catch (error) {
                            console.error(
                                "Failed to scan QR code from clipboard image:",
                                error,
                            );
                        }
                    }
                }
            }

            setScanError(
                "No QR code found in clipboard. Copy a QR code image and try again.",
            );
            setTimeout(() => setScanError(""), 3000);
        } catch (error) {
            console.error("Failed to access clipboard:", error);
            setScanError(
                "Failed to access clipboard. Please check permissions.",
            );
            setTimeout(() => setScanError(""), 3000);
        }
    };

    // Handle paste event on the input field
    const handleInputPaste = async (
        event: React.ClipboardEvent<HTMLInputElement>,
    ) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                event.preventDefault();
                const blob = items[i].getAsFile();
                if (blob) {
                    try {
                        const result = await QrScanner.scanImage(blob, {
                            returnDetailedScanResult: true,
                        });

                        if (result.data) {
                            handleRecipientChange(result.data);
                        }
                    } catch (error) {
                        console.error(
                            "Failed to scan QR code from pasted image:",
                            error,
                        );
                        setScanError("No QR code found in the image.");
                        setTimeout(() => setScanError(""), 3000);
                    }
                }
            }
        }
    };

    if (!selectedAccount) {
        return (
            <SendContainer>
                <Card>
                    <CardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select Account
                        </Button>
                    </CardContent>
                </Card>
            </SendContainer>
        );
    }

    const validateForm = () => {
        if (!recipient.trim()) {
            setValidationError("Recipient address is required");
            return false;
        }

        if (recipient.trim().toLowerCase().startsWith("0x")) {
            setValidationError(
                "Sending to Ethereum addresses is not supported",
            );
            return false;
        }

        // Validate address format
        const addressValidationResult = addressValidation(recipient);
        if (!addressValidationResult.isValid) {
            setValidationError(
                `Invalid recipient address: ${addressValidationResult.validationMessages.join(
                    ", ",
                )}`,
            );
            return false;
        }

        if (
            selectedAccount &&
            recipient.toLowerCase() === selectedAccount.address.toLowerCase()
        ) {
            setValidationError(
                "Cannot send to the same address (self-transfer not allowed)",
            );
            return false;
        }

        if (
            !amount.trim() ||
            isNaN(parseFloat(amount)) ||
            parseFloat(amount) <= 0
        ) {
            setValidationError("Valid amount is required");
            return false;
        }

        const balanceNum = parseFloat(balance);
        const amountToSend = parseFloat(amount);

        if (amountToSend > balanceNum) {
            setValidationError(
                `Insufficient balance. You have ${balanceNum.toFixed(
                    8,
                )} ${getTokenDisplayName()}`,
            );
            return false;
        }

        const totalRequired = amountToSend + getGasFeeAsNumber();
        if (totalRequired > balanceNum) {
            const maxSendable = Math.max(0, balanceNum - getGasFeeAsNumber());
            setValidationError(
                `Insufficient balance for transaction + fee. Maximum sendable: ${maxSendable.toFixed(
                    8,
                )} ${getTokenDisplayName()} (${balanceNum.toFixed(
                    8,
                )} - ${getGasFeeAsNumber().toFixed(8)} fee)`,
            );
            return false;
        }

        setValidationError("");
        return true;
    };

    const handleSendClick = (): void => {
        if (!validateForm() || !selectedAccount) {
            return;
        }

        setShowConfirmation(true);
    };

    const resolveWalletId = async (password: string): Promise<string> => {
        if (selectedWallet?.isUnlocked && selectedWallet.id) {
            return selectedWallet.id;
        }

        const unlockedWallet = await dispatch(
            unlockAccount({ accountId: selectedAccount.id, password }),
        ).unwrap();

        if (!unlockedWallet.id) {
            throw new Error("Failed to unlock wallet");
        }

        return unlockedWallet.id;
    };

    const handleConfirmSend = async (passwordFromModal?: string) => {
        if (!selectedAccount || !passwordFromModal) return;

        setShowConfirmation(false);

        if (recipient.trim().toLowerCase().startsWith("0x")) {
            setValidationError(
                "Sending to Ethereum addresses is not supported",
            );
            return;
        }

        setTxHash("");
        setIsWaitingForBalance(false);
        setPasswordError("");

        try {
            const walletId = await resolveWalletId(passwordFromModal);

            const resultAction = await dispatch(
                sendTransaction({
                    walletId,
                    accountId: selectedAccount.id,
                    to: recipient as Address,
                    amount,
                    password: passwordFromModal,
                }),
            );

            if (sendTransaction.fulfilled.match(resultAction)) {
                const deployId = resultAction.payload.deployId;
                setTxHash(deployId);
                setIsWaitingForBalance(true);
                setRecipient("");
                setAmount("");

                let pollCount = 0;
                const maxPolls = 30;
                const initialBalance = balance;

                const pollInterval = setInterval(async () => {
                    pollCount++;

                    try {
                        const balanceResult = await dispatch(
                            fetchBalance({ accountId: selectedAccount.id }),
                        );

                        if (fetchBalance.fulfilled.match(balanceResult)) {
                            const newBalance = balanceResult.payload.balance;

                            if (
                                newBalance !== initialBalance ||
                                pollCount >= maxPolls
                            ) {
                                clearInterval(pollInterval);
                                setIsWaitingForBalance(false);
                            }
                        } else if (fetchBalance.rejected.match(balanceResult)) {
                            const sentAmount = parseFloat(amount);
                            const fee = getGasFeeAsNumber();
                            const expectedNewBalance =
                                parseFloat(initialBalance) - sentAmount - fee;

                            if (expectedNewBalance >= 0) {
                                dispatch(
                                    updateAccountBalance({
                                        accountId: selectedAccount.id,
                                        balance: expectedNewBalance.toString(),
                                    }),
                                );
                            }

                            if (pollCount >= maxPolls) {
                                clearInterval(pollInterval);
                                setIsWaitingForBalance(false);
                            }
                        }
                    } catch (error) {
                        console.error(
                            "[Send] Error during balance polling:",
                            error,
                        );
                        if (pollCount >= maxPolls) {
                            clearInterval(pollInterval);
                            setIsWaitingForBalance(false);
                        }
                    }
                }, 2000);
            }
        } catch (err) {
            console.error("Send failed:", err);
            setPasswordError(
                "Failed to send transaction. Check your password and try again.",
            );
            setTimeout(() => setPasswordError(""), 4000);
        }
    };

    const handleClearAll = (): void => {
        setRecipient("");
        setAmount("");
        setPasswordError("");
        setValidationError("");
        setAddressError("");
        setTxHash("");
        setIsWaitingForBalance(false);
        setScanError("");
        setShowConfirmation(false);
        setCopied(false);
        setEstimatedFee(generateRandomGasFee());
    };

    const maxAmount = () => {
        const balanceNum = parseFloat(balance);
        const max = Math.max(0, balanceNum - getGasFeeAsNumber());

        if (max <= 0) {
            setValidationError("Insufficient balance to cover gas fees");
            setAmount("0");
        } else {
            const maxRounded = Math.floor(max * 100000000) / 100000000;
            setAmount(maxRounded.toFixed(8));
            setValidationError("");
        }
    };

    return (
        <SendContainer>
            <Card style={{ paddingBottom: "36px" }}>
                <CardHeader>
                    <CardTitle>Send ASI</CardTitle>
                </CardHeader>
                <CardContent>
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
                        <ASIAccountBalance account={selectedAccount} />
                    </BalanceInfo>

                    <RecipientAddressFormGroup>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                            }}
                        >
                            Recipient Address
                        </label>
                        <InputWithButton className="input-with-button">
                            <div style={{ flex: 1 }}>
                                <Input
                                    id="send-recipient-input"
                                    className="send-recipient-input text-3"
                                    type="text"
                                    value={recipient}
                                    onChange={(e) =>
                                        handleRecipientChange(e.target.value)
                                    }
                                    onPaste={handleInputPaste}
                                    placeholder={`Enter ${getTokenDisplayName()} address or paste QR code image`}
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
                                    id="send-qr-scan-button"
                                    variant="secondary"
                                    onClick={() => setShowQRScanner(true)}
                                    style={{
                                        aspectRatio: "1/1",
                                        width: "44px",
                                        alignSelf: "flex-end",
                                        minWidth: "auto",
                                    }}
                                >
                                    <QRIcon color="currentColor" />
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
                        <TextSecondaryBlock
                            style={{
                                marginTop: "4px",
                                fontSize: "12px",
                            }}
                        >
                            Tip: Copy a QR code image and paste it directly in
                            the field or click the Paste button
                        </TextSecondaryBlock>
                    </RecipientAddressFormGroup>

                    <InputWithButton
                        className="input-with-button"
                        style={{ marginBottom: "36px" }}
                    >
                        <Input
                            id="send-amount-input"
                            className="send-amount-input text-3"
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
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Enter amount"
                            step="0.00000001"
                            min="0"
                            max={balance}
                            copyable
                            CustomCopyIcon={ContentPasteIcon}
                        />
                        <Button
                            id="send-max-amount-button"
                            variant="secondary"
                            onClick={maxAmount}
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

                    <ActionButtons>
                        <Button
                            id="send-transaction-button"
                            onClick={handleSendClick}
                            loading={isLoading}
                            disabled={
                                !recipient ||
                                !amount ||
                                !!validationError ||
                                !!addressError
                            }
                            style={{ minWidth: "150px", height: "44px" }}
                        >
                            <h3>Send</h3>
                            <VectorIcon />
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            style={{ minWidth: "150px", height: "44px" }}
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
                </CardContent>
            </Card>

            {/* QR Scanner Modal */}
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
                            <Video ref={videoRef} />
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

            {/* Transaction Confirmation Modal */}
            <TransactionConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSend}
                amount={amount}
                recipient={recipient}
                senderAddress={selectedAccount?.address || ""}
                senderName={selectedAccount?.name || ""}
                estimatedFee={estimatedFee}
                loading={isLoading}
                needsPassword
            />
        </SendContainer>
    );
};
