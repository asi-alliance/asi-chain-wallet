import React, { useEffect, useMemo, useState } from "react";
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
import { TextSecondaryBlock } from "styles/sharedStyledComponents";
import { DefaultTheme } from "styled-components/dist/types";
import { ContentPasteIcon, HistoryIcon, ReceiveIcon } from "components/Icons";
import { getGasFeeAsNumber } from "constants/gas";
import {
    ASI_BRIDGE_URI,
    BridgeChainKey,
    bridgeChainForKey,
    defaultDestinationFor,
    DESTINATION_CHAIN_KEYS,
} from "constants/bridgeChains";
import { formatToken, parseTokenInput } from "utils/tokenFormat";
import { useCardanoWallet } from "hooks/useCardanoWallet";
import { useEvmBridge } from "hooks/useEvmBridge";
import { useCosmosWallet } from "hooks/useCosmosWallet";
import { buildCardanoLockTx } from "utils/cardanoTx";
import { useWalletSessionAction } from "hooks";
import { selectActiveWallet, selectSelectedAccount } from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { skipToken } from "@reduxjs/toolkit/query";
import { IWalletSessionContext, WalletKind } from "types/bridgeWalletSession";
import {
    ASIWalletSection,
    BridgeWalletSelector,
} from "components/BridgeWalletSelector";
import { bridgeLock } from "store/WalletsStore/thunks";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";

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

const ActionButtons = styled.div`
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
`;

const LockButton = styled(Button)`
    min-width: 220px;
    height: 44px;

    @media (max-width: 768px) {
        min-width: auto;
    }
`;

const ClearAllButton = styled(Button)`
    min-width: 170px;
    height: 44px;

    @media (max-width: 768px) {
        min-width: auto;
    }
`;

const ErrorMessage = styled.div`
    background: ${({ theme }) => theme.danger};
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-all;
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

const InputWithButton = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-end;
`;

const BridgeCardContent = styled(CardContent)`
    padding: 0 159px;

    @media (max-width: 768px) {
        padding: initial;
    }
`;

const ChainSelectorRow = styled.div`
    display: flex;
    gap: 24px;
    align-items: flex-end;
    margin-bottom: 36px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
    }
`;

const ChainField = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

const ChainFieldLabel = styled.label`
    font-weight: 500;
    color: ${({ theme }) => theme.text.primary};
`;

