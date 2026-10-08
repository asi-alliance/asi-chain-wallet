import React, { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AppDispatch, RootState } from "store";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    PasswordModal,
    TransactionConfirmationModal,
} from "components";
import { Select } from "components/Select";
import { ISelectOption } from "components/Select/Select";
import {
    ContentPasteIcon,
    ExploreIcon,
    HistoryIcon,
    ReceiveIcon,
} from "components/Icons";
import {
    ASI_BRIDGE_URI,
    BridgeChainKey,
    bridgeChainForKey,
    defaultDestinationFor,
    DESTINATION_CHAIN_KEYS,
} from "constants/bridgeChains";
import { formatToken } from "utils/tokenFormat";
import { useCardanoWallet } from "hooks/useCardanoWallet";
import { useEvmBridge } from "hooks/useEvmBridge";
import { useCosmosWallet } from "hooks/useCosmosWallet";
import { buildCardanoLockTx } from "utils/cardanoTx";
import { useCopyToClipboard, useWalletSessionAction } from "hooks";
import { selectActiveWallet, selectSelectedAccount } from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { skipToken } from "@reduxjs/toolkit/query";
import { IWalletSessionContext, WalletKind } from "types/bridgeWalletSession";
import {
    ASIWalletSection,
    BridgeWalletSelector,
} from "components/BridgeWalletSelector";
import { bridgeLock } from "store/WalletsStore/thunks";
import {
    networkOperationFinished,
    networkOperationStarted,
} from "store/networkOperationSlice";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";
import { ASI_DECIMALS, fromAtomicAmount } from "@asichain/asi-wallet-sdk";
import { BRIDGE_LOCK_MAX_GAS_COST } from "services/rchain";
import {
    getAmountValidationError,
    getMaxSendableAmount,
    isPositiveTokenAmount,
} from "utils/balanceUtils";
import { SdkWalletService } from "sdk";
import { getTokenDisplayName } from "constants/token";

const BALANCE_UNAVAILABLE_ERROR =
    "Failed to load balance for the selected network. Locking is unavailable.";

const BALANCE_LOADING_ERROR =
    "Balance is still loading. Please wait and try again.";

const INVALID_AMOUNT_FORMAT_ERROR =
    "Invalid amount format. Enter a plain number, for example 0.01";

const NETWORK_CHANGED_ERROR =
    "Network changed while the lock was awaiting confirmation. Check the details and try again.";

const LOCK_DETAILS_MISSING_ERROR = "Lock details are missing. Please retry.";

const EVM_EXPLORER_URLS: Partial<Record<BridgeChainKey, string>> = {
    sepolia: sepolia.blockExplorers.default.url,
    baseSepolia: baseSepolia.blockExplorers.default.url,
};

interface IPendingBridgeLock {
    walletId: string;
    accountId: string;
    accountName: string;
    accountAddress: string;
    networkId: string;
    recipient: string;
    amount: string;
    destChainId: number;
    bridgeUri: string;
}

const parseAtomicAmount = (value: string): bigint | null => {
    try {
        return SdkWalletService.toAtomicAmount(value);
    } catch {
        return null;
    }
};

const BridgeContainer = styled.div`
    width: 100%;
    max-width: 946px;
    margin: 0 auto;
`;

const BridgeCard = styled(Card)`
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: ${({ theme }) => theme.spacing.xl};
    }
`;

const BridgeCardContent = styled(CardContent)`
    display: grid;
    gap: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        gap: ${({ theme }) => theme.spacing.xl};
    }
`;

const RouteGrid = styled.div`
    display: grid;
    grid-template-columns:
        minmax(0, 1fr) ${({ theme }) => theme.sizes.control.field}
        minmax(0, 1fr);
    align-items: end;
    gap: ${({ theme }) => theme.spacing.xl};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: minmax(0, 1fr);
        gap: ${({ theme }) => theme.spacing.md};
    }
`;

const AmountRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 60px;
    gap: ${({ theme }) => theme.spacing.md};
    align-items: start;
`;

const MaxButton = styled(Button)`
    width: 60px;
    min-width: 0;
    height: ${({ theme }) => theme.sizes.control.field};
    margin-top: ${({ theme }) => theme.spacing["3xl"]};
    padding: 0;
    font-size: ${({ theme }) => theme.typography.size.sm};
