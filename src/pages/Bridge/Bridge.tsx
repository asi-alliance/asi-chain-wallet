import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AppDispatch, RootState } from "store";
import { bridgeLock } from "store/walletSlice";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    PasswordInput,
    TransactionConfirmationModal,
    ASIAccountSwitcher,
    ASIAccountBalance,
    AccountSwitcher,
    AccountBalance,
    AccountView,
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
    SOURCE_CHAIN_KEYS,
} from "constants/bridgeChains";
import { formatToken, parseTokenInput } from "utils/tokenFormat";
import {
    recipientErrorFor,
    recipientLabelFor,
    recipientPlaceholderFor,
} from "utils/bridgeRecipient";
import { useCardanoWallet } from "hooks/useCardanoWallet";
import { useEvmBridge } from "hooks/useEvmBridge";
import { useCosmosWallet } from "hooks/useCosmosWallet";
import { useClearCrossNetworksData } from "hooks/useClearCrossNetworksData";
import { buildCardanoLockTx } from "utils/cardanoTx";

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

const AccountSectionWrapper = styled.div`
    margin-bottom: 24px;
`;

const ConnectWalletRow = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
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
    const selectedAccount = useSelector(
        (state: RootState) => state.wallet.selectedAccount,
    );
    const selectedNetwork = useSelector(
        (state: RootState) => state.wallet.selectedNetwork,
    );
    const { unlockedAccounts, requirePasswordForTransaction } = useSelector(
        (state: RootState) => state.auth,
    );

    const cardano = useCardanoWallet();

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [password, setPassword] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copied, setCopied] = useState(false);

    const [srcChainKey, setSrcChainKey] = useState<BridgeChainKey>("asi");
    const [dstChainKey, setDstChainKey] = useState<BridgeChainKey>(() =>
        defaultDestinationFor("asi"),
    );

    const [txHash, setTxHash] = useState("");
    const [lockError, setLockError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const srcChain = bridgeChainForKey(srcChainKey);
    const dstChain = bridgeChainForKey(dstChainKey);
    const srcKind = srcChain.kind;

    const evm = useEvmBridge(srcChain.evmId);
    const cosmos = useCosmosWallet();

    const clearCrossNetworksData = useClearCrossNetworksData({
        onCardanoClear: cardano.disconnect,
        onCosmosClear: cosmos.disconnect,
    });

    const isAccountUnlocked =
        selectedAccount &&
        unlockedAccounts.some((a) => a.id === selectedAccount.id);
    const needsPassword = !isAccountUnlocked || requirePasswordForTransaction;

    const recipientError = recipientErrorFor(dstChain, recipient);
    const rawAmount = amount.trim()
        ? parseTokenInput(amount, srcChain.nativeDecimals)
        : BigInt(0);
    const canSend =
        amount.trim() !== "" &&
        rawAmount > BigInt(0) &&
        recipient.trim() !== "" &&
        !recipientError;

    const cardanoBalanceDisplay = formatToken(
        BigInt(cardano.balanceRaw || "0"),
        srcChain.nativeDecimals,
    );
    const cardanoAccountView: AccountView = {
        id: "cardano-wallet",
        name: cardano.walletName || srcChain.shortLabel,
        address: cardano.address,
        balance: cardanoBalanceDisplay,
    };

    const evmBalanceDisplay = formatToken(
        evm.tokenBalance ?? BigInt(0),
        srcChain.nativeDecimals,
    );
    const evmAccountView: AccountView = {
        id: "evm-wallet",
        name: "EVM Wallet",
        address: evm.address ?? "",
        balance: evmBalanceDisplay,
    };

    const cosmosBalanceDisplay = formatToken(
        BigInt(cosmos.balanceRaw || "0"),
        srcChain.nativeDecimals,
    );
    const cosmosAccountView: AccountView = {
        id: "cosmos-wallet",
        name: cosmos.provider || srcChain.shortLabel,
        address: cosmos.address ?? "",
        balance: cosmosBalanceDisplay,
    };

    const needsEvmApproval =
        srcKind === "evm" &&
        evm.allowance !== undefined &&
        rawAmount > BigInt(0) &&
        evm.allowance < rawAmount;

    const busy =
        srcKind === "evm" ? evm.isPending || evm.isConfirming : isLoading;
    const shownTxHash =
        srcKind === "evm"
            ? evm.isSuccess && evm.txHash
                ? evm.txHash
                : ""
            : txHash;
    const shownError =
        (srcKind === "evm" ? evm.error?.message : lockError) || "";

    useEffect(() => {
        if (evm.isSuccess) {
            evm.refetch();
        }
    }, [evm.isSuccess, evm.refetch]);

    const sourceOptions = useMemo<ISelectOption[]>(
        () =>
            SOURCE_CHAIN_KEYS.map((key) => {
                const chain = bridgeChainForKey(key);
                return { id: key, value: key, label: chain.label };
            }),
        [],
    );

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

    const handleSourceChange = (key: string): void => {
        const nextKey = key as BridgeChainKey;
        setSrcChainKey(nextKey);
        if (nextKey === dstChainKey) {
            setDstChainKey(defaultDestinationFor(nextKey));
        }
        setAmount("");
        setTxHash("");
        setLockError("");
    };

    const handleDestinationChange = (key: string): void => {
        const nextKey = key as BridgeChainKey;
        if (nextKey === srcChainKey) {
            return;
        }
        setDstChainKey(nextKey);
        setTxHash("");
        setLockError("");
    };

    const maxAmount = (): void => {
        if (srcKind === "asi") {
            const balance = parseFloat(selectedAccount?.balance || "0");
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
        setRecipient("");
        setAmount("");
        setPassword("");
        setTxHash("");
        setLockError("");
    };

    const handleConnectCardano = async (): Promise<void> => {
        try {
            await cardano.connect();
        } catch {
            /* error surfaced via cardano.error */
        }
    };

    const handleConnectCosmos = async (): Promise<void> => {
        try {
            await cosmos.connect();
        } catch {
            /* error surfaced via cosmos.error */
        }
    };

    const handleEvmAction = (): void => {
        if (evm.wrongNetwork) {
            evm.switchToSource();
        } else if (needsEvmApproval) {
            evm.approve(rawAmount);
        } else {
            evm.lock(rawAmount, recipient.trim(), dstChain.routeId);
        }
    };

    const handleCosmosLock = async (): Promise<void> => {
        setLockError("");
        setTxHash("");
        setIsLoading(true);
        try {
            const result = await cosmos.lock(
                rawAmount,
                recipient.trim(),
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

    const handleAsiLock = async (passwordFromModal?: string): Promise<void> => {
        if (!selectedAccount) return;
        setShowConfirmation(false);
        setLockError("");
        setTxHash("");
        setIsLoading(true);
        try {
            const result = await dispatch(
                bridgeLock({
                    from: selectedAccount,
                    recipient: recipient.trim(),
                    amountBaseUnits: parseTokenInput(
                        amount,
                        srcChain.nativeDecimals,
                    ).toString(),
                    destChainId: dstChain.routeId,
                    bridgeUri: srcChain.bridgeUri || ASI_BRIDGE_URI,
                    password: passwordFromModal ?? password,
                    network: selectedNetwork,
                }),
            ).unwrap();
            setTxHash(result.deployId);
            setAmount("");
            setPassword("");
        } catch (err: any) {
            setLockError(err?.message || String(err));
        } finally {
            setIsLoading(false);
        }
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
                recipient: recipient.trim(),
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

    const lockDisabled =
        busy ||
        (srcKind === "evm"
            ? !evm.isConnected || (!evm.wrongNetwork && !canSend)
            : !canSend) ||
        (srcKind === "asi" && needsPassword && !password) ||
        (srcKind === "cardano" && !cardano.connected) ||
        (srcKind === "cosmos" && !cosmos.connected);

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

    // useEffect(() => {
    //     console.log("SRC KIND: ", srcKind);

    //     console.log("CARDANO: ", cardano);

    //     console.log("EVM: ", evm);
    //     console.log("COSMOS: ", cosmos);
    // }, [evm, cosmos, cardano]);

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
                    {(evm.isConnected ||
                        cardano.connected ||
                        cosmos.connected) && (
                        <ClearAllButton
                            id="bridge-clear-networks-button"
                            variant="danger"
                            onClick={clearCrossNetworksData}
                        >
                            <h3>Disconnect wallets</h3>
                        </ClearAllButton>
                    )}
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
                            Locking tokens on {srcChain.label}...
                        </LoadingMessage>
                    )}

                    {shownError && <ErrorMessage>{shownError}</ErrorMessage>}

                    <ChainSelectorRow>
                        <ChainField>
                            <ChainFieldLabel>Source</ChainFieldLabel>
                            <Select
                                id="bridge-source-select"
                                value={srcChainKey}
                                onChange={handleSourceChange}
                                options={sourceOptions}
                                style={{ width: "100%" }}
                            />
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

                    {srcKind === "asi" && (
                        <>
                            <AccountSectionWrapper>
                                <ASIAccountSwitcher fullWidth />
                            </AccountSectionWrapper>
                            <BalanceInfo className="balance-info">
                                <ASIAccountBalance account={selectedAccount} />
                            </BalanceInfo>
                        </>
                    )}

                    {srcKind === "cardano" &&
                        (cardano.connected ? (
                            <>
                                <AccountSectionWrapper>
                                    <AccountSwitcher
                                        fullWidth
                                        disabled
                                        accounts={[cardanoAccountView]}
                                        selectedId={cardanoAccountView.id}
                                        onSelect={() => undefined}
                                    />
                                </AccountSectionWrapper>
                                <BalanceInfo className="balance-info">
                                    <AccountBalance
                                        balance={cardanoBalanceDisplay}
                                        loading={cardano.balanceLoading}
                                        onRefresh={cardano.refreshBalance}
                                    />
                                </BalanceInfo>
                            </>
                        ) : (
                            <ConnectWalletRow>
                                <Button
                                    id="bridge-connect-cardano-button"
                                    onClick={handleConnectCardano}
                                    loading={cardano.loading}
                                    style={{
                                        minWidth: "220px",
                                        height: "44px",
                                    }}
                                >
                                    <h3>Connect Cardano Wallet</h3>
                                </Button>
                                {cardano.error && (
                                    <ErrorMessage>{cardano.error}</ErrorMessage>
                                )}
                            </ConnectWalletRow>
                        ))}

                    {srcKind === "evm" &&
                        (evm.isConnected ? (
                            <>
                                <AccountSectionWrapper>
                                    <AccountSwitcher
                                        fullWidth
                                        disabled
                                        accounts={[evmAccountView]}
                                        selectedId={evmAccountView.id}
                                        onSelect={() => undefined}
                                    />
                                </AccountSectionWrapper>
                                <BalanceInfo className="balance-info">
                                    <AccountBalance
                                        balance={evmBalanceDisplay}
                                        loading={evm.isPending}
                                        onRefresh={evm.refetch}
                                    />
                                </BalanceInfo>
                                {evm.wrongNetwork && (
                                    <InfoMessage>
                                        Wrong network. Switch your wallet to{" "}
                                        {srcChain.label}.
                                    </InfoMessage>
                                )}
                            </>
                        ) : (
                            <ConnectWalletRow>
                                <Button
                                    id="bridge-connect-evm-button"
                                    onClick={evm.openConnect}
                                    style={{
                                        minWidth: "220px",
                                        height: "44px",
                                    }}
                                >
                                    <h3>Connect EVM Wallet</h3>
                                </Button>
                            </ConnectWalletRow>
                        ))}

                    {srcKind === "cosmos" &&
                        (cosmos.connected ? (
                            <>
                                <AccountSectionWrapper>
                                    <AccountSwitcher
                                        fullWidth
                                        disabled
                                        accounts={[cosmosAccountView]}
                                        selectedId={cosmosAccountView.id}
                                        onSelect={() => undefined}
                                    />
                                </AccountSectionWrapper>
                                <BalanceInfo className="balance-info">
                                    <AccountBalance
                                        balance={cosmosBalanceDisplay}
                                        loading={cosmos.loading}
                                        onRefresh={cosmos.refreshBalance}
                                    />
                                </BalanceInfo>
                            </>
                        ) : (
                            <ConnectWalletRow>
                                <Button
                                    id="bridge-connect-cosmos-button"
                                    onClick={handleConnectCosmos}
                                    loading={cosmos.loading}
                                    style={{
                                        minWidth: "220px",
                                        height: "44px",
                                    }}
                                >
                                    <h3>Connect Fetch Wallet</h3>
                                </Button>
                                {cosmos.error && (
                                    <ErrorMessage>{cosmos.error}</ErrorMessage>
                                )}
                            </ConnectWalletRow>
                        ))}

                    {srcKind === "asi" && !isAccountUnlocked && (
                        <InfoMessage>
                            Account is locked. You'll need to enter your
                            password to submit the lock.
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
                    </InputFormGroup>

                    <InputFormGroup>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                            }}
                        >
                            {recipientLabelFor(dstChain)}
                        </label>
                        <Input
                            id="bridge-recipient-input"
                            className="bridge-recipient-input text-3"
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder={recipientPlaceholderFor(dstChain)}
                            wrapperStyle={{
                                marginBottom: "0",
                            }}
                            style={{
                                width: "100%",
                                fontSize: "0.75rem",
                                height: "44px",
                                border: `2px solid ${
                                    recipientError ? "#ff4d4f" : "#e0e0e0"
                                }`,
                                borderRadius: "8px",
                                background: "transparent",
                                color: "inherit",
                                outline: "none",
                            }}
                            copyable
                            CustomCopyIcon={ContentPasteIcon}
                        />
                        {recipientError && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    color: "#ff4d4f",
                                    fontSize: "14px",
                                }}
                            >
                                {recipientError}
                            </div>
                        )}
                    </InputFormGroup>

                    {srcKind === "asi" && needsPassword && (
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
                onClose={() => {
                    setShowConfirmation(false);
                    setPassword("");
                }}
                onConfirm={handleAsiLock}
                amount={amount}
                recipient={recipient}
                senderAddress={selectedAccount?.revAddress || ""}
                senderName={selectedAccount?.name || ""}
                loading={isLoading}
                requirePasswordForTransaction={requirePasswordForTransaction}
            />
        </BridgeContainer>
    );
};