const StaticChainValue = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 150px;
    height: 44px;
    padding: 10px 20px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 6px;
    background: ${({ theme }) => theme.surface};
    color: ${({ theme }) => theme.text.primary};
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ChainArrow = styled.span`
    flex-shrink: 0;
    align-self: flex-end;
    display: flex;
    align-items: center;
    padding-bottom: 10px;
    color: ${({ theme }) => theme.primary};

    @media (max-width: 768px) {
        align-self: center;
        padding-bottom: initial;
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

    const { data: selectedASIAccountBalance = "0" } = useGetBalanceQuery(
        selectedAccount
            ? { accountId: selectedAccount.id, networkId: selectedNetwork.id }
            : skipToken,
    );

    const [amount, setAmount] = useState("");
    const [amountError, setAmountError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const rawAmount = amount.trim()
        ? parseTokenInput(amount, srcChain.nativeDecimals)
        : BigInt(0);

    const asiLock = useWalletSessionAction({
        walletId: activeWallet?.id,
        action: (password?: string) => {
            if (!selectedAccount || !activeWallet) {
                throw new Error("Wallet not opened. Please login again.");
            }

            return dispatch(
                bridgeLock({
                    walletId: activeWallet.id,
                    accountId: selectedAccount.id,
                    recipient: destinationWallet.account!.address,
                    amountBaseUnits: rawAmount.toString(),
                    destChainId: dstChain.routeId,
                    bridgeUri: srcChain.bridgeUri || ASI_BRIDGE_URI,
                    password,
                    network: selectedNetwork,
                }),
            ).unwrap();
        },
        onSuccess: ({ deployId }) => {
            setTxHash(deployId);
            setAmount("");
        },
        onError: setLockError,
        errorFallback: "Failed to lock tokens",
    });

    const needsEvmApproval =
        srcKind === "evm" &&
        evm.allowance !== undefined &&
        rawAmount > BigInt(0) &&
        evm.allowance < rawAmount;

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
    const shownError =
        (srcKind === "evm" ? evm.error?.message : lockError) || "";

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
        setAmountError("");
        evm.reset();
    };

    const maxAmount = (): void => {
        if (srcKind === "asi") {
            const balance = parseFloat(selectedASIAccountBalance);
            const max = Math.max(0, balance - getGasFeeAsNumber());
            const maxRounded = Math.floor(max * 100000000) / 100000000;
            setAmount(maxRounded.toFixed(8));
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

    const handleClearAll = (): void => {
        setAmount("");
        setTxHash("");

        setLockError("");
        setAmountError("");
        asiLock.passwordPrompt.onClose();
        evm.reset();
    };

    const handleEvmAction = (): void => {
        if (evm.wrongNetwork) {
            evm.switchToSource();
        } else if (needsEvmApproval) {
            evm.approve(rawAmount);
        } else {
            evm.lock(
                rawAmount,
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
                rawAmount,
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
                amount: parseTokenInput(amount, srcChain.nativeDecimals),
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

        if (!value.trim()) {
            setAmountError("");
            return;
        }

        const amountValue = Number(value);

        if (isNaN(amountValue) || amountValue <= 0) {
            setAmountError("Valid amount is required");
            return;
        }

        if (srcKind === "asi") {
            const balance = Number(selectedASIAccountBalance);

            if (amountValue > balance) {
                setAmountError(
                    `Insufficient balance. You have ${balance.toFixed(8)} ASI`,
                );
                return;
            }

            const totalRequired = amountValue + getGasFeeAsNumber();

            if (totalRequired > balance) {
                const maxSendable = Math.max(0, balance - getGasFeeAsNumber());

                setAmountError(
                    `Amount + fee exceeds balance. Max: ${maxSendable.toFixed(
                        8,
                    )} ASI`,
                );
                return;
            }
        }

        if (srcKind === "evm") {
            if (evm.tokenBalance !== undefined) {
                const balance = Number(
                    formatToken(evm.tokenBalance, srcChain.nativeDecimals),
                );

                if (amountValue > balance) {
                    setAmountError(
                        `Insufficient balance. You have ${balance.toFixed(8)}`,
                    );
                    return;
                }
            }
        }

        if (srcKind === "cardano") {
            const balance = Number(
                formatToken(
                    BigInt(cardano.balanceRaw || "0"),
                    srcChain.nativeDecimals,
                ),
            );

            if (amountValue > balance) {
                setAmountError(
                    `Insufficient balance. You have ${balance.toFixed(8)}`,
                );
                return;
            }
        }

        if (srcKind === "cosmos") {
            const balance = Number(
                formatToken(
                    BigInt(cosmos.balanceRaw || "0"),
                    srcChain.nativeDecimals,
                ),
            );

            if (amountValue > balance) {
                setAmountError(
                    `Insufficient balance. You have ${balance.toFixed(8)}`,
                );
                return;
            }
        }

        setAmountError("");
    };

    const isAmountValid =
        amount.trim() !== "" && rawAmount > BigInt(0) && !amountError;

    const lockDisabled =
        busy ||
        !sourceAccountLoaded ||
        !destinationAccountLoaded ||
        !isAmountValid;

    const lockLabel = (() => {
        if (srcKind === "cardano")
            return `Lock with ${cardano.walletName || "wallet"}`;
        if (srcKind === "evm") {
            if (evm.wrongNetwork) return `Switch to ${srcChain.label}`;
            if (needsEvmApproval) return "Approve";
        }
        return `Lock on ${srcChain.label}`;
    })();

    const copyTxHash = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(shownTxHash);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
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
                    {shownTxHash && (
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
                                    <div>Lock submitted successfully!</div>
                                    <div className="deploy-id">
                                        {srcKind === "asi"
                                            ? "Deploy ID"
                                            : "Tx hash"}
                                        : {shownTxHash}
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    style={{
                                        flexShrink: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={copyTxHash}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                        </SuccessMessage>
                    )}

                    {busy && (
                        <LoadingMessage>
                            <span className="spinner"></span>
                            {srcKind === "evm" && evm.lastAction === "approve"
                                ? `Approving tokens on ${srcChain.label}...`
                                : `Locking tokens on ${srcChain.label}...`}
                        </LoadingMessage>
                    )}

                    {shownError && <ErrorMessage>{shownError}</ErrorMessage>}

                    <ChainSelectorRow>
                        <ChainField>
                            <ChainFieldLabel>Source</ChainFieldLabel>
                            <StaticChainValue id="bridge-source-chain">
                                {srcChain.label}
                            </StaticChainValue>
                        </ChainField>
                        <ChainArrow aria-hidden="true">
                            <ReceiveIcon size={24} />
                        </ChainArrow>
                        <ChainField>
                            <ChainFieldLabel>Destination</ChainFieldLabel>
                            <Select
                                id="bridge-destination-select"
                                value={dstChainKey}
                                onChange={handleDestinationChange}
                                options={destinationOptions}
                                style={{ width: "100%" }}
                            />
                        </ChainField>
                    </ChainSelectorRow>

                    <h2 style={{ marginBottom: "8px" }}>Source account</h2>

                    <ASIWalletSection account={selectedAccount} />

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
                                onChange={(e) =>
                                    handleAmountChange(e.target.value)
                                }
                                placeholder="Enter amount"
                                step="0.00000001"
                                min="0"
                                copyable
                                CustomCopyIcon={ContentPasteIcon}
                            />
                            <Button
                                id="bridge-max-amount-button"
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
                        <TextSecondaryBlock
                            style={{
                                marginTop: "4px",
                                fontSize: "12px",
                            }}
                        >
                            8 decimal places (1 ASI = 1.00000000)
                        </TextSecondaryBlock>
                        {amountError && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    color: "#ff4d4f",
                                    fontSize: "14px",
                                }}
                            >
                                {amountError}
                            </div>
                        )}
                    </InputFormGroup>

                    <h2 style={{ marginBottom: "8px" }}>Destination account</h2>

                    <BridgeWalletSelector
                        chainKind={dstChain.kind}
                        wallet={destinationWallet}
                    />

                    <ActionButtons>
                        <LockButton
                            id="bridge-transaction-button"
                            onClick={handleLockClick}
                            loading={busy}
                            disabled={lockDisabled}
                        >
                            <h3>{lockLabel}</h3>
                        </LockButton>
                        <ClearAllButton
                            variant="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll();
                            }}
                        >
                            <h3>Clear all</h3>
                        </ClearAllButton>
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

            <TransactionConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleAsiLock}
                amount={amount}
                recipient={destinationWallet.account!.address}
                senderAddress={selectedAccount.address}
                senderName={selectedAccount.name}
                loading={asiLock.isRunning}
            />

            <PasswordModal
                {...asiLock.passwordPrompt}
                title="Enter password to sign transaction"
                description="Your wallet session has expired. Enter your password to sign and send this bridge lock."
            />
        </BridgeContainer>
    );
};
