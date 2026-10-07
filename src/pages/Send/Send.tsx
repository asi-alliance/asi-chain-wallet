import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import QrScanner from "qr-scanner";
import { Address, DeployStatus, GasFee } from "@asichain/asi-wallet-sdk";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    deployWatchCleared,
    selectDeployWatch,
    selectSelectedAccount,
    selectSelectedNetworkId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { sendTransaction } from "store/WalletsStore/thunks";
import {
    networkOperationFinished,
    networkOperationStarted,
} from "store/networkOperationSlice";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    PasswordModal,
    TransactionConfirmationModal,
} from "components";
import { AccountBalance } from "components/AccountBalance";
import { AccountSelector } from "components/AccountSelector";
import { AccountSelectorLabelMods } from "components/AccountSelector/AccountSelector";
import {
    ContentPasteIcon,
    HistoryIcon,
    QRIcon,
    VectorIcon,
} from "components/Icons";
import { ModalWindow } from "components/ModalWindow";
import { useWalletSessionAction } from "hooks";
import { getGasFeeRangeLabel } from "../../constants/gas";
import { ACCOUNT_DATA_POLLING_INTERVAL_MS } from "constants/polling";
import {
    getAmountValidationError,
    getMaxSendableAmount,
    isPositiveTokenAmount,
} from "utils/balanceUtils";
import addressValidation from "utils/AddressValidation";

const BALANCE_UNAVAILABLE_ERROR =
    "Failed to load balance for the selected network. Sending is unavailable.";
const TRANSACTION_UNRESOLVED_TITLE =
    "Transaction status is unknown. It may still complete on chain. Check transaction history later.";
const NETWORK_CHANGED_ERROR =
    "Network changed while the transfer was awaiting confirmation. Check the details and send again.";

const validateRecipientAddress = (
    value: string,
    sourceAddress?: string,
): string => {
    const normalized = value.trim();

    if (!normalized) return "Recipient address is required";
    if (normalized.toLowerCase().startsWith("0x")) {
        return "This address belongs to another network. Enter an ASI Chain address.";
    }

    const result = addressValidation(normalized);
    if (!result.isValid) {
        return `Invalid recipient address: ${result.validationMessages.join(", ")}`;
    }
    if (
        sourceAddress &&
        normalized.toLowerCase() === sourceAddress.toLowerCase()
    ) {
        return "Cannot send to the same address (self-transfer is not allowed).";
    }

    return "";
};

interface ITransferDetails {
    walletId: string;
    accountId: string;
    accountName: string;
    accountAddress: string;
    networkId: string;
    to: Address;
    amount: string;
}

const SendContainer = styled.div`
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
`;

const SendCard = styled(Card)`
    padding-bottom: ${({ theme }) => theme.spacing["4xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding-bottom: ${({ theme }) => theme.spacing["3xl"]};
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing["3xl"]};
`;

const SourceSection = styled.section`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing["5xl"]};
`;

const BalanceArea = styled.div`
    display: flex;
    justify-content: center;
`;

const FieldRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: ${({ theme }) => theme.spacing.md};
`;

const FieldAction = styled(Button)`
    width: 44px;
    min-width: 44px;
    margin-top: 24px;
    padding: 0;
`;

const IconFieldAction = styled(Button)`
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    margin-top: 24px;
`;

const PasteFieldAction = styled(Button)`
    width: 28px;
    min-width: 28px;
    height: 28px;
    min-height: 28px;
    padding: 0;
`;

const FormError = styled.div`
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => theme.danger};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => `${theme.danger}12`};
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const Actions = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};

    > button:nth-child(-n + 2) {
        width: 100%;
        min-width: 0;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        > button:nth-child(-n + 2) {
            padding-inline: 4px;
            font-size: ${({ theme }) => theme.typography.size.sm};
        }
    }
`;

const StatusBanner = styled.section<{
    $tone: "pending" | "success" | "warning";
}>`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid
        ${({ theme, $tone }) =>
            $tone === "success"
                ? theme.primary
                : $tone === "warning"
                  ? theme.warning
                  : theme.secondary};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme, $tone }) =>
        $tone === "success"
            ? theme.primarySubtle
            : $tone === "warning"
              ? `${theme.warning}12`
              : `${theme.secondary}12`};