`;

const RecipientRow = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing.md};
    align-items: end;

    > :first-child {
        flex: 1;
        min-width: 0;
    }
`;

const ExplorerLink = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${({ theme }) => theme.sizes.control.field};
    height: ${({ theme }) => theme.sizes.control.field};
    border: 1px solid ${({ theme }) => theme.primary};
    border-radius: ${({ theme }) => theme.radii.md};
    color: ${({ theme }) => theme.actionText};

    &:hover[href] {
        background: ${({ theme }) => theme.primarySubtle};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 2px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.md};
    justify-content: flex-start;
    align-items: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;

        > :first-child {
            grid-column: 1 / -1;
        }
    }
`;

const LockButton = styled(Button)`
    min-width: 220px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const ClearAllButton = styled(Button)`
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        width: 100%;
    }
`;

const ErrorMessage = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme }) => theme.danger};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.background.tertiary};
    color: ${({ theme }) => theme.dangerText};
    overflow-wrap: anywhere;
`;

const SuccessMessage = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme }) => theme.primary};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.primarySubtle};
    color: ${({ theme }) => theme.text.primary};

    strong {
        color: ${({ theme }) => theme.actionText};
    }

    code {
        display: block;
        margin-top: ${({ theme }) => theme.spacing.md};
        overflow-wrap: anywhere;
    }
`;

const LoadingMessage = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme }) => theme.primary};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.primarySubtle};
    color: ${({ theme }) => theme.actionText};

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

    @media (prefers-reduced-motion: reduce) {
        .spinner {
            animation: none;
        }
    }
`;

const ChainField = styled.div`
    min-width: 0;
`;

const ChainFieldLabel = styled.span`
    display: block;
    margin-bottom: ${({ theme }) => theme.control.labelGap};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    color: ${({ theme }) => theme.text.primary};
`;

const StaticChainValue = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    height: ${({ theme }) => theme.sizes.control.field};
    padding: ${({ theme }) => theme.control.fieldPadding};
    border: ${({ theme }) =>
        `${theme.control.borderWidth} solid ${theme.control.fieldBorder}`};
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ theme }) => theme.control.fieldBackground};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ChainArrow = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${({ theme }) => theme.sizes.control.field};
    color: ${({ theme }) => theme.actionText};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        height: ${({ theme }) => theme.spacing["3xl"]};

        > svg {
            transform: rotate(90deg);
        }
    }
`;