`;

const StatusHeading = styled.h2`
    margin: 0 0 ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.text.primary};
    font-size: ${({ theme }) => theme.typography.size.lg};
    line-height: ${({ theme }) => theme.typography.lineHeight.lg};
`;

const StatusText = styled.p`
    margin: 0 0 ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const HashValue = styled.div`
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    overflow-wrap: anywhere;
`;

const StatusActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.md};
    margin-top: ${({ theme }) => theme.spacing.md};
`;

const VideoContainer = styled.div`
    width: 100%;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.control.fieldBackground};
`;

const Video = styled.video`
    display: block;
    width: 100%;
    height: auto;
`;

const ScannerHelp = styled.p`
    margin: ${({ theme }) => theme.spacing.xl} 0 0;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.sm};
    text-align: center;
`;

export const Send: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedAccount = useSelector(selectSelectedAccount);
    const selectedWallet = useSelector((state: RootState) =>
        selectedAccount
            ? selectWalletByAccountId(state, selectedAccount.id)
            : null,
    );
    const networkId = useSelector(selectSelectedNetworkId);
    const {
        currentData: currentBalance,
        isFetching,
        isError: isBalanceError,
        refetch: refetchBalance,
    } = useGetBalanceQuery(
        selectedAccount
            ? { accountId: selectedAccount.id, networkId }
            : skipToken,
        { pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS },
    );

    const balance = currentBalance ?? "0";
    const isBalanceReady = currentBalance !== undefined && !isBalanceError;
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [txHash, setTxHash] = useState("");
    const [validationError, setValidationError] = useState("");
    const [maxError, setMaxError] = useState("");
    const [amountPasteError, setAmountPasteError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [scanError, setScanError] = useState("");
    const [cameraError, setCameraError] = useState("");
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingTransfer, setPendingTransfer] =
        useState<ITransferDetails | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const confirmationInFlightRef = useRef(false);
    const pasteGenerationRef = useRef(0);
    const amountPasteGenerationRef = useRef(0);
    const scannerGenerationRef = useRef(0);

    const deployWatch = useSelector((state: RootState) =>
        txHash ? selectDeployWatch(state, txHash) : null,
    );
    const isTransactionConfirmed =
        deployWatch?.status === DeployStatus.FINALIZED;
    const unresolvedReason = deployWatch?.unresolvedReason ?? "";
    const isWaitingForConfirmation =
        !!txHash && !isTransactionConfirmed && !unresolvedReason;
    const walletId = selectedWallet?.id;

    const clearDeployWatch = (): void => {
        if (txHash) {
            dispatch(deployWatchCleared(txHash));
        }
        setTxHash("");
        setCopied(false);
        setCopyError("");
    };

    const sendAction = useWalletSessionAction({
        walletId,
        action: (password?: string) => {
            if (!pendingTransfer) {
                throw new Error("Transfer details are missing. Please retry.");
            }
            if (pendingTransfer.networkId !== networkId) {
                throw new Error(NETWORK_CHANGED_ERROR);
            }

            clearDeployWatch();
            return dispatch(
                sendTransaction({
                    walletId: pendingTransfer.walletId,
                    accountId: pendingTransfer.accountId,
                    to: pendingTransfer.to,
                    amount: pendingTransfer.amount,
                    password,
                }),
            ).unwrap();
        },
        onSuccess: ({ deployId }) => {
            pasteGenerationRef.current += 1;
            amountPasteGenerationRef.current += 1;
            setPendingTransfer(null);
            setTxHash(deployId);
            setRecipient("");
            setAmount("");
            setValidationError("");
            setAddressError("");
            setScanError("");
        },
        onError: (message: string) => {
            setPendingTransfer(null);
            setValidationError(message);
        },
        errorFallback: "Failed to send transaction",
    });

    const isSending = sendAction.isRunning;
    const isFormFrozen = !!pendingTransfer || isSending;
    const amountError = isBalanceReady
        ? getAmountValidationError(amount, balance, GasFee.MAX, true)
        : "";
    const balanceError = isBalanceError ? BALANCE_UNAVAILABLE_ERROR : "";

    useLayoutEffect(() => {
        if (!pendingTransfer) return;

        dispatch(networkOperationStarted());
        return () => {
            dispatch(networkOperationFinished());
        };
    }, [dispatch, pendingTransfer]);

    useLayoutEffect(() => {
        if (!pendingTransfer) return;

        const historyIndex = window.history.state?.idx;
        let restoringHistory = false;

        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = "";
        };
        const handlePopState = (event: PopStateEvent): void => {
            if (restoringHistory) {
                restoringHistory = false;
                return;
            }

            event.stopImmediatePropagation();
            const nextIndex = event.state?.idx;
            const delta =
                typeof historyIndex === "number" &&
                typeof nextIndex === "number"
                    ? historyIndex - nextIndex
                    : 1;

            restoringHistory = true;
            window.history.go(delta || 1);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState, true);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState, true);
        };
    }, [pendingTransfer]);

    useEffect(() => {
        if (!recipient.trim() || !selectedAccount?.address) {
            setAddressError("");
            return;
        }

        setAddressError(
            validateRecipientAddress(recipient, selectedAccount.address),
        );
    }, [recipient, selectedAccount?.address]);

    useEffect(() => {
        if (!showQRScanner || !videoRef.current) return;

        const scannerGeneration = ++scannerGenerationRef.current;
        const scanner = new QrScanner(
            videoRef.current,
            (result) => {
                if (scannerGeneration !== scannerGenerationRef.current) return;

                pasteGenerationRef.current += 1;
                setRecipient(result.data);
                setAddressError(
                    validateRecipientAddress(
                        result.data,
                        selectedAccount?.address,
                    ),
                );
                setValidationError("");
                setScanError("");
                setCameraError("");
                setShowQRScanner(false);
            },
            {
                returnDetailedScanResult: true,
                highlightScanRegion: true,
                highlightCodeOutline: true,
            },
        );
        let scannerDestroyed = false;
        const destroyScanner = (): void => {
            if (scannerDestroyed) return;

            scannerDestroyed = true;
            scanner.stop();
            scanner.destroy();
            if (scannerGenerationRef.current === scannerGeneration) {
                scannerGenerationRef.current += 1;
            }
            if (qrScannerRef.current === scanner) {
                qrScannerRef.current = null;
            }
        };

        qrScannerRef.current = scanner;
        scanner.start().catch(() => {
            if (scannerGeneration !== scannerGenerationRef.current) return;

            destroyScanner();
            setCameraError(
                "Failed to access camera. Check camera permissions and try again.",
            );
        });

        return destroyScanner;
    }, [selectedAccount?.address, showQRScanner]);

    if (!selectedAccount) {
        return (
            <SendContainer>
                <Card>
                    <CardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select account
                        </Button>
                    </CardContent>
                </Card>
            </SendContainer>
        );
    }

    const handleRecipientChange = (value: string): void => {
        pasteGenerationRef.current += 1;
        setRecipient(value);
        setValidationError("");
        setScanError("");
        setAddressError(
            value.trim()
                ? validateRecipientAddress(value, selectedAccount.address)
                : "",
        );
    };

    const validateForm = (): boolean => {
        const recipientError = validateRecipientAddress(
            recipient,
            selectedAccount.address,
        );
        if (recipientError) {
            setAddressError(recipientError);
            return false;
        }
        if (!amount.trim()) {
            setValidationError("Amount is required");
            return false;
        }
        if (!isBalanceReady) {
            setValidationError(
                isBalanceError
                    ? BALANCE_UNAVAILABLE_ERROR
                    : "Balance is still loading. Please wait and try again.",
            );
            return false;
        }
        if (amountError) {
            setValidationError("");
            return false;
        }
        return true;
    };

    const handleSend = (): void => {
        if (isSending || confirmationInFlightRef.current || !validateForm()) {
            return;
        }
        if (!walletId) {
            setValidationError("Session expired. Please log in again.");
            navigate("/login");
            return;
        }

        pasteGenerationRef.current += 1;
        amountPasteGenerationRef.current += 1;
        setScanError("");
        dispatch(networkOperationStarted());
        setPendingTransfer({
            walletId,
            accountId: selectedAccount.id,
            accountName: selectedAccount.name,
            accountAddress: selectedAccount.address,
            networkId,
            to: recipient.trim() as Address,
            amount: amount.trim(),
        });
        setValidationError("");
        setShowConfirmation(true);
    };

    const handleConfirmSend = (): void => {
        if (isSending || confirmationInFlightRef.current) return;

        confirmationInFlightRef.current = true;
        setShowConfirmation(false);
        void sendAction.run().finally(() => {
            confirmationInFlightRef.current = false;
        });
    };

    const handleCancelTransfer = (): void => {
        if (isSending) return;
        setShowConfirmation(false);
        sendAction.passwordPrompt.onClose();
        setPendingTransfer(null);
        setScanError("");
    };

    const handleMax = (): void => {
        amountPasteGenerationRef.current += 1;
        const max = getMaxSendableAmount(balance);
        if (!isPositiveTokenAmount(max)) {
            setAmount("");
            setMaxError("Insufficient balance to cover the estimated fee.");
            setAmountPasteError("");
            setValidationError("");
            return;
        }

        setAmount(max);
        setMaxError("");
        setAmountPasteError("");
        setValidationError("");
    };

    const handleClear = (): void => {
        if (isSending) return;
        pasteGenerationRef.current += 1;
        amountPasteGenerationRef.current += 1;
        setRecipient("");
        setAmount("");
        setValidationError("");
        setMaxError("");
        setAmountPasteError("");
        setAddressError("");
        setScanError("");
        setCameraError("");
        clearDeployWatch();
        handleCancelTransfer();
    };

    const handlePaste = async (
        event: React.ClipboardEvent<HTMLInputElement>,
    ): Promise<void> => {
        if (event.clipboardData?.getData?.("text/plain")?.trim()) {
            return;
        }

        const imageItem = Array.from(event.clipboardData?.items ?? []).find(
            (item) => item.type.startsWith("image/"),
        );
        const image = imageItem?.getAsFile();
        if (!image) return;

        event.preventDefault();
        const pasteGeneration = ++pasteGenerationRef.current;
        try {
            const result = await QrScanner.scanImage(image, {
                returnDetailedScanResult: true,
            });
            if (pasteGeneration !== pasteGenerationRef.current) return;
            handleRecipientChange(result.data);
        } catch {
            if (pasteGeneration !== pasteGenerationRef.current) return;
            setScanError("No QR code was found in the pasted image.");
        }
    };

    const pasteRecipientFromClipboard = async (): Promise<void> => {
        const generation = ++pasteGenerationRef.current;
        setScanError("");

        try {
            let text = "";
            try {
                text = await navigator.clipboard.readText();
            } catch {
                // An image-only clipboard may not provide text.
            }
            if (generation !== pasteGenerationRef.current) return;
            if (text.trim()) {
                handleRecipientChange(text.trim());
                return;
            }

            const items = await navigator.clipboard.read?.();
            if (generation !== pasteGenerationRef.current) return;
            const imageItem = items?.find((item) =>
                item.types.some((type) => type.startsWith("image/")),
            );
            const imageType = imageItem?.types.find((type) =>
                type.startsWith("image/"),
            );
            if (!imageItem || !imageType) {
                setScanError(
                    "Clipboard does not contain an address or QR image.",
                );
                return;
            }

            const blob = await imageItem.getType(imageType);
            const result = await QrScanner.scanImage(
                new File([blob], "clipboard-qr", { type: imageType }),
                { returnDetailedScanResult: true },
            );
            if (generation !== pasteGenerationRef.current) return;
            handleRecipientChange(result.data);
        } catch {
            if (generation !== pasteGenerationRef.current) return;
            setScanError(
                "Could not paste an address or scan a QR image from the clipboard.",
            );
        }
    };

    const pasteAmountFromClipboard = async (): Promise<void> => {
        const generation = ++amountPasteGenerationRef.current;
        setAmountPasteError("");

        try {
            const text = await navigator.clipboard.readText();
            if (generation !== amountPasteGenerationRef.current) return;
            if (!text.trim()) {
                setAmountPasteError("Clipboard does not contain an amount.");
                return;
            }
            setAmount(text.trim());
            setMaxError("");
            setValidationError("");
        } catch {
            if (generation !== amountPasteGenerationRef.current) return;
            setAmountPasteError("Could not paste the amount from the clipboard.");
        }
    };

    const copyHash = async (): Promise<void> => {
        setCopyError("");

        try {
            await navigator.clipboard.writeText(txHash);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopyError("Could not copy the transaction hash.");
        }
    };

    const statusTone = isTransactionConfirmed
        ? "success"
        : unresolvedReason
          ? "warning"
          : "pending";
    const statusTitle = isTransactionConfirmed
        ? "Transaction completed"
        : unresolvedReason
          ? "Confirmation unavailable"
          : "Transaction pending";

    return (
        <SendContainer>
            <SendCard>
                <CardHeader>
                    <CardTitle>Send ASI</CardTitle>
                </CardHeader>
                <CardContent>
                    {txHash && (
                        <StatusBanner
                            $tone={statusTone}
                            role={unresolvedReason ? "alert" : "status"}
                            aria-live="polite"
                        >
                            <StatusHeading>{statusTitle}</StatusHeading>
                            <StatusText>
                                {isTransactionConfirmed
                                    ? "The transfer was finalized on chain. Balance and transaction history are being refreshed."
                                    : unresolvedReason
                                      ? TRANSACTION_UNRESOLVED_TITLE
                                      : "The transfer was submitted and is waiting for on-chain finalization."}
                            </StatusText>
                            <HashValue>Deploy ID: {txHash}</HashValue>
                            {unresolvedReason && (
                                <StatusText>{unresolvedReason}</StatusText>
                            )}
                            {copyError && (
                                <FormError role="alert">
                                    {copyError}
                                </FormError>
                            )}
                            <StatusActions>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    onClick={() => void copyHash()}
                                    aria-label="Copy transaction hash"
                                >
                                    {copied ? "Hash copied" : "Copy hash"}
                                </Button>
                            </StatusActions>
                        </StatusBanner>
                    )}
                    <Form
                        noValidate
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSend();
                        }}
                    >
                        {validationError && (
                            <FormError role="alert">
                                {validationError}
                            </FormError>
                        )}
                        {balanceError && (
                            <FormError role="alert">
                                {balanceError}
                            </FormError>
                        )}

                        <SourceSection aria-label="Source account">
                            <AccountSelector
                                fullWidth
                                label="Account"
                                labelMode={AccountSelectorLabelMods.FULL}
                                disabled={isFormFrozen}
                            />
                            <BalanceArea>
                                <AccountBalance
                                    balance={
                                        isBalanceError
                                            ? undefined
                                            : currentBalance
                                    }
                                    loading={isFetching}
                                    onRefresh={() => void refetchBalance()}
                                    refreshButtonId={`refresh-balance-account-${selectedAccount.id}`}
                                    refreshAriaLabel={`Refresh balance, ${selectedAccount.name}`}
                                    compactLabel
                                    style={{ marginBottom: 0 }}
                                />
                            </BalanceArea>
                        </SourceSection>

                        <FieldRow>
                            <Input
                                id="send-recipient-input"
                                label="Recipient Address"
                                type="text"
                                value={recipient}
                                onChange={(event) =>
                                    handleRecipientChange(
                                        event.target.value,
                                    )
                                }
                                onPaste={(event) => void handlePaste(event)}
                  placeholder="Enter ASI address or paste QR code image"
                                error={addressError}
                                helperText="Tip: Copy a QR code image and paste it directly in the field or click the Paste button."
                                endAdornment={
                                    <PasteFieldAction
                                        type="button"
                                        variant="icon-button-ghost"
                                        size="small"
                                        title="Paste recipient address or QR image"
                                        aria-label="Paste recipient address or QR image"
                                        onClick={() => void pasteRecipientFromClipboard()}
                                        disabled={isFormFrozen}
                                    >
                                        <ContentPasteIcon color="currentColor" />
                                    </PasteFieldAction>
                                }
                                autoComplete="off"
                                spellCheck={false}
                                disabled={isFormFrozen}
                                wrapperStyle={{ marginBottom: 0 }}
                            />
                            <IconFieldAction
                                type="button"
                                variant="icon-button"
                                aria-label="Scan recipient QR code"
                                title="Scan recipient QR code"
                                onClick={() => {
                                    setScanError("");
                                    setCameraError("");
                                    setShowQRScanner(true);
                                }}
                                disabled={isFormFrozen}
                            >
                                <QRIcon color="currentColor" />
                            </IconFieldAction>
                        </FieldRow>
                        {scanError && (
                            <FormError role="alert">{scanError}</FormError>
                        )}

                        <FieldRow>
                            <Input
                                id="send-amount-input"
                                label="Amount"
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(event) => {
                                    amountPasteGenerationRef.current += 1;
                                    setAmount(event.target.value);
                                    setValidationError("");
                                    setMaxError("");
                                    setAmountPasteError("");
                                }}
                                placeholder="Enter Amount"
                                error={
                                    amountError || maxError || amountPasteError
                                }
                                endAdornment={
                                    <PasteFieldAction
                                        type="button"
                                        variant="icon-button-ghost"
                                        size="small"
                                        title="Paste amount"
                                        aria-label="Paste amount"
                                        onClick={() => void pasteAmountFromClipboard()}
                                        disabled={isFormFrozen}
                                    >
                                        <ContentPasteIcon color="currentColor" />
                                    </PasteFieldAction>
                                }
                                autoComplete="off"
                                disabled={isFormFrozen}
                                wrapperStyle={{ marginBottom: 0 }}
                            />
                            <FieldAction
                                id="send-max-amount-button"
                                type="button"
                                variant="secondary"
                                onClick={handleMax}
                                disabled={
                                    !isBalanceReady ||
                                    isFormFrozen
                                }
                            >
                                Max
                            </FieldAction>
                        </FieldRow>

                        <Actions>
                            <Button
                                id="send-transaction-button"
                                type="submit"
                                loading={isSending}
                                disabled={
                                    isFormFrozen ||
                                    isWaitingForConfirmation ||
                                    !recipient.trim() ||
                                    !amount.trim() ||
                                    !!addressError ||
                                    !!amountError ||
                                    !!maxError ||
                                    !!amountPasteError ||
                                    !isBalanceReady
                                }
                            >
                                Send <VectorIcon />
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClear}
                                disabled={isFormFrozen}
                            >
                                Clear all
                            </Button>
                            <Button
                                id="history-button"
                                type="button"
                                variant="icon-button"
                                aria-label="View transaction history"
                                title="View transaction history"
                                onClick={() => navigate("/history")}
                                disabled={isFormFrozen}
                            >
                                <HistoryIcon />
                            </Button>
                        </Actions>
                    </Form>
                </CardContent>
            </SendCard>

            <ModalWindow
                isOpen={showQRScanner}
                onClose={() => {
                    setShowQRScanner(false);
                    setCameraError("");
                }}
                title="Scan recipient QR code"
                maxWidth="500px"
            >
                {cameraError ? (
                    <FormError role="alert">{cameraError}</FormError>
                ) : (
                    <VideoContainer>
                        <Video ref={videoRef} />
                    </VideoContainer>
                )}
                <ScannerHelp>
                    Position the recipient QR code inside the camera frame.
                </ScannerHelp>
            </ModalWindow>

            <TransactionConfirmationModal
                isOpen={showConfirmation}
                onClose={handleCancelTransfer}
                onConfirm={handleConfirmSend}
                amount={pendingTransfer?.amount ?? ""}
                recipient={pendingTransfer?.to ?? ""}
                senderAddress={pendingTransfer?.accountAddress ?? ""}
                senderName={pendingTransfer?.accountName ?? ""}
                maxFee={GasFee.MAX}
                feeLabel={getGasFeeRangeLabel()}
                loading={isSending}
            />

            <PasswordModal
                {...sendAction.passwordPrompt}
                onClose={handleCancelTransfer}
                title="Enter password to sign transaction"
                description="Your wallet session has expired. Enter your password to sign and send this transaction."
            />
        </SendContainer>
    );
};