export const Bridge: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const activeWallet: IUnlockedWalletMeta | null =
        useSelector(selectActiveWallet);
    const selectedAccount: IUnlockedAccountMeta | null = useSelector(
        selectSelectedAccount,
    );
    const selectedNetwork = useSelector(
        (state: RootState) => state.walletsStore.selectedNetwork,
    );

    const cardano = useCardanoWallet();

    const {
        currentData: currentASIAccountBalance,
        isFetching: isBalanceFetching,
        isError: isBalanceError,
    } = useGetBalanceQuery(
        selectedAccount
            ? { accountId: selectedAccount.id, networkId: selectedNetwork.id }
            : skipToken,
    );

    const selectedASIAccountBalance = currentASIAccountBalance ?? "0";
    const isBalanceReady =
        currentASIAccountBalance !== undefined && !isBalanceError;

    const [amount, setAmount] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const txHashClipboard = useCopyToClipboard(1500);
    const [pendingLock, setPendingLock] = useState<IPendingBridgeLock | null>(
        null,
    );

    const srcChainKey: BridgeChainKey = "asi";
    const [dstChainKey, setDstChainKey] = useState<BridgeChainKey>(() =>
        defaultDestinationFor(srcChainKey),
    );

    const [txHash, setTxHash] = useState("");
    const [lockError, setLockError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const srcChain = bridgeChainForKey(srcChainKey);
    const dstChain = bridgeChainForKey(dstChainKey);
    const srcKind = srcChain.kind;

    const evm = useEvmBridge(srcChain, false);
    const evmDestination = useEvmBridge(dstChain, true);
    const cosmos = useCosmosWallet();

    const asiSession: IWalletSessionContext["asi"] = {
        account: selectedAccount,
    };

    const sourceWalletSessionContext: IWalletSessionContext = {
        asi: asiSession,
        cardano: cardano.session,
        cosmos: cosmos.session,
        evm: evm.session,
    };

    const destinationWalletSessionContext: IWalletSessionContext = {
        asi: asiSession,
        cardano: cardano.session,
        cosmos: cosmos.session,
        evm: evmDestination.session,
    };

    const sourceWallet = sourceWalletSessionContext[srcKind];
    const destinationWallet = destinationWalletSessionContext[dstChain.kind];

    const hasWalletAccount = (
        wallet: IWalletSessionContext[WalletKind],
    ): boolean => {
        return Boolean(wallet.account?.address);
    };

    const sourceAccountLoaded = hasWalletAccount(sourceWallet);
    const destinationAccountLoaded = hasWalletAccount(destinationWallet);
    const destinationNeedsConnection =
        "connected" in destinationWallet && !destinationWallet.connected;

    const asiLock = useWalletSessionAction({
        walletId: activeWallet?.id,
        action: (password?: string) => {
            if (!pendingLock) {
                throw new Error(LOCK_DETAILS_MISSING_ERROR);
            }

            if (pendingLock.networkId !== selectedNetwork.id) {
                throw new Error(NETWORK_CHANGED_ERROR);
            }

            return dispatch(
                bridgeLock({
                    walletId: pendingLock.walletId,
                    accountId: pendingLock.accountId,
                    recipient: pendingLock.recipient,
                    amount: pendingLock.amount,
                    destChainId: pendingLock.destChainId,
                    bridgeUri: pendingLock.bridgeUri,
                    password,
                    network: selectedNetwork,
                }),
            ).unwrap();
        },
        onSuccess: ({ deployId }) => {
            setPendingLock(null);
            setTxHash(deployId);
            setAmount("");
        },
        onError: (message: string) => {
            setPendingLock(null);
            setLockError(message);
        },
        errorFallback: "Failed to lock tokens",
    });

    useEffect(() => {
        if (!pendingLock) {
            return;
        }

        dispatch(networkOperationStarted());

        return () => {
            dispatch(networkOperationFinished());
        };
    }, [dispatch, pendingLock]);

    const parsedAmount: bigint | null = amount.trim()
        ? parseAtomicAmount(amount)
        : BigInt(0);
    const atomicAmount: bigint = parsedAmount ?? BigInt(0);

    const needsEvmApproval =
        srcKind === "evm" &&
        evm.allowance !== undefined &&
        atomicAmount > BigInt(0) &&
        evm.allowance < atomicAmount;

    const busy =
        srcKind === "evm"
            ? evm.isPending ||
              evm.isConfirming ||
              (evm.isSuccess && evm.lastAction === "approve")
            : isLoading || asiLock.isRunning;
    const isEvmLockSuccess =
        srcKind === "evm" &&
        evm.isSuccess &&
        evm.lastAction === "lock" &&
        !!evm.txHash;
    const shownTxHash = isEvmLockSuccess
        ? (evm.txHash as string)
        : srcKind === "evm"
          ? ""
          : txHash;

    const getAmountError = (): string => {
        if (!isBalanceReady) {
            return "";
        }

        const validationError = getAmountValidationError(
            amount,
            selectedASIAccountBalance,
            BRIDGE_LOCK_MAX_GAS_COST,
            true,
        );

        return (
            validationError ||
            (parsedAmount === null ? INVALID_AMOUNT_FORMAT_ERROR : "")
        );
    };

    const amountError = getAmountError();
    const balanceLoadingStatus =
        !isBalanceReady && !isBalanceError ? BALANCE_LOADING_ERROR : "";
    const balanceError = isBalanceError ? BALANCE_UNAVAILABLE_ERROR : "";
    const shownError =
        (srcKind === "evm" ? evm.error?.message : lockError) ||
        balanceError ||
        "";

    useEffect(() => {
        if (srcKind !== "evm" || !evm.isSuccess || !evm.lastAction) {
            return;
        }

        if (evm.lastAction === "approve") {
            const approveTxHash = evm.txHash;
            let cancelled = false;

            void (async () => {
                try {
                    await evm.refetch();
                } finally {
                    if (!cancelled) {
                        evm.resetIfCurrent(approveTxHash);
                    }
                }
            })();

            return () => {
                cancelled = true;
            };
        }

        if (evm.lastAction === "lock") {
            void evm.refetch();
            setAmount("");
        }
    }, [
        srcKind,
        evm.isSuccess,
        evm.lastAction,
        evm.txHash,
        evm.refetch,
        evm.resetIfCurrent,
    ]);

    const destinationOptions = useMemo<ISelectOption[]>(
        () =>
            DESTINATION_CHAIN_KEYS.filter((key) => key !== srcChainKey).map(
                (key) => {
                    const chain = bridgeChainForKey(key);
                    return { id: key, value: key, label: chain.label };
                },
            ),
        [srcChainKey],
    );

    const handleDestinationChange = (key: string): void => {
        const nextKey = key as BridgeChainKey;
        if (nextKey === srcChainKey) {
            return;
        }
        setDstChainKey(nextKey);
        setTxHash("");
        setLockError("");
        evm.reset();
    };

    const maxAmount = (): void => {
        if (srcKind === "asi") {
            const max = getMaxSendableAmount(
                selectedASIAccountBalance,
                BRIDGE_LOCK_MAX_GAS_COST,
            );

            if (!isPositiveTokenAmount(max)) {
                setAmount("");
                setLockError(
                    "Insufficient balance to cover the estimated fee.",
                );
                return;
            }

            setAmount(max);
            setLockError("");
        } else if (srcKind === "cardano") {
            setAmount(
                formatToken(
                    BigInt(cardano.balanceRaw || "0"),
                    srcChain.nativeDecimals,
                ),
            );
        } else if (srcKind === "evm") {
            setAmount(
                formatToken(
                    evm.tokenBalance ?? BigInt(0),
                    srcChain.nativeDecimals,
                ),
            );
        } else if (srcKind === "cosmos") {
            setAmount(
                formatToken(
                    BigInt(cosmos.balanceRaw || "0"),
                    srcChain.nativeDecimals,
                ),
            );
        }
    };

    const handleCancelLock = (): void => {
        setShowConfirmation(false);
        asiLock.passwordPrompt.onClose();
        setPendingLock(null);
    };

    const handleClearAll = (): void => {
        setAmount("");
        setTxHash("");

        setLockError("");
        handleCancelLock();
        evm.reset();
    };

    const handleEvmAction = (): void => {
        if (evm.wrongNetwork) {
            evm.switchToSource();
        } else if (needsEvmApproval) {
            evm.approve(atomicAmount);
        } else {
            evm.lock(
                atomicAmount,
                destinationWallet.account!.address,
                dstChain.routeId,
            );
        }
    };

    const handleCosmosLock = async (): Promise<void> => {
        setLockError("");
        setTxHash("");
        setIsLoading(true);
        try {
            const result = await cosmos.lock(
                atomicAmount,
                destinationWallet.account!.address,
                dstChain.routeId,
            );
            setTxHash(result.transactionHash);
            setAmount("");
        } catch (err: any) {
            setLockError(err?.message || String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAsiLock = (): void => {
        setShowConfirmation(false);
        setLockError("");
        setTxHash("");

        void asiLock.run();
    };

    const handleCardanoLock = async (): Promise<void> => {
        if (!cardano.api || !cardano.address) return;
        setLockError("");
        setTxHash("");
        setIsLoading(true);
        try {
            const build = await buildCardanoLockTx({
                wallet: cardano.api,
                chain: srcChain,
                senderAddress: cardano.address,
                recipient: destinationWallet.account!.address,
                amount: atomicAmount,
                destChainId: dstChain.routeId,
            });
            const signed = await cardano.api.signTx(
                build.unsignedTxCbor,
                false,
            );
            const submitted = await cardano.api.submitTx(signed);
            setTxHash(submitted || build.txHash);
            setAmount("");
        } catch (err: any) {
            setLockError(err?.message || String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLockClick = (): void => {
        if (srcKind === "asi") {
            const recipient = destinationWallet.account?.address;

            if (!activeWallet || !selectedAccount || !recipient) {
                setLockError("Wallet not opened. Please login again.");

                return;
            }

            setPendingLock({
                walletId: activeWallet.id,
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
                accountAddress: selectedAccount.address,
                networkId: selectedNetwork.id,
                recipient,
                amount,
                destChainId: dstChain.routeId,
                bridgeUri: srcChain.bridgeUri || ASI_BRIDGE_URI,
            });
            setShowConfirmation(true);
        } else if (srcKind === "cardano") {
            handleCardanoLock();
        } else if (srcKind === "evm") {
            handleEvmAction();
        } else if (srcKind === "cosmos") {
            handleCosmosLock();
        }
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        setLockError("");
    };

    const isAmountValid =
        amount.trim() !== "" && atomicAmount > BigInt(0) && !amountError;

    const lockDisabled =
        busy ||
        !isBalanceReady ||
        isBalanceFetching ||
        !sourceAccountLoaded ||
        !destinationAccountLoaded ||
        !isAmountValid;

    const assetSymbol = getTokenDisplayName();
    const recipientAddress = destinationWallet.account?.address ?? "";
    const explorerBaseUrl = EVM_EXPLORER_URLS[dstChainKey];
    const recipientExplorerUrl =
        explorerBaseUrl && isAddress(recipientAddress)
            ? `${explorerBaseUrl}/address/${encodeURIComponent(recipientAddress)}`
            : undefined;

    const lockLabel = (() => {
        if (srcKind === "cardano")
            return `Lock with ${cardano.walletName || "wallet"}`;
        if (srcKind === "evm") {
            if (evm.wrongNetwork) return `Switch to ${srcChain.label}`;
            if (needsEvmApproval) return "Approve";
        }
        return `Lock on ${srcChain.label}`;
    })();

    const isTxHashCopied =
        txHashClipboard.result?.status === "copied" &&
        txHashClipboard.result.value === shownTxHash;

    if (!selectedAccount) {
        return (
            <BridgeContainer>
                <BridgeCard>
                    <CardHeader>
                        <CardTitle>Bridge</CardTitle>
                    </CardHeader>
                    <BridgeCardContent>
                        <p>Please select an account first.</p>
                        <Button onClick={() => navigate("/accounts")}>
                            Select Account
                        </Button>
                    </BridgeCardContent>
                </BridgeCard>
            </BridgeContainer>
        );
    }

    return (
        <BridgeContainer>
            <BridgeCard>
                <CardHeader>
                    <CardTitle>Bridge</CardTitle>
                </CardHeader>
                <BridgeCardContent>
                    {shownTxHash && (
                        <SuccessMessage role="status">
                            <div>
                                <strong>Lock submitted successfully</strong>
                                <code>
                                    {srcKind === "asi" ? "Deploy ID" : "Tx hash"}: {shownTxHash}
                                </code>
                            </div>
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => txHashClipboard.copy(shownTxHash)}
                            >
                                {isTxHashCopied
                                    ? "Copied!"
                                    : srcKind === "asi"
                                      ? "Copy deploy ID"
                                      : "Copy hash"}
                            </Button>
                        </SuccessMessage>
                    )}

                    {busy && (
                        <LoadingMessage role="status" aria-live="polite">
                            <span className="spinner" aria-hidden="true" />
                            {srcKind === "evm" && evm.lastAction === "approve"
                                ? `Approving tokens on ${srcChain.label}...`
                                : `Locking tokens on ${srcChain.label}...`}
                        </LoadingMessage>
                    )}

                    {balanceLoadingStatus && (
                        <LoadingMessage role="status" aria-live="polite">
                            <span className="spinner" aria-hidden="true" />
                            {balanceLoadingStatus}
                        </LoadingMessage>
                    )}

                    {shownError && <ErrorMessage role="alert">{shownError}</ErrorMessage>}

                    <div>
                        <ChainFieldLabel>Account</ChainFieldLabel>
                        <ASIWalletSection account={selectedAccount} />
                    </div>

                    <RouteGrid role="group" aria-label="Bridge route">
                        <ChainField>
                            <ChainFieldLabel id="bridge-source-label">Source</ChainFieldLabel>
                            <StaticChainValue id="bridge-source-chain" aria-labelledby="bridge-source-label">
                                {srcChain.label}
                            </StaticChainValue>
                        </ChainField>
                        <ChainArrow aria-hidden="true">
                            <ReceiveIcon size={24} />
                        </ChainArrow>
                        <ChainField>
                            <ChainFieldLabel id="bridge-destination-label">
                                Destination
                            </ChainFieldLabel>
                            <Select
                                id="bridge-destination-select"
                                value={dstChainKey}
                                onChange={handleDestinationChange}
                                options={destinationOptions}
                                style={{ width: "100%" }}
                                aria-labelledby="bridge-destination-label"
                            />
                        </ChainField>
                    </RouteGrid>

                    <AmountRow>
                        <Input
                            id="bridge-amount-input"
                            className="bridge-amount-input"
                            label="Amount"
                            wrapperStyle={{ marginBottom: 0 }}
                            type="number"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Enter Amount"
                            step="0.00000001"
                            min="0"
                            disabled={!isBalanceReady}
                            error={amountError || undefined}
                            helperText={`8 decimal places (1 ${assetSymbol} = 1.00000000)`}
                            copyable
                            copyTitle="Copy amount"
                            CustomCopyIcon={ContentPasteIcon}
                        />
                        <MaxButton
                            id="bridge-max-amount-button"
                            variant="secondary"
                            onClick={maxAmount}
                            disabled={!isBalanceReady}
                            aria-label={`Use maximum available ${assetSymbol} amount`}
                        >
                            Max
                        </MaxButton>
                    </AmountRow>

                    <div>
                        {destinationNeedsConnection && (
                            <BridgeWalletSelector
                                chainKind={dstChain.kind}
                                wallet={destinationWallet}
                            />
                        )}
                        <RecipientRow>
                            <Input
                                id="bridge-recipient-address"
                                label={
                                    dstChain.kind === "evm"
                                        ? "ETH recipient address (0x...)"
                                        : "Recipient address"
                                }
                                value={recipientAddress}
                                placeholder="Connect destination wallet to see the recipient"
                                readOnly
                                copyable
                                copyTitle="Copy address"
                                wrapperStyle={{ marginBottom: 0 }}
                            />
                            {recipientExplorerUrl && (
                                <ExplorerLink
                                    href={recipientExplorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`View recipient in ${dstChain.label} explorer`}
                                    aria-label={`View recipient in ${dstChain.label} explorer`}
                                >
                                    <ExploreIcon size={20} />
                                </ExplorerLink>
                            )}
                        </RecipientRow>
                    </div>

                    <ActionButtons>
                        <LockButton
                            id="bridge-transaction-button"
                            onClick={handleLockClick}
                            loading={busy}
                            //TODO: Return disabling after Bridge full scenario e2e test
                            disabled={true}
                            // disabled={lockDisabled}
                        >
                            {lockLabel}
                        </LockButton>
                        <ClearAllButton
                            variant="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                        >
                            Clear all
                        </ClearAllButton>
                        <Button
                            id="history-button"
                            title="View transaction history"
                            aria-label="View transaction history"
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
            </BridgeCard>

            <TransactionConfirmationModal
                isOpen={showConfirmation}
                onClose={handleCancelLock}
                onConfirm={handleAsiLock}
                amount={pendingLock?.amount ?? ""}
                recipient={pendingLock?.recipient ?? ""}
                senderAddress={pendingLock?.accountAddress ?? ""}
                senderName={pendingLock?.accountName ?? ""}
                maxFee={BRIDGE_LOCK_MAX_GAS_COST}
                feeLabel={`up to ${fromAtomicAmount(
                    BRIDGE_LOCK_MAX_GAS_COST,
                    ASI_DECIMALS,
                )}`}
                feeDetailLabel="Estimated maximum fee"
                totalLabel="Maximum total"
                loading={asiLock.isRunning}
            />

            <PasswordModal
                {...asiLock.passwordPrompt}
                onClose={handleCancelLock}
                title="Enter password to sign transaction"
                description="Your wallet session has expired. Enter your password to sign and send this bridge lock."
            />
        </BridgeContainer>
    );
};
